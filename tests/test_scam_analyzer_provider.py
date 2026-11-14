import asyncio
import json
import sys
from types import SimpleNamespace

import pytest

from app.config import Settings
from app.schemas import AnalyzeRequest
from app.services.scam_analyzer import ScamAnalyzer

pytestmark = pytest.mark.skipif(sys.platform == 'win32', reason='Local Windows asyncio runtime cannot create its self-pipe; run this async provider test on Linux CI/Vercel.')


class FakeModels:
    def __init__(self, response=None, error=None): self.response, self.error = response, error
    async def generate_content(self, **_kwargs):
        if self.error: raise self.error
        return SimpleNamespace(text=self.response)


def configured_analyzer(response=None, error=None) -> ScamAnalyzer:
    analyzer = ScamAnalyzer(Settings(gemini_api_key='test-key', gemini_model_preferences='gemini-2.5-flash', gemini_max_model_attempts=1))
    analyzer._client = object()
    analyzer._async_client = SimpleNamespace(models=FakeModels(response, error))
    analyzer._model_candidates = ('gemini-2.5-flash',)
    async def no_url_enrichment(_message): return []
    analyzer._url_intelligence.analyze_message_urls = no_url_enrichment
    return analyzer


def test_valid_gemini_response_is_schema_validated() -> None:
    payload = json.dumps({'verdict': 'SCAM', 'confidence': 90, 'scam_category': 'OTP_THEFT', 'severity': 'HIGH', 'psychological_tactics': [], 'red_flags': [{'phrase': 'share OTP', 'explanation': 'A secret code is requested.'}], 'action_steps': ['Do not share an OTP.'], 'hindi_summary': 'OTP साझा न करें।'})
    result = asyncio.run(configured_analyzer(response=payload).analyze(AnalyzeRequest(message='share OTP now')))
    assert result.analysis_source == 'AI'
    assert result.model_used == 'gemini-2.5-flash'


def test_invalid_provider_json_activates_rule_fallback() -> None:
    result = asyncio.run(configured_analyzer(response='not json').analyze(AnalyzeRequest(message='share OTP now')))
    assert result.analysis_source == 'RULE_FALLBACK'


def test_provider_error_activates_rule_fallback() -> None:
    result = asyncio.run(configured_analyzer(error=TimeoutError()).analyze(AnalyzeRequest(message='share OTP now')))
    assert result.analysis_source == 'RULE_FALLBACK'
