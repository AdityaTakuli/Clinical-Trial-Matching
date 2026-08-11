from raw_functions.extract_query import extract_query


def extract_query_node(state):

    result = extract_query(
        state["raw_query"]
    )

    return {
        **state,
        "condition": result.get("condition"),
        "location": result.get("location"),
        "age": result.get("age"),
    }
