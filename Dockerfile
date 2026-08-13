FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
# Keep HuggingFace / torch caches off the tiny root disk where possible
ENV HF_HOME=/tmp/hf
ENV TRANSFORMERS_CACHE=/tmp/hf
ENV SENTENCE_TRANSFORMERS_HOME=/tmp/hf

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /app/backend/requirements.txt

# Install deps, then force CPU-only torch (sentence-transformers would otherwise pull CUDA wheels)
RUN pip install --no-cache-dir -r /app/backend/requirements.txt \
    && pip install --no-cache-dir --force-reinstall torch \
        --index-url https://download.pytorch.org/whl/cpu

COPY backend /app/backend

WORKDIR /app/backend

EXPOSE 8000

# Render sets $PORT; default to 8000 for local Docker
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
