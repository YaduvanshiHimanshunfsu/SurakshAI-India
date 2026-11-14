from __future__ import annotations

import secrets
import logging
import time

from fastapi import Request
from fastapi.responses import JSONResponse, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, production: bool = False) -> None:
        super().__init__(app)
        self._production = production

    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = secrets.token_urlsafe(12)
        started_at = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception as exc:
            # Do not disclose stack traces or provider details to browsers.
            # Log only the exception type: requests can contain scam evidence.
            logger.error("Unhandled request error: %s", type(exc).__name__)
            response = JSONResponse(status_code=500, content={"detail": "Internal server error"})
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Cache-Control"] = "no-store"
        response.headers["Content-Security-Policy"] = "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self';"
        response.headers["Permissions-Policy"] = "microphone=(self), camera=(), geolocation=(), payment=(), usb=()"
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        response.headers["Cross-Origin-Resource-Policy"] = "same-origin"
        if self._production:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        logger.info("request_complete method=%s path=%s status=%s duration_ms=%s", request.method, request.url.path, response.status_code, round((time.perf_counter() - started_at) * 1000, 1))
        return response


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_request_bytes: int) -> None:
        super().__init__(app)
        self._max_request_bytes = max_request_bytes

    async def dispatch(self, request: Request, call_next) -> Response:
        if request.method not in {"POST", "PUT", "PATCH"}:
            return await call_next(request)

        content_length = request.headers.get("content-length")
        if content_length:
            try:
                if int(content_length) > self._max_request_bytes:
                    return JSONResponse(status_code=413, content={"detail": "Request body is too large"})
            except ValueError:
                return JSONResponse(status_code=400, content={"detail": "Invalid Content-Length header"})

        # Content-Length is optional and cannot be trusted on its own. Cache the
        # bounded body so downstream JSON/form parsing can still consume it while
        # preventing a chunked request from bypassing the configured limit.
        try:
            body = await request.body()
        except Exception:
            return JSONResponse(status_code=400, content={"detail": "Request body could not be read"})
        if len(body) > self._max_request_bytes:
            return JSONResponse(status_code=413, content={"detail": "Request body is too large"})
        return await call_next(request)
