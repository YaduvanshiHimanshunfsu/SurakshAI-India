from __future__ import annotations

"""Reviewed offline scam-signal rules used when live AI is unavailable.

These rules are a safety net, not a claim that a sender is criminal. Each rule
is intentionally explainable, version-controlled, and limited to observable
message patterns so SurakshAI remains useful during an AI-provider outage.
"""

from dataclasses import dataclass

from app.schemas import PsychologicalTactic, ScamCategory


@dataclass(frozen=True)
class ScamSignalRule:
    pattern: str
    category: ScamCategory
    risk_weight: int
    simple_explanation: str
    hindi_explanation: str
    safe_action: str
    tactic: PsychologicalTactic | None = None


SCAM_SIGNAL_RULES: tuple[ScamSignalRule, ...] = (
    ScamSignalRule(r"\b(?:kyc|verify (?:your )?account|update (?:your )?details)\b", ScamCategory.KYC_SCAM, 22, "Unexpected account verification can be used to steal details.", "अचानक KYC या अकाउंट वेरिफिकेशन का संदेश धोखाधड़ी हो सकता है।", "Open the official bank or telecom app yourself; do not use this message's link.", PsychologicalTactic.AUTHORITY_IMPERSONATION),
    ScamSignalRule(r"\b(?:blocked?|suspend(?:ed)?|service (?:will be )?stop(?:ped)?)\b", ScamCategory.KYC_SCAM, 24, "A threat to block an account is meant to create fear.", "खाता बंद होने की धमकी देकर डराया जा रहा है।", "Do not rush. Check the account only in the official app.", PsychologicalTactic.FEAR_INDUCTION),
    ScamSignalRule(r"\b(?:within|in)\s+(?:\d+|one|two|24)\s*(?:hours?|hrs?)\b|\b(?:urgent|immediately|last date|today only)\b", ScamCategory.UNKNOWN, 18, "Pressure to act quickly can stop you from checking safely.", "जल्दी करने का दबाव आपको जांच करने से रोक सकता है।", "Pause and verify through an independently known official channel.", PsychologicalTactic.FALSE_URGENCY),
    ScamSignalRule(r"\b(?:share|send|tell|provide|give)\b.{0,35}\b(?:otp|one[ -]?time password|cvv|pin|password)\b", ScamCategory.OTP_THEFT, 62, "A real bank or payment app will not ask you to reveal an OTP, PIN, CVV, or password.", "बैंक या पेमेंट ऐप आपसे OTP, PIN, CVV या पासवर्ड नहीं मांगता।", "End the conversation. Do not share any security secret.", PsychologicalTactic.OTP_SOCIAL_ENGINEERING),
    ScamSignalRule(r"\b(?:upi|gpay|phonepe|paytm)\b.{0,55}\b(?:collect|request|approve|pin|receive money|refund)\b", ScamCategory.UPI_FRAUD, 44, "A UPI collect request or PIN can make you pay; receiving money does not need a PIN.", "पैसे पाने के लिए UPI PIN नहीं डालना पड़ता; collect request मंजूर करने से भुगतान हो सकता है।", "Do not approve the request or enter your UPI PIN.", PsychologicalTactic.OTP_SOCIAL_ENGINEERING),
    ScamSignalRule(r"\b(?:scan|qr code|qr)\b.{0,55}\b(?:receive|refund|cashback|money|payment|pin)\b", ScamCategory.UPI_FRAUD, 38, "A QR code can start a payment. It is not needed to receive money.", "QR कोड स्कैन करने से भुगतान शुरू हो सकता है; पैसे पाने के लिए QR स्कैन नहीं करना पड़ता।", "Do not scan the QR code or enter a UPI PIN.", PsychologicalTactic.TOO_GOOD_TO_BE_TRUE),
    ScamSignalRule(r"\b(?:anydesk|teamviewer|quicksupport|remote access|screen share|share screen)\b", ScamCategory.TECH_SUPPORT, 48, "Remote-access apps can let a stranger view or control your device.", "रिमोट एक्सेस ऐप से कोई आपके फोन को देख या कंट्रोल कर सकता है।", "Do not install the app or share your screen; disconnect if access was already given.", PsychologicalTactic.AUTHORITY_IMPERSONATION),
    ScamSignalRule(r"\b(?:won|winner|lucky draw|kbc|lottery|prize)\b", ScamCategory.LOTTERY_PRIZE, 32, "Unexpected prizes are commonly used to demand money or personal details.", "अचानक इनाम या लॉटरी का संदेश अक्सर धोखाधड़ी होता है।", "Do not pay a fee or share details to claim a prize.", PsychologicalTactic.TOO_GOOD_TO_BE_TRUE),
    ScamSignalRule(r"\b(?:processing fee|registration fee|claim fee|pay.{0,18}(?:fee|charge))\b", ScamCategory.LOTTERY_PRIZE, 34, "A small fee to unlock a large reward is a common scam pattern.", "बड़े इनाम के लिए छोटी फीस मांगना आम धोखाधड़ी का तरीका है।", "Do not pay a fee to receive a prize, refund, or job.", PsychologicalTactic.PROCESSING_FEE_TRAP),
    ScamSignalRule(r"\b(?:work from home|youtube videos?|like videos?|data entry|earn.{0,25}(?:per hour|daily)|task job)\b", ScamCategory.FAKE_JOB, 32, "Easy-income task offers can turn into payment or deposit scams.", "आसान कमाई या task job के नाम पर पैसे मांगे जा सकते हैं।", "Do not pay a deposit or move the conversation to an unknown app.", PsychologicalTactic.TOO_GOOD_TO_BE_TRUE),
    ScamSignalRule(r"\b(?:telegram|trading group|guaranteed returns?|95% accurate|crypto signals?|double your money)\b", ScamCategory.INVESTMENT_FRAUD, 34, "Guaranteed returns and exclusive groups are high-risk investment signals.", "गारंटीड रिटर्न और secret trading group निवेश धोखाधड़ी के संकेत हैं।", "Do not transfer money for guaranteed returns.", PsychologicalTactic.SOCIAL_PROOF_FABRICATION),
    ScamSignalRule(r"\b(?:pm kisan|pm awas|aadhaar|epfo|income tax refund|rbi|uidai)\b", ScamCategory.GOVERNMENT_IMPERSONATION, 22, "Government names can be copied to gain trust.", "सरकारी नाम का उपयोग भरोसा जीतने के लिए किया जा सकता है।", "Verify only through the official government website or app.", PsychologicalTactic.AUTHORITY_IMPERSONATION),
    ScamSignalRule(r"\b(?:customs|courier|parcel|fedex|package|delivery).{0,45}\b(?:held|duty|charge|release|police case)\b", ScamCategory.COURIER_SCAM, 30, "Unexpected parcel or customs charges should be verified independently.", "कूरियर या कस्टम शुल्क का अचानक संदेश जांचे बिना न मानें।", "Use the courier's official tracking website, not the message link.", PsychologicalTactic.FEAR_INDUCTION),
    ScamSignalRule(r"\b(?:customer care|helpline|support number).{0,45}\b(?:bank|upi|paytm|phonepe|amazon|microsoft)\b", ScamCategory.TECH_SUPPORT, 30, "Search-result and message customer-care numbers can be fake.", "मैसेज या search result में मिला customer care नंबर नकली हो सकता है।", "Call only the number shown in the official app or official website.", PsychologicalTactic.AUTHORITY_IMPERSONATION),
    ScamSignalRule(r"\b(?:love you|romance|dating|gift|parcel).{0,80}\b(?:customs|fee|money|bitcoin|crypto)\b", ScamCategory.ROMANCE_SCAM, 34, "A new online relationship asking for money or fees is high risk.", "ऑनलाइन रिश्ते में पैसे या फीस मांगना जोखिम का संकेत है।", "Do not send money or identity documents to an online contact.", PsychologicalTactic.RECIPROCITY_TRAP),
    ScamSignalRule(r"\b(?:sextortion|nude|private video|viral video|send money or)\b", ScamCategory.ROMANCE_SCAM, 48, "Threats to publish private content are used to force payment.", "निजी सामग्री फैलाने की धमकी देकर पैसे मांगना ब्लैकमेल है।", "Do not pay or continue the chat; preserve evidence and report it.", PsychologicalTactic.FEAR_INDUCTION),
    ScamSignalRule(r"\b(?:click (?:here|this link)|open (?:this )?link|wa\.me/|bit\.ly/)\b", ScamCategory.PHISHING_LINK, 18, "Unexpected links can lead to fake login or payment pages.", "अनजान लिंक नकली login या payment page पर ले जा सकता है।", "Do not open the link; type the official website yourself.", PsychologicalTactic.FALSE_URGENCY),
)


DEFAULT_ACTIONS: dict[ScamCategory, list[str]] = {
    ScamCategory.OTP_THEFT: ["Do not share any OTP, PIN, CVV, password, or screen-sharing code.", "End the conversation and contact the company through its official app or website.", "If you shared details or lost money, call 1930 immediately."],
    ScamCategory.PHISHING_LINK: ["Do not open the link or install any app from it.", "Verify the request through the organisation's official app or website.", "Block and report the sender if the message is unsolicited."],
    ScamCategory.KYC_SCAM: ["Do not use the link or number in the message.", "Check your account only through the official bank or telecom app.", "If you entered banking details or lost money, call 1930 immediately."],
    ScamCategory.UPI_FRAUD: ["Do not approve collect requests or send money to verify an account.", "Open your payment app directly to check your account status.", "If money was lost, call 1930 immediately and notify your bank."],
}

GENERIC_ACTIONS = ["Do not act on the message until you verify it through an official channel.", "Do not share passwords, OTPs, PINs, CVVs, or banking details.", "Block and report the sender if the message was unsolicited or misleading."]
