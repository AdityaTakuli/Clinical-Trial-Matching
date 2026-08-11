# TrialMatch — Unified Build & Execution Plan

*Merges overview.md (pitch/architecture) + plan.md (technical specs + RAG addition) into one document to build from.*

---

## 0. Panel Pitch (lead with this, not the tech)

> "Clinical trial listings are publicly available but functionally inaccessible to the patients they're meant to help, because eligibility criteria are written for clinicians, not patients."

Two guarantees to state explicitly:
1. **Nothing invented** — all trial data is real, live, pulled from ClinicalTrials.gov.
2. **Translation, not generation** — the LLM only rewrites eligibility criteria that were fetched; it never infers criteria that aren't there. Every card links back to the source listing so the rewrite can be checked against the original.

---

## 1. What It Does

Input: a patient's condition (or a vague symptom description) + optional location/age.
Output: currently-recruiting trials they may qualify for, with eligibility explained in plain language instead of dense clinical text (e.g. *"histologically confirmed adenocarcinoma, ECOG performance status 0-1..."*).

---

## 2. Full System Architecture (base pipeline + RAG layer)

```
Next.js (Vercel, free)
   │  form: condition/symptom text, optional location, optional age
   ▼
FastAPI backend (Render, free tier) — POST /search-trials
   │
   ▼
LangGraph agent
   ├─ Node 1   extract_query        free text → structured {condition, location}      [LLM]
   ├─ Node 1.5 semantic_match  (RAG) embed query → cosine-sim vs condition corpus →
   │                                 top-3 candidate condition names                  [HF Inference API]
   ├─ Node 2   fetch_trials         ClinicalTrials.gov API v2, one call per candidate
   │                                 condition, merge + de-dup results
   ├─ Node 3   filter_rank          keep RECRUITING, sort by relevance/date/distance
   ├─ Node 4   explain_eligibility  LLM rewrites each trial's eligibilityCriteria in
   │                                 plain language — grounded-only prompt             [LLM]
   └─ Node 5   output               structured results + which matched condition each
                                     trial came from
   ▼
Next.js renders trial cards: title, phase, status, location, "why you might qualify"
summary, link to https://clinicaltrials.gov/study/{nctId}
```

**Why this order matters (panel pitch):**
- `semantic_match` is the real RAG pattern — embed, retrieve, then ground the next step on what was retrieved. It solves patients describing symptoms in their own words rather than clinical/keyword terms, which is a genuine gap in ClinicalTrials.gov's own search.
- `fetch_trials` → `filter_rank` do real filtering/ranking work, not pass-through.
- `explain_eligibility` is the actual value-add: it *rewrites*, never invents.
- Two distinct retrieval patterns in one project — retrieval via embeddings (semantic condition matching) feeding retrieval via structured API (ClinicalTrials.gov) feeding grounded generation (plain-language rewrite) — is worth calling out explicitly to the panel as more sophisticated than either pure-RAG or pure-API-orchestration alone.

---

## 3. Data & LLM Sources (all free)

| Purpose | Source | Notes |
|---|---|---|
| Trial search & full trial data | ClinicalTrials.gov API v2 | Free, no key. `eligibilityModule` field has raw criteria text. |
| Semantic condition matching | Curated static corpus (~150–300 conditions) + HF Inference API (`sentence-transformers/all-MiniLM-L6-v2`) | Embeddings precomputed **offline**, corpus JSON committed to repo — no model/heavy RAM on the live backend. |
| Geocoding (stretch only) | Nominatim (OpenStreetMap) | Free, no key, rate-limited — fine for a demo. |
| LLM — query parsing + eligibility rewriting | Groq API | Free tier, `llama-3.1-8b-instant` for speed. |

**Corpus honesty note for the panel:** it's a curated demo corpus, not exhaustive or clinically validated — good enough to show the pattern working. MedlinePlus Health Topics API is the natural production upgrade (more authoritative, but a 4th external API — treat as stretch, not Day-1 plan).

---

## 4. ClinicalTrials.gov API v2 Reference

**Base endpoint:** `https://clinicaltrials.gov/api/v2/studies` — no key, free, JSON or CSV.

```bash
curl "https://clinicaltrials.gov/api/v2/studies?query.cond=lung+cancer&filter.overallStatus=RECRUITING&pageSize=10&format=json"
```

| Param | Purpose |
|---|---|
| `query.cond` | condition/disease search (e.g. `type 2 diabetes`) |
| `query.locn` | location search |
| `filter.overallStatus` | e.g. `RECRUITING`, `NOT_YET_RECRUITING` |
| `pageSize` | max results per page (10–20 for a demo) |
| `pageToken` | pagination cursor |
| `format` | `json` (default) or `csv` |

**Response shape (what you parse):**
```json
{
  "studies": [
    {
      "protocolSection": {
        "identificationModule": { "nctId": "NCT05123456", "briefTitle": "..." },
        "statusModule": {
          "overallStatus": "RECRUITING",
          "startDateStruct": {"date": "2024-01-15"},
          "completionDateStruct": {"date": "2026-06-30"}
        },
        "eligibilityModule": {
          "eligibilityCriteria": "Inclusion Criteria:\n- ...\nExclusion Criteria:\n- ...",
          "healthyVolunteers": false, "sex": "ALL",
          "minimumAge": "18 Years", "maximumAge": "75 Years"
        },
        "contactsLocationsModule": { "locations": [{"city": "...", "state": "...", "country": "..."}] },
        "designModule": { "phases": ["PHASE2"] }
      },
      "hasResults": false
    }
  ],
  "totalCount": 1234,
  "pageToken": "next_page_token_here"
}
```
`eligibilityModule.eligibilityCriteria` is the single most important field — the free-text Inclusion/Exclusion block the `explain_eligibility` node rewrites, per trial.

---

## 5. Repo Structure (unified)

```
trialmatch/
├── backend/
│   ├── main.py                    # FastAPI app, /search-trials endpoint
│   ├── graph.py                   # LangGraph graph definition
│   ├── nodes/
│   │   ├── extract_query.py       # free-text → structured query
│   │   ├── semantic_match.py      # RAG node — condition corpus retrieval
│   │   ├── fetch_trials.py        # calls ClinicalTrials.gov, one call per candidate
│   │   ├── filter_rank.py         # RECRUITING filter + sort
│   │   └── explain_eligibility.py # LLM rewrites eligibilityCriteria per trial
│   ├── schemas.py                 # Pydantic / TypedDict state models
│   ├── condition_corpus.json      # committed — built offline, loaded at startup
│   ├── requirements.txt
│   └── .env                       # GROQ_API_KEY, HF_TOKEN
├── scripts/
│   └── build_corpus.py            # run ONCE locally, not on Render
└── frontend/
    ├── app/
    │   ├── page.tsx                # search form
    │   ├── results/page.tsx        # results dashboard (or client state, no route needed)
    │   └── layout.tsx
    ├── components/
    │   ├── SearchForm.tsx
    │   ├── TrialCard.tsx           # title, phase, status, location, summary, NCT link
    │   └── LoadingState.tsx        # handles Render cold-start delay
    ├── lib/api.ts                  # fetch wrapper to backend
    └── .env.local                  # NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

---

## 6. LangGraph State & Wiring

```python
# schemas.py
from typing import TypedDict, List, Optional

class TrialMatchState(TypedDict):
    raw_query: str
    condition: Optional[str]
    location: Optional[str]
    matched_conditions: List[str]     # NEW — top-3 from semantic_match
    raw_trials: List[dict]
    ranked_trials: List[dict]
    final_results: List[dict]
```

```python
# graph.py
from langgraph.graph import StateGraph, END

graph = StateGraph(TrialMatchState)
graph.add_node("extract_query", extract_query_node)
graph.add_node("semantic_match", semantic_match_node)     # NEW
graph.add_node("fetch_trials", fetch_trials_node)
graph.add_node("filter_rank", filter_rank_node)
graph.add_node("explain_eligibility", explain_eligibility_node)

graph.set_entry_point("extract_query")
graph.add_edge("extract_query", "semantic_match")          # updated
graph.add_edge("semantic_match", "fetch_trials")            # updated
graph.add_edge("fetch_trials", "filter_rank")
graph.add_edge("filter_rank", "explain_eligibility")
graph.add_edge("explain_eligibility", END)

app_graph = graph.compile()
```

---

## 7. Node-by-Node Detail

**7.1 `extract_query`** — parses free text into `{condition, location}` via LLM.

**7.2 `semantic_match` (RAG node)** — embeds the query, cosine-sims against the precomputed corpus, returns top-3 candidate condition names.
```python
import numpy as np

def semantic_match_node(state):
    corpus_data = load_condition_corpus()          # loaded once at app startup
    corpus_embeddings = np.array(corpus_data["embeddings"])
    query_embedding = embed_text(state["raw_query"])  # single HF API call

    similarities = corpus_embeddings @ query_embedding / (
        np.linalg.norm(corpus_embeddings, axis=1) * np.linalg.norm(query_embedding)
    )
    top_k_idx = np.argsort(similarities)[-3:][::-1]
    matched_conditions = [corpus_data["corpus"][i]["condition"] for i in top_k_idx]
    return {**state, "matched_conditions": matched_conditions}
```

**7.3 `fetch_trials`** — queries ClinicalTrials.gov for **each** candidate condition, merges + de-dups.

**7.4 `filter_rank`** — keeps `RECRUITING`, sorts by relevance/date (+ distance if location given).

**7.5 `explain_eligibility`** — the hallucination-risk answer for the panel. Grounding prompt:
> "Rewrite the following eligibility criteria in plain language for a patient. Do not add any criteria not present in the text. Do not guess at medical terms you're unsure of — flag them instead."

**7.6 `output`** — final structured list, tagging which matched condition each trial came from.

---

## 8. Corpus Build (offline, once, before deployment)

**Source:** curated static list, ~150–300 common conditions, each `{condition, symptoms}` (an LLM can help draft it fast; spot-check a sample for accuracy).

```python
# scripts/build_corpus.py — run locally, output committed to repo
import json, requests

corpus = json.load(open("conditions_raw.json"))
embeddings = []
for entry in corpus:
    text = f"{entry['condition']}: {entry['symptoms']}"
    resp = requests.post(
        "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2",
        headers={"Authorization": f"Bearer {HF_TOKEN}"},
        json={"inputs": text}
    )
    embeddings.append(resp.json())

with open("condition_corpus.json", "w") as f:
    json.dump({"corpus": corpus, "embeddings": embeddings}, f)
```
Commit `condition_corpus.json`. The live backend just loads this file at startup — no model, no heavy RAM, no runtime cost.

---

## 9. FastAPI Backend

```python
# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from graph import app_graph

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.post("/search-trials")
async def search_trials(payload: dict):
    result = await app_graph.ainvoke({"raw_query": payload["query"]})
    return result["final_results"]
```

---

## 10. Frontend Detail

- `SearchForm.tsx` — condition/symptom text, optional location, optional age.
- `TrialCard.tsx` — title, phase, status, location, plain-language "why you might qualify" summary, and a link to `https://clinicaltrials.gov/study/{nctId}` (lets users verify against source — matters for credibility).
- `LoadingState.tsx` — must cover both Render cold-start (30–50s) **and** LLM latency. Staged messages work well and double as the streaming stretch goal if time allows: *"Parsing your condition... Found N trials... Ranking by relevance... Explaining eligibility..."*
- Empty/no-results state — some condition+location combos will genuinely have few trials; handle gracefully.

---

## 11. Deployment Steps

**Backend → Render (free tier)**
1. Push `backend/` to a GitHub repo.
2. Render dashboard → New → Web Service → connect repo.
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Env vars: `GROQ_API_KEY`, `HF_TOKEN`
6. **Note:** free tier sleeps after ~15 min idle; first request after sleep takes 30–50s. Build this into the frontend loading state, and ping the backend a minute before presenting.

**Frontend → Vercel (free tier)**
1. Push `frontend/` to GitHub (same repo/subfolder or separate repo).
2. Vercel dashboard → New Project → import repo → root directory `frontend/` if monorepo.
3. Env var: `NEXT_PUBLIC_API_URL` = Render backend URL.
4. Deploy — Vercel auto-detects Next.js.

**Groq**
1. Sign up at console.groq.com (free), generate API key.
2. `llama-3.1-8b-instant` via Groq SDK or OpenAI-compatible endpoint.

**HF Inference API**
1. Generate a free HF token for the embedding calls in `build_corpus.py` and `semantic_match.py`.

---

## 12. Unified Build Order (2 days)

**Day 1 — Backend + RAG (build the corpus first — everything else depends on it)**
- [ ] Curate condition corpus (~150–300 entries, name + 1–2 sentence symptoms)
- [ ] Run `build_corpus.py` offline, commit `condition_corpus.json`
- [ ] Get raw ClinicalTrials.gov calls working in a plain script — confirm response shape before touching LangGraph
- [ ] Get Groq calls working standalone — confirm plain-language rewrite quality on 2–3 real eligibility blocks
- [ ] Wire the LangGraph graph (linear, no branching) including `semantic_match`; run end-to-end via a script first — no FastAPI yet
- [ ] Test with real queries: an explicit condition ("type 2 diabetes near Chicago") **and** a vague symptom description, to confirm both paths work
- [ ] Wrap in FastAPI, test with curl/Postman
- [ ] Deploy backend to Render

**Day 2 — Frontend + polish (this is now tighter since RAG ate ~half a day)**
- [ ] Build Next.js against the working backend: search form, results cards, loading state, empty state
- [ ] Deploy to Vercel, connect to Render backend
- [ ] End-to-end test of the *deployed* version, cold start included
- [ ] Write README + demo script
- [ ] Stretch goals only if time remains (see §13)

**Pre-demo checklist (do ~1 hour before presenting)**
- [ ] Ping the Render backend to wake it up
- [ ] Run one full live query end-to-end and confirm it returns real, sensible trials
- [ ] Have the "how do you validate matches / prevent hallucination" answers ready (§13)

---

## 13. Panel Q&A Prep

- **"How do you make sure the plain-language rewrite doesn't misrepresent the criteria?"** — Every card links back to the original ClinicalTrials.gov listing, and the rewrite prompt is constrained to only restate what's in the fetched criteria, never infer beyond it.
- **"How good is your condition corpus / how do you validate matches?"** — It's a curated demo corpus (~150–300 conditions), good enough to show the pattern working, not exhaustive or clinically validated. MedlinePlus is the natural production upgrade path.
- **"Why not just rely on ClinicalTrials.gov's own search?"** — Patients describe symptoms in their own words, not clinical/keyword terms; the semantic layer bridges that gap before the structured API call.
- **"Is anything hallucinated?"** — No trial data is invented (live API); the LLM only translates fetched text and is instructed to flag uncertain terms rather than guess.

---

## 14. Stretch Goals (only if Day 2 finishes early)

- Distance-based sorting using geocoded location (Nominatim)
- "Explain why I might NOT qualify" toggle — plain-language exclusion criteria
- Save/bookmark trials in-session (no auth — local state only)
- Streaming the agent's steps to the UI (LangGraph supports it — strong visual for a live demo)