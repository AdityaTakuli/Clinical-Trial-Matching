from raw_functions.filter_rank import filter_rank


def filter_rank_node(state):

    print("\n===== FILTER/RANK NODE =====")
    print("Input trials:", len(state["raw_trials"]))

    ranked_trials = filter_rank(
        state["raw_trials"],
        state.get("patient_profile")
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
            "| score:",
            trial.get("ranking_score")
        )

    return {
        **state,
        "ranked_trials": ranked_trials,
    }
