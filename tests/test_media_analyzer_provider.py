import asyncio
import json
import sys
from types import SimpleNamespace

import pytest

from app.config import Settings
from app.schemas import MediaKind
from app.services.media_analyzer import MediaAnalyzer, MediaExtractionUnavailableError
from app.services.media_validation import ValidatedMedia

pytestmark = pytest.mark.skipif(sys.platform == 'win32', reason='Local Windows asyncio runtime cannot create its self-pipe; run this async provider test on Linux CI/Vercel.')


class FakeModels:
    def __init__(self, text=None, error=None): self.text, self.error = text, error
    async def generate_content(self, **_kwargs):
        if self.error: raise self.error
        return SimpleNamespace(text=self.text)


def analyzer(text=None, error=None) -> MediaAnalyzer:
    service = MediaAnalyzer(Settings(gemini_api_key='test-key', gemini_model_preferences='gemini-2.5-flash', gemini_max_model_attempts=1))
    service._client = object(); service._async_client = SimpleNamespace(models=FakeModels(text, error))
    return service


def test_voice_provider_returns_real_reviewable_transcript() -> None:
    media = ValidatedMedia(media_kind=MediaKind.VOICE_NOTE, mime_type='audio/webm', size_bytes=8, data=b'\x1a\x45\xdf\xa3demo')
    response = json.dumps({'extracted_text': 'Please share your OTP.', 'detected_language': 'en', 'limitations': ['Short recording.']})
    result = asyncio.run(analyzer(response).extract(media))
    assert result.media_kind == MediaKind.VOICE_NOTE
    assert result.extracted_text == 'Please share your OTP.'


def test_media_provider_failure_never_invents_a_transcript() -> None:
    media = ValidatedMedia(media_kind=MediaKind.VOICE_NOTE, mime_type='audio/webm', size_bytes=8, data=b'\x1a\x45\xdf\xa3demo')
    with pytest.raises(MediaExtractionUnavailableError):
        asyncio.run(analyzer(error=TimeoutError()).extract(media))
