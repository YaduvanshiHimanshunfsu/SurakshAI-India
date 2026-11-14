from __future__ import annotations

from app.data.official_directory import OFFICIAL_DIRECTORY
from app.schemas import OrganisationClaim, OrganisationVerifyRequest, OrganisationVerifyResponse

_PRESSURE_TERMS = ("urgent", "immediately", "blocked", "suspend", "otp", "pin", "link", "pay", "payment", "install")


class OrganisationVerifier:
    """Finds claimed organisations and gives an independent verification route.

    This intentionally does not authenticate a message or its sender.
    """

    def verify(self, request: OrganisationVerifyRequest) -> OrganisationVerifyResponse:
        text = request.text.casefold()
        pressure = any(term in text for term in _PRESSURE_TERMS)
        claims: list[OrganisationClaim] = []
        for entry in OFFICIAL_DIRECTORY:
            if not any(alias in text for alias in entry.aliases):
                continue
            reason = "The message uses a familiar organisation name. That alone does not prove it is genuine."
            if pressure:
                reason = "The message combines a familiar organisation name with urgency, a secret, a link, payment, or app-install pressure."
            claims.append(OrganisationClaim(
                claimed_organisation=entry.name,
                official_domains=list(entry.official_domains),
                safe_instruction=entry.safe_instruction,
                risk_reason=reason,
            ))
        notice = (
            "These are safe ways to verify a claim. This tool cannot confirm that a message, number, or link is genuine."
            if claims else
            "No supported organisation claim was found. Do not use a contact or link from an unexpected message; verify independently."
        )
        return OrganisationVerifyResponse(claims=claims, notice=notice)
