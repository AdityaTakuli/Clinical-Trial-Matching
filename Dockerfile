FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV HF_HOME=/app/.cache/hf
ENV TRANSFORMERS_CACHE=/app/.cache/hf
ENV SENTENCE_TRANSFORMERS_HOME=/app/.cache/hf
ENV EMBEDDING_MODEL_PATH=/app/models/minilm
# CrossEncoder is optional — keep off on 512MB free tiers
ENV ENABLE_RERANKER=false

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /app/backend/requirements.txt

# Install deps, then force CPU-only torch (sentence-transformers would otherwise pull CUDA wheels)
RUN pip install --no-cache-dir -r /app/backend/requirements.txt \
    && pip install --no-cache-dir --force-reinstall torch \
        --index-url https://download.pytorch.org/whl/cpu

# Bake MiniLM into the image while Hub is still reachable
RUN mkdir -p /app/models \
    && python -c "from sentence_transformers import SentenceTransformer; \
m = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2'); \
m.save('/app/models/minilm')" \
    && rm -rf /root/.cache /tmp/*

# After bake: never hit Hugging Face during requests
ENV HF_HUB_OFFLINE=1
ENV TRANSFORMERS_OFFLINE=1

COPY backend /app/backend

WORKDIR /app/backend

EXPOSE 8000

# Render sets $PORT; default to 8000 for local Docker
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
