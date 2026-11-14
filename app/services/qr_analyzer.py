from __future__ import annotations

from urllib.parse import parse_qs, urlparse

from app.data.qr_playbooks import UNKNOWN_ACTIONS, UPI_ACTIONS, URL_ACTIONS
from app.schemas import QrAnalyzeRequest, QrAnalyzeResponse, QrPayloadKind, SafetyDecision
from app.services.scam_analyzer import ScamAnalyzer


class QrAnalyzer:
    """Analyses only the browser-decoded payload, never an uploaded QR image."""

    def __init__(self, analyzer: ScamAnalyzer) -> None:
        self._analyzer = analyzer

    async def analyze(self, request: QrAnalyzeRequest) -> QrAnalyzeResponse:
        payload = request.payload.strip()
        parsed = urlparse(payload)
        if parsed.scheme.lower() == "upi" and parsed.netloc.lower() == "pay":
            upi_id = (parse_qs(parsed.query).get("pa") or [None])[0]
            return QrAnalyzeResponse(
                payload_kind=QrPayloadKind.UPI_PAYMENT,
                decision=SafetyDecision.STOP_NOW,
                title="This QR can start a UPI payment",
                simple_explanation="Scanning a payment QR generally starts a payment. Receiving money never requires entering a UPI PIN.",
                hindi_explanation="Paise paane ke liye UPI PIN nahi dalna hota. Is QR se payment shuru ho sakta hai.",
                actions=list(UPI_ACTIONS),
                upi_id=upi_id,
            )
        if parsed.scheme.lower() in {"http", "https"} and parsed.netloc:
            url_analysis = await self._analyzer.analyze_url(payload)
            return QrAnalyzeResponse(
                payload_kind=QrPayloadKind.URL,
                decision=SafetyDecision.VERIFY_FIRST,
                title="This QR opens a website",
                simple_explanation="A QR link can lead to a fake sign-in or payment page. Check the result before opening it.",
                hindi_explanation="QR link fake login ya payment page khol sakta hai. Pehle verify karein.",
                actions=list(URL_ACTIONS),
                url_analysis=url_analysis,
            )
        return QrAnalyzeResponse(
            payload_kind=QrPayloadKind.TEXT if payload else QrPayloadKind.UNKNOWN,
            decision=SafetyDecision.VERIFY_FIRST,
            title="Unknown QR content — verify before acting",
            simple_explanation="This QR does not contain a recognised UPI payment or website link. Treat it carefully.",
            hindi_explanation="Is QR ka content pehchana nahi gaya. Koi secret ya payment detail na dein.",
            actions=list(UNKNOWN_ACTIONS),
        )
