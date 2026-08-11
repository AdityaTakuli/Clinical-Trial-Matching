from typing import TypedDict


class TrialMatchState(TypedDict):
    raw_query: str
    condition: str | None
    location: str | None
    age: int | None
    matched_conditions: list[str]
    raw_trials: list[dict]
    ranked_trials: list[dict]
    final_results: list[dict]