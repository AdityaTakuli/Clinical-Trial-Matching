from raw_functions.fetch_trials import fetch_trials_for_conditions


def fetch_trials_node(state):

    trials = fetch_trials_for_conditions(
        conditions=state["matched_conditions"],
        location=state["location"],
        page_size=5,
    )

    return {
        **state,
        "raw_trials": trials,
    }
