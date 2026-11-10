from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class Verdict(str, Enum):
    SCAM = "SCAM"
    SUSPICIOUS = "SUSPICIOUS"
    SAFE = "SAFE"


class Severity(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class AnalysisSource(str, Enum):
    AI = "AI"
    RULE_FALLBACK = "RULE_FALLBACK"


class MediaKind(str, Enum):
    SCREENSHOT = "SCREENSHOT"
    VOICE_NOTE = "VOICE_NOTE"


class ExposureState(str, Enum):
    RECEIVED_ONLY = "RECEIVED_ONLY"
    CLICKED_LINK = "CLICKED_LINK"
    SHARED_PERSONAL_INFO = "SHARED_PERSONAL_INFO"
    SHARED_SECRET = "SHARED_SECRET"
    INSTALLED_APP_OR_SCREEN_SHARE = "INSTALLED_APP_OR_SCREEN_SHARE"
    SENT_MONEY = "SENT_MONEY"


class RescueUrgency(str, Enum):
    PREVENTIVE = "PREVENTIVE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class EvidenceKind(str, Enum):
    MESSAGE = "MESSAGE"
    SCREENSHOT = "SCREENSHOT"
    VOICE_TRANSCRIPT = "VOICE_TRANSCRIPT"
    EMAIL = "EMAIL"
    URL = "URL"
    TRANSACTION_REFERENCE = "TRANSACTION_REFERENCE"


class EmailType(str, Enum):
    PHISHING = "PHISHING"
    IMPERSONATION = "IMPERSONATION"
    BUSINESS_EMAIL_COMPROMISE = "BUSINESS_EMAIL_COMPROMISE"
    MALWARE_DELIVERY = "MALWARE_DELIVERY"
    MARKETING_OR_NEWSLETTER = "MARKETING_OR_NEWSLETTER"
    TRANSACTIONAL = "TRANSACTIONAL"
    PERSONAL_OR_UNKNOWN = "PERSONAL_OR_UNKNOWN"


class AuthenticationStatus(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    SOFTFAIL = "SOFTFAIL"
    NEUTRAL = "NEUTRAL"
    NONE = "NONE"
    NOT_PRESENT = "NOT_PRESENT"
    NOT_VERIFIABLE = "NOT_VERIFIABLE"
    ERROR = "ERROR"


class UrlRiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"
    UNKNOWN = "UNKNOWN"


class ReputationStatus(str, Enum):
    FLAGGED = "FLAGGED"
    NO_KNOWN_LISTING = "NO_KNOWN_LISTING"
    NOT_CHECKED = "NOT_CHECKED"
    ERROR = "ERROR"


class TlsStatus(str, Enum):
    VALID = "VALID"
    INVALID = "INVALID"
    NOT_APPLICABLE = "NOT_APPLICABLE"
    UNREACHABLE = "UNREACHABLE"
    NOT_CHECKED = "NOT_CHECKED"


class InputLanguage(str, Enum):
    AUTO = "auto"
    ENGLISH = "en"
    HINDI = "hi"
    HINGLISH = "hinglish"
    BENGALI = "bn"
    TAMIL = "ta"
    TELUGU = "te"
    MARATHI = "mr"
    GUJARATI = "gu"
    PUNJABI = "pa"
    URDU = "ur"
    SPANISH = "es"
    FRENCH = "fr"
    ARABIC = "ar"
    OTHER = "other"


class ScamCategory(str, Enum):
    UPI_FRAUD = "UPI_FRAUD"
    KYC_SCAM = "KYC_SCAM"
    GOVERNMENT_IMPERSONATION = "GOVERNMENT_IMPERSONATION"
    LOTTERY_PRIZE = "LOTTERY_PRIZE"
    FAKE_JOB = "FAKE_JOB"
    INVESTMENT_FRAUD = "INVESTMENT_FRAUD"
    OTP_THEFT = "OTP_THEFT"
    PHISHING_LINK = "PHISHING_LINK"
    COURIER_SCAM = "COURIER_SCAM"
    TECH_SUPPORT = "TECH_SUPPORT"
    ROMANCE_SCAM = "ROMANCE_SCAM"
    UNKNOWN = "UNKNOWN"


class PsychologicalTactic(str, Enum):
    FALSE_URGENCY = "FALSE_URGENCY"
    AUTHORITY_IMPERSONATION = "AUTHORITY_IMPERSONATION"
    FEAR_INDUCTION = "FEAR_INDUCTION"
    TOO_GOOD_TO_BE_TRUE = "TOO_GOOD_TO_BE_TRUE"
    OTP_SOCIAL_ENGINEERING = "OTP_SOCIAL_ENGINEERING"
    PROCESSING_FEE_TRAP = "PROCESSING_FEE_TRAP"
    SOCIAL_PROOF_FABRICATION = "SOCIAL_PROOF_FABRICATION"
    RECIPROCITY_TRAP = "RECIPROCITY_TRAP"


class AnalyzeRequest(BaseModel):
    """Untrusted text submitted by the browser for analysis."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    message: str = Field(min_length=3, max_length=5_000)
    language: InputLanguage = InputLanguage.AUTO

    @field_validator("message")
    @classmethod
    def reject_null_bytes(cls, value: str) -> str:
        if "\x00" in value:
            raise ValueError("Message contains an invalid character")
        return value


class RedFlag(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    phrase: str = Field(min_length=1, max_length=160)
    explanation: str = Field(min_length=5, max_length=320)


class UrlSignal(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    code: str = Field(min_length=2, max_length=64)
    severity: Severity
    explanation: str = Field(min_length=5, max_length=320)


class TlsDetails(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    status: TlsStatus
    issuer: str | None = Field(default=None, max_length=320)
    expires_at: str | None = Field(default=None, max_length=80)
    hostname_verified: bool | None = None


class ReputationProviderResult(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    provider: str = Field(min_length=2, max_length=64)
    status: ReputationStatus
    threat_types: list[str] = Field(default_factory=list, max_length=8)
    malicious_count: int | None = Field(default=None, ge=0)
    suspicious_count: int | None = Field(default=None, ge=0)
    detail: str | None = Field(default=None, max_length=240)


class UrlAnalysis(BaseModel):
    """A conservative, explainable assessment of one user-supplied URL."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    original_url: str = Field(min_length=1, max_length=2_048)
    normalized_url: str | None = Field(default=None, max_length=2_048)
    host: str | None = Field(default=None, max_length=253)
    registered_domain: str | None = Field(default=None, max_length=253)
    risk_level: UrlRiskLevel
    risk_score: int = Field(ge=0, le=100)
    signals: list[UrlSignal] = Field(default_factory=list, max_length=12)
    tls: TlsDetails
    reputation: list[ReputationProviderResult] = Field(default_factory=list, max_length=3)
    summary: str = Field(min_length=5, max_length=500)
    limitations: str = Field(min_length=10, max_length=500)


class UrlAnalyzeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    url: str = Field(min_length=4, max_length=2_048)


class EmailAnalyzeRequest(BaseModel):
    """Email input. A raw .eml is strongest because it preserves headers."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    raw_eml: str | None = Field(default=None, max_length=1_000_000)
    sender: str | None = Field(default=None, max_length=512)
    subject: str | None = Field(default=None, max_length=2_000)
    body: str | None = Field(default=None, max_length=100_000)
    language: InputLanguage = InputLanguage.AUTO

    @model_validator(mode="after")
    def requires_email_content(self) -> "EmailAnalyzeRequest":
        if not self.raw_eml and not self.body:
            raise ValueError("Provide a raw .eml file or pasted email body")
        if self.raw_eml and "\x00" in self.raw_eml:
            raise ValueError("Email contains an invalid character")
        return self


class EmailIdentity(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    display_name: str | None = Field(default=None, max_length=256)
    address: str | None = Field(default=None, max_length=320)
    domain: str | None = Field(default=None, max_length=253)


class AuthenticationEvidence(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    spf: AuthenticationStatus
    dkim: AuthenticationStatus
    dmarc: AuthenticationStatus
    alignment: AuthenticationStatus
    source: str = Field(min_length=3, max_length=120)
    details: list[str] = Field(default_factory=list, max_length=8)


class EmailAttachment(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    filename: str | None = Field(default=None, max_length=512)
    content_type: str = Field(min_length=1, max_length=160)
    size_bytes: int | None = Field(default=None, ge=0)
    risk: UrlRiskLevel
    reason: str = Field(min_length=5, max_length=320)


class EmailAnalysisResponse(BaseModel):
    """Explainable, frontend-safe result for a pasted email or raw .eml."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    verdict: Verdict
    confidence: int = Field(ge=0, le=100)
    severity: Severity
    email_type: EmailType
    scam_category: ScamCategory
    sender: EmailIdentity
    reply_to: EmailIdentity | None = None
    return_path: EmailIdentity | None = None
    authentication: AuthenticationEvidence
    subject: str | None = Field(default=None, max_length=2_000)
    psychological_tactics: list[PsychologicalTactic] = Field(default_factory=list, max_length=6)
    red_flags: list[RedFlag] = Field(default_factory=list, max_length=8)
    action_steps: list[str] = Field(min_length=1, max_length=7)
    hindi_summary: str = Field(min_length=5, max_length=420)
    url_analyses: list[UrlAnalysis] = Field(default_factory=list, max_length=3)
    attachments: list[EmailAttachment] = Field(default_factory=list, max_length=20)
    analysis_source: AnalysisSource
    model_used: str | None = Field(default=None, max_length=120)
    limitations: list[str] = Field(min_length=1, max_length=6)


class AnalysisResponse(BaseModel):
    """Strict, frontend-safe contract returned by the API."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    verdict: Verdict
    confidence: int = Field(ge=0, le=100)
    scam_category: ScamCategory
    severity: Severity
    psychological_tactics: list[PsychologicalTactic] = Field(default_factory=list, max_length=6)
    red_flags: list[RedFlag] = Field(default_factory=list, max_length=6)
    action_steps: list[str] = Field(min_length=1, max_length=6)
    hindi_summary: str = Field(min_length=5, max_length=420)
    safe_explanation: str | None = Field(default=None, max_length=420)
    analysis_source: AnalysisSource = AnalysisSource.AI
    model_used: str | None = Field(default=None, max_length=120)
    notice: str | None = Field(default=None, max_length=240)
    url_analyses: list[UrlAnalysis] = Field(default_factory=list, max_length=3)

    @field_validator("action_steps")
    @classmethod
    def action_steps_are_actionable(cls, values: list[str]) -> list[str]:
        clean = [value.strip() for value in values if value and value.strip()]
        if not clean:
            raise ValueError("At least one action step is required")
        return clean

    @model_validator(mode="after")
    def enforce_cautious_safe_results(self) -> "AnalysisResponse":
        # A text-only classifier must never present a message as definitively safe.
        if self.verdict == Verdict.SAFE:
            self.severity = Severity.LOW
            self.confidence = min(self.confidence, 75)
            self.safe_explanation = self.safe_explanation or (
                "No obvious scam indicators were found in this text, but verify requests "
                "for money or sensitive information through official channels."
            )
        return self


class MediaValidationResponse(BaseModel):
    """Metadata returned after validating an opt-in media upload.

    The server deliberately does not return the original filename or content.
    Phase 3 will use this validation path before sending approved media to an
    analysis provider.
    """

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    media_kind: MediaKind
    mime_type: str = Field(min_length=3, max_length=80)
    size_bytes: int = Field(ge=1)
    consent_acknowledged: bool
    retention_notice: str = Field(min_length=20, max_length=320)


class MediaExtractionCandidate(BaseModel):
    """Strict, provider-produced transcription/OCR output before app metadata is added."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    extracted_text: str = Field(min_length=1, max_length=10_000)
    detected_language: InputLanguage = InputLanguage.AUTO
    limitations: list[str] = Field(min_length=1, max_length=4)


class MediaExtractionResponse(MediaExtractionCandidate):
    """Validated extracted text; uploaded bytes and file names are never returned."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    media_kind: MediaKind


class RescueRequest(BaseModel):
    """A user's stated exposure, paired with an existing analysis outcome."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    exposure_state: ExposureState
    verdict: Verdict
    scam_category: ScamCategory = ScamCategory.UNKNOWN


class RescueAction(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    priority: int = Field(ge=1, le=10)
    instruction: str = Field(min_length=8, max_length=360)
    official_url: str | None = Field(default=None, max_length=2_048)


class RescuePlan(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    urgency: RescueUrgency
    title: str = Field(min_length=5, max_length=160)
    actions: list[RescueAction] = Field(min_length=1, max_length=8)
    evidence_to_preserve: list[str] = Field(default_factory=list, max_length=10)
    limitations: list[str] = Field(min_length=1, max_length=4)


class EvidenceItem(BaseModel):
    """Sanitised evidence metadata suitable for local encrypted storage."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    kind: EvidenceKind
    sha256: str | None = Field(default=None, min_length=64, max_length=64)
    captured_at: str | None = Field(default=None, max_length=40)
    description: str = Field(min_length=3, max_length=500)


class ReportPackDraft(BaseModel):
    """Future local-only report payload; it deliberately has no identity fields."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    case_id: str = Field(min_length=8, max_length=80)
    analysis: AnalysisResponse
    rescue_plan: RescuePlan | None = None
    evidence: list[EvidenceItem] = Field(default_factory=list, max_length=20)
    include_unredacted_evidence: bool = False


class HealthResponse(BaseModel):
    status: str
    provider_configured: bool
    offline_fallback_enabled: bool
