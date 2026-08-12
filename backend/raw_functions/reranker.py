_cross_encoder = None

MODEL_NAME = "cross-encoder/ms-marco-MiniLM-L-6-v2"


def _get_cross_encoder():

    global _cross_encoder

    if _cross_encoder is None:
        from sentence_transformers import CrossEncoder

        _cross_encoder = CrossEncoder(MODEL_NAME)

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

    if not trials or not query.strip():
        return trials

    candidates = trials[:top_k]

    if len(candidates) <= 1:
        return candidates

    model = _get_cross_encoder()

    pairs = [
        [query, _trial_text(trial)]
        for trial in candidates
    ]

    scores = model.predict(pairs)

    for trial, score in zip(candidates, scores):
        rerank_score = float(score)
        trial["rerank_score"] = rerank_score

        normalized = 1 / (1 + pow(2.718281828, -rerank_score))

        trial["ranking_score"] = round(
            0.70 * trial.get("ranking_score", 0.0)
            + 0.30 * normalized,
            4,
        )

    candidates.sort(
        key=lambda trial: trial.get("ranking_score", 0.0),
        reverse=True,
    )

    return candidates[:5]
