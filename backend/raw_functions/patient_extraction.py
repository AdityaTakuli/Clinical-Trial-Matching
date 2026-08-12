import json
import os
import re

from dotenv import load_dotenv
from groq import Groq

from raw_functions.patient_profile_regex import extract_patient_profile_regex


load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def _empty_profile() -> dict:

    return {
        "age": None,
        "sex": None,
        "location": None,
        "conditions": [],
        "symptoms": [],
        "medications": [],
        "lab_values": {},
        "medical_history": [],
    }


def extract_patient_profile_llm(query: str) -> dict:

    prompt = f"""
Extract patient information from the clinical trial search query.

Query:
{query}

Return ONLY valid JSON with this schema:
{{
  "age": number or null,
  "sex": "MALE" or "FEMALE" or null,
  "location": string or null,
  "conditions": [string],
  "symptoms": [string],
  "medications": [string],
  "lab_values": {{"HbA1c": number, "BMI": number, "eGFR": number, "creatinine": number}},
  "medical_history": [string]
}}

Rules:
- Do not diagnose.
- Do not infer values not stated.
- Use null/empty when unknown.
- lab_values should only include explicitly mentioned labs.
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": "You extract structured patient search information.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0,
            response_format={"type": "json_object"},
        )

        data = json.loads(response.choices[0].message.content)
        profile = _empty_profile()

        for key in profile:
            if key in data and data[key] is not None:
                profile[key] = data[key]

        if profile.get("sex"):
            profile["sex"] = str(profile["sex"]).upper()

        lab_values = profile.get("lab_values") or {}

        for lab_key, lab_value in list(lab_values.items()):
            if lab_value is None:
                del lab_values[lab_key]

        profile["lab_values"] = lab_values

        return profile

    except Exception:
        return extract_patient_profile_regex(query)


def extract_patient_profile(query: str) -> dict:

    if os.getenv("USE_REGEX_PATIENT_PROFILE", "").lower() == "true":
        return extract_patient_profile_regex(query)

    llm_profile = extract_patient_profile_llm(query)
    regex_profile = extract_patient_profile_regex(query)

    merged = _empty_profile()

    for key in ("age", "sex", "location"):
        merged[key] = llm_profile.get(key) or regex_profile.get(key)

    for key in ("conditions", "symptoms", "medications", "medical_history"):
        merged[key] = list(
            dict.fromkeys(
                (llm_profile.get(key) or [])
                + (regex_profile.get(key) or [])
            )
        )

    merged["lab_values"] = {
        **(regex_profile.get("lab_values") or {}),
        **(llm_profile.get("lab_values") or {}),
    }

    return merged
