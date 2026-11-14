from __future__ import annotations

"""Reviewed, deterministic advice for the immediate decision a person faces."""

from dataclasses import dataclass

from app.schemas import SafeAction, SafetyDecision


@dataclass(frozen=True)
class DecisionPlaybook:
    decision: SafetyDecision
    title: str
    simple_explanation: str
    hindi_explanation: str
    hinglish_explanation: str
    steps: tuple[str, ...]


STOP_ACTIONS: dict[SafeAction, DecisionPlaybook] = {
    SafeAction.SHARE_OTP: DecisionPlaybook(SafetyDecision.STOP_NOW, "Do not share an OTP", "A real bank or payment app will not ask you to reveal an OTP.", "OTP kisi ko bhi na batayein.", "OTP kabhi share mat kijiye. Bank ya payment app aapse OTP nahi maangta.", ("End the conversation.", "Open the official bank or payment app yourself.")),
    SafeAction.PAY_MONEY: DecisionPlaybook(SafetyDecision.STOP_NOW, "Do not pay from this message", "Pressure, threats, or an unexpected payment request are common scam tactics.", "Message ke pressure mein paise na bhejein.", "Message ke pressure mein payment mat kijiye; pehle independently verify kijiye.", ("Do not send money or approve a collect request.", "Verify through the official app or a number you already know.")),
    SafeAction.INSTALL_APP: DecisionPlaybook(SafetyDecision.STOP_NOW, "Do not install an app for this caller", "Remote-access and screen-sharing apps can let a scammer see your screen or control your device.", "Caller ke kehne par app install na karein.", "Caller ke bolne par remote ya screen-share app install mat kijiye.", ("Do not install or open the app.", "If already installed, disconnect it and change important passwords from a trusted device.")),
    SafeAction.SCAN_OR_PAY_QR: DecisionPlaybook(SafetyDecision.STOP_NOW, "Do not scan or pay yet", "Scanning a payment QR normally starts a payment. Receiving money never needs your UPI PIN.", "Paise paane ke liye UPI PIN nahi dalna hota.", "Paise receive karne ke liye QR scan ya UPI PIN ki zarurat nahi hoti.", ("Do not enter your UPI PIN.", "Do not approve a collect request to receive money.")),
}

VERIFY_ACTIONS: dict[SafeAction, DecisionPlaybook] = {
    SafeAction.CLICK_LINK: DecisionPlaybook(SafetyDecision.VERIFY_FIRST, "Do not open this link yet", "A link can lead to a fake login or payment page. Use the official app or type the address yourself.", "Link kholne se pehle independently verify karein.", "Link par click karne se pehle official app ya website ko khud open karke verify kijiye.", ("Do not sign in through the link.", "Open the official app or type its known website address yourself.")),
    SafeAction.CALL_NUMBER: DecisionPlaybook(SafetyDecision.VERIFY_FIRST, "Do not call the number in the message", "A familiar name does not make a phone number official. Find the number independently.", "Message mein diya number call na karein.", "Message mein diya number use mat kijiye; official website ya app se number dhoondhiye.", ("Do not call or WhatsApp this number.", "Use an official website, app, or statement you already trust.")),
    SafeAction.OPEN_ATTACHMENT: DecisionPlaybook(SafetyDecision.VERIFY_FIRST, "Do not open the attachment yet", "Unexpected attachments can contain harmful files or lead to a fake sign-in page.", "Unknown attachment kholne se pehle verify karein.", "Unexpected attachment ko pehle verify kiye bina open mat kijiye.", ("Do not download or enable macros.", "Verify the sender through a known official channel.")),
}
