from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth.dependencies import get_current_user
from database.database import get_db
from database.models import User, SearchHistory, SavedTrial


router = APIRouter(tags=["User data"])


class SearchHistoryItem(BaseModel):
    id: int
    query: str
    result_count: int | None
    matched_conditions: list | None
    created_at: datetime

    class Config:
        from_attributes = True


class SaveTrialRequest(BaseModel):
    title: str | None = None


class SaveTrialBody(BaseModel):
    nct_id: str
    title: str | None = None


class SavedTrialItem(BaseModel):
    id: int
    nct_id: str
    title: str | None
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/search-history", response_model=list[SearchHistoryItem])
@router.get("/users/me/search-history", response_model=list[SearchHistoryItem])
def get_search_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(SearchHistory)
        .filter(SearchHistory.user_id == current_user.id)
        .order_by(SearchHistory.created_at.desc())
        .all()
    )


@router.delete("/users/me/search-history", status_code=status.HTTP_200_OK)
def clear_search_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    deleted = (
        db.query(SearchHistory)
        .filter(SearchHistory.user_id == current_user.id)
        .delete(synchronize_session=False)
    )
    db.commit()

    return {"deleted": deleted}


def _persist_saved_trial(db, user_id, nct_id, title):
    saved = SavedTrial(
        user_id=user_id,
        nct_id=nct_id,
        title=title,
    )

    db.add(saved)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Trial already saved",
        )

    db.refresh(saved)
    return saved


@router.get("/saved-trials", response_model=list[SavedTrialItem])
@router.get("/users/me/saved-trials", response_model=list[SavedTrialItem])
def get_saved_trials(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(SavedTrial)
        .filter(SavedTrial.user_id == current_user.id)
        .order_by(SavedTrial.created_at.desc())
        .all()
    )


@router.post(
    "/saved-trials",
    response_model=SavedTrialItem,
    status_code=status.HTTP_201_CREATED,
)
def save_trial_body(
    body: SaveTrialBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _persist_saved_trial(db, current_user.id, body.nct_id, body.title)


@router.post(
    "/trials/{nct_id}/save",
    response_model=SavedTrialItem,
    status_code=status.HTTP_201_CREATED,
)
def save_trial(
    nct_id: str,
    request: SaveTrialRequest | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _persist_saved_trial(
        db,
        current_user.id,
        nct_id,
        request.title if request else None,
    )


@router.delete("/saved-trials/{nct_id}", status_code=status.HTTP_200_OK)
@router.delete("/trials/{nct_id}/save", status_code=status.HTTP_200_OK)
def unsave_trial(
    nct_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    saved = (
        db.query(SavedTrial)
        .filter(
            SavedTrial.user_id == current_user.id,
            SavedTrial.nct_id == nct_id,
        )
        .first()
    )

    if saved is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saved trial not found",
        )

    db.delete(saved)
    db.commit()

    return {"message": "Trial removed from saved list"}
