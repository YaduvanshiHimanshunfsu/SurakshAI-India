from __future__ import annotations

import logging
import pathlib
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes import router
from app.config import get_settings
from app.core.monitoring import initialise_monitoring
from app.core.provider_guard import ProviderConcurrencyGate
from app.core.rate_limiter import build_rate_limiter
from app.core.middleware import RequestSizeLimitMiddleware, SecurityHeadersMiddleware
from app.services.scam_analyzer import ScamAnalyzer
from app.services.email_analyzer import EmailAnalyzer
from app.services.rescue_planner import RescuePlanner
from app.services.media_analyzer import MediaAnalyzer
from app.services.decision_checker import DecisionChecker
from app.services.organisation_verifier import OrganisationVerifier
from app.services.qr_analyzer import QrAnalyzer
from app.services.simple_explainer import SimpleExplainer
from app.services.trusted_channel_service import TrustedChannelService

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")

# Resolve the frontend directory relative to this file's location.
# In production (Vercel) the frontend is pre-built into frontend/dist/.
# In local development the raw frontend/ source is served by Vite's dev server.
_PROJECT_ROOT = pathlib.Path(__file__).parent.parent
_FRONTEND_DIST = _PROJECT_ROOT / "frontend" / "dist"
_FRONTEND_DEV  = _PROJECT_ROOT / "frontend"
# Prefer the production build; fall back to the raw source tree for local dev.
_FRONTEND_DIR = _FRONTEND_DIST if _FRONTEND_DIST.exists() else _FRONTEND_DEV
_INDEX_HTML = _FRONTEND_DIR / "index.html"


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    initialise_monitoring(settings)
    provider_gate = ProviderConcurrencyGate(settings.provider_max_concurrent_requests, settings.provider_queue_wait_seconds)
    app.state.analyzer = ScamAnalyzer(settings, provider_gate=provider_gate)
    app.state.email_analyzer = EmailAnalyzer(settings, app.state.analyzer)
    app.state.rescue_planner = RescuePlanner()
    app.state.media_analyzer = MediaAnalyzer(settings, provider_gate=provider_gate)
    app.state.rate_limiter = build_rate_limiter(settings)
    app.state.decision_checker = DecisionChecker()
    app.state.qr_analyzer = QrAnalyzer(app.state.analyzer)
    app.state.organisation_verifier = OrganisationVerifier()
    app.state.trusted_channel_service = TrustedChannelService()
    app.state.simple_explainer = SimpleExplainer()
    yield
    await app.state.media_analyzer.close()
    await app.state.analyzer.close()
    await app.state.rate_limiter.close()


def create_app() -> FastAPI:
    settings = get_settings()
    # Add localhost:8000 to CORS origins if not present
    cors_origins = list(settings.cors_origins)
    if "http://localhost:8000" not in cors_origins:
        cors_origins.append("http://localhost:8000")

    app = FastAPI(
        title="SurakshAI-India API",
        version="0.1.0",
        description="A cautious Indian scam-message analysis API.",
        docs_url="/docs" if settings.environment == "development" else None,
        redoc_url=None,
        lifespan=lifespan,
    )
    app.add_middleware(SecurityHeadersMiddleware, production=settings.environment == "production")
    app.add_middleware(RequestSizeLimitMiddleware, max_request_bytes=settings.max_request_bytes)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
        max_age=600,
    )
    
    # ── API routes (prefix: /api/v1) ──────────────────────────────────────────
    app.include_router(router, prefix=settings.api_v1_prefix)

    # ── Frontend SPA ─────────────────────────────────────────────────────────
    # Serve index.html at the root; all other unknown paths also fall back to it
    # so the client-side router can handle them.
    if _INDEX_HTML.exists():
        # Serve compiled JS/CSS assets from /assets/* (Vite output directory).
        # This mount is registered first so Starlette resolves asset paths before
        # the SPA catch-all route below.
        _assets_dir = _FRONTEND_DIR / "assets"
        if _assets_dir.exists():
            app.mount("/assets", StaticFiles(directory=str(_assets_dir)), name="frontend-assets")

        # SPA fallback: return any real file that exists, otherwise return index.html
        # so client-side routing works for deep links (e.g. /learn, /result).
        @app.get("/{rest_of_path:path}", include_in_schema=False)
        async def serve_spa(rest_of_path: str = "") -> FileResponse:
            candidate = _FRONTEND_DIR / rest_of_path
            if rest_of_path and candidate.is_file():
                return FileResponse(candidate)
            return FileResponse(_INDEX_HTML)

    return app


app = create_app()
