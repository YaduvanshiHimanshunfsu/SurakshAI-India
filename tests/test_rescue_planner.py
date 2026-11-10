from app.schemas import ExposureState, RescueRequest, RescueUrgency, ScamCategory, Verdict
from app.services.rescue_planner import RescuePlanner


def test_received_only_returns_preventive_actions() -> None:
    plan = RescuePlanner().create_plan(
        RescueRequest(
            exposure_state=ExposureState.RECEIVED_ONLY,
            verdict=Verdict.SCAM,
            scam_category=ScamCategory.KYC_SCAM,
        )
    )

    assert plan.urgency == RescueUrgency.PREVENTIVE
    assert any("Do not reply" in action.instruction for action in plan.actions)
    assert not any("1930" in action.instruction for action in plan.actions)


def test_sent_money_returns_critical_1930_and_ncrp_actions() -> None:
    plan = RescuePlanner().create_plan(
        RescueRequest(
            exposure_state=ExposureState.SENT_MONEY,
            verdict=Verdict.SCAM,
            scam_category=ScamCategory.UPI_FRAUD,
        )
    )

    assert plan.urgency == RescueUrgency.CRITICAL
    assert "1930" in plan.actions[0].instruction
    assert any(action.official_url == "https://cybercrime.gov.in/" for action in plan.actions)
    assert any("transaction ID" in item for item in plan.evidence_to_preserve)


def test_recovery_plan_never_requests_a_secret() -> None:
    plan = RescuePlanner().create_plan(
        RescueRequest(
            exposure_state=ExposureState.SHARED_SECRET,
            verdict=Verdict.SUSPICIOUS,
        )
    )

    text = " ".join(action.instruction for action in plan.actions).lower()
    assert "tell us" not in text
    assert "send us" not in text
    assert "upload it" not in text
    assert "enter your otp" not in text
    assert "share your otp" not in text
