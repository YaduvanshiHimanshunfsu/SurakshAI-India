from __future__ import annotations

import re
from collections import Counter
from dataclasses import dataclass

from app.schemas import (
    AnalysisResponse,
    AnalysisSource,
    PsychologicalTactic,
    RedFlag,
    ScamCategory,
    Severity,
    Verdict,
)


@dataclass(frozen=True)
class SignalRule:
    pattern: str
    points: int
    category: ScamCategory
    tactic: PsychologicalTactic | None
    explanation: str


RULES: tuple[SignalRule, ...] = (
    SignalRule(r"\b(?:upi|gpay|phonepe|paytm)\b", 10, ScamCategory.UPI_FRAUD, None,
               "Payment-app references need extra care when combined with pressure or links."),
    SignalRule(r"\b(?:kyc|verify (?:your )?account|update (?:your )?details)\b", 22,
               ScamCategory.KYC_SCAM, PsychologicalTactic.AUTHORITY_IMPERSONATION,
               "Unexpected KYC or verification requests are commonly used to steal account details."),
    SignalRule(r"\b(?:blocked?|suspend(?:ed)?|service (?:will be )?stop(?:ped)?)\b", 24,
               ScamCategory.KYC_SCAM, PsychologicalTactic.FEAR_INDUCTION,
               "Threats of account or service suspension are designed to create fear."),
    SignalRule(r"\b(?:within|in)\s+(?:\d+|one|two|24)\s*(?:hours?|hrs?)\b|\b(?:urgent|immediately|last date|today only)\b",
               18, ScamCategory.UNKNOWN, PsychologicalTactic.FALSE_URGENCY,
               "Urgent deadlines are a common tactic to stop people from verifying independently."),
    SignalRule(r"\b(?:share|send|tell|provide|give)\b.{0,35}\b(?:otp|one[ -]?time password|cvv|pin)\b",
               62, ScamCategory.OTP_THEFT, PsychologicalTactic.OTP_SOCIAL_ENGINEERING,
               "Legitimate support staff will not ask you to share an OTP, PIN, or CVV."),
    SignalRule(r"\b(?:won|winner|lucky draw|kbc|lottery|prize)\b", 32,
               ScamCategory.LOTTERY_PRIZE, PsychologicalTactic.TOO_GOOD_TO_BE_TRUE,
               "Unexpected prize claims are a frequent fraud pattern."),
    SignalRule(r"\b(?:processing fee|registration fee|claim fee|pay.{0,18}(?:fee|charge))\b",
               34, ScamCategory.LOTTERY_PRIZE, PsychologicalTactic.PROCESSING_FEE_TRAP,
               "A small fee to unlock a much larger reward is a common scam pattern."),
    SignalRule(r"\b(?:work from home|youtube videos?|like videos?|data entry|earn.{0,25}(?:per hour|daily))\b",
               32, ScamCategory.FAKE_JOB, PsychologicalTactic.TOO_GOOD_TO_BE_TRUE,
               "Unsolicited easy-income offers are frequently used for job-task fraud."),
    SignalRule(r"\b(?:telegram|trading group|guaranteed returns?|95% accurate|crypto signals?)\b",
               34, ScamCategory.INVESTMENT_FRAUD, PsychologicalTactic.SOCIAL_PROOF_FABRICATION,
               "Guaranteed returns and exclusive trading groups are high-risk investment signals."),
    SignalRule(r"\b(?:pm kisan|pm awas|aadhaar|epfo|income tax refund|rbi)\b", 22,
               ScamCategory.GOVERNMENT_IMPERSONATION, PsychologicalTactic.AUTHORITY_IMPERSONATION,
               "Government or regulator names can be impersonated to gain trust."),
    SignalRule(r"\b(?:customs|courier|parcel|fedex|package).{0,45}\b(?:held|duty|charge|release)\b",
               30, ScamCategory.COURIER_SCAM, PsychologicalTactic.FEAR_INDUCTION,
               "Unexpected package and customs-payment messages should be verified through official tracking."),
    SignalRule(r"\b(?:microsoft|amazon|apple).{0,45}\b(?:customer care|support|suspicious activity)\b",
               24, ScamCategory.TECH_SUPPORT, PsychologicalTactic.AUTHORITY_IMPERSONATION,
               "Scammers often impersonate well-known support teams to obtain access or credentials."),
    SignalRule(r"\b(?:click (?:here|this link)|open (?:this )?link|wa\.me/|bit\.ly/)\b",
               18, ScamCategory.PHISHING_LINK, PsychologicalTactic.FALSE_URGENCY,
               "Unexpected links can lead to credential theft or malicious payment pages."),
)

URL_PATTERN = re.compile(r"(?:https?://|www\.)\S+|\b[a-z0-9][a-z0-9-]{1,62}\.(?:com|in|net|org|co|xyz)(?:/\S*)?", re.I)


DEFAULT_ACTIONS: dict[ScamCategory, list[str]] = {
    ScamCategory.OTP_THEFT: [
        "Do not share any OTP, PIN, CVV, password, or screen-sharing code.",
        "End the conversation and contact the company through its official app or website.",
        "If you shared details or lost money, call 1930 immediately.",
    ],
    ScamCategory.PHISHING_LINK: [
        "Do not open the link or install any app from it.",
        "Verify the request through the organisation's official app or website.",
        "Block and report the sender if the message is unsolicited.",
    ],
    ScamCategory.KYC_SCAM: [
        "Do not use the link or number in the message.",
        "Check your account only through the official bank or telecom app.",
        "If you entered banking details or lost money, call 1930 immediately.",
    ],
    ScamCategory.UPI_FRAUD: [
        "Do not approve collect requests or send money to verify an account.",
        "Open your payment app directly to check your account status.",
        "If money was lost, call 1930 immediately and notify your bank.",
    ],
}

GENERIC_ACTIONS = [
    "Do not act on the message until you verify it through an official channel.",
    "Do not share passwords, OTPs, PINs, CVVs, or banking details.",
    "Block and report the sender if the message was unsolicited or misleading.",
]


class RuleBasedFallbackAnalyzer:
    """A transparent, deliberately conservative offline safety net.

    It exists for degraded service only. It does not look up URLs or claim that a
    real-world sender is malicious.
    """

    def analyze(self, message: str) -> AnalysisResponse:
        score = 0
        category_points: Counter[ScamCategory] = Counter()
        tactics: list[PsychologicalTactic] = []
        flags: list[RedFlag] = []
        seen_phrases: set[str] = set()

        for rule in RULES:
            match = re.search(rule.pattern, message, flags=re.IGNORECASE | re.DOTALL)
            if not match:
                continue
            phrase = match.group(0).strip()
            phrase_key = phrase.casefold()
            score += rule.points
            category_points[rule.category] += rule.points
            if rule.tactic and rule.tactic not in tactics:
                tactics.append(rule.tactic)
            if phrase_key not in seen_phrases and len(flags) < 6:
                flags.append(RedFlag(phrase=phrase, explanation=rule.explanation))
                seen_phrases.add(phrase_key)

        url_match = URL_PATTERN.search(message)
        if url_match and score >= 18:
            phrase = url_match.group(0).strip(".,;:!?)]")
            if phrase and phrase.casefold() not in seen_phrases and len(flags) < 6:
                flags.append(
                    RedFlag(
                        phrase=phrase,
                        explanation="Use official apps or typed-in official websites instead of unexpected message links.",
                    )
                )
                category_points[ScamCategory.PHISHING_LINK] += 12
                score += 12

        category = category_points.most_common(1)[0][0] if category_points else ScamCategory.UNKNOWN
        if score >= 55:
            verdict = Verdict.SCAM
            severity = Severity.HIGH
            confidence = min(96, 62 + score // 2)
        elif score >= 24:
            verdict = Verdict.SUSPICIOUS
            severity = Severity.MEDIUM
            confidence = min(82, 48 + score)
        else:
            verdict = Verdict.SAFE
            severity = Severity.LOW
            confidence = 62

        if verdict == Verdict.SCAM:
            hindi = "इस संदेश में धोखाधड़ी के कई संकेत हैं। कोई लिंक न खोलें और कोई OTP या बैंक जानकारी साझा न करें।"
        elif verdict == Verdict.SUSPICIOUS:
            hindi = "यह संदेश संदिग्ध लग रहा है। कार्रवाई करने से पहले आधिकारिक ऐप या वेबसाइट से इसकी पुष्टि करें।"
        else:
            hindi = "इस संदेश में स्पष्ट धोखाधड़ी के संकेत नहीं मिले, फिर भी पैसे या निजी जानकारी से जुड़े अनुरोध की आधिकारिक माध्यम से पुष्टि करें।"

        return AnalysisResponse(
            verdict=verdict,
            confidence=confidence,
            scam_category=category,
            severity=severity,
            psychological_tactics=tactics,
            red_flags=flags,
            action_steps=DEFAULT_ACTIONS.get(category, GENERIC_ACTIONS),
            hindi_summary=hindi,
            safe_explanation=(
                "No strong scam signals were found by the limited offline checks. This is not a guarantee of legitimacy."
                if verdict == Verdict.SAFE
                else None
            ),
            analysis_source=AnalysisSource.RULE_FALLBACK,
            model_used=None,
            notice="Limited offline analysis was used because live AI analysis is unavailable.",
        )
