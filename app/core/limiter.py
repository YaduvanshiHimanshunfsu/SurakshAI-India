"""Compatibility import; use :mod:`app.core.rate_limiter` for new code."""

from app.core.rate_limiter import InMemoryRateLimiter

__all__ = ["InMemoryRateLimiter"]
