from nodes.semantic_match import semantic_match

result = semantic_match(
    "high sugar and frequent urination",
    top_k=5
)

print(result)