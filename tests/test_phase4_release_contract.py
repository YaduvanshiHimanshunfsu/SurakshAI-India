from app.main import create_app


def test_evidence_locker_has_no_server_side_api_surface() -> None:
    """Evidence contents must remain a browser-only feature, not an API payload."""

    # OpenAPI generation is pure and avoids a Windows TestClient/Proactor loop
    # interaction that is unrelated to this release-contract assertion.
    paths = create_app().openapi()["paths"]

    assert not any("evidence" in path.casefold() or "report-pack" in path.casefold() for path in paths)


def test_release_config_keeps_the_frontend_build_and_server_entrypoint() -> None:
    from pathlib import Path
    import json

    root = Path(__file__).resolve().parents[1]
    config = json.loads((root / "vercel.json").read_text(encoding="utf-8"))
    assert (root / "api" / "index.py").is_file()
    # Modern Vercel configuration uses a functions map, not the legacy builds array.
    assert "api/index.py" in config["functions"]
    assert any(route["src"] == "/api/(.*)" and route["dest"] == "api/index.py" for route in config["routes"])
