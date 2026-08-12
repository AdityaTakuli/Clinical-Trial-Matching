import json
from pathlib import Path

import numpy as np
from sentence_transformers import SentenceTransformer, util

BACKEND_DIR = Path(__file__).resolve().parent.parent

CORPUS_PATH = BACKEND_DIR / "data" / "condition_corpus_500.json"
EMBEDDINGS_PATH = BACKEND_DIR / "data" / "condition_embeddings.npz"

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
model = SentenceTransformer(MODEL_NAME)

with open(CORPUS_PATH, "r", encoding="utf-8") as file:
    data = json.load(file)

corpus = data["corpus"]
corpus_embeddings = np.load(EMBEDDINGS_PATH)["embeddings"]


def semantic_match(query: str, top_k: int = 3):

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
