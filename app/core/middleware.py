from __future__ import annotations

import secrets
import logging

from fastapi import Request
from fastapi.responses import JSONResponse, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = secrets.token_urlsafe(12)
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
