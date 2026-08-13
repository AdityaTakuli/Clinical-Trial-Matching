import logging
import os
from urllib.parse import urlparse

from dotenv import load_dotenv
import redis


load_dotenv()

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

_client: redis.Redis | None = None


def get_redis() -> redis.Redis | None:
    """Return a shared Redis client, or None if Redis is unavailable.

    Works with local Redis (`redis://`) and Upstash (`rediss://`).
    Fails open: returns None so cache/rate-limit degrade gracefully.
    """
    global _client

    if _client is not None:
        return _client

    try:
        # Remote Upstash needs a bit more than local Redis
        timeout = 5 if REDIS_URL.startswith("rediss://") else 1
        client = redis.Redis.from_url(
            REDIS_URL,
            socket_connect_timeout=timeout,
            socket_timeout=timeout,
            decode_responses=True,
        )
        client.ping()
        _client = client
        host = urlparse(REDIS_URL).hostname or "redis"
        logger.info("Connected to Redis at %s", host)
        return _client
    except Exception as exc:
        logger.warning("Redis unavailable (%s): caching disabled", exc)
        return None
