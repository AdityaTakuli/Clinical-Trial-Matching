import hashlib
import json
import logging
import os

from cache.redis_client import get_redis


logger = logging.getLogger(__name__)

SEARCH_CACHE_PREFIX = "search"

try:
    SEARCH_CACHE_TTL = int(os.getenv("SEARCH_CACHE_TTL", "3600"))
except ValueError:
    SEARCH_CACHE_TTL = 3600


def normalize_query(query: str) -> str:
    """Normalize a query so equivalent searches share a cache key."""
    return " ".join(query.lower().split())


def make_search_key(query: str) -> str:
    normalized = normalize_query(query)
    digest = hashlib.sha256(normalized.encode("utf-8")).hexdigest()
    return f"{SEARCH_CACHE_PREFIX}:{digest}"


def get_cached_search(query: str) -> dict | None:
    """Return a cached search payload for the query, or None on miss/error."""
    client = get_redis()
    if client is None:
        return None

    try:
        raw = client.get(make_search_key(query))
    except Exception as exc:
        logger.warning("Redis GET failed: %s", exc)
        return None

    if not raw:
        return None

    try:
        return json.loads(raw)
    except (TypeError, ValueError):
        return None


def set_cached_search(
    query: str,
    payload: dict,
    ttl: int = SEARCH_CACHE_TTL,
) -> None:
    """Store a search payload under the normalized-query key. Never raises."""
    client = get_redis()
    if client is None:
        return

    try:
        client.set(
            make_search_key(query),
            json.dumps(payload, default=str),
            ex=ttl,
        )
    except Exception as exc:
        logger.warning("Redis SET failed: %s", exc)
