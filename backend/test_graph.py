from graph import app_graph


initial_state = {
    "raw_query": """
        I have trouble breathing and chest tightness.
        I am 25 years old and looking for trials near Chennai.
    """,

    "condition": None,
    "location": None,
    "age": None,
    "patient_profile": {},
    "matched_conditions": [],
    "condition_matches": [],
    "raw_trials": [],
    "ranked_trials": [],
    "final_results": [],
}


result = app_graph.invoke(
    initial_state
)


print("\nCONDITION:")
print(result["condition"])

print("\nLOCATION:")
print(result["location"])

print("\nMATCHED CONDITIONS:")
print(result["matched_conditions"])

print("\nFINAL RESULTS:")
print(len(result["final_results"]))


for trial in result["final_results"]:

    print("=" * 70)

    print("NCT:", trial["nct_id"])

    print("TITLE:", trial["title"])

    print("MATCHED CONDITION:",
          trial["matched_condition"])

    print("\nPLAIN LANGUAGE ELIGIBILITY:")

    print(
        trial["eligibility_explanation"]
    )
