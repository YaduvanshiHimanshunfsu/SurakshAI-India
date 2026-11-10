from __future__ import annotations

"""Bounded, non-persistent validation for future screenshot and voice uploads."""

import io
import warnings
from dataclasses import dataclass, field

from fastapi import UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError

from app.config import Settings
from app.schemas import MediaKind


class MediaValidationError(ValueError):
    """Raised for an unsafe or unsupported media upload without exposing its data."""


@dataclass(frozen=True)
class ValidatedMedia:
    media_kind: MediaKind
    mime_type: str
    size_bytes: int
    data: bytes = field(repr=False)


_IMAGE_FORMATS = {
    "JPEG": "image/jpeg",
    "PNG": "image/png",
    "WEBP": "image/webp",
}

# Browsers and operating systems describe the same M4A container differently.
# The binary inspection is still authoritative; this only avoids rejecting a
# correctly labelled browser recording because it used the registered alias.
_EQUIVALENT_MIME_TYPES = {
    frozenset({"audio/mp4", "audio/x-m4a"}),
}


def _normalise_mime_type(value: str | None) -> str:
    return (value or "").split(";", maxsplit=1)[0].strip().lower()


def _detect_audio_mime_type(data: bytes) -> str | None:
    if data.startswith(b"RIFF") and data[8:12] == b"WAVE":
        return "audio/wav"
    if data.startswith(b"\x1a\x45\xdf\xa3"):
        return "audio/webm"
    if len(data) >= 12 and data[4:8] == b"ftyp":
        return "audio/mp4"
    if data.startswith(b"ID3") or (len(data) >= 2 and data[0] == 0xFF and data[1] & 0xE0 == 0xE0):
        return "audio/mpeg"
    return None


class MediaValidator:
    """Validates only metadata and file structure; it never writes uploads to disk."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    async def validate(self, upload: UploadFile, media_kind: MediaKind) -> ValidatedMedia:
        if not self._settings.media_upload_enabled:
            raise MediaValidationError("Media uploads are not enabled")

        declared_mime_type = _normalise_mime_type(upload.content_type)
        limit = (
            self._settings.max_image_upload_bytes
            if media_kind == MediaKind.SCREENSHOT
            else self._settings.max_audio_upload_bytes
        )
        allowed_types = (
            self._settings.image_mime_types
            if media_kind == MediaKind.SCREENSHOT
            else self._settings.audio_mime_types
        )

        if declared_mime_type not in allowed_types:
            raise MediaValidationError("This file type is not supported for the selected media")

        # Reading a single byte over the configured ceiling avoids trusting an
        # attacker-controlled Content-Length header while keeping memory bounded.
        data = await upload.read(limit + 1)
        if not data:
            raise MediaValidationError("The uploaded file is empty")
        if len(data) > limit:
            raise MediaValidationError("The uploaded file exceeds the permitted size")

        if media_kind == MediaKind.SCREENSHOT:
            actual_mime_type = self._validate_image(data)
        else:
            actual_mime_type = _detect_audio_mime_type(data)
            if actual_mime_type is None:
                raise MediaValidationError("The audio file could not be verified")

        if (
            actual_mime_type != declared_mime_type
            and frozenset({actual_mime_type, declared_mime_type}) not in _EQUIVALENT_MIME_TYPES
        ):
            raise MediaValidationError("The file contents do not match the declared media type")

        return ValidatedMedia(
            media_kind=media_kind,
            mime_type=actual_mime_type,
            size_bytes=len(data),
            data=data,
        )

    def _validate_image(self, data: bytes) -> str:
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("error", Image.DecompressionBombWarning)
                with Image.open(io.BytesIO(data)) as image:
                    actual_mime_type = _IMAGE_FORMATS.get(image.format or "")
                    if actual_mime_type is None:
                        raise MediaValidationError("The image format is not supported")
                    width, height = image.size
                    if width < 1 or height < 1 or width * height > self._settings.max_image_pixels:
                        raise MediaValidationError("The image dimensions are not permitted")
                    image.verify()
                    return actual_mime_type
        except (Image.DecompressionBombError, Image.DecompressionBombWarning):
            raise MediaValidationError("The image dimensions are not permitted") from None
        except (UnidentifiedImageError, OSError, SyntaxError, ValueError):
            raise MediaValidationError("The image file could not be verified") from None


def sanitise_screenshot(data: bytes, *, max_dimension: int = 2_200, max_bytes: int = 3_000_000) -> tuple[bytes, str]:
    """Apply orientation, remove metadata, and bound an image before AI use.

    The returned bytes are in-memory only. Screenshots are normalised to PNG when
    possible; a quality-controlled JPEG fallback prevents an unusually noisy
    screenshot from exceeding the provider payload budget.
    """

    try:
        with Image.open(io.BytesIO(data)) as opened:
            image = ImageOps.exif_transpose(opened)
            if image.mode not in {"RGB", "RGBA"}:
                image = image.convert("RGBA" if "transparency" in image.info else "RGB")
            image.thumbnail((max_dimension, max_dimension))
            image.load()
            png = io.BytesIO()
            image.save(png, format="PNG", optimize=True)
            clean = png.getvalue()
            if len(clean) <= max_bytes:
                return clean, "image/png"

            # JPEG deliberately drops all source metadata and is a practical
            # fallback for a photograph or unusually noisy screenshot.
            jpeg = io.BytesIO()
            image.convert("RGB").save(jpeg, format="JPEG", quality=88, optimize=True)
            clean = jpeg.getvalue()
            if len(clean) <= max_bytes:
                return clean, "image/jpeg"
    except (Image.DecompressionBombError, Image.DecompressionBombWarning):
        raise MediaValidationError("The image dimensions are not permitted") from None
    except (UnidentifiedImageError, OSError, SyntaxError, ValueError):
        raise MediaValidationError("The image could not be safely prepared") from None

    raise MediaValidationError("The sanitised image exceeds the permitted size")
