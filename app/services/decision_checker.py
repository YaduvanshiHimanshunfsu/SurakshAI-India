from __future__ import annotations

from app.data.decision_playbooks import STOP_ACTIONS, VERIFY_ACTIONS
from app.schemas import SafeAction, SafeNextStepRequest, SafeNextStepResponse, SafetyDecision, Verdict


class DecisionChecker:
    """Returns reviewed safety advice; it never asks for or evaluates secrets."""

    def check(self, request: SafeNextStepRequest) -> SafeNextStepResponse:
        if request.action in STOP_ACTIONS:
            playbook = STOP_ACTIONS[request.action]
        elif request.verdict in {Verdict.SCAM, Verdict.SUSPICIOUS}:
            playbook = VERIFY_ACTIONS[request.action]
        else:
            playbook = VERIFY_ACTIONS[request.action]
            return SafeNextStepResponse(
                decision=SafetyDecision.LOWER_RISK_STILL_VERIFY,
                title="Lower risk, still verify independently",
                simple_explanation="There is no obvious scam warning here, but unexpected links, calls, and attachments should still be independently verified.",
                hindi_explanation="Koi saaf scam signal nahi mila, phir bhi independently verify karein.",
                hinglish_explanation="Clear scam signal nahi hai, phir bhi official channel se independently verify kijiye.",
                steps=list(playbook.steps),
            )
        return SafeNextStepResponse(
            decision=playbook.decision,
            title=playbook.title,
            simple_explanation=playbook.simple_explanation,
            hindi_explanation=playbook.hindi_explanation,
            hinglish_explanation=playbook.hinglish_explanation,
            steps=list(playbook.steps),
        )
