import logging
import os

from dotenv import load_dotenv
from groq import APIConnectionError, APIStatusError, NotFoundError, RateLimitError


load_dotenv()

logger = logging.getLogger(__name__)

# Chat-capable models enabled for our Groq key, best first. The llama-* models
# are NOT available on this key, so they must not appear here.
DEFAULT_MODELS = (
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
)


def model_chain(primary: str | None, fallbacks: str | None) -> tuple[str, ...]:
    """Build an ordered, de-duplicated model chain from env values.

    `fallbacks` is a comma-separated list; when unset the defaults are used.
    """
    chain = []

    if primary and primary.strip():
        chain.append(primary.strip())

    if fallbacks is None:
        chain.extend(DEFAULT_MODELS)
    else:
        chain.extend(m.strip() for m in fallbacks.split(",") if m.strip())

    seen = set()
    ordered = []
    for model in chain:
        if model not in seen:
            seen.add(model)
            ordered.append(model)

    return tuple(ordered) or DEFAULT_MODELS


GROQ_MODELS = model_chain(
    os.getenv("GROQ_MODEL"),
    os.getenv("GROQ_FALLBACK_MODELS"),
)

# First choice; kept as a separate name for call sites that only log the model.
GROQ_MODEL = GROQ_MODELS[0]


def _should_fall_back(exc: Exception) -> bool:
    if isinstance(exc, (NotFoundError, RateLimitError, APIConnectionError)):
        return True
    # Retry the next model on Groq-side failures, not on our own bad requests.
    return isinstance(exc, APIStatusError) and exc.status_code >= 500


def complete(client, *, models=None, options_for=None, **kwargs):
    """chat.completions.create, trying each model until one answers.

    Falls back when a model is unavailable (404), rate limited, or Groq errors;
    a bad request is raised immediately since another model would fail too.
    `options_for(model)` may return extra per-model request options.
    """
    chain = tuple(models) if models else GROQ_MODELS
    last_exc = None

    for model in chain:
        extra = options_for(model) if options_for else {}
        try:
            return client.chat.completions.create(model=model, **kwargs, **extra)
        except Exception as exc:
            if not _should_fall_back(exc):
                raise
            last_exc = exc
            logger.warning("Groq model %s unavailable (%s), trying next", model, exc)

    raise last_exc
