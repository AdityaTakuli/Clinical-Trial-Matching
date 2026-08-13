import logging
import os

from dotenv import load_dotenv
import redis


load_dotenv()

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

_client: redis.Redis | None = None


def get_redis() -> redis.Redis | None:
    """Return a shared Redis client, or None if Redis is unavailable.

    The client is created lazily and cached. If the connection cannot be
    established the function returns None so callers can degrade gracefully
    instead of failing the request.
    """
    global _client

    if _client is not None:
        return _client

    try:
        client = redis.Redis.from_url(
            REDIS_URL,
            socket_connect_timeout=1,
            socket_timeout=1,
            decode_responses=True,
        )
        client.ping()
        _client = client
        logger.info("Connected to Redis at %s", REDIS_URL)
        return _client
    except Exception as exc:
        logger.warning("Redis unavailable (%s): caching disabled", exc)
        return None
