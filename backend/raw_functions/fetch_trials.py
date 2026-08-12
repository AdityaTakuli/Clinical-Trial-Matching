import logging

import requests

from raw_functions.cache import trial_cache


logger = logging.getLogger(__name__)

BASE_URL = "https://clinicaltrials.gov/api/v2/studies"


def _extract_locations(protocol: dict) -> list[dict]:

    contacts_locations = protocol.get(
        "contactsLocationsModule", {}
    )

    locations = []

    for location in contacts_locations.get("locations", []):

        locations.append(
            {
                "facility": location.get("facility"),
                "city": location.get("city"),
                "state": location.get("state"),
                "country": location.get("country"),
            }
        )

    return locations


def fetch_trials(
    condition: str,
    location: str | None = None,
    page_size: int = 10,
):

    params = {
        "query.cond": condition,
        "filter.overallStatus": "RECRUITING",
        "pageSize": page_size,
    }

    if location:
        params["query.locn"] = location

    cached = trial_cache.get("fetch_trials", params)

    if cached is not None:
        logger.info("ClinicalTrials.gov cache hit for %s", condition)
        return cached

    response = requests.get(BASE_URL, params=params, timeout=30)
    response.raise_for_status()

    data = response.json()
    trials = []

    for study in data.get("studies", []):

        protocol = study.get("protocolSection", {})
        identification = protocol.get("identificationModule", {})
        status = protocol.get("statusModule", {})
        eligibility = protocol.get("eligibilityModule", {})
        conditions_module = protocol.get("conditionsModule", {})
        start_date = status.get("startDateStruct", {}).get("date")

        trial = {
            "nct_id": identification.get("nctId"),
            "title": identification.get("briefTitle"),
            "status": status.get("overallStatus"),
            "start_date": start_date,
            "minimum_age": eligibility.get("minimumAge"),
            "maximum_age": eligibility.get("maximumAge"),
            "sex": eligibility.get("sex"),
            "eligibility": eligibility.get("eligibilityCriteria"),
            "conditions": conditions_module.get("conditions", []),
            "locations": _extract_locations(protocol),
            "matched_condition": condition,
        }

        trials.append(trial)

    trial_cache.set(trials, "fetch_trials", params)
    logger.info("Cached %s trials for %s", len(trials), condition)

    return trials


def fetch_trials_for_conditions(
    conditions: list[str],
    location: str | None = None,
    page_size: int = 10,
):
    all_trials = []

    for condition in conditions:
        trials = fetch_trials(
            condition=condition,
            location=location,
            page_size=page_size,
        )
        all_trials.extend(trials)

    return all_trials
