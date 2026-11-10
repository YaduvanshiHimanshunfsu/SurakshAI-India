from __future__ import annotations

import asyncio
import base64
import ipaddress
import re
import socket
import ssl
from dataclasses import dataclass
from typing import Iterable
from urllib.parse import SplitResult, urlsplit, urlunsplit

import httpx
import tldextract

from app.config import Settings
from app.schemas import (
    ReputationProviderResult,
    ReputationStatus,
    Severity,
    TlsDetails,
    TlsStatus,
    UrlAnalysis,
    UrlRiskLevel,
    UrlSignal,
)


# This extractor uses the embedded Public Suffix List snapshot. It never makes a
# hidden network call to refresh suffixes while handling a user message.
_EXTRACT = tldextract.TLDExtract(suffix_list_urls=())
# Covers explicit URLs and common bare domains in SMS/WhatsApp messages, while
# avoiding the domain portion of an email address.
URL_PATTERN = re.compile(
    r"(?ix)(?<![@\w-])(?:"
    r"(?:https?://|www\.)[^\s<>\"']+"
    r"|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}(?:/[^\s<>\"']*)?"
    r")"
)
SHORTENERS = frozenset({"bit.ly", "tinyurl.com", "t.co", "goo.gl", "cutt.ly", "rb.gy", "is.gd", "shorturl.at"})
SUSPICIOUS_TLDS = frozenset({"zip", "mov", "xyz", "top", "click", "link", "gq", "tk", "ml", "work", "country"})
BRAND_TERMS = (
    "sbi", "hdfc", "icici", "axis", "kotak", "paytm", "phonepe", "gpay", "googlepay",
    "airtel", "jio", "amazon", "flipkart", "microsoft", "apple", "whatsapp", "instagram",
    "facebook", "paypal", "netflix", "dhl", "fedex", "usps", "gov", "irs", "hmrc",
)
KNOWN_BRAND_DOMAINS = frozenset(
    {
        "sbi.co.in", "hdfcbank.com", "icicibank.com", "axisbank.com", "kotak.com",
        "paytm.com", "phonepe.com", "google.com", "airtel.in", "jio.com",
        "amazon.in", "amazon.com", "flipkart.com", "microsoft.com", "apple.com",
        "whatsapp.com", "instagram.com", "facebook.com", "paypal.com", "netflix.com",
        "dhl.com", "fedex.com", "usps.com", "irs.gov", "gov.uk",
    }
)
SENSITIVE_PATH_TERMS = re.compile(
    r"(?:login|sign[ -]?in|verify|verification|secure|update|kyc|wallet|bank(?:ing)?|otp|password|refund|claim)",
    re.IGNORECASE,
)


class UrlValidationError(ValueError):
    pass


@dataclass(frozen=True)
class NormalizedUrl:
    original: str
    url: str
    parsed: SplitResult
    host: str
    raw_host: str
    registered_domain: str
    suffix: str


class UrlIntelligenceService:
    """Performs explainable URL checks without fetching untrusted web content.

    This is intentionally not a web crawler. It never downloads page content,
    executes JavaScript, follows redirects, or submits unknown URLs to VirusTotal.
    That avoids turning a safety feature into an SSRF or privacy-leak primitive.
    """

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    async def analyze_message_urls(self, message: str) -> list[UrlAnalysis]:
        if not self._settings.url_intelligence_enabled:
            return []
        urls = self.extract_urls(message)
        if not urls:
            return []
        results = await asyncio.gather(*(self.analyze_url(url) for url in urls), return_exceptions=True)
        analyses: list[UrlAnalysis] = []
        for raw_url, result in zip(urls, results, strict=True):
            if isinstance(result, UrlAnalysis):
                analyses.append(result)
            else:
                analyses.append(self._unexpected_error_result(raw_url))
        return analyses

    @staticmethod
    def extract_urls(message: str) -> list[str]:
        found: list[str] = []
        seen: set[str] = set()
        for match in URL_PATTERN.finditer(message):
            candidate = match.group(0).rstrip(".,;:!?)]}'\"")
            key = candidate.casefold()
            if candidate and key not in seen:
                found.append(candidate)
                seen.add(key)
        return found[:3]

    async def analyze_url(self, raw_url: str) -> UrlAnalysis:
        try:
            target = self._normalise(raw_url)
        except UrlValidationError as exc:
            return UrlAnalysis(
                original_url=raw_url,
                normalized_url=None,
                host=None,
                registered_domain=None,
                risk_level=UrlRiskLevel.HIGH,
                risk_score=70,
                signals=[
                    UrlSignal(
                        code="UNSAFE_URL_FORMAT",
                        severity=Severity.HIGH,
                        explanation="This link uses an unsupported or deceptive URL format and should not be opened.",
                    )
                ],
                tls=TlsDetails(status=TlsStatus.NOT_CHECKED),
                reputation=[],
                summary="The link could not be safely normalised for inspection.",
                limitations=f"No site content was opened. Detail: {str(exc)[:160]}",
            )

        signals: list[UrlSignal] = []
        score = self._add_static_signals(target, signals)
        # HTTP has no TLS certificate to inspect, independent of whether active
        # HTTPS probing is enabled for this deployment.
        if target.parsed.scheme != "https":
            tls_task = self._not_applicable_tls()
        elif self._settings.url_tls_probe_enabled:
            tls_task = self._probe_tls(target)
        else:
            tls_task = self._not_checked_tls()
        reputation_task = self._reputation_checks(target.url)
        tls, reputation = await asyncio.gather(tls_task, reputation_task)

        if tls.status == TlsStatus.INVALID:
            score += self._add_signal(
                signals,
                "TLS_VALIDATION_FAILED",
                Severity.HIGH,
                "The HTTPS certificate could not be validated for this hostname.",
                35,
            )
        elif tls.status == TlsStatus.UNREACHABLE and target.parsed.scheme == "https":
            score += self._add_signal(
                signals,
                "TLS_NOT_CONFIRMED",
                Severity.MEDIUM,
                "The server certificate could not be checked. This can happen for benign technical reasons, but the site should be verified independently.",
                8,
            )

        known_flag = False
        for item in reputation:
            if item.status == ReputationStatus.FLAGGED:
                known_flag = True
                self._add_signal(
                    signals,
                    f"{item.provider.upper()}_FLAG",
                    Severity.HIGH,
                    f"{item.provider} has a known threat signal for this URL.",
                    70,
                )

        if known_flag:
            score = max(score, 90)
        score = min(100, score)
        risk_level = self._risk_level(score, known_flag)

        return UrlAnalysis(
            original_url=target.original,
            normalized_url=target.url,
            host=target.host,
            registered_domain=target.registered_domain,
            risk_level=risk_level,
            risk_score=score,
            signals=signals[:12],
            tls=tls,
            reputation=reputation,
            summary=self._summary(risk_level, known_flag, signals),
            limitations=(
                "This assessment uses URL structure, TLS verification, and optional threat-intelligence lookups. "
                "A valid HTTPS certificate or no known blocklist match does not prove that a site is legitimate. "
                "The page itself was not opened or executed."
            ),
        )

    def _normalise(self, raw_url: str) -> NormalizedUrl:
        original = raw_url.strip()
        candidate = original
        if "://" not in candidate:
            candidate = f"https://{candidate}"
        parsed = urlsplit(candidate)
        if parsed.scheme not in {"http", "https"}:
            raise UrlValidationError("Only http and https links can be inspected")
        if not parsed.netloc or not parsed.hostname:
            raise UrlValidationError("The link has no valid hostname")
        if parsed.username or parsed.password:
            raise UrlValidationError("Links with embedded credentials are not accepted")
        try:
            port = parsed.port
        except ValueError as exc:
            raise UrlValidationError("The link has an invalid port") from exc
        if port not in {None, 80, 443}:
            raise UrlValidationError("Only standard web ports are accepted")

        raw_host = parsed.hostname.rstrip(".").lower()
        try:
            ipaddress.ip_address(raw_host)
        except ValueError:
            pass
        else:
            raise UrlValidationError("Direct IP-address links are not inspected")
        try:
            host = raw_host.encode("idna").decode("ascii")
        except UnicodeError as exc:
            raise UrlValidationError("The hostname cannot be converted safely") from exc

        extracted = _EXTRACT(host)
        registered_domain = getattr(extracted, "top_domain_under_public_suffix", "") or getattr(
            extracted, "registered_domain", ""
        ) or host
        suffix = extracted.suffix.lower()
        netloc = host if port is None else f"{host}:{port}"
        normalized = urlunsplit((parsed.scheme.lower(), netloc, parsed.path or "/", parsed.query, ""))
        return NormalizedUrl(
            original=original,
            url=normalized,
            parsed=urlsplit(normalized),
            host=host,
            raw_host=raw_host,
            registered_domain=registered_domain.lower(),
            suffix=suffix,
        )

    def _add_static_signals(self, target: NormalizedUrl, signals: list[UrlSignal]) -> int:
        score = 0
        if target.parsed.scheme == "http":
            score += self._add_signal(
                signals,
                "NO_HTTPS",
                Severity.MEDIUM,
                "This link does not use HTTPS, so information sent to it may not be protected in transit.",
                18,
            )
        if target.host.startswith("xn--") or ".xn--" in target.host or any(ord(char) > 127 for char in target.raw_host):
            score += self._add_signal(
                signals,
                "IDN_OR_PUNYCODE",
                Severity.HIGH,
                "This domain uses internationalised characters or Punycode. Verify carefully because lookalike domains can use this technique.",
                25,
            )
        if target.registered_domain in SHORTENERS:
            score += self._add_signal(
                signals,
                "URL_SHORTENER",
                Severity.MEDIUM,
                "A URL shortener hides the final destination, so do not open it unless independently verified.",
                22,
            )
        if target.suffix in SUSPICIOUS_TLDS:
            score += self._add_signal(
                signals,
                "HIGH_RISK_TLD",
                Severity.MEDIUM,
                "This top-level domain is frequently abused in phishing campaigns. It is a risk signal, not proof of fraud.",
                12,
            )
        if len(target.url) > 160:
            score += self._add_signal(
                signals,
                "UNUSUALLY_LONG_URL",
                Severity.LOW,
                "The link is unusually long, which can be used to hide the true destination or important parameters.",
                7,
            )
        if len(target.host.split(".")) >= 5:
            score += self._add_signal(
                signals,
                "DEEP_SUBDOMAIN_CHAIN",
                Severity.LOW,
                "The domain has many subdomains. Check the registered domain carefully, not just the first words.",
                7,
            )
        if "%" in target.parsed.path or "%" in target.parsed.query:
            score += self._add_signal(
                signals,
                "ENCODED_URL_CONTENT",
                Severity.LOW,
                "Encoded characters can obscure where a link leads or what it asks for.",
                6,
            )
        if SENSITIVE_PATH_TERMS.search(f"{target.parsed.path}?{target.parsed.query}"):
            score += self._add_signal(
                signals,
                "CREDENTIAL_OR_KYC_LURE",
                Severity.MEDIUM,
                "The path contains terms commonly used in login, KYC, password, refund, or verification lures.",
                15,
            )
        if any(term in target.host for term in BRAND_TERMS) and target.registered_domain not in KNOWN_BRAND_DOMAINS:
            score += self._add_signal(
                signals,
                "BRAND_LIKE_DOMAIN",
                Severity.HIGH,
                "The domain contains a well-known brand term. Verify the exact official domain through the organisation's app or typed website address.",
                25,
            )
        return score

    async def _probe_tls(self, target: NormalizedUrl) -> TlsDetails:
        if target.parsed.scheme != "https":
            return TlsDetails(status=TlsStatus.NOT_APPLICABLE, hostname_verified=False)
        try:
            addresses = await asyncio.wait_for(self._public_addresses(target.host), timeout=self._settings.url_analysis_timeout_seconds)
            if not addresses:
                return TlsDetails(status=TlsStatus.UNREACHABLE, hostname_verified=None)
            context = ssl.create_default_context()
            reader, writer = await asyncio.wait_for(
                asyncio.open_connection(addresses[0], 443, ssl=context, server_hostname=target.host),
                timeout=self._settings.url_analysis_timeout_seconds,
            )
            del reader
            try:
                ssl_object = writer.get_extra_info("ssl_object")
                certificate = ssl_object.getpeercert() if ssl_object else {}
                return TlsDetails(
                    status=TlsStatus.VALID,
                    issuer=self._format_certificate_name(certificate.get("issuer", ())),
                    expires_at=certificate.get("notAfter"),
                    hostname_verified=True,
                )
            finally:
                writer.close()
                try:
                    await writer.wait_closed()
                except (ConnectionError, OSError):
                    pass
        except ssl.SSLCertVerificationError:
            return TlsDetails(status=TlsStatus.INVALID, hostname_verified=False)
        except (asyncio.TimeoutError, socket.gaierror, ConnectionError, OSError):
            return TlsDetails(status=TlsStatus.UNREACHABLE, hostname_verified=None)

    @staticmethod
    async def _public_addresses(host: str) -> list[str]:
        infos = await asyncio.get_running_loop().getaddrinfo(host, 443, type=socket.SOCK_STREAM)
        addresses: list[str] = []
        for _, _, _, _, address in infos:
            ip = address[0]
            try:
                parsed = ipaddress.ip_address(ip)
            except ValueError:
                continue
            if parsed.is_global and ip not in addresses:
                addresses.append(ip)
        return addresses

    async def _reputation_checks(self, normalized_url: str) -> list[ReputationProviderResult]:
        tasks = []
        if self._settings.web_risk_api_key and self._settings.web_risk_api_key.get_secret_value():
            tasks.append(self._check_web_risk(normalized_url))
        if self._settings.virustotal_api_key and self._settings.virustotal_api_key.get_secret_value():
            tasks.append(self._check_virustotal(normalized_url))
        if not tasks:
            return []
        results = await asyncio.gather(*tasks, return_exceptions=True)
        return [result for result in results if isinstance(result, ReputationProviderResult)]

    async def _check_web_risk(self, normalized_url: str) -> ReputationProviderResult:
        key = self._settings.web_risk_api_key
        assert key is not None
        params = [
            ("threatTypes", "MALWARE"),
            ("threatTypes", "SOCIAL_ENGINEERING"),
            ("threatTypes", "UNWANTED_SOFTWARE"),
            ("uri", normalized_url),
            ("key", key.get_secret_value()),
        ]
        try:
            async with httpx.AsyncClient(timeout=self._settings.url_analysis_timeout_seconds) as client:
                response = await client.get("https://webrisk.googleapis.com/v1/uris:search", params=params)
            if response.status_code == 200:
                threat_types = response.json().get("threat", {}).get("threatTypes", [])
                status = ReputationStatus.FLAGGED if threat_types else ReputationStatus.NO_KNOWN_LISTING
                return ReputationProviderResult(
                    provider="Google Web Risk",
                    status=status,
                    threat_types=[str(item) for item in threat_types][:8],
                    detail=("Known unsafe URL match." if threat_types else "No known match on the queried threat lists."),
                )
            return ReputationProviderResult(
                provider="Google Web Risk", status=ReputationStatus.ERROR, detail="Reputation lookup was unavailable."
            )
        except httpx.HTTPError:
            return ReputationProviderResult(
                provider="Google Web Risk", status=ReputationStatus.ERROR, detail="Reputation lookup was unavailable."
            )

    async def _check_virustotal(self, normalized_url: str) -> ReputationProviderResult:
        key = self._settings.virustotal_api_key
        assert key is not None
        url_id = base64.urlsafe_b64encode(normalized_url.encode("utf-8")).decode("ascii").rstrip("=")
        try:
            async with httpx.AsyncClient(timeout=self._settings.url_analysis_timeout_seconds) as client:
                response = await client.get(
                    f"https://www.virustotal.com/api/v3/urls/{url_id}",
                    headers={"x-apikey": key.get_secret_value()},
                )
            if response.status_code == 404:
                return ReputationProviderResult(
                    provider="VirusTotal",
                    status=ReputationStatus.NOT_CHECKED,
                    detail="No prior VirusTotal report was found. The URL was not submitted for scanning.",
                )
            if response.status_code != 200:
                return ReputationProviderResult(
                    provider="VirusTotal", status=ReputationStatus.ERROR, detail="Reputation lookup was unavailable."
                )
            attributes = response.json().get("data", {}).get("attributes", {})
            stats = attributes.get("last_analysis_stats", {})
            malicious = int(stats.get("malicious", 0) or 0)
            suspicious = int(stats.get("suspicious", 0) or 0)
            status = ReputationStatus.FLAGGED if malicious or suspicious else ReputationStatus.NO_KNOWN_LISTING
            return ReputationProviderResult(
                provider="VirusTotal",
                status=status,
                malicious_count=malicious,
                suspicious_count=suspicious,
                detail=(
                    "Existing VirusTotal detections were found."
                    if status == ReputationStatus.FLAGGED
                    else "Existing VirusTotal report has no malicious or suspicious detections."
                ),
            )
        except httpx.HTTPError:
            return ReputationProviderResult(
                provider="VirusTotal", status=ReputationStatus.ERROR, detail="Reputation lookup was unavailable."
            )

    @staticmethod
    async def _not_checked_tls() -> TlsDetails:
        return TlsDetails(status=TlsStatus.NOT_CHECKED, hostname_verified=None)

    @staticmethod
    async def _not_applicable_tls() -> TlsDetails:
        return TlsDetails(status=TlsStatus.NOT_APPLICABLE, hostname_verified=False)

    @staticmethod
    def _add_signal(
        signals: list[UrlSignal], code: str, severity: Severity, explanation: str, points: int
    ) -> int:
        signals.append(UrlSignal(code=code, severity=severity, explanation=explanation))
        return points

    @staticmethod
    def _format_certificate_name(value: Iterable[Iterable[tuple[str, str]]]) -> str | None:
        parts = [f"{key}={item}" for rdn in value for key, item in rdn]
        return ", ".join(parts)[:320] if parts else None

    @staticmethod
    def _risk_level(score: int, known_flag: bool) -> UrlRiskLevel:
        if known_flag or score >= 75:
            return UrlRiskLevel.CRITICAL
        if score >= 45:
            return UrlRiskLevel.HIGH
        if score >= 20:
            return UrlRiskLevel.MEDIUM
        return UrlRiskLevel.LOW

    @staticmethod
    def _summary(risk_level: UrlRiskLevel, known_flag: bool, signals: list[UrlSignal]) -> str:
        if known_flag:
            return "A threat-intelligence provider has flagged this URL. Do not open it or enter any information."
        if risk_level in {UrlRiskLevel.CRITICAL, UrlRiskLevel.HIGH}:
            return "This link has several phishing-risk indicators. Verify through an official app or typed website address instead of opening it."
        if risk_level == UrlRiskLevel.MEDIUM:
            return "This link has caution signals. Verify its exact official domain before using it."
        return "No strong structural risk indicators were found. This is not proof that the website is legitimate."

    @staticmethod
    def _unexpected_error_result(raw_url: str) -> UrlAnalysis:
        return UrlAnalysis(
            original_url=raw_url,
            normalized_url=None,
            host=None,
            registered_domain=None,
            risk_level=UrlRiskLevel.UNKNOWN,
            risk_score=0,
            signals=[],
            tls=TlsDetails(status=TlsStatus.NOT_CHECKED),
            reputation=[],
            summary="The URL could not be analysed at this time.",
            limitations="No conclusion should be drawn from an unavailable URL analysis.",
        )
