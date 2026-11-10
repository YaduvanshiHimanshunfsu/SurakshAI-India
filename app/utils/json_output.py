from __future__ import annotations

import json


class ModelOutputError(ValueError):
    """Raised when a provider response cannot be safely parsed as one JSON object."""


def parse_json_object(raw: str) -> dict:
    """Parse a single JSON object without executing or repairing model content.

    A code-fence wrapper is tolerated because providers occasionally add one despite
    instructions. Anything before/after the JSON object must be whitespace only.
    """

    cleaned = raw.strip()
    if cleaned.startswith("```"):
        first_newline = cleaned.find("\n")
        if first_newline == -1:
            raise ModelOutputError("Response contains an incomplete code fence")
        cleaned = cleaned[first_newline + 1 :]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3].rstrip()

    decoder = json.JSONDecoder()
    try:
        value, end = decoder.raw_decode(cleaned)
    except json.JSONDecodeError as exc:
        raise ModelOutputError("Response is not valid JSON") from exc

    if not isinstance(value, dict) or cleaned[end:].strip():
        raise ModelOutputError("Response must contain exactly one JSON object")
    return value
