from typing import TypedDict


class TrialMatchState(TypedDict):
    raw_query: str
    condition: str | None
    location: str | None
    age: int | None
    patient_profile: dict
    matched_conditions: list[str]
    condition_matches: list[dict]
    raw_trials: list[dict]
    ranked_trials: list[dict]
    final_results: list[dict]