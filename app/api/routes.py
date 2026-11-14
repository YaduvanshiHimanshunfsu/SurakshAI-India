from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status

from app.config import Settings, get_settings
from app.schemas import (
    AnalyzeRequest,
    AnalysisResponse,
    EmailAnalyzeRequest,
    EmailAnalysisResponse,
    HealthResponse,
    MediaKind,
    MediaExtractionResponse,
    MediaValidationResponse,
    RescuePlan,
    RescueRequest,
    SafeNextStepRequest,
    SafeNextStepResponse,
    QrAnalyzeRequest,
    QrAnalyzeResponse,
    OrganisationVerifyRequest,
    OrganisationVerifyResponse,
    TrustedChannel,
    SimpleExplainRequest,
    SimpleExplainResponse,
    UrlAnalysis,
    UrlAnalyzeRequest,
)
from app.services.email_analyzer import EmailAnalyzer
from app.services.scam_analyzer import ProviderUnavailableError, ScamAnalyzer
from app.services.media_validation import MediaValidationError, MediaValidator
from app.services.media_analyzer import MediaAnalyzer, MediaExtractionUnavailableError
from app.services.rescue_planner import RescuePlanner
from app.services.decision_checker import DecisionChecker
from app.services.organisation_verifier import OrganisationVerifier
from app.services.qr_analyzer import QrAnalyzer
from app.services.simple_explainer import SimpleExplainer
from app.services.trusted_channel_service import TrustedChannelService

router = APIRouter(tags=["SurakshAI-India"])


def get_analyzer(request: Request) -> ScamAnalyzer:
    return request.app.state.analyzer


def get_email_analyzer(request: Request) -> EmailAnalyzer:
    return request.app.state.email_analyzer


def get_rescue_planner(request: Request) -> RescuePlanner:
    return request.app.state.rescue_planner


def get_media_analyzer(request: Request) -> MediaAnalyzer:
    return request.app.state.media_analyzer


def get_decision_checker(request: Request) -> DecisionChecker:
    return request.app.state.decision_checker


def get_qr_analyzer(request: Request) -> QrAnalyzer:
    return request.app.state.qr_analyzer


def get_organisation_verifier(request: Request) -> OrganisationVerifier:
    return request.app.state.organisation_verifier


def get_trusted_channel_service(request: Request) -> TrustedChannelService:
    return request.app.state.trusted_channel_service


def get_simple_explainer(request: Request) -> SimpleExplainer:
    return request.app.state.simple_explainer


async def enforce_rate_limit(request: Request) -> None:
    await request.app.state.rate_limiter.check(request)


@router.get("/health", response_model=HealthResponse, include_in_schema=False)
async def health(settings: Settings = Depends(get_settings)) -> HealthResponse:
    return HealthResponse(
        status="ok",
        provider_configured=settings.provider_is_configured,
        offline_fallback_enabled=settings.enable_offline_fallback,
    )


@router.post(
    "/surakshai/analyze",
    response_model=AnalysisResponse,
    dependencies=[Depends(enforce_rate_limit)],
    summary="Analyse suspicious message text for Indian scam patterns",
)
async def analyze_scam(
    payload: AnalyzeRequest,
    analyzer: ScamAnalyzer = Depends(get_analyzer),
) -> AnalysisResponse:
    try:
        return await analyzer.analyze(payload)
    except ProviderUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Live scam analysis is unavailable. Please try again shortly.",
        ) from exc


@router.post(
    "/surakshai/url/analyze",
    response_model=UrlAnalysis,
    dependencies=[Depends(enforce_rate_limit)],
    summary="Inspect a URL for phishing signals, TLS status, and optional reputation matches",
)
async def analyze_url(
    payload: UrlAnalyzeRequest,
    analyzer: ScamAnalyzer = Depends(get_analyzer),
) -> UrlAnalysis:
    return await analyzer.analyze_url(payload.url)


@router.post(
    "/surakshai/email/analyze",
    response_model=EmailAnalysisResponse,
    dependencies=[Depends(enforce_rate_limit)],
    summary="Analyse a pasted email or raw .eml for phishing, authentication evidence, and unsafe links",
)
async def analyze_email(
    payload: EmailAnalyzeRequest,
    analyzer: EmailAnalyzer = Depends(get_email_analyzer),
) -> EmailAnalysisResponse:
    try:
        return await analyzer.analyze(payload)
    except ProviderUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Live email analysis is unavailable. Please try again shortly.",
        ) from exc


@router.post(
    "/surakshai/media/validate",
    response_model=MediaValidationResponse,
    dependencies=[Depends(enforce_rate_limit)],
    summary="Validate an opt-in screenshot or voice upload without retaining it",
)
async def validate_media(
    media: UploadFile = File(...),
    media_kind: MediaKind = Form(...),
    consent: bool = Form(False),
    settings: Settings = Depends(get_settings),
) -> MediaValidationResponse:
    """Establish a safe upload boundary before media extraction is introduced.

    This endpoint does not analyse, save, log, or return the file. It only
    verifies its declared type, binary structure, dimensions/size, and consent.
    """

    if not consent:
        await media.close()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Consent is required before media can be processed.",
        )

    try:
        validated = await MediaValidator(settings).validate(media, media_kind)
    except MediaValidationError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    finally:
        await media.close()

    return MediaValidationResponse(
        media_kind=validated.media_kind,
        mime_type=validated.mime_type,
        size_bytes=validated.size_bytes,
        consent_acknowledged=True,
        retention_notice="The upload was validated in memory and was not saved or analysed.",
    )


@router.post(
    "/surakshai/media/extract",
    response_model=MediaExtractionResponse,
    dependencies=[Depends(enforce_rate_limit)],
    summary="Extract reviewable text from a consented screenshot or voice note",
)
async def extract_media(
    media: UploadFile = File(...),
    media_kind: MediaKind = Form(...),
    consent: bool = Form(False),
    settings: Settings = Depends(get_settings),
    analyzer: MediaAnalyzer = Depends(get_media_analyzer),
) -> MediaExtractionResponse:
    """Extract text in memory only; no transcript is invented if extraction fails."""

    if not consent:
        await media.close()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Consent is required before media can be processed.",
        )

    try:
        validated = await MediaValidator(settings).validate(media, media_kind)
        return await analyzer.extract(validated)
    except MediaValidationError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except MediaExtractionUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="We could not read this media. Please paste or type the message text to continue.",
        ) from exc
    finally:
        await media.close()


@router.post(
    "/surakshai/rescue-plan",
    response_model=RescuePlan,
    dependencies=[Depends(enforce_rate_limit)],
    summary="Give deterministic next steps after a potential scam exposure",
)
async def create_rescue_plan(
    payload: RescueRequest,
    planner: RescuePlanner = Depends(get_rescue_planner),
) -> RescuePlan:
    """Return reviewed safety guidance; no secret or account data is accepted."""

    return planner.create_plan(payload)


@router.post(
    "/surakshai/safe-next-step",
    response_model=SafeNextStepResponse,
    dependencies=[Depends(enforce_rate_limit)],
    summary="Return deterministic advice before a risky next action",
)
async def safe_next_step(
    payload: SafeNextStepRequest,
    checker: DecisionChecker = Depends(get_decision_checker),
) -> SafeNextStepResponse:
    return checker.check(payload)


@router.post(
    "/surakshai/qr/analyze",
    response_model=QrAnalyzeResponse,
    dependencies=[Depends(enforce_rate_limit)],
    summary="Assess a browser-decoded QR payload without uploading the QR image",
)
async def analyze_qr(
    payload: QrAnalyzeRequest,
    analyzer: QrAnalyzer = Depends(get_qr_analyzer),
) -> QrAnalyzeResponse:
    return await analyzer.analyze(payload)


@router.post(
    "/surakshai/organisation/verify",
    response_model=OrganisationVerifyResponse,
    dependencies=[Depends(enforce_rate_limit)],
    summary="Find claimed organisations and independent official verification routes",
)
async def verify_organisation(
    payload: OrganisationVerifyRequest,
    verifier: OrganisationVerifier = Depends(get_organisation_verifier),
) -> OrganisationVerifyResponse:
    return verifier.verify(payload)


@router.get(
    "/surakshai/trusted-channels",
    response_model=list[TrustedChannel],
    dependencies=[Depends(enforce_rate_limit)],
    summary="List official reporting and recovery channels without collecting secrets",
)
async def trusted_channels(service: TrustedChannelService = Depends(get_trusted_channel_service)) -> list[TrustedChannel]:
    return service.list_channels()


@router.post(
    "/surakshai/explain-simply",
    response_model=SimpleExplainResponse,
    dependencies=[Depends(enforce_rate_limit)],
    summary="Explain a verdict in deterministic plain English, Hindi, and Hinglish",
)
async def explain_simply(
    payload: SimpleExplainRequest,
    explainer: SimpleExplainer = Depends(get_simple_explainer),
) -> SimpleExplainResponse:
    return explainer.explain(payload)


@router.post(
    "/scamshield/analyze",
    response_model=AnalysisResponse,
    dependencies=[Depends(enforce_rate_limit)],
    deprecated=True,
    include_in_schema=False,
)
async def analyze_scam_legacy(
    payload: AnalyzeRequest,
    analyzer: ScamAnalyzer = Depends(get_analyzer),
) -> AnalysisResponse:
    """Temporary compatibility alias; migrate clients to /surakshai/analyze."""

    return await analyze_scam(payload, analyzer)
