from fastapi.testclient import TestClient

from app.main import create_app


def test_evidence_locker_has_no_server_side_api_surface() -> None:
    """Evidence contents must remain a browser-only feature, not an API payload."""

    with TestClient(create_app()) as client:
        paths = client.get("/openapi.json").json()["paths"]

    assert not any("evidence" in path.casefold() or "report-pack" in path.casefold() for path in paths)


def test_release_config_keeps_the_frontend_build_and_server_entrypoint() -> None:
    from pathlib import Path
    import json

    root = Path(__file__).resolve().parents[1]
    config = json.loads((root / "vercel.json").read_text(encoding="utf-8"))
    assert (root / "api" / "index.py").is_file()
    assert config["builds"][0]["src"] == "api/index.py"
