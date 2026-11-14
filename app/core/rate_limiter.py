from __future__ import annotations

import asyncio
import time
from collections import defaultdict, deque
from typing import Protocol

from fastapi import HTTPException, Request, status

from app.config import Settings
from app.core.redis_limiter import RedisRateLimiter, SharedRateLimitUnavailable


class RequestRateLimiter(Protocol):
    async def check(self, request: Request) -> None: ...


def request_identifier(request: Request, trust_proxy_headers: bool) -> str:
    """Use one anonymous client address; do not log or persist it outside rate limiting."""

    if trust_proxy_headers:
        forwarded = request.headers.get("x-forwarded-for", "").split(",", 1)[0].strip()
        if forwarded:
            return forwarded[:128]
    return (request.client.host if request.client else "unknown")[:128]


class InMemoryRateLimiter:
    """Local-development fallback only; it is intentionally process-scoped."""

    def __init__(self, limit: int, window_seconds: int, daily_limit: int, trust_proxy_headers: bool) -> None:
        self._limit = limit
        self._window_seconds = window_seconds
        self._daily_limit = daily_limit
        self._trust_proxy_headers = trust_proxy_headers
        self._buckets: dict[str, deque[float]] = defaultdict(deque)
        self._lock = asyncio.Lock()

    async def check(self, request: Request) -> None:
        client_id = request_identifier(request, self._trust_proxy_headers)
        now = time.monotonic()
        checks = (("minute", self._limit, self._window_seconds), ("day", self._daily_limit, 86_400))
        async with self._lock:
            for scope, limit, window in checks:
                key = f"{scope}:{client_id}"
                bucket = self._buckets[key]
                cutoff = now - window
                while bucket and bucket[0] <= cutoff:
                    bucket.popleft()
                if len(bucket) >= limit:
                    retry_after = max(1, int(window - (now - bucket[0])))
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Too many safety checks. Please try again later.",
                        headers={"Retry-After": str(retry_after)},
                    )
                bucket.append(now)


class HybridRateLimiter:
    """Uses Upstash Redis when configured, otherwise a deliberately local limiter."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._local = InMemoryRateLimiter(settings.rate_limit_requests, settings.rate_limit_window_seconds, settings.daily_anonymous_limit, settings.trust_proxy_headers)
        self._shared = RedisRateLimiter(settings) if settings.upstash_redis_rest_url and settings.upstash_redis_rest_token else None

    async def check(self, request: Request) -> None:
        if self._shared is None:
            await self._local.check(request)
            return
        try:
            await self._shared.check(request_identifier(request, self._settings.trust_proxy_headers))
        except SharedRateLimitUnavailable:
            # A production deployment fails closed to protect the AI budget. Local
            # development can continue with the process-local safety limiter.
            if self._settings.environment == "production" and not self._settings.rate_limit_fail_open:
                raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Safety service is busy. Please try again shortly.")
            await self._local.check(request)

    async def close(self) -> None:
        if self._shared is not None:
            await self._shared.close()


def build_rate_limiter(settings: Settings) -> HybridRateLimiter:
    return HybridRateLimiter(settings)
