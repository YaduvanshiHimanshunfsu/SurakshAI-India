from __future__ import annotations

import asyncio
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status


class InMemoryRateLimiter:
    """Small per-process rate limiter suited to a local/demo deployment.

    A production multi-instance deployment should replace this with a shared store
    such as Redis plus an edge/WAF rate limit.
    """

    def __init__(self, limit: int, window_seconds: int) -> None:
        self._limit = limit
        self._window_seconds = window_seconds
        self._buckets: dict[str, deque[float]] = defaultdict(deque)
        self._lock = asyncio.Lock()

    async def check(self, request: Request) -> None:
        client_id = request.client.host if request.client else "unknown"
        now = time.monotonic()
        cutoff = now - self._window_seconds
        async with self._lock:
            bucket = self._buckets[client_id]
            while bucket and bucket[0] <= cutoff:
                bucket.popleft()
            if len(bucket) >= self._limit:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many analysis requests. Please try again shortly.",
                    headers={"Retry-After": str(self._window_seconds)},
                )
            bucket.append(now)
