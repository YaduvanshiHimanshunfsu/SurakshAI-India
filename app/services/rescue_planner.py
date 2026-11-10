from __future__ import annotations

"""Generate reviewed emergency guidance without relying on an LLM."""

from app.data.recovery_playbooks import LIMITATIONS, PLAYBOOKS
from app.schemas import RescuePlan, RescueRequest


class RescuePlanner:
    """Maps a user's reported exposure to a deterministic recovery playbook."""

    def create_plan(self, request: RescueRequest) -> RescuePlan:
        urgency, title, actions, evidence = PLAYBOOKS[request.exposure_state]
        return RescuePlan(
            urgency=urgency,
            title=title,
            actions=list(actions),
            evidence_to_preserve=list(evidence),
            limitations=list(LIMITATIONS),
        )
