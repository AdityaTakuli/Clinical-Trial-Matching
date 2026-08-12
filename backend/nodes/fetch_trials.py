from raw_functions.fetch_trials import fetch_trials_for_conditions
from raw_functions.parse_eligibility import parse_eligibility
from raw_functions.criterion_matcher import (
    evaluate_trial_criteria,
    calculate_criteria_score,
)


def fetch_trials_node(state):

    print("\n===== FETCH TRIALS NODE =====")
    print("Conditions:", state["matched_conditions"])
    print("Location:", state["location"])

    trials = fetch_trials_for_conditions(
        conditions=state["matched_conditions"],
        location=state["location"],
        page_size=5,
    )

    condition_scores = {
        item["condition"]: item["similarity"]
        for item in state["condition_matches"]
    }

    patient_profile = state.get("patient_profile") or {}

    for trial in trials:
        condition = trial.get("matched_condition")

        trial["condition_similarity"] = condition_scores.get(
            condition,
            0.0
        )

        parsed = parse_eligibility(
            trial.get("eligibility", "")
        )

        trial["parsed_eligibility"] = parsed

        results = evaluate_trial_criteria(
            parsed,
            patient_profile
        )

        trial["criteria_results"] = results

        trial["criteria_score"] = calculate_criteria_score(
            results
        )

    print("Fetched trials:", len(trials))

    for trial in trials:
        print(
            trial.get("nct_id"),
            "|",
            trial.get("matched_condition"),
            "| similarity:",
            trial.get("condition_similarity"),
            "| criteria:",
            trial.get("criteria_score")
        )

    return {
        **state,
        "raw_trials": trials,
    }
