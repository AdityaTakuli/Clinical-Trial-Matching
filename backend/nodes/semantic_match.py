from raw_functions.semantic_match import semantic_match


def semantic_match_node(state):

    print("\n===== SEMANTIC MATCH NODE =====")
    print("Condition:", state["condition"])

    matches = semantic_match(
        state["condition"],
        top_k=3
    )

    matched_conditions = [
        match["condition"]
        for match in matches
    ]

    print("Matched conditions (500-corpus):")
    for match in matches:
        print(
            f"  {match['condition']}",
            f"(similarity: {match['similarity']:.3f})"
        )

    return {
        **state,
        "matched_conditions": matched_conditions,
        "condition_matches": matches,
    }
