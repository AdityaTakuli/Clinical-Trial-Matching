from raw_functions.patient_extraction import extract_patient_profile


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
