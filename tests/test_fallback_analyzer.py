from app.schemas import AnalysisSource, ScamCategory, Verdict
from app.services.fallback_analyzer import RuleBasedFallbackAnalyzer


def test_upi_kyc_message_is_flagged_as_scam() -> None:
    message = (
        "Dear customer, your SBI UPI ID will be blocked in 24 hours. "
        "Complete KYC at sbi-verify-kyc.in/urgent to avoid suspension."
    )

    result = RuleBasedFallbackAnalyzer().analyze(message)

    assert result.verdict == Verdict.SCAM
    assert result.scam_category == ScamCategory.KYC_SCAM
    assert result.analysis_source == AnalysisSource.RULE_FALLBACK
    assert any("blocked" in flag.phrase.lower() for flag in result.red_flags)


def test_otp_request_is_high_risk() -> None:
    result = RuleBasedFallbackAnalyzer().analyze(
        "Amazon support says share the OTP sent to your mobile to secure your account."
    )

    assert result.verdict == Verdict.SCAM
    assert result.scam_category == ScamCategory.OTP_THEFT
    assert "1930" in " ".join(result.action_steps)


def test_plain_transaction_alert_is_not_called_a_scam() -> None:
    result = RuleBasedFallbackAnalyzer().analyze(
        "Your account ending 1234 was debited by Rs 250 at a merchant. If this was not you, use your bank app."
    )

    assert result.verdict == Verdict.SAFE
    assert result.scam_category == ScamCategory.UNKNOWN
