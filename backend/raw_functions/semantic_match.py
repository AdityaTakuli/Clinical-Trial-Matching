import json
import logging
import os
from pathlib import Path

import numpy as np
from sentence_transformers import SentenceTransformer, util

logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).resolve().parent.parent

CORPUS_PATH = BACKEND_DIR / "data" / "condition_corpus_500.json"
EMBEDDINGS_PATH = BACKEND_DIR / "data" / "condition_embeddings.npz"

# Hub id used for local/dev when a baked path is not present
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

# Docker bakes weights here so runtime never hits Hugging Face
DEFAULT_LOCAL_MODEL = Path("/app/models/minilm")
LOCAL_MODEL_PATH = Path(
    os.getenv("EMBEDDING_MODEL_PATH", str(DEFAULT_LOCAL_MODEL))
)

_model: SentenceTransformer | None = None

with open(CORPUS_PATH, "r", encoding="utf-8") as file:
    data = json.load(file)

corpus = data["corpus"]
corpus_embeddings = np.load(EMBEDDINGS_PATH)["embeddings"]


def _resolve_model_source() -> tuple[str, bool]:
    """Return (path_or_id, local_files_only)."""
    if LOCAL_MODEL_PATH.exists():
        return str(LOCAL_MODEL_PATH), True

    # Allow an explicit offline cache hit without a bake path
    if os.getenv("HF_HUB_OFFLINE", "").lower() in ("1", "true", "yes"):
        return MODEL_NAME, True

    return MODEL_NAME, False


def _get_model() -> SentenceTransformer:
    """Load the embedding model once per process."""
    global _model
    if _model is not None:
        return _model

    source, local_only = _resolve_model_source()
    logger.info(
        "Loading SentenceTransformer from %s (local_files_only=%s)",
        source,
        local_only,
    )
    _model = SentenceTransformer(source, local_files_only=local_only)
    logger.info("SentenceTransformer ready")
    return _model


def semantic_match(query: str, top_k: int = 3):
    model = _get_model()

    query_embedding = model.encode(
        query,
        normalize_embeddings=True,
    )

    similarity_matrix = util.cos_sim(query_embedding, corpus_embeddings)

    similarities = similarity_matrix[0].numpy()

    top_indices = np.argsort(similarities)[-top_k:][::-1]

    results = []
    for index in top_indices:
        results.append(
            {
                "condition": corpus[index]["condition"],
                "similarity": float(similarities[index]),
            }
        )

    return results
