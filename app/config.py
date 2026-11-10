from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration loaded from environment variables only."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    environment: Literal["development", "staging", "production"] = "development"
    api_v1_prefix: str = "/api/v1"
    allowed_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    gemini_api_key: SecretStr | None = None
    # Enabled models differ by account, region, tier, and API lifecycle. This
    # ordered allow-list is resolved against models visible to the supplied key.
    gemini_model_preferences: str = (
        "gemini-3.6-flash,gemini-3.5-flash,gemini-3.5-flash-lite,"
        "gemini-2.5-flash,gemini-flash-latest"
    )
    gemini_max_model_attempts: int = 3
    gemini_timeout_seconds: float = 20.0

    # Optional URL reputation providers. A user-submitted URL is sent to a
    # provider only when its corresponding key is configured.
    web_risk_api_key: SecretStr | None = None
    virustotal_api_key: SecretStr | None = None
    url_intelligence_enabled: bool = True
    url_tls_probe_enabled: bool = True
    url_analysis_timeout_seconds: float = 5.0
    max_urls_per_message: int = 3

    enable_offline_fallback: bool = True
    rate_limit_requests: int = 20
    rate_limit_window_seconds: int = 60

    # Keep application requests comfortably below the 4.5 MB serverless payload
    # limit. This includes multipart boundaries as well as the media itself.
    max_request_bytes: int = Field(default=3_250_000, ge=1_024, le=4_000_000)
    media_upload_enabled: bool = True
    max_image_upload_bytes: int = Field(default=3_000_000, ge=1_024, le=3_500_000)
    max_audio_upload_bytes: int = Field(default=3_000_000, ge=1_024, le=3_500_000)
    max_image_pixels: int = Field(default=20_000_000, ge=1, le=25_000_000)
    allowed_image_mime_types: str = "image/jpeg,image/png,image/webp"
    allowed_audio_mime_types: str = "audio/mpeg,audio/wav,audio/webm,audio/mp4,audio/x-m4a"

    # Raw .eml uploads are accepted as text JSON. Attachments are never accepted
    # separately or opened; the larger limit only preserves header evidence.
    email_dkim_verification_enabled: bool = True
    email_dns_timeout_seconds: float = 4.0

    @field_validator("allowed_origins")
    @classmethod
    def validate_origins(cls, value: str) -> str:
        origins = [origin.strip().rstrip("/") for origin in value.split(",") if origin.strip()]
        if not origins:
            raise ValueError("ALLOWED_ORIGINS must contain at least one origin")
        if "*" in origins:
            raise ValueError("Wildcard CORS origins are not allowed")
        return ",".join(origins)

    @property
    def cors_origins(self) -> list[str]:
        return self.allowed_origins.split(",")

    @property
    def provider_is_configured(self) -> bool:
        return bool(self.gemini_api_key and self.gemini_api_key.get_secret_value())

    @property
    def gemini_model_candidates(self) -> tuple[str, ...]:
        """Return a de-duplicated, explicit list of models safe to attempt."""

        seen: set[str] = set()
        candidates: list[str] = []
        for raw_name in self.gemini_model_preferences.split(","):
            name = raw_name.strip().removeprefix("models/")
            if name and name not in seen:
                candidates.append(name)
                seen.add(name)
        return tuple(candidates)

    @staticmethod
    def _csv_values(value: str) -> tuple[str, ...]:
        return tuple(item.strip().lower() for item in value.split(",") if item.strip())

    @property
    def image_mime_types(self) -> tuple[str, ...]:
        return self._csv_values(self.allowed_image_mime_types)

    @property
    def audio_mime_types(self) -> tuple[str, ...]:
        return self._csv_values(self.allowed_audio_mime_types)


@lru_cache
def get_settings() -> Settings:
    return Settings()
