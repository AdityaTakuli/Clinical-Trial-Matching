import re
from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth.dependencies import get_current_user
from database.database import get_db
from database.models import TrialRegistration, User, UserProfile


router = APIRouter(tags=["Trial registrations"])

NCT_ID_PATTERN = re.compile(r"^NCT\d{8}$")


class RegisterTrialBody(BaseModel):
    title: str | None = Field(default=None, max_length=1000)
    preferred_contact: Literal["EMAIL", "PHONE"] = "EMAIL"
    message: str | None = Field(default=None, max_length=2000)


class RegistrationItem(BaseModel):
    id: int
    nct_id: str
    title: str | None
    status: str
    preferred_contact: str
    message: str | None
    created_at: datetime

    class Config:
        from_attributes = True


def _validate_nct_id(nct_id: str) -> str:
    nct_id = nct_id.strip().upper()
    if not NCT_ID_PATTERN.match(nct_id):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Invalid NCT ID",
        )
    return nct_id


@router.get("/users/me/registrations", response_model=list[RegistrationItem])
def list_registrations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(TrialRegistration)
        .filter(TrialRegistration.user_id == current_user.id)
        .order_by(TrialRegistration.created_at.desc())
        .all()
    )


@router.post(
    "/trials/{nct_id}/register",
    response_model=RegistrationItem,
    status_code=status.HTTP_201_CREATED,
)
def register_for_trial(
    nct_id: str,
    body: RegisterTrialBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    nct_id = _validate_nct_id(nct_id)

    profile = (
        db.query(UserProfile)
        .filter(UserProfile.user_id == current_user.id)
        .first()
    )

    if profile is None or not profile.full_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Complete your profile (at least your name) before registering for a trial",
        )

    if body.preferred_contact == "PHONE" and not profile.phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Add a phone number to your profile to be contacted by phone",
        )

    registration = TrialRegistration(
        user_id=current_user.id,
        nct_id=nct_id,
        title=body.title,
        preferred_contact=body.preferred_contact,
        message=body.message.strip() if body.message else None,
    )

    db.add(registration)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You are already registered for this trial",
        )

    db.refresh(registration)
    return registration


@router.delete("/trials/{nct_id}/register", status_code=status.HTTP_200_OK)
def withdraw_registration(
    nct_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    nct_id = _validate_nct_id(nct_id)

    registration = (
        db.query(TrialRegistration)
        .filter(
            TrialRegistration.user_id == current_user.id,
            TrialRegistration.nct_id == nct_id,
        )
        .first()
    )

    if registration is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration not found",
        )

    db.delete(registration)
    db.commit()

    return {"message": "Registration withdrawn"}
