import re


def extract_patient_profile_regex(query: str) -> dict:

    profile = {
        "age": None,
        "sex": None,
        "location": None,
        "conditions": [],
        "symptoms": [],
        "medications": [],
        "lab_values": {},
        "medical_history": [],
    }

    query_lower = query.lower()

    age_patterns = [
        r"\b(\d{1,3})\s*(?:years?\s*old|year[- ]old)\b",
        r"\bage\s*(?:is|:)?\s*(\d{1,3})\b",
    ]

    for pattern in age_patterns:
        match = re.search(pattern, query_lower)
        if match:
            profile["age"] = int(match.group(1))
            break

    if re.search(r"\b(male|man|boy)\b", query_lower):
        profile["sex"] = "MALE"
    elif re.search(r"\b(female|woman|girl)\b", query_lower):
        profile["sex"] = "FEMALE"

    location_match = re.search(
        r"(?:living in|located in|near|from)\s+([A-Za-z][A-Za-z\s\-]{1,40})",
        query,
        re.IGNORECASE,
    )
    if location_match:
        profile["location"] = location_match.group(1).strip().rstrip("., ")

    condition_keywords = {
        "type 2 diabetes": "Type 2 Diabetes",
        "diabetes": "Type 2 Diabetes",
        "diabetic": "Type 2 Diabetes",
        "hypertension": "Hypertension",
        "high blood pressure": "Hypertension",
        "asthma": "Asthma",
        "lung cancer": "Lung Cancer",
        "heart failure": "Heart Failure",
        "kidney disease": "Chronic Kidney Disease",
        "chronic kidney disease": "Chronic Kidney Disease",
        "renal disease": "Chronic Kidney Disease",
    }

    for keyword, condition in condition_keywords.items():
        if keyword in query_lower and condition not in profile["conditions"]:
            profile["conditions"].append(condition)

    symptom_keywords = [
        "frequent urination",
        "high sugar",
        "high blood sugar",
        "chest pain",
        "trouble breathing",
        "shortness of breath",
        "persistent cough",
    ]

    for symptom in symptom_keywords:
        if symptom in query_lower:
            profile["symptoms"].append(symptom)

    medication_match = re.findall(
        r"\b(metformin|insulin|aspirin|statins?)\b",
        query_lower,
    )
    profile["medications"] = list(dict.fromkeys(medication_match))

    hba1c_match = re.search(
        r"hba1c\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?)",
        query_lower,
    )
    if hba1c_match:
        profile["lab_values"]["HbA1c"] = float(hba1c_match.group(1))

    bmi_match = re.search(
        r"\bbmi\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?)",
        query_lower,
    )
    if bmi_match:
        profile["lab_values"]["BMI"] = float(bmi_match.group(1))

    egfr_match = re.search(
        r"(?:egfr|gfr)\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?)",
        query_lower,
    )
    if egfr_match:
        profile["lab_values"]["eGFR"] = float(egfr_match.group(1))

    creatinine_match = re.search(
        r"creatinine\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?)",
        query_lower,
    )
    if creatinine_match:
        profile["lab_values"]["creatinine"] = float(creatinine_match.group(1))

    history_keywords = {
        "heart attack": "Heart Attack",
        "stroke": "Stroke",
        "kidney disease": "Chronic Kidney Disease",
        "liver disease": "Liver Disease",
    }

    for keyword, history in history_keywords.items():
        if keyword in query_lower and history not in profile["medical_history"]:
            profile["medical_history"].append(history)

    return profile
