from raw_functions.filter_rank import filter_rank


def filter_rank_node(state):

    ranked_trials = filter_rank(
        state["raw_trials"]
    )

    return {
        **state,
        "ranked_trials": ranked_trials,
    }

def filter_rank_node(state):

    print("\n===== FILTER/RANK NODE =====")
    print("Input trials:", len(state["raw_trials"]))

    ranked_trials = filter_rank(
        state["raw_trials"]
    )

    print("Ranked trials:", len(ranked_trials))

    for trial in ranked_trials:
        print(
            trial.get("nct_id"),
            "|",
            trial.get("matched_condition")
        )

    return {
        **state,
        "ranked_trials": ranked_trials,
    }