import logging
import os
import time

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from sqlalchemy.orm import Session

from auth.router import router as auth_router
from auth.dependencies import get_current_user
from database.database import get_db
from database.models import User, SearchHistory
from users.router import router as users_router
from cache.service import get_cached_search, set_cached_search
from cache.rate_limit import check_rate_limit
from graph import app_graph
from logging_config import new_request_id, setup_logging


setup_logging()
logger = logging.getLogger(__name__)

app = FastAPI(
    title="TrialMatch API",
    description="Clinical trial discovery API",
    version="1.0.0",
)

origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)


class SearchRequest(BaseModel):
    query: str


@app.middleware("http")
async def log_requests(request: Request, call_next):

    request_id = new_request_id()
    start = time.perf_counter()

    logger.info("Started %s %s", request.method, request.url.path)

    response = await call_next(request)

    duration_ms = round((time.perf_counter() - start) * 1000, 2)
    logger.info(
        "Completed %s %s status=%s duration_ms=%s",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )

    response.headers["X-Request-ID"] = request_id
    return response


@app.get("/")
def root():
    return {
        "message": "TrialMatch API is running",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok"}


def _record_search_history(db, user_id, query, result_count, matched_conditions):
    try:
        db.add(
            SearchHistory(
                user_id=user_id,
                query=query,
                result_count=result_count,
                matched_conditions=matched_conditions,
            )
        )
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Failed to record search history")


@app.post("/search-trials")
async def search_trials(
    request: SearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    if not check_rate_limit(current_user.id):
        logger.warning("Rate limit exceeded for user_id=%s", current_user.id)
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Try again later.",
        )

    logger.info("Search request from user_id=%s email=%s", current_user.id, current_user.email)

    # Cache lookup (results are query-based, not user-specific)
    cached_payload = get_cached_search(request.query)
    if cached_payload is not None:
        logger.info("Cache HIT for search query")
        _record_search_history(
            db,
            current_user.id,
            request.query,
            len(cached_payload.get("trials") or []),
            cached_payload.get("matched_conditions"),
        )
        return {**cached_payload, "cached": True}

    logger.info("Cache MISS for search query")

    initial_state = {
        "user_id": current_user.id,
        "raw_query": request.query,
        "condition": None,
        "location": None,
        "age": None,
        "patient_profile": {},
        "matched_conditions": [],
        "condition_matches": [],
        "raw_trials": [],
        "ranked_trials": [],
        "final_results": [],
    }

    try:
        result = await app_graph.ainvoke(
            initial_state
        )
    except Exception:
        logger.exception("Pipeline failed")
        raise HTTPException(
            status_code=502,
            detail="Trial matching service temporarily unavailable",
        )

    trials = result.get("final_results") or []
    matched_conditions = result.get("condition_matches")

    payload = {
        "query": request.query,
        "patient_profile": result.get("patient_profile"),
        "matched_conditions": matched_conditions,
        "trials": trials,
        "disclaimer": (
            "Likely matches based on the information provided. "
            "Final eligibility must be confirmed with the trial site."
        ),
    }

    set_cached_search(request.query, payload)

    _record_search_history(
        db,
        current_user.id,
        request.query,
        len(trials),
        matched_conditions,
    )

    return {**payload, "cached": False}
