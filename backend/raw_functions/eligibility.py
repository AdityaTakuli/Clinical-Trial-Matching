import re


def parse_age(age_string: str) -> float:

    """
    Converts values such as:

    '18 Years'
    '65 Years'
    '18'

    into a number.
    """

    match = re.search(
        r"\d+(?:\.\d+)?",
        str(age_string)
    )

    if not match:
        return float("inf")

    return float(match.group())


def calculate_eligibility_score(
    trial: dict,
    patient: dict
) -> float:

    age = patient.get("age")
    sex = patient.get("sex")

    score = 0.0
    checks = 0

    if age is not None:

        minimum_age = trial.get("minimum_age")
        maximum_age = trial.get("maximum_age")

        if minimum_age is not None or maximum_age is not None:

            checks += 1

            age_ok = True

            if minimum_age is not None:
                age_ok &= age >= parse_age(minimum_age)

            if maximum_age is not None:
                age_ok &= age <= parse_age(maximum_age)

            if age_ok:
                score += 1.0

    if sex is not None:

        trial_sex = trial.get("sex")

        if trial_sex:

            checks += 1

            trial_sex = trial_sex.upper()

            if trial_sex == "ALL":
                score += 1.0

            elif trial_sex == sex.upper():
                score += 1.0

    if checks == 0:
        return 0.5

    return score / checks
