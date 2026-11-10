import io
import asyncio

from fastapi.testclient import TestClient
from PIL import Image
from starlette.datastructures import UploadFile

from app.config import Settings
from app.main import create_app
from app.schemas import MediaKind
from app.services.media_validation import MediaValidationError, MediaValidator, sanitise_screenshot


def _valid_png() -> bytes:
    """Generate a valid image in memory; no fixture file is retained."""

    buffer = io.BytesIO()
    Image.new("RGB", (1, 1), (0, 119, 255)).save(buffer, format="PNG")
    return buffer.getvalue()


def test_media_validation_accepts_a_consented_valid_screenshot() -> None:
    with TestClient(create_app()) as client:
        response = client.post(
            "/api/v1/surakshai/media/validate",
            data={"media_kind": "SCREENSHOT", "consent": "true"},
            files={"media": ("sample.png", _valid_png(), "image/png")},
        )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["media_kind"] == "SCREENSHOT"
    assert body["mime_type"] == "image/png"
    assert body["consent_acknowledged"] is True
    assert "sample.png" not in response.text


def test_media_validation_requires_explicit_consent() -> None:
    with TestClient(create_app()) as client:
        response = client.post(
            "/api/v1/surakshai/media/validate",
            data={"media_kind": "SCREENSHOT", "consent": "false"},
            files={"media": ("sample.png", _valid_png(), "image/png")},
        )

    assert response.status_code == 422
    assert "Consent is required" in response.json()["detail"]


def test_media_validation_rejects_a_disguised_file() -> None:
    with TestClient(create_app()) as client:
        response = client.post(
            "/api/v1/surakshai/media/validate",
            data={"media_kind": "SCREENSHOT", "consent": "true"},
            files={"media": ("not-an-image.png", b"not a PNG", "image/png")},
        )

    assert response.status_code == 422
    assert "could not be verified" in response.json()["detail"]


def test_media_validator_rejects_an_oversized_upload_before_parsing() -> None:
    upload = UploadFile(filename="large.png", file=io.BytesIO(b"x" * 1025), headers={"content-type": "image/png"})
    validator = MediaValidator(Settings(max_image_upload_bytes=1024))

    try:
        asyncio.run(validator.validate(upload, MediaKind.SCREENSHOT))
    except MediaValidationError as exc:
        assert "exceeds the permitted size" in str(exc)
    else:  # pragma: no cover - documents the required failure mode
        raise AssertionError("An oversized upload must be rejected")


def test_media_validator_accepts_the_m4a_browser_mime_alias() -> None:
    # M4A is an MP4 container. Safari and some Android browsers label it with
    # the x-m4a alias even though binary inspection correctly identifies MP4.
    audio = b"\x00\x00\x00\x18ftypM4A \x00\x00\x00\x00"
    upload = UploadFile(
        filename="voice.m4a",
        file=io.BytesIO(audio),
        headers={"content-type": "audio/x-m4a"},
    )

    validated = asyncio.run(MediaValidator(Settings()).validate(upload, MediaKind.VOICE_NOTE))

    assert validated.mime_type == "audio/mp4"


def test_screenshot_sanitisation_removes_exif_metadata() -> None:
    source = io.BytesIO()
    image = Image.new("RGB", (8, 8), (0, 119, 255))
    exif = image.getexif()
    exif[270] = "sensitive description"
    image.save(source, format="JPEG", exif=exif)

    clean, mime_type = sanitise_screenshot(source.getvalue())

    assert mime_type == "image/png"
    with Image.open(io.BytesIO(clean)) as output:
        assert output.getexif() == {}


def test_media_extraction_never_fakes_text_without_an_ai_provider() -> None:
    with TestClient(create_app()) as client:
        response = client.post(
            "/api/v1/surakshai/media/extract",
            data={"media_kind": "SCREENSHOT", "consent": "true"},
            files={"media": ("sample.png", _valid_png(), "image/png")},
        )

    assert response.status_code == 503
    assert "paste or type" in response.json()["detail"].lower()
