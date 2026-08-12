import json
import math
import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("USE_REGEX_PATIENT_PROFILE", "true")

from raw_functions.semantic_match import semantic_match
from raw_functions.patient_extraction import extract_patient_profile


EVAL_PATH = BACKEND_DIR / "tests" / "evaluation" / "queries.json"


def recall_at_k(relevant: set[str], retrieved: list[str], k: int) -> float:

    if not relevant:
        return 0.0

    top_k = set(retrieved[:k])
    return len(relevant & top_k) / len(relevant)


def mrr(relevant: set[str], retrieved: list[str]) -> float:

    for index, item in enumerate(retrieved, start=1):
        if item in relevant:
            return 1 / index

    return 0.0


def ndcg_at_k(relevant: set[str], retrieved: list[str], k: int) -> float:

    def dcg(items: list[str]) -> float:
        score = 0.0

        for index, item in enumerate(items[:k], start=1):
            if item in relevant:
                score += 1 / math.log2(index + 1)

        return score

    ideal = dcg(list(relevant))
    if ideal == 0:
        return 0.0

    return dcg(retrieved) / ideal


def evaluate_case(case: dict) -> dict:

    query = case["query"]
    profile = extract_patient_profile(query)
    matches = semantic_match(query, top_k=5)

    retrieved = [match["condition"] for match in matches]
    relevant = set(case.get("expected_conditions") or [])

    metrics = {
        "recall@1": recall_at_k(relevant, retrieved, 1),
        "recall@3": recall_at_k(relevant, retrieved, 3),
        "recall@5": recall_at_k(relevant, retrieved, 5),
        "mrr": mrr(relevant, retrieved),
        "ndcg@5": ndcg_at_k(relevant, retrieved, 5),
    }

    keyword_hits = [
        keyword
        for keyword in case.get("must_include_keywords", [])
        if any(keyword.lower() in condition.lower() for condition in retrieved)
    ]

    return {
        "id": case["id"],
        "retrieved": retrieved,
        "profile": profile,
        "metrics": metrics,
        "keyword_coverage": len(keyword_hits) / max(
            len(case.get("must_include_keywords", [])), 1
        ),
    }


def main():

    cases = json.loads(EVAL_PATH.read_text())
    results = [evaluate_case(case) for case in cases]

    aggregate = {
        "recall@1": 0.0,
        "recall@3": 0.0,
        "recall@5": 0.0,
        "mrr": 0.0,
        "ndcg@5": 0.0,
        "keyword_coverage": 0.0,
    }

    for result in results:
        for key in ("recall@1", "recall@3", "recall@5", "mrr", "ndcg@5"):
            aggregate[key] += result["metrics"][key]
        aggregate["keyword_coverage"] += result["keyword_coverage"]

    count = len(results)

    for key in aggregate:
        aggregate[key] = round(aggregate[key] / count, 4)

    print(json.dumps({"aggregate": aggregate, "cases": results}, indent=2))


if __name__ == "__main__":
    main()
