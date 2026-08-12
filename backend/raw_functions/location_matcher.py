def calculate_location_score(
    trial: dict,
    patient: dict,
) -> float:

    patient_location = (patient.get("location") or "").strip().lower()

    if not patient_location:
        return 0.5

    locations = trial.get("locations") or []

    if not locations:
        return 0.5

    for location in locations:
        city = (location.get("city") or "").strip().lower()
        country = (location.get("country") or "").strip().lower()

        if patient_location == city:
            return 1.0

        if patient_location in city or city in patient_location:
            return 1.0

        if patient_location == country:
            return 0.5

        if patient_location in country or country in patient_location:
            return 0.5

    return 0.0
