from __future__ import annotations

import re
from collections import Counter
from app.data.scam_rules import DEFAULT_ACTIONS, GENERIC_ACTIONS, SCAM_SIGNAL_RULES
from app.schemas import (
    AnalysisResponse,
    AnalysisSource,
    PsychologicalTactic,
    RedFlag,
    ScamCategory,
    Severity,
    Verdict,
)


URL_PATTERN = re.compile(r"(?:https?://|www\.)\S+|\b[a-z0-9][a-z0-9-]{1,62}\.(?:com|in|net|org|co|xyz)(?:/\S*)?", re.I)


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

        matched_actions: list[str] = []
        hindi_reason: str | None = None
        for rule in SCAM_SIGNAL_RULES:
            match = re.search(rule.pattern, message, flags=re.IGNORECASE | re.DOTALL)
            if not match:
                continue
            phrase = match.group(0).strip()
            phrase_key = phrase.casefold()
            score += rule.risk_weight
            category_points[rule.category] += rule.risk_weight
            if rule.tactic and rule.tactic not in tactics:
                tactics.append(rule.tactic)
            if phrase_key not in seen_phrases and len(flags) < 6:
                flags.append(RedFlag(phrase=phrase, explanation=rule.simple_explanation))
                seen_phrases.add(phrase_key)
            if rule.safe_action not in matched_actions:
                matched_actions.append(rule.safe_action)
            hindi_reason = hindi_reason or rule.hindi_explanation

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
            hindi = hindi_reason or "इस संदेश में धोखाधड़ी के कई संकेत हैं। कोई लिंक न खोलें और कोई OTP या बैंक जानकारी साझा न करें।"
        elif verdict == Verdict.SUSPICIOUS:
            hindi = "यह संदेश संदिग्ध लग रहा है। कार्रवाई करने से पहले आधिकारिक ऐप या वेबसाइट से इसकी पुष्टि करें।"
        else:
            hindi = "इस संदेश में स्पष्ट धोखाधड़ी के संकेत नहीं मिले, फिर भी पैसे या निजी जानकारी से जुड़े अनुरोध की आधिकारिक माध्यम से पुष्टि करें।"

        # Keep the advice short, but de-duplicate a matched instruction before
        # trimming so the urgent 1930 guidance is not accidentally displaced.
        action_steps: list[str] = []
        for action in matched_actions + DEFAULT_ACTIONS.get(category, GENERIC_ACTIONS):
            if action not in action_steps:
                action_steps.append(action)
        if verdict == Verdict.SCAM:
            urgent_actions = [action for action in action_steps if "1930" in action]
            non_urgent_actions = [action for action in action_steps if "1930" not in action]
            # Retain a concise prevention action and surface the official fraud
            # channel rather than burying it behind near-duplicate advice.
            action_steps = non_urgent_actions[:2] + urgent_actions[:1] if urgent_actions else non_urgent_actions

        return AnalysisResponse(
            verdict=verdict,
            confidence=confidence,
            scam_category=category,
            severity=severity,
            psychological_tactics=tactics,
            red_flags=flags,
            action_steps=action_steps[:3],
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
