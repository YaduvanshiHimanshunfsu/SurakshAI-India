from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator


class ProviderBusyError(RuntimeError):
    """Raised when the configured provider-concurrency budget is exhausted."""


class ProviderConcurrencyGate:
    """Bounds concurrent paid AI operations within one function instance."""

    def __init__(self, maximum: int, wait_seconds: float) -> None:
        self._semaphore = asyncio.Semaphore(maximum)
        self._wait_seconds = wait_seconds

    @asynccontextmanager
    async def slot(self) -> AsyncIterator[None]:
        try:
            await asyncio.wait_for(self._semaphore.acquire(), timeout=self._wait_seconds)
        except asyncio.TimeoutError as exc:
            raise ProviderBusyError("AI capacity is temporarily busy") from exc
        try:
            yield
        finally:
            self._semaphore.release()
