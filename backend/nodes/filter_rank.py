from raw_functions.filter_rank import rank_trials


def filter_rank_node(state):

    print("\n===== FILTER/RANK NODE =====")
    print("Input trials:", len(state["raw_trials"]))

    patient = {
        **(state.get("patient_profile") or {}),
        "matched_conditions": state.get("matched_conditions") or [],
    }

    if state.get("location") and not patient.get("location"):
        patient["location"] = state["location"]

    ranked_trials = rank_trials(
        state["raw_trials"],
        patient,
        query=state.get("raw_query"),
    )

    print("Ranked trials:", len(ranked_trials))

    for trial in ranked_trials:
        print(
            trial.get("nct_id"),
            "|",
            trial.get("matched_condition"),
            "| condition:",
            trial.get("condition_similarity"),
            "| eligibility:",
            trial.get("eligibility_score"),
            "| status:",
            trial.get("eligibility_status"),
            "| score:",
            trial.get("ranking_score"),
        )

    return {
        **state,
        "ranked_trials": ranked_trials,
    }
