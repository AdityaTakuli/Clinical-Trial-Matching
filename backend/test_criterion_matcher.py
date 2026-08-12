from raw_functions.criterion_matcher import (
    evaluate_trial_criteria
)


patient = {
    "age": 25,
    "sex": "MALE"
}


eligibility = {
    "inclusion": [
        "Age 18 to 65 years",
        "Male participants"
    ],

    "exclusion": [
        "Age 70 years or older"
    ]
}


results = evaluate_trial_criteria(
    eligibility,
    patient
)


for result in results:
    print(
        result["type"],
        "|",
        result["result"],
        "|",
        result["criterion"]
    )
