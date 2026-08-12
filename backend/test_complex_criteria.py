from raw_functions.criterion_matcher import (
    match_bmi_criterion,
    match_lab_value_criterion,
    match_medical_history_criterion,
)


def test_bmi_range_match():

    patient = {"lab_values": {"BMI": 31.0}}
    result = match_bmi_criterion("BMI 27 to 35", patient)
    assert result == "MATCH"


def test_bmi_range_mismatch():

    patient = {"lab_values": {"BMI": 22.0}}
    result = match_bmi_criterion("BMI 27 to 35", patient)
    assert result == "MISMATCH"


def test_egfr_minimum_match():

    patient = {"lab_values": {"eGFR": 55.0}}
    result = match_lab_value_criterion("eGFR >= 30", patient)
    assert result == "MATCH"


def test_creatinine_maximum_mismatch():

    patient = {"lab_values": {"creatinine": 2.1}}
    result = match_lab_value_criterion("creatinine <= 1.5", patient)
    assert result == "MISMATCH"


def test_kidney_history_exclusion_match():

    patient = {
        "conditions": ["Chronic Kidney Disease"],
        "medical_history": [],
    }
    result = match_medical_history_criterion(
        "History of severe kidney disease",
        patient,
    )
    assert result == "MATCH"
