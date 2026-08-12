import hashlib
import json
import time
from typing import Any


class TTLCache:

    def __init__(self, ttl_seconds: int = 3600):

        self.ttl_seconds = ttl_seconds
        self._store: dict[str, tuple[float, Any]] = {}

    def _make_key(self, *parts) -> str:

        payload = json.dumps(parts, sort_keys=True, default=str)
        return hashlib.sha256(payload.encode()).hexdigest()

    def get(self, *parts):

        key = self._make_key(*parts)
        entry = self._store.get(key)

        if not entry:
            return None

        expires_at, value = entry

        if time.time() > expires_at:
            del self._store[key]
            return None

        return value

    def set(self, value, *parts):

        key = self._make_key(*parts)
        self._store[key] = (
            time.time() + self.ttl_seconds,
            value,
        )


trial_cache = TTLCache(ttl_seconds=3600)
