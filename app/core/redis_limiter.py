from __future__ import annotations

import hashlib
from typing import Any

import httpx
from fastapi import HTTPException, status

from app.config import Settings


class SharedRateLimitUnavailable(RuntimeError):
    pass


class RedisRateLimiter:
    """Upstash REST fixed-window limiter with opaque, hashed client keys."""

    def __init__(self, settings: Settings) -> None:
        self._url = settings.upstash_redis_rest_url.get_secret_value().rstrip("/")  # type: ignore[union-attr]
        self._token = settings.upstash_redis_rest_token.get_secret_value()  # type: ignore[union-attr]
        self._minute_limit = settings.rate_limit_requests
        self._daily_limit = settings.daily_anonymous_limit
        self._client = httpx.AsyncClient(timeout=settings.rate_limit_backend_timeout_seconds)

    @staticmethod
    def _key(identifier: str, scope: str) -> str:
        digest = hashlib.sha256(identifier.encode("utf-8")).hexdigest()
        return f"surakshai:rate:{scope}:{digest}"

    async def _increment(self, identifier: str, scope: str, limit: int, seconds: int) -> None:
        try:
            response = await self._client.post(
                f"{self._url}/pipeline",
                headers={"Authorization": f"Bearer {self._token}"},
                json=[["INCR", self._key(identifier, scope)], ["EXPIRE", self._key(identifier, scope), seconds, "NX"], ["TTL", self._key(identifier, scope)]],
            )
            response.raise_for_status()
            payload: list[dict[str, Any]] = response.json()
            count = int(payload[0].get("result", 0))
            ttl = max(1, int(payload[2].get("result", seconds)))
        except (httpx.HTTPError, ValueError, TypeError, IndexError, KeyError) as exc:
            raise SharedRateLimitUnavailable from exc
        if count > limit:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many safety checks. Please try again later.", headers={"Retry-After": str(ttl)})

    async def check(self, identifier: str) -> None:
        await self._increment(identifier, "minute", self._minute_limit, 60)
        await self._increment(identifier, "day", self._daily_limit, 86_400)

    async def close(self) -> None:
        await self._client.aclose()
