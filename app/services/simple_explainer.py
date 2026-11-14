from __future__ import annotations

from app.data.simple_explanations import CATEGORY_EXPLANATIONS, DEFAULT_EXPLANATION
from app.schemas import SimpleExplainRequest, SimpleExplainResponse, Verdict


class SimpleExplainer:
    """Plain-language safety guidance that remains available without an AI provider."""

    def explain(self, request: SimpleExplainRequest) -> SimpleExplainResponse:
        simple, hindi, hinglish = CATEGORY_EXPLANATIONS.get(request.scam_category, DEFAULT_EXPLANATION)
        if request.verdict == Verdict.SAFE:
            simple = "No obvious scam signal was found, but unexpected requests for money or secrets should still be checked independently."
            hindi = "Koi saaf scam signal nahi mila, phir bhi paise ya secret ki unexpected request ko independently verify karein."
            hinglish = "Clear scam signal nahi mila, phir bhi money ya secret ki unexpected request ko independently verify kijiye."
        flags = [flag.phrase.casefold() for flag in request.red_flags[:2] if getattr(flag, "phrase", None)]
        why = "The risk is higher because the request asks you to trust a message instead of an official channel."
        if flags:
            why = "The risk is higher because of " + " and ".join(flags) + "."
        return SimpleExplainResponse(
            simple_explanation=simple,
            hindi_explanation=hindi,
            hinglish_explanation=hinglish,
            do_steps=["Pause before taking action.", "Use the official app or a website you type yourself.", "Ask a trusted person if you feel pressured."],
            dont_steps=["Do not share an OTP, PIN, password, or CVV.", "Do not pay or install an app because of an unexpected message.", "Do not use the message's link or phone number to verify it."],
            why_risky=why,
        )
