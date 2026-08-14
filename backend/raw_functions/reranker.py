import logging
import os

logger = logging.getLogger(__name__)

_cross_encoder = None
_load_failed = False

# Correct HF id (no hyphen between L and 6)
MODEL_NAME = "cross-encoder/ms-marco-MiniLM-L6-v2"


def _reranker_enabled() -> bool:
    return os.getenv("ENABLE_RERANKER", "false").lower() in (
        "1",
        "true",
        "yes",
    )


def _get_cross_encoder():
    global _cross_encoder, _load_failed

    if _load_failed:
        return None

    if _cross_encoder is None:
        from sentence_transformers import CrossEncoder

        logger.info("Loading CrossEncoder %s", MODEL_NAME)
        _cross_encoder = CrossEncoder(MODEL_NAME)
        logger.info("CrossEncoder ready")

    return _cross_encoder


def _trial_text(trial: dict) -> str:
    parts = [
        trial.get("title") or "",
        trial.get("matched_condition") or "",
        " ".join(trial.get("conditions") or []),
        (trial.get("eligibility") or "")[:500],
    ]

    return " ".join(part for part in parts if part).strip()


def rerank_trials(
    query: str,
    trials: list[dict],
    top_k: int = 20,
) -> list[dict]:
    """Optional neural rerank. Off by default to avoid OOM on small hosts."""

    if not trials or not query.strip():
        return trials

    candidates = trials[:top_k]

    if len(candidates) <= 1:
        return candidates[:5]

    if not _reranker_enabled():
        return candidates[:5]

    try:
        model = _get_cross_encoder()
        if model is None:
            return candidates[:5]

        pairs = [[query, _trial_text(trial)] for trial in candidates]
        scores = model.predict(pairs)

        for trial, score in zip(candidates, scores):
            rerank_score = float(score)
            trial["rerank_score"] = rerank_score

            normalized = 1 / (1 + pow(2.718281828, -rerank_score))

            trial["ranking_score"] = round(
                0.70 * trial.get("ranking_score", 0.0) + 0.30 * normalized,
                4,
            )

        candidates.sort(
            key=lambda trial: trial.get("ranking_score", 0.0),
            reverse=True,
        )
    except Exception:
        global _load_failed
        _load_failed = True
        logger.exception(
            "CrossEncoder unavailable; continuing without neural rerank"
        )
        return candidates[:5]

    return candidates[:5]
