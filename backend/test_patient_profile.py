from raw_functions.patient_profile_regex import extract_patient_profile_regex as extract_patient_profile


queries = [
    "I am a 25 year old male with diabetes",
    "I am a 42 year old woman with high sugar",
    "I have diabetes and frequent urination",
    "age 35 male with hypertension",
]


for query in queries:

    profile = extract_patient_profile(query)

    print(query)
    print(profile)
    print()
