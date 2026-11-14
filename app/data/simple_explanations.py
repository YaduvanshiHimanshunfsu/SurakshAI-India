from __future__ import annotations

from app.schemas import ScamCategory

CATEGORY_EXPLANATIONS: dict[ScamCategory, tuple[str, str, str]] = {
    ScamCategory.OTP_THEFT: ("Someone may be trying to take your OTP or another code that can approve access or a payment.", "Koi aapse OTP ya aisa code lene ki koshish kar raha hai jo access ya payment approve kar sakta hai.", "Koi aapse OTP ya code lene ki koshish kar raha hai jisse access ya payment ho sakta hai."),
    ScamCategory.UPI_FRAUD: ("Someone may be trying to make you pay or approve a request when you expect to receive money.", "Koi aapse payment ya request approve karwane ki koshish kar raha hai, jabki aap paise paane ki ummeed kar rahe hain.", "Koi aapse payment ya collect request approve karwana chahta hai jab aap paise receive karne ki soch rahe hain."),
    ScamCategory.KYC_SCAM: ("Someone may be using a KYC warning to make you act before you can check the truth.", "Koi KYC warning ka use karke aapse jaldi mein galti karwana chahta hai.", "KYC ke naam par aapse jaldi decision karwane ki koshish ho rahi hai."),
    ScamCategory.TECH_SUPPORT: ("Someone may be trying to see your screen or control your device.", "Koi aapki screen dekhne ya device control karne ki koshish kar sakta hai.", "Koi aapka phone screen dekhne ya control karne ki koshish kar raha ho sakta hai."),
}

DEFAULT_EXPLANATION = (
    "This message may be trying to make you act quickly before you can check the truth.",
    "Yeh message aapko jaldi mein action lene par majboor kar sakta hai, bina sach check kiye.",
    "Yeh message aapko jaldi decision lene ke liye pressure kar raha ho sakta hai.",
)
