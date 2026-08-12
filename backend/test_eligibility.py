from raw_functions.eligibility import calculate_eligibility_score


patient = {
    "age": 25,
    "sex": "MALE"
}


trials = [

    {
        "minimum_age": "18 Years",
        "maximum_age": "65 Years",
        "sex": "ALL"
    },

    {
        "minimum_age": "50 Years",
        "maximum_age": "80 Years",
        "sex": "ALL"
    },

    {
        "minimum_age": "18 Years",
        "maximum_age": "65 Years",
        "sex": "FEMALE"
    },

    {
        "minimum_age": None,
        "maximum_age": None,
        "sex": "ALL"
    }
]


for trial in trials:

    score = calculate_eligibility_score(
        trial,
        patient
    )

    print(score)
