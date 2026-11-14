import asyncio

from app.config import Settings
from app.schemas import TlsStatus, UrlRiskLevel
from app.services.url_intelligence import UrlIntelligenceService


def _service() -> UrlIntelligenceService:
    return UrlIntelligenceService(
        Settings(url_tls_probe_enabled=False, web_risk_api_key=None, virustotal_api_key=None)
    )


def test_shortened_credential_lure_is_risky_without_network() -> None:
    result = asyncio.run(_service().analyze_url("http://bit.ly/verify-account?kyc=1"))

    signal_codes = {signal.code for signal in result.signals}
    assert result.risk_level in {UrlRiskLevel.HIGH, UrlRiskLevel.CRITICAL}
    assert {"NO_HTTPS", "URL_SHORTENER", "CREDENTIAL_OR_KYC_LURE"} <= signal_codes
    assert result.tls.status == TlsStatus.NOT_APPLICABLE


def test_direct_ip_url_is_not_inspected() -> None:
    result = asyncio.run(_service().analyze_url("https://127.0.0.1/login"))

    assert result.risk_level == UrlRiskLevel.HIGH
    assert result.normalized_url is None
    assert result.signals[0].code == "UNSAFE_URL_FORMAT"


def test_url_extraction_deduplicates_and_removes_trailing_punctuation() -> None:
    urls = UrlIntelligenceService.extract_urls(
        "Open https://example.com/login. Or sbi-verify-kyc.in/urgent, then www.test.org/path!"
    )

    assert urls == ["https://example.com/login", "sbi-verify-kyc.in/urgent", "www.test.org/path"]


def test_reviewed_domain_profile_never_authenticates_a_specific_page() -> None:
    profile = UrlIntelligenceService._site_profile("google.com")

    assert profile.status == "KNOWN_OFFICIAL_DOMAIN"
    assert profile.name == "Google"
    assert "does not authenticate" in profile.verification_note


def test_unknown_domain_profile_is_cautious_not_a_scam_label() -> None:
    profile = UrlIntelligenceService._site_profile("example.org")

    assert profile.status == "NOT_IN_REVIEWED_DIRECTORY"
    assert "not proof" in profile.verification_note
