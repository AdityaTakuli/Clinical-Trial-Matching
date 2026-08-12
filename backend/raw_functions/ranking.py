from raw_functions.reranker import rerank_trials
from raw_functions.criterion_matcher import (
    build_eligibility_assessment,
    has_hard_incompatibility,
)
from raw_functions.location_matcher import calculate_location_score
from raw_functions.parse_eligibility import parse_eligibility


def calculate_recency_score(start_date: str | None) -> float:

    if not start_date:
        return 0.5

    year_match = start_date[:4]

    try:
        year = int(year_match)
    except ValueError:
        return 0.5

    if year >= 2025:
        return 1.0

    if year >= 2023:
        return 0.75

    if year >= 2020:
        return 0.5

    return 0.25


def build_trial_explanations(
    trial: dict,
    assessment: dict,
) -> dict:

    match_reasons = []
    unknown_information = []
    potential_conflicts = []

    condition = trial.get("matched_condition")
    similarity = trial.get("condition_similarity")

    if condition and similarity:
        match_reasons.append(
            f"Strong semantic match for {condition} "
            f"(similarity {similarity:.2f})"
        )

    if trial.get("status") == "RECRUITING":
        match_reasons.append("Trial is currently recruiting")

    for item in assessment.get("criteria", []):
        criterion = item["criterion"]
        result = item["result"]
        section = item["type"]

        if section == "INCLUSION" and result == "MATCH":
            match_reasons.append(
                f"Inclusion criterion appears satisfied: {criterion}"
            )

        if result == "UNKNOWN":
            unknown_information.append(criterion)

        if section == "INCLUSION" and result == "MISMATCH":
            potential_conflicts.append(
                f"Inclusion criterion may not be satisfied: {criterion}"
            )

        if section == "EXCLUSION" and result == "MATCH":
            potential_conflicts.append(
                f"Exclusion criterion may apply: {criterion}"
            )

    location_score = trial.get("location_score", 0.5)

    if location_score >= 1.0:
        match_reasons.append("Trial has a site in the patient's location")

    return {
        "match_reasons": match_reasons,
        "unknown_information": unknown_information,
        "potential_conflicts": potential_conflicts,
    }


def rank_trials(
    trials: list[dict],
    patient: dict | None = None,
    query: str | None = None,
) -> list[dict]:

    patient = patient or {}

    recruiting_trials = [
        trial
        for trial in trials
        if trial.get("status") == "RECRUITING"
    ]

    unique_trials = {}

    for trial in recruiting_trials:
        nct_id = trial.get("nct_id")
        if nct_id:
            unique_trials[nct_id] = trial

    ranked_candidates = []

    for trial in unique_trials.values():

        if "parsed_eligibility" not in trial:
            trial["parsed_eligibility"] = parse_eligibility(
                trial.get("eligibility", "")
            )

        assessment = build_eligibility_assessment(
            trial,
            patient,
            trial["parsed_eligibility"],
        )

        if has_hard_incompatibility(trial, patient, assessment):
            continue

        trial["criteria_results"] = assessment["criteria"]
        trial["eligibility_score"] = assessment["eligibility_score"]
        trial["eligibility_status"] = assessment["status"]
        trial["criteria_summary"] = {
            "matched": assessment["matched"],
            "mismatched": assessment["mismatched"],
            "unknown": assessment["unknown"],
        }

        condition_score = trial.get("condition_similarity", 0.0)
        eligibility_score = assessment["eligibility_score"]
        location_score = calculate_location_score(trial, patient)
        recency_score = calculate_recency_score(trial.get("start_date"))

        trial["location_score"] = location_score
        trial["recency_score"] = recency_score

        trial["ranking_score"] = round(
            0.55 * condition_score
            + 0.30 * eligibility_score
            + 0.10 * location_score
            + 0.05 * recency_score,
            4,
        )

        explanations = build_trial_explanations(trial, assessment)
        trial["match_reasons"] = explanations["match_reasons"]
        trial["unknown_information"] = explanations["unknown_information"]
        trial["potential_conflicts"] = explanations["potential_conflicts"]

        ranked_candidates.append(trial)

    ranked_candidates.sort(
        key=lambda trial: trial.get("ranking_score", 0.0),
        reverse=True,
    )

    if query:
        ranked_candidates = rerank_trials(
            query,
            ranked_candidates,
            top_k=20,
        )
    else:
        ranked_candidates = ranked_candidates[:5]

    return ranked_candidates
