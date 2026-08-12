import re


def extract_patient_profile(query: str) -> dict:

    profile = {
        "age": None,
        "sex": None,
    }

    age_patterns = [
        r"\b(\d{1,3})\s*(?:years?\s*old|year[- ]old)\b",
        r"\bage\s*(?:is|:)?\s*(\d{1,3})\b",
    ]

    for pattern in age_patterns:
        match = re.search(pattern, query.lower())

        if match:
            profile["age"] = int(match.group(1))
            break

    query_lower = query.lower()

    if re.search(r"\b(male|man|boy)\b", query_lower):
        profile["sex"] = "MALE"

    elif re.search(r"\b(female|woman|girl)\b", query_lower):
        profile["sex"] = "FEMALE"

    return profile


def patient_profile_node(state):

    profile = extract_patient_profile(
        state["raw_query"]
    )

    print("\n===== PATIENT PROFILE NODE =====")
    print("Profile:", profile)

    return {
        **state,
        "patient_profile": profile,
    }
