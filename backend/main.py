import logging
import time
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from graph import app_graph
from logging_config import new_request_id, setup_logging


setup_logging()
logger = logging.getLogger(__name__)

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"

app = FastAPI(
    title="TrialMatch API",
    description="Clinical trial discovery API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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

    index_path = FRONTEND_DIR / "index.html"

    if index_path.exists():
        return FileResponse(index_path)

    return {
        "message": "TrialMatch API is running",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/search-trials")
async def search_trials(request: SearchRequest):

    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    initial_state = {
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

    return {
        "query": request.query,
        "patient_profile": result.get("patient_profile"),
        "matched_conditions": result.get("condition_matches"),
        "trials": trials,
        "disclaimer": (
            "Likely matches based on the information provided. "
            "Final eligibility must be confirmed with the trial site."
        ),
    }


if FRONTEND_DIR.exists():
    app.mount(
        "/static",
        StaticFiles(directory=FRONTEND_DIR),
        name="static",
    )
