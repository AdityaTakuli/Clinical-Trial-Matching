import re

from raw_functions.eligibility import (
    calculate_eligibility_score,
    parse_age,
)


CRITERION_TYPES = (
    "AGE",
    "SEX",
    "CONDITION",
    "SYMPTOM",
    "LAB_VALUE",
    "MEDICATION",
    "MEDICAL_HISTORY",
    "BMI",
    "PREGNANCY",
    "LOCATION",
    "OTHER",
)


def classify_criterion(criterion: str) -> str:

    text = criterion.lower()

    if re.search(r"\bpregnan", text):
        return "PREGNANCY"

    if "hba1c" in text or "a1c" in text:
        return "LAB_VALUE"

    if any(word in text for word in [
        "egfr", "gfr", "creatinine", "kidney function", "renal function"
    ]):
        return "LAB_VALUE"

    if "bmi" in text or "body mass index" in text:
        return "BMI"

    if any(word in text for word in ["medication", "metformin", "insulin", "drug"]):
        return "MEDICATION"

    if any(word in text for word in ["history of", "prior", "previous"]):
        return "MEDICAL_HISTORY"

    if (
        "year" in text
        and any(word in text for word in ["age", "older", "younger", "adult"])
    ):
        return "AGE"

    if any(word in text for word in ["male", "female", "men", "women"]):
        return "SEX"

    if any(word in text for word in [
        "diabetes", "diabetic", "hypertension", "asthma", "cancer", "failure"
    ]):
        return "CONDITION"

    if any(word in text for word in [
        "symptom", "cough", "pain", "breathing", "urination"
    ]):
        return "SYMPTOM"

    return "OTHER"


def match_age_criterion(criterion: str, age: int | None) -> str:

    if age is None:
        return "UNKNOWN"

    text = criterion.lower()

    match = re.search(r"(\d+)\s*(?:to|-)\s*(\d+)\s*years?", text)
    if match:
        minimum = int(match.group(1))
        maximum = int(match.group(2))
        return "MATCH" if minimum <= age <= maximum else "MISMATCH"

    match = re.search(r"(?:at least|minimum of)\s*(\d+)\s*years?", text)
    if match:
        minimum = int(match.group(1))
        return "MATCH" if age >= minimum else "MISMATCH"

    match = re.search(r"(\d+)\s*years?\s*(?:or\s*)?older", text)
    if match:
        minimum = int(match.group(1))
        return "MATCH" if age >= minimum else "MISMATCH"

    return "UNKNOWN"


def match_sex_criterion(criterion: str, sex: str | None) -> str:

    if sex is None:
        return "UNKNOWN"

    text = criterion.lower()

    if "male" in text and "female" not in text:
        return "MATCH" if sex.upper() == "MALE" else "MISMATCH"

    if "female" in text and "male" not in text:
        return "MATCH" if sex.upper() == "FEMALE" else "MISMATCH"

    return "UNKNOWN"


def match_lab_value_criterion(criterion: str, patient: dict) -> str:

    lab_values = patient.get("lab_values") or {}
    text = criterion.lower()

    range_match = re.search(
        r"(?:hba1c|a1c).*?(?:between|from)?\s*(\d+(?:\.\d+)?)\s*(?:%?\s*(?:to|and|-)\s*)(\d+(?:\.\d+)?)",
        text,
    )
    if range_match:
        hba1c = lab_values.get("HbA1c")
        if hba1c is None:
            return "UNKNOWN"
        minimum = float(range_match.group(1))
        maximum = float(range_match.group(2))
        return "MATCH" if minimum <= hba1c <= maximum else "MISMATCH"

    bmi_range = re.search(
        r"bmi.*?(?:between|from)?\s*(\d+(?:\.\d+)?)\s*(?:to|and|-)\s*(\d+(?:\.\d+)?)",
        text,
    )
    if bmi_range:
        bmi = lab_values.get("BMI")
        if bmi is None:
            return "UNKNOWN"
        minimum = float(bmi_range.group(1))
        maximum = float(bmi_range.group(2))
        return "MATCH" if minimum <= bmi <= maximum else "MISMATCH"

    egfr_min = re.search(
        r"(?:egfr|gfr).*?(?:≥|>=|at least|minimum of)\s*(\d+(?:\.\d+)?)",
        text,
    )
    if egfr_min:
        egfr = lab_values.get("eGFR")
        if egfr is None:
            return "UNKNOWN"
        minimum = float(egfr_min.group(1))
        return "MATCH" if egfr >= minimum else "MISMATCH"

    creatinine_max = re.search(
        r"creatinine.*?(?:≤|<=|less than|under|maximum of)\s*(\d+(?:\.\d+)?)",
        text,
    )
    if creatinine_max:
        creatinine = lab_values.get("creatinine")
        if creatinine is None:
            return "UNKNOWN"
        maximum = float(creatinine_max.group(1))
        return "MATCH" if creatinine <= maximum else "MISMATCH"

    if "hba1c" in text or "a1c" in text:
        return "UNKNOWN"

    if any(word in text for word in ["egfr", "gfr", "creatinine"]):
        return "UNKNOWN"

    return "UNKNOWN"


def match_bmi_criterion(criterion: str, patient: dict) -> str:

    bmi = (patient.get("lab_values") or {}).get("BMI")

    if bmi is None:
        return "UNKNOWN"

    text = criterion.lower()

    range_match = re.search(
        r"(?:between|from)?\s*(\d+(?:\.\d+)?)\s*(?:to|and|-)\s*(\d+(?:\.\d+)?)",
        text,
    )
    if range_match:
        minimum = float(range_match.group(1))
        maximum = float(range_match.group(2))
        return "MATCH" if minimum <= bmi <= maximum else "MISMATCH"

    minimum_match = re.search(
        r"(?:≥|>=|at least|minimum of)\s*(\d+(?:\.\d+)?)",
        text,
    )
    if minimum_match:
        minimum = float(minimum_match.group(1))
        return "MATCH" if bmi >= minimum else "MISMATCH"

    maximum_match = re.search(
        r"(?:≤|<=|at most|maximum of|under)\s*(\d+(?:\.\d+)?)",
        text,
    )
    if maximum_match:
        maximum = float(maximum_match.group(1))
        return "MATCH" if bmi <= maximum else "MISMATCH"

    return "UNKNOWN"


def match_medical_history_criterion(criterion: str, patient: dict) -> str:

    history = list(patient.get("medical_history") or [])
    history.extend(patient.get("conditions") or [])

    if not history:
        return "UNKNOWN"

    text = criterion.lower()

    for item in history:
        item_lower = item.lower()
        if item_lower in text or any(
            token in text for token in item_lower.split() if len(token) > 3
        ):
            return "MATCH"

    kidney_terms = ["kidney", "renal", "nephro"]
    if any(term in text for term in kidney_terms):
        for item in history:
            if any(term in item.lower() for term in kidney_terms):
                return "MATCH"

    return "UNKNOWN"


def match_condition_criterion(criterion: str, patient: dict) -> str:

    conditions = list(patient.get("conditions") or [])
    conditions.extend(patient.get("matched_conditions") or [])

    if not conditions:
        return "UNKNOWN"

    text = criterion.lower()

    for condition in conditions:
        condition_lower = condition.lower()
        if condition_lower in text or any(
            token in text for token in condition_lower.split() if len(token) > 3
        ):
            return "MATCH"

    return "UNKNOWN"


def match_medication_criterion(criterion: str, patient: dict) -> str:

    medications = patient.get("medications") or []

    if not medications:
        return "UNKNOWN"

    text = criterion.lower()

    for medication in medications:
        if medication.lower() in text:
            return "MATCH"

    return "UNKNOWN"


def match_pregnancy_criterion(criterion: str, patient: dict) -> str:

    sex = patient.get("sex")

    if sex == "MALE":
        return "MISMATCH"

    if sex == "FEMALE":
        return "UNKNOWN"

    return "UNKNOWN"


def match_criterion(criterion: str, patient: dict) -> str:

    criterion_type = classify_criterion(criterion)

    if criterion_type == "AGE":
        return match_age_criterion(criterion, patient.get("age"))

    if criterion_type == "SEX":
        return match_sex_criterion(criterion, patient.get("sex"))

    if criterion_type == "LAB_VALUE":
        return match_lab_value_criterion(criterion, patient)

    if criterion_type == "BMI":
        return match_bmi_criterion(criterion, patient)

    if criterion_type == "MEDICAL_HISTORY":
        return match_medical_history_criterion(criterion, patient)

    if criterion_type == "CONDITION":
        return match_condition_criterion(criterion, patient)

    if criterion_type == "MEDICATION":
        return match_medication_criterion(criterion, patient)

    if criterion_type == "PREGNANCY":
        return match_pregnancy_criterion(criterion, patient)

    return "UNKNOWN"


def evaluate_trial_criteria(
    parsed_eligibility: dict,
    patient: dict,
) -> list[dict]:

    results = []

    for section in ("inclusion", "exclusion"):
        section_type = section.upper()

        for criterion in parsed_eligibility.get(section, []):
            result = match_criterion(criterion, patient)

            results.append(
                {
                    "type": section_type,
                    "criterion_type": classify_criterion(criterion),
                    "criterion": criterion,
                    "result": result,
                }
            )

    return results


def _interpret_criterion_result(
    section: str,
    result: str,
) -> tuple[bool, bool, bool]:

    if section == "INCLUSION":
        return (
            result == "MATCH",
            result == "MISMATCH",
            result == "UNKNOWN",
        )

    return (
        result == "MISMATCH",
        result == "MATCH",
        result == "UNKNOWN",
    )


def build_eligibility_assessment(
    trial: dict,
    patient: dict,
    parsed_eligibility: dict | None = None,
) -> dict:

    parsed = parsed_eligibility or trial.get("parsed_eligibility") or {
        "inclusion": [],
        "exclusion": [],
    }

    criteria = evaluate_trial_criteria(parsed, patient)

    matched = 0
    mismatched = 0
    unknown = 0
    inclusion_mismatch = False
    exclusion_match = False
    unknown_exists = False

    for item in criteria:
        is_match, is_mismatch, is_unknown = _interpret_criterion_result(
            item["type"],
            item["result"],
        )

        if is_match:
            matched += 1
        if is_mismatch:
            mismatched += 1
            if item["type"] == "INCLUSION":
                inclusion_mismatch = True
            else:
                exclusion_match = True
        if is_unknown:
            unknown += 1
            unknown_exists = True

    structured_score = calculate_eligibility_score(trial, patient)

    if inclusion_mismatch or exclusion_match:
        status = "POTENTIAL_MISMATCH"
        eligibility_score = 0.0
    elif unknown_exists:
        status = "UNCERTAIN"
        eligibility_score = (
            matched / (matched + unknown)
            if matched > 0
            else max(structured_score, 0.5)
        )
    else:
        status = "STRONG_MATCH"
        eligibility_score = max(structured_score, 1.0 if matched > 0 else 0.5)

    return {
        "eligibility_score": round(eligibility_score, 4),
        "status": status,
        "matched": matched,
        "mismatched": mismatched,
        "unknown": unknown,
        "criteria": criteria,
    }


def has_hard_incompatibility(
    trial: dict,
    patient: dict,
    assessment: dict,
) -> bool:

    if assessment["status"] == "POTENTIAL_MISMATCH":
        return True

    age = patient.get("age")

    if age is not None:
        minimum_age = trial.get("minimum_age")
        maximum_age = trial.get("maximum_age")

        if minimum_age is not None and age < parse_age(minimum_age):
            return True

        if maximum_age is not None and age > parse_age(maximum_age):
            return True

    sex = patient.get("sex")
    trial_sex = trial.get("sex")

    if sex and trial_sex and trial_sex.upper() not in ("ALL", sex.upper()):
        return True

    return False
