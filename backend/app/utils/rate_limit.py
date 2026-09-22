"""Login rate limiting.

Uses Redis when available and falls back to an in-process counter so a Redis
outage never takes authentication down with it.
"""
import time
from typing import Dict, Tuple

from ..config import settings

_memory_store: Dict[str, Tuple[int, float]] = {}

_redis_client = None
_redis_checked = False


def _get_redis():
    global _redis_client, _redis_checked
    if _redis_checked:
        return _redis_client
    _redis_checked = True
    try:
        import redis

        client = redis.Redis.from_url(
            settings.REDIS_URL,
            socket_connect_timeout=1,
            socket_timeout=1,
            decode_responses=True,
        )
        client.ping()
        _redis_client = client
    except Exception:
        _redis_client = None
    return _redis_client


def reset_rate_limit(key: str) -> None:
    client = _get_redis()
    if client is not None:
        try:
            client.delete(key)
            return
        except Exception:
            pass
    _memory_store.pop(key, None)


def is_rate_limited(key: str) -> bool:
    """Return True when `key` exceeded the configured attempts inside the window."""
    limit = settings.LOGIN_RATE_LIMIT_MAX
    window = settings.LOGIN_RATE_LIMIT_WINDOW

    client = _get_redis()
    if client is not None:
        try:
            count = int(client.get(key) or 0)
            return count >= limit
        except Exception:
            pass

    count, reset_at = _memory_store.get(key, (0, 0.0))
    if time.time() > reset_at:
        return False
    return count >= limit


def record_failure(key: str) -> None:
    window = settings.LOGIN_RATE_LIMIT_WINDOW
    client = _get_redis()
    if client is not None:
        try:
            pipe = client.pipeline()
            pipe.incr(key)
            pipe.expire(key, window)
            pipe.execute()
            return
        except Exception:
            pass

    now = time.time()
    count, reset_at = _memory_store.get(key, (0, 0.0))
    if now > reset_at:
        count, reset_at = 0, now + window
    _memory_store[key] = (count + 1, reset_at)
