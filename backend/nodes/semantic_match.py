from raw_functions.semantic_match import semantic_match


def semantic_match_node(state):

    matches = semantic_match(
        state["condition"],
        top_k=3
    )

    matched_conditions = [
        match["condition"]
        for match in matches
    ]

    return {
        **state,
        "matched_conditions": matched_conditions,
    }
