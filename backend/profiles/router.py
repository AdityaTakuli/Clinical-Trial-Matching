from datetime import date, datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from auth.dependencies import get_current_user
from database.database import get_db
from database.models import User, UserProfile
from profiles.service import serialize_profile


router = APIRouter(prefix="/users/me/profile", tags=["Profile"])

MAX_LIST_ITEMS = 50
MAX_ITEM_LENGTH = 120


class ProfileBody(BaseModel):
    full_name: str | None = Field(default=None, max_length=120)
    date_of_birth: date | None = None
    sex: Literal["MALE", "FEMALE", "OTHER"] | None = None
    phone: str | None = Field(default=None, max_length=32)
    city: str | None = Field(default=None, max_length=120)
    country: str | None = Field(default=None, max_length=120)
    conditions: list[str] = Field(default_factory=list)
    medications: list[str] = Field(default_factory=list)
    allergies: list[str] = Field(default_factory=list)
    medical_history: list[str] = Field(default_factory=list)
    lab_values: dict[str, float] = Field(default_factory=dict)
    notes: str | None = Field(default=None, max_length=4000)
    contact_consent: bool = False

    @field_validator("full_name", "phone", "city", "country", "notes", "sex", mode="before")
    @classmethod
    def blank_to_none(cls, value):
        if isinstance(value, str):
            value = value.strip()
            return value or None
        return value

    @field_validator("conditions", "medications", "allergies", "medical_history")
    @classmethod
    def clean_list(cls, values: list[str]) -> list[str]:
        seen: set[str] = set()
        cleaned: list[str] = []
        for value in values:
            text = value.strip()[:MAX_ITEM_LENGTH]
            if text and text.lower() not in seen:
                seen.add(text.lower())
                cleaned.append(text)
        if len(cleaned) > MAX_LIST_ITEMS:
            raise ValueError(f"At most {MAX_LIST_ITEMS} items allowed")
        return cleaned

    @field_validator("lab_values")
    @classmethod
    def clean_labs(cls, values: dict[str, float]) -> dict[str, float]:
        cleaned = {key.strip()[:40]: value for key, value in values.items() if key.strip()}
        if len(cleaned) > 30:
            raise ValueError("At most 30 lab values allowed")
        return cleaned

    @field_validator("date_of_birth")
    @classmethod
    def dob_in_past(cls, value: date | None) -> date | None:
        if value is not None and value > date.today():
            raise ValueError("Date of birth cannot be in the future")
        if value is not None and value.year < 1900:
            raise ValueError("Date of birth looks invalid")
        return value


class ProfileOut(ProfileBody):
    age: int | None
    completion: int
    updated_at: datetime


def _get_profile(db: Session, user_id: int) -> UserProfile | None:
    return db.query(UserProfile).filter(UserProfile.user_id == user_id).first()


@router.get("", response_model=ProfileOut)
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = _get_profile(db, current_user.id)

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not created yet",
        )

    return serialize_profile(profile)


@router.put("", response_model=ProfileOut)
def upsert_profile(
    body: ProfileBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = _get_profile(db, current_user.id)

    if profile is None:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)

    for field, value in body.model_dump().items():
        setattr(profile, field, value)

    profile.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(profile)

    return serialize_profile(profile)


@router.delete("", status_code=status.HTTP_200_OK)
def delete_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = _get_profile(db, current_user.id)

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not created yet",
        )

    db.delete(profile)
    db.commit()

    return {"message": "Profile deleted"}
