import json
from pathlib import Path

import numpy as np
from sentence_transformers import SentenceTransformer


# --------------------------------------------------
# Paths
# --------------------------------------------------

BACKEND_DIR = Path(__file__).resolve().parent.parent

CORPUS_PATH = BACKEND_DIR / "data" / "condition_corpus_500.json"
OUTPUT_PATH = BACKEND_DIR / "data" / "condition_embeddings.npz"


# --------------------------------------------------
# Load embedding model
# --------------------------------------------------

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

print("Loading embedding model...")

model = SentenceTransformer(MODEL_NAME)


# --------------------------------------------------
# Load corpus
# --------------------------------------------------

print(f"Loading corpus from: {CORPUS_PATH}")

with open(CORPUS_PATH, "r", encoding="utf-8") as file:
    data = json.load(file)


corpus = data["corpus"]

print("Number of records:", len(corpus))


# --------------------------------------------------
# Create text representation for each condition
# --------------------------------------------------

texts = []

for entry in corpus:

    condition = entry.get("condition", "")

    aliases = ", ".join(entry.get("aliases", []))
    symptoms = ", ".join(entry.get("symptoms", []))
    lay_terms = ", ".join(entry.get("lay_terms", []))
    description = entry.get("description", "")

    text = f"""
Condition: {condition}

Aliases: {aliases}

Symptoms: {symptoms}

Lay terms: {lay_terms}

Description: {description}
""".strip()

    texts.append(text)


# --------------------------------------------------
# Generate embeddings
# --------------------------------------------------

print("Generating embeddings...")

embeddings = model.encode(
    texts,
    show_progress_bar=True,
    normalize_embeddings=True
)


# --------------------------------------------------
# Save embeddings
# --------------------------------------------------

np.savez_compressed(
    OUTPUT_PATH,
    embeddings=embeddings
)


print("\nCorpus embedding complete.")

print("Number of records:", len(texts))

print("Embedding shape:", embeddings.shape)

print("Saved to:", OUTPUT_PATH)