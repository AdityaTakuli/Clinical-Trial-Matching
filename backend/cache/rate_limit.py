import logging
import time

from cache.redis_client import get_redis


logger = logging.getLogger(__name__)

RATE_LIMIT = 30
WINDOW_SECONDS = 60


def check_rate_limit(user_id: int) -> bool:
    client = get_redis()
    if client is None:
        return True

    current_window = int(time.time() // WINDOW_SECONDS)
    key = f"trialmatch:rate:{user_id}:{current_window}"

    try:
        count = client.incr(key)
        if count == 1:
            client.expire(key, WINDOW_SECONDS)
    except Exception as exc:
        logger.warning("Rate limit check failed: %s", exc)
        return True

    return count <= RATE_LIMIT
