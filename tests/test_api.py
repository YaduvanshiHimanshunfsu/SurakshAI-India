from fastapi.testclient import TestClient

from app.main import create_app


def test_health_discloses_only_safe_configuration_status() -> None:
    with TestClient(create_app()) as client:
        response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert "GEMINI_API_KEY" not in response.text


def test_analysis_endpoint_returns_valid_fallback_contract_without_key() -> None:
    payload = {
        "message": "Congratulations! You won KBC lottery. Pay processing fee today to claim prize.",
        "language": "en",
    }
    with TestClient(create_app()) as client:
        response = client.post("/api/v1/surakshai/analyze", json=payload)

    body = response.json()
    assert response.status_code == 200
    assert body["verdict"] == "SCAM"
    assert body["analysis_source"] == "RULE_FALLBACK"
    assert body["red_flags"]
    assert response.headers["cache-control"] == "no-store"


def test_analysis_endpoint_rejects_extra_and_empty_inputs() -> None:
    with TestClient(create_app()) as client:
        empty = client.post("/api/v1/surakshai/analyze", json={"message": "   "})
        extra = client.post(
            "/api/v1/surakshai/analyze",
            json={"message": "hello", "debug": True},
        )

    assert empty.status_code == 422
    assert extra.status_code == 422


def test_rescue_plan_is_deterministic_and_does_not_accept_extra_data() -> None:
    with TestClient(create_app()) as client:
        response = client.post(
            "/api/v1/surakshai/rescue-plan",
            json={
                "exposure_state": "SENT_MONEY",
                "verdict": "SCAM",
                "scam_category": "UPI_FRAUD",
            },
        )
        extra = client.post(
            "/api/v1/surakshai/rescue-plan",
            json={"exposure_state": "RECEIVED_ONLY", "verdict": "SCAM", "otp": "123456"},
        )

    assert response.status_code == 200
    assert response.json()["urgency"] == "CRITICAL"
    assert "1930" in response.text
    assert extra.status_code == 422
