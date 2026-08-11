from raw_functions.filter_rank import filter_rank


def filter_rank_node(state):

    ranked_trials = filter_rank(
        state["raw_trials"]
    )

    return {
        **state,
        "ranked_trials": ranked_trials,
    }
