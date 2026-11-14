from app.schemas import (
    OrganisationVerifyRequest,
    QrAnalyzeRequest,
    SafeAction,
    SafeNextStepRequest,
    ScamCategory,
    SimpleExplainRequest,
    Verdict,
)
from app.services.decision_checker import DecisionChecker
from app.services.organisation_verifier import OrganisationVerifier
from app.services.simple_explainer import SimpleExplainer


def test_otp_decision_is_always_stop_now() -> None:
    result = DecisionChecker().check(SafeNextStepRequest(action=SafeAction.SHARE_OTP, verdict=Verdict.SAFE))
    assert result.decision == "STOP_NOW"
    assert "OTP" in result.title


def test_organisation_verifier_only_recognises_a_claim() -> None:
    result = OrganisationVerifier().verify(OrganisationVerifyRequest(text="SBI KYC blocked urgently share OTP"))
    assert result.claims[0].claimed_organisation == "State Bank of India"
    assert "does not prove" not in result.claims[0].risk_reason  # pressure reason is more specific
    assert result.claims[0].official_domains == ["sbi.co.in"]


def test_simple_explanation_is_available_without_ai() -> None:
    result = SimpleExplainer().explain(SimpleExplainRequest(verdict=Verdict.SUSPICIOUS, scam_category=ScamCategory.OTP_THEFT))
    assert "OTP" in result.simple_explanation
    assert len(result.do_steps) == 3


def test_qr_request_never_contains_an_image() -> None:
    payload = QrAnalyzeRequest(payload="upi://pay?pa=merchant%40upi")
    assert payload.payload.startswith("upi://")
