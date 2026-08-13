# TrialMatch

AI-powered clinical trial discovery. Users describe their situation in natural language; TrialMatch extracts a patient profile, semantically matches conditions against a 500-condition corpus, fetches trials from ClinicalTrials.gov, ranks them by relevance, and returns personalized results.

**Architecture:** Next.js frontend + FastAPI backend + LangGraph pipeline + PostgreSQL + Redis.

---

## Table of Contents

- [System Architecture](#system-architecture)
- [Request Flows](#request-flows)
- [LangGraph Pipeline](#langgraph-pipeline)
- [Data Storage](#data-storage)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Docker](#docker)

---

## System Architecture

```mermaid
flowchart TB
    subgraph Client["Client (Browser)"]
        UI["Next.js App\n:3000"]
    end

    subgraph Frontend["frontend-next/"]
        Pages["Pages\n/  /search  /login  /register"]
        AuthLib["lib/auth.ts\nJWT in localStorage"]
        Proxy["next.config.ts\n/api/* → :8000"]
    end

    subgraph Backend["backend/ (FastAPI :8000)"]
        API["main.py"]
        Auth["auth/\nregister · login · me"]
        Users["users/\nhistory · saved trials"]
        Cache["cache/\nsearch cache · rate limit"]
        Graph["LangGraph Pipeline"]
    end

    subgraph Data["Data Layer"]
        PG[("PostgreSQL\nusers · search_history\nsaved_trials")]
        Redis[("Redis\ncache · rate counters")]
        CTGov["ClinicalTrials.gov API"]
        Corpus["500-condition corpus\n+ embeddings"]
        Groq["Groq LLM API"]
    end

    UI --> Pages
    Pages --> AuthLib
    Pages --> Proxy
    Proxy --> API

    API --> Auth
    API --> Users
    API --> Cache
    API --> Graph

    Auth --> PG
    Users --> PG
    Cache --> Redis
    Graph --> Corpus
    Graph --> CTGov
    Graph --> Groq
    Graph --> Cache
```

### Component Responsibilities

| Component | Role |
|-----------|------|
| **frontend-next/** | React/Next.js UI. Handles login state, search UI, trial cards, charts. Proxies `/api/*` to FastAPI. |
| **backend/** | Python API only — no static frontend served. Auth, search, user data, caching, rate limiting. |
| **LangGraph** | Orchestrates the trial-matching pipeline as a state machine across 6 nodes. |
| **PostgreSQL** | Persistent app data: users, search history, saved trials. |
| **Redis** | Ephemeral data: search result cache (TTL 1h), per-user rate limit counters (30 req/min). |
| **ClinicalTrials.gov** | External source of live trial data (not stored permanently). |

---

## Request Flows

### Authentication Flow

```mermaid
sequenceDiagram
    participant Browser
    participant Next as Next.js (:3000)
    participant API as FastAPI (:8000)
    participant PG as PostgreSQL

    Browser->>Next: POST /api/auth/register
    Next->>API: POST /auth/register
    API->>API: Argon2 hash password
    API->>PG: INSERT user
    API-->>Browser: 200 { user }

    Browser->>Next: POST /api/auth/login
    Next->>API: POST /auth/login
    API->>PG: SELECT user by email
    API->>API: verify password + create JWT
    API-->>Browser: 200 { access_token, token_type }

    Note over Browser: Token stored in localStorage

    Browser->>Next: GET /api/auth/me
    Note over Next: Authorization: Bearer JWT
    Next->>API: GET /auth/me
    API->>API: decode JWT → user_id
    API->>PG: SELECT user
    API-->>Browser: 200 { id, email }
```

### Search Flow (Authenticated)

```mermaid
sequenceDiagram
    participant Browser
    participant Next as Next.js
    participant API as FastAPI
    participant Redis
    participant PG as PostgreSQL
    participant Graph as LangGraph
    participant CT as ClinicalTrials.gov

    Browser->>Next: POST /api/search-trials
    Note over Browser: Authorization: Bearer JWT

    Next->>API: POST /search-trials

    API->>API: get_current_user() — verify JWT
    API->>Redis: INCR rate limit key
    alt Rate limit exceeded
        API-->>Browser: 429 Too Many Requests
    end

    API->>Redis: GET search:{hash(query)}
    alt Cache HIT
        Redis-->>API: cached payload
        API->>PG: INSERT search_history
        API-->>Browser: 200 { trials, cached: true }
    else Cache MISS
        API->>Graph: ainvoke(state)
        Graph->>Graph: extract → profile → semantic match
        Graph->>CT: fetch trials
        Graph->>Graph: filter → rank → explain
        Graph-->>API: final_results
        API->>Redis: SET search:{hash} TTL=3600
        API->>PG: INSERT search_history
        API-->>Browser: 200 { trials, cached: false }
    end
```

---

## LangGraph Pipeline

The core AI pipeline runs as a linear LangGraph state machine:

```mermaid
flowchart LR
    A["1. extract_query\nParse raw text"] --> B["2. patient_profile\nExtract age, sex,\nlocation, symptoms"]
    B --> C["3. semantic_match\nEmbed query →\n500-condition corpus"]
    C --> D["4. fetch_trials\nClinicalTrials.gov\nAPI per condition"]
    D --> E["5. filter_rank\nDeduplicate, eligibility,\nweighted scoring"]
    E --> F["6. explain_eligibility\nGenerate explanations"]
    F --> G["final_results"]
```

### Pipeline State (`TrialMatchState`)

| Field | Description |
|-------|-------------|
| `user_id` | Authenticated user (passed from API, not used in ranking yet) |
| `raw_query` | Original user input |
| `condition`, `location`, `age` | Extracted structured fields |
| `patient_profile` | Full extracted profile dict |
| `condition_matches` | Semantic matches with similarity scores |
| `raw_trials` | Unfiltered trials from ClinicalTrials.gov |
| `ranked_trials` | After filtering and scoring |
| `final_results` | Top trials with eligibility explanations |

### Ranking Signals (Current)

```
final_score =
    semantic condition similarity
  + eligibility matching (age, sex, criteria)
  + location proximity
  + recruitment status
  + recency
```

---

## Data Storage

TrialMatch separates three kinds of data:

```mermaid
flowchart LR
    subgraph Persistent["PostgreSQL — App Data"]
        U["users"]
        SH["search_history"]
        ST["saved_trials"]
    end

    subgraph Ephemeral["Redis — Fast / Temporary"]
        SC["search:{hash}\nTTL 3600s"]
        RL["trialmatch:rate:{uid}:{window}\nTTL 60s"]
    end

    subgraph External["External — Not Stored"]
        CT["ClinicalTrials.gov\ntrial records"]
        LLM["Groq LLM\ninference"]
    end
```

| Store | What goes here | What does NOT go here |
|-------|---------------|----------------------|
| **PostgreSQL** | Users, passwords (hashed), search history, saved trial bookmarks | Raw trial data from ClinicalTrials.gov |
| **Redis** | Cached search results (query-keyed), rate limit counters | User-specific data under shared keys |
| **ClinicalTrials.gov** | Live trial information (fetched on demand) | User credentials, app state |

---

## Database Schema

```mermaid
erDiagram
    users ||--o{ search_history : "has many"
    users ||--o{ saved_trials : "has many"

    users {
        int id PK
        string email UK
        string password_hash
        datetime created_at
    }

    search_history {
        int id PK
        int user_id FK
        text query
        int result_count
        json matched_conditions
        datetime created_at
    }

    saved_trials {
        int id PK
        int user_id FK
        string nct_id
        text title
        datetime created_at
    }
```

Create tables:

```bash
cd backend
python create_table.py
```

---

## API Reference

Interactive docs: **http://127.0.0.1:8000/docs**

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | No | API status + docs link |
| GET | `/health` | No | Health check |

### Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Register with email + password |
| POST | `/auth/login` | No | Login → returns JWT |
| GET | `/auth/me` | Yes | Current user profile |

### Search

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/search-trials` | Yes | Run trial matching pipeline |

Rate limited to **30 requests/minute** per user. Results cached for **1 hour** per normalized query.

### Search History

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/search-history` | Yes | List user's past searches |
| DELETE | `/users/me/search-history` | Yes | Clear all search history |

### Saved Trials

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/saved-trials` | Yes | List saved trials |
| POST | `/saved-trials` | Yes | Save a trial `{ nct_id, title? }` |
| DELETE | `/saved-trials/{nct_id}` | Yes | Remove a saved trial |

All user-data endpoints enforce per-user isolation — User A cannot access User B's history or saved trials.

### Error Codes

| Code | Meaning |
|------|---------|
| 400 | Invalid request (empty query, validation error) |
| 401 | Missing or invalid JWT |
| 404 | Saved trial not found |
| 409 | Duplicate (email already registered, trial already saved) |
| 429 | Rate limit exceeded |
| 502 | LangGraph pipeline failure |

---

## Project Structure

```
trialmatch/
├── frontend-next/              # Next.js 16 frontend (main UI)
│   ├── src/
│   │   ├── app/                # Pages: /, /search, /login, /register
│   │   ├── components/         # Navbar, SearchForm, TrialCard, AuthForm, charts
│   │   └── lib/
│   │       ├── auth.ts         # JWT storage, login/register, authFetch()
│   │       └── utils.ts
│   └── next.config.ts          # /api/* → FastAPI proxy
│
├── backend/                    # FastAPI API (Python only, no static files)
│   ├── main.py                 # App entry, /search-trials endpoint
│   ├── graph.py                # LangGraph state machine definition
│   ├── schemas.py              # TrialMatchState TypedDict
│   │
│   ├── auth/                   # Authentication
│   │   ├── router.py           # /auth/register, /login, /me
│   │   ├── security.py         # Argon2 hashing, JWT creation
│   │   └── dependencies.py     # get_current_user()
│   │
│   ├── users/                  # User data endpoints
│   │   └── router.py           # search history, saved trials
│   │
│   ├── database/               # PostgreSQL
│   │   ├── database.py         # Engine, SessionLocal, get_db()
│   │   └── models.py           # User, SearchHistory, SavedTrial
│   │
│   ├── cache/                  # Redis
│   │   ├── redis_client.py     # Connection (graceful degradation)
│   │   ├── service.py          # Search result cache
│   │   └── rate_limit.py       # Per-user rate limiting
│   │
│   ├── nodes/                  # LangGraph node wrappers
│   │   ├── extract_query.py
│   │   ├── patient_profile.py
│   │   ├── semantic_match.py
│   │   ├── fetch_trials.py
│   │   ├── filter_rank.py
│   │   └── explain_eligibility.py
│   │
│   ├── raw_functions/          # Core pipeline logic
│   │   ├── semantic_match.py   # Embedding + cosine similarity
│   │   ├── fetch_trials.py     # ClinicalTrials.gov API client
│   │   ├── ranking.py          # Weighted trial scoring
│   │   ├── eligibility.py      # Age/sex/criteria matching
│   │   ├── patient_extraction.py
│   │   └── ...
│   │
│   ├── data/
│   │   ├── condition_corpus_500.json
│   │   └── condition_embeddings.npz
│   │
│   ├── tests/evaluation/       # Offline ranking evaluation
│   ├── create_table.py         # DB bootstrap script
│   ├── requirements.txt
│   └── .env                    # Secrets (not committed)
│
├── Dockerfile                  # Backend container
├── docker-compose.yml
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion, Recharts |
| Backend | FastAPI, Uvicorn, Pydantic v2 |
| AI Pipeline | LangGraph, sentence-transformers, Groq LLM |
| Auth | Argon2 (pwdlib), JWT (python-jose), OAuth2 Bearer |
| Database | PostgreSQL 16, SQLAlchemy 2.0 |
| Cache | Redis 8 (redis-py) |
| External APIs | ClinicalTrials.gov, Groq |

---

## Local Development

### Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL (running on `localhost:5432`)
- Redis (running on `localhost:6379`)

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env` (see [Environment Variables](#environment-variables)), then:

```bash
python create_table.py          # create DB tables
uvicorn main:app --reload       # start API on :8000
```

API docs: http://127.0.0.1:8000/docs

### 2. Frontend

```bash
cd frontend-next
npm install
npm run dev                     # start on :3000
```

App: http://localhost:3000

The frontend proxies all `/api/*` requests to the backend via `next.config.ts`:

```
Browser  →  localhost:3000/api/search-trials
         →  localhost:8000/search-trials  (rewrite)
```

### 3. Register and Search

1. Open http://localhost:3000/register
2. Create an account (auto-logs in)
3. Go to http://localhost:3000/search
4. Enter a query like: *"I have high sugar and frequently urinate"*

---

## Environment Variables

Create `backend/.env`:

```env
# LLM
GROQ_API_KEY=your_groq_api_key

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/trialmatch

# Auth
SECRET_KEY=generate_a_long_random_string
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Cache
REDIS_URL=redis://localhost:6379/0
SEARCH_CACHE_TTL=3600
```

Never commit `.env` to git. Generate a secret key:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## Docker

Build and run the backend container:

```bash
docker compose up --build
```

This starts FastAPI on port 8000. PostgreSQL and Redis must be available separately (or extend `docker-compose.yml` to include them).

The frontend is developed and deployed independently via Next.js (`npm run build` / Vercel).

---

## Security Notes

- Passwords hashed with **Argon2** — never stored in plaintext
- JWTs signed with HS256, 30-minute expiration
- Rate limiting: 30 searches/minute per authenticated user
- All user-data endpoints scoped to `current_user.id`
- Redis and PostgreSQL bound to `127.0.0.1` in local dev
- CORS currently allows all origins (tighten for production)
