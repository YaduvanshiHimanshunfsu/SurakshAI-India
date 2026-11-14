from __future__ import annotations

import asyncio
import logging
from typing import Any

from google import genai
from google.genai import types
from pydantic import ValidationError

from app.config import Settings
from app.core.provider_guard import ProviderConcurrencyGate
from app.prompts import SYSTEM_PROMPT, build_user_message
from app.schemas import AnalysisResponse, AnalysisSource, AnalyzeRequest, RedFlag, UrlAnalysis, Verdict
from app.services.fallback_analyzer import RuleBasedFallbackAnalyzer
from app.services.url_intelligence import UrlIntelligenceService
from app.utils.json_output import ModelOutputError, parse_json_object

logger = logging.getLogger(__name__)


class ProviderUnavailableError(RuntimeError):
    """The AI provider could not return a valid answer and fallback is disabled."""


class ScamAnalyzer:
    """Coordinates provider analysis and validates every model-produced field."""

    def __init__(self, settings: Settings, provider_gate: ProviderConcurrencyGate | None = None) -> None:
        self._settings = settings
        self._fallback = RuleBasedFallbackAnalyzer()
        self._url_intelligence = UrlIntelligenceService(settings)
        self._client: Any | None = None
        self._async_client: Any | None = None
        self._model_candidates: tuple[str, ...] | None = None
        self._model_lock = asyncio.Lock()
        self._provider_gate = provider_gate

    @property
    def _gemini(self) -> Any:
        if self._client is None:
            key = self._settings.gemini_api_key
            if key is None or not key.get_secret_value():
                raise ProviderUnavailableError("AI provider is not configured")
            self._client = genai.Client(
                api_key=key.get_secret_value(),
            )
            self._async_client = self._client.aio
        return self._async_client

    async def analyze(self, request: AnalyzeRequest) -> AnalysisResponse:
        """Return live AI output or a visibly labeled, deterministic fallback."""

        try:
            url_analyses = await self._url_intelligence.analyze_message_urls(request.message)
        except Exception as exc:
            # URL enrichment must never prevent the core SMS/message analysis.
            logger.warning("URL enrichment unavailable: %s", type(exc).__name__)
            url_analyses = []

        if not self._settings.provider_is_configured:
            return self._fallback_or_raise(request.message, "AI provider is not configured", url_analyses)

        try:
            candidates = await self._resolve_model_candidates()
            last_error: Exception | None = None
            for model_name in candidates:
                try:
                    async def generate():
                        return await self._gemini.models.generate_content(
                            model=model_name,
                            contents=build_user_message(request.message, request.language),
                            config=types.GenerateContentConfig(
                                system_instruction=SYSTEM_PROMPT,
                                response_mime_type="application/json",
                                response_schema=AnalysisResponse,
                                max_output_tokens=900,
                            ),
                        )
                    if self._provider_gate is None:
                        response = await asyncio.wait_for(generate(), timeout=self._settings.gemini_timeout_seconds)
                    else:
                        async with self._provider_gate.slot():
                            response = await asyncio.wait_for(generate(), timeout=self._settings.gemini_timeout_seconds)
                    text = getattr(response, "text", None)
                    if not isinstance(text, str) or not text.strip():
                        raise ModelOutputError("Provider returned no text content")
                    result = AnalysisResponse.model_validate(parse_json_object(text))
                    return self._normalise_live_result(result, request.message, model_name, url_analyses)
                except (ModelOutputError, ValidationError) as exc:
                    # A schema violation is not shown to the user and the next
                    # compatible model may still return a valid structured answer.
                    last_error = exc
                    logger.warning("Gemini model %s returned invalid analysis: %s", model_name, type(exc).__name__)
                except Exception as exc:
                    # Do not leak submitted messages, key data, or provider errors.
                    # The next compatible model can recover from 404, 429, 5xx,
                    # capacity, or temporary network failures.
                    last_error = exc
                    logger.warning("Gemini model %s unavailable: %s", model_name, type(exc).__name__)

            if last_error:
                logger.warning("All compatible Gemini model attempts failed: %s", type(last_error).__name__)
            return self._fallback_or_raise(request.message, "Live AI analysis is temporarily unavailable", url_analyses)
        except ProviderUnavailableError:
            return self._fallback_or_raise(request.message, "AI provider is not configured", url_analyses)
        except Exception as exc:
            logger.warning("Gemini model resolution unavailable: %s", type(exc).__name__)
            return self._fallback_or_raise(request.message, "Live AI analysis is temporarily unavailable", url_analyses)

    async def analyze_url(self, url: str) -> UrlAnalysis:
        """Expose URL intelligence for a user who pastes only a link."""

        return await self._url_intelligence.analyze_url(url)

    async def _resolve_model_candidates(self) -> tuple[str, ...]:
        """Discover key-accessible text models and apply a stable preference order.

        Gemini API keys can expose a different model set based on account tier,
        region, and rollout stage. Discovery avoids a hard dependency on one
        version while the allow-list avoids accidentally choosing image, audio,
        embedding, preview, or unrelated specialised models.
        """

        if self._model_candidates is not None:
            return self._model_candidates

        async with self._model_lock:
            if self._model_candidates is not None:
                return self._model_candidates

            configured = self._settings.gemini_model_candidates
            available: set[str] = set()
            try:
                pager = await self._gemini.models.list()
                async for model in pager:
                    name = str(getattr(model, "name", "")).removeprefix("models/")
                    actions = {str(action).casefold() for action in getattr(model, "supported_actions", [])}
                    if name and "generatecontent" in actions and self._is_general_text_model(name):
                        available.add(name)
            except Exception as exc:
                # Listing models is an optimisation; configured candidates remain
                # usable when model discovery itself is unavailable.
                logger.warning("Gemini model discovery failed: %s", type(exc).__name__)

            resolved = [name for name in configured if not available or name in available]
            # Prefer explicitly configured stable models. If Google exposes a new
            # compatible Flash model, it can be used only after listed preferences.
            extras = sorted(
                (name for name in available if name not in resolved),
                key=self._model_rank,
            )
            candidates = (resolved + extras)[: max(1, self._settings.gemini_max_model_attempts)]
            self._model_candidates = tuple(candidates or configured[:1])
            return self._model_candidates

    @staticmethod
    def _is_general_text_model(model_name: str) -> bool:
        name = model_name.casefold()
        excluded = ("image", "audio", "tts", "live", "embedding", "omni", "computer")
        return name.startswith("gemini-") and not any(term in name for term in excluded) and (
            "flash" in name or "pro" in name
        )

    @staticmethod
    def _model_rank(model_name: str) -> tuple[int, str]:
        name = model_name.casefold()
        # Prefer future stable Flash releases to Pro/preview variants for this
        # low-latency classification task.
        return (0 if "flash" in name and "preview" not in name else 1, name)

    def _fallback_or_raise(
        self, message: str, reason: str, url_analyses: list[UrlAnalysis]
    ) -> AnalysisResponse:
        if self._settings.enable_offline_fallback:
            result = self._fallback.analyze(message)
            result.url_analyses = url_analyses
            return result
        raise ProviderUnavailableError(reason)

    @staticmethod
    def _normalise_live_result(
        result: AnalysisResponse,
        original_message: str,
        model_name: str,
        url_analyses: list[UrlAnalysis],
    ) -> AnalysisResponse:
        """Enforce UI-safe red flags and conservative live-result metadata."""

        unique: set[str] = set()
        verified_flags: list[RedFlag] = []
        folded = original_message.casefold()
        for flag in result.red_flags:
            phrase = flag.phrase.strip()
            key = phrase.casefold()
            # Highlights are only safe/useful when they genuinely refer to user text.
            if key and key not in unique and key in folded:
                verified_flags.append(flag)
                unique.add(key)

        result.red_flags = verified_flags[:6]
        result.analysis_source = AnalysisSource.AI
        result.model_used = model_name
        result.notice = None
        # URL telemetry is produced by deterministic, provider-backed checks—not
        # by the LLM—so it remains trustworthy even if model output drifts.
        result.url_analyses = url_analyses
        if result.verdict == Verdict.SAFE:
            result.safe_explanation = result.safe_explanation or (
                "No obvious scam indicators were found in this message. This is not a guarantee; "
                "verify sensitive requests through official channels."
            )
        return result

    async def close(self) -> None:
        if self._async_client is not None:
            await self._async_client.aclose()
            self._async_client = None
        if self._client is not None:
            self._client.close()
            self._client = None
