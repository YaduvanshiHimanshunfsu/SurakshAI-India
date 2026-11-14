from __future__ import annotations

"""Privacy-safe operational telemetry. Evidence text is never an event field."""

import json
import logging
from typing import Any

from app.config import Settings

logger = logging.getLogger("surakshai.monitoring")

_SENSITIVE_KEYS = {"message", "text", "body", "raw_eml", "media", "content", "authorization", "cookie", "otp", "password", "pin", "cvv"}


def _scrub(value: Any) -> Any:
    if isinstance(value, dict):
        return {key: "[Filtered]" if key.casefold() in _SENSITIVE_KEYS else _scrub(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_scrub(item) for item in value]
    return value


def initialise_monitoring(settings: Settings) -> None:
    """Initialise Sentry only when explicitly configured; importing remains optional."""

    if not settings.sentry_dsn or not settings.sentry_dsn.get_secret_value():
        return
    try:
        import sentry_sdk

        sentry_sdk.init(
            dsn=settings.sentry_dsn.get_secret_value(),
            environment=settings.environment,
            traces_sample_rate=settings.sentry_traces_sample_rate,
            send_default_pii=False,
            before_send=lambda event, _hint: _scrub(event),
            before_send_transaction=lambda event, _hint: _scrub(event),
        )
    except Exception as exc:  # Monitoring must never stop scam-safety guidance.
        logger.warning("Monitoring initialisation unavailable: %s", type(exc).__name__)


def record_event(name: str, **fields: str | int | float | bool | None) -> None:
    """Emit only a fixed allow-list of opaque operational fields."""

    safe = {"event": name, **{key: value for key, value in fields.items() if value is not None}}
    logger.info("telemetry=%s", json.dumps(safe, separators=(",", ":"), sort_keys=True))
