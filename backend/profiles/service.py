from datetime import date

from database.models import UserProfile


COMPLETION_FIELDS = (
    "full_name",
    "date_of_birth",
    "sex",
    "phone",
    "city",
    "country",
    "conditions",
    "medications",
)


def calculate_age(date_of_birth: date | None, today: date | None = None) -> int | None:
    if date_of_birth is None:
        return None

    today = today or date.today()
    before_birthday = (today.month, today.day) < (date_of_birth.month, date_of_birth.day)
    return today.year - date_of_birth.year - int(before_birthday)


def profile_completion(profile: UserProfile) -> int:
    filled = sum(1 for field in COMPLETION_FIELDS if getattr(profile, field))
    return round(filled / len(COMPLETION_FIELDS) * 100)


def serialize_profile(profile: UserProfile) -> dict:
    return {
        "full_name": profile.full_name,
        "date_of_birth": profile.date_of_birth,
        "age": calculate_age(profile.date_of_birth),
        "sex": profile.sex,
        "phone": profile.phone,
        "city": profile.city,
        "country": profile.country,
        "conditions": profile.conditions or [],
        "medications": profile.medications or [],
        "allergies": profile.allergies or [],
        "medical_history": profile.medical_history or [],
        "lab_values": profile.lab_values or {},
        "notes": profile.notes,
        "contact_consent": profile.contact_consent,
        "completion": profile_completion(profile),
        "updated_at": profile.updated_at,
    }


def profile_for_llm(profile: UserProfile) -> dict:
    """Medically relevant profile fields only — no contact details."""
    data = serialize_profile(profile)
    return {
        key: data[key]
        for key in (
            "age",
            "sex",
            "city",
            "country",
            "conditions",
            "medications",
            "allergies",
            "medical_history",
            "lab_values",
            "notes",
        )
        if data[key] not in (None, "", [], {})
    }
