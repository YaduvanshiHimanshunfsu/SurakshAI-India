import pytest

from app.utils.json_output import ModelOutputError, parse_json_object


def test_parses_a_single_json_object() -> None:
    assert parse_json_object('{"verdict":"SCAM"}') == {"verdict": "SCAM"}


def test_tolerates_a_wrapping_code_fence() -> None:
    raw = '```json\n{"verdict":"SCAM"}\n```'
    assert parse_json_object(raw) == {"verdict": "SCAM"}


def test_rejects_commentary_after_json() -> None:
    with pytest.raises(ModelOutputError):
        parse_json_object('{"verdict":"SCAM"}\nHere is the result.')
