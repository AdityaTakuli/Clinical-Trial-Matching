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



def fetch_trials_node(state):

    print("\n===== FETCH TRIALS NODE =====")
    print("Conditions:", state["matched_conditions"])
    print("Location:", state["location"])

    trials = fetch_trials_for_conditions(
        conditions=state["matched_conditions"],
        location=state["location"],
        page_size=5,
    )

    print("Fetched trials:", len(trials))

    for trial in trials:
        print(
            trial.get("nct_id"),
            "|",
            trial.get("matched_condition")
        )

    return {
        **state,
        "raw_trials": trials,
    }