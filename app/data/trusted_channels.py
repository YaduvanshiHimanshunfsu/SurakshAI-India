from __future__ import annotations

from app.schemas import TrustedChannel

# Links are first-party Indian public service or service-provider destinations.
# Never put crowdsourced "customer-care" phone numbers in this directory.
TRUSTED_CHANNELS: tuple[TrustedChannel, ...] = (
    TrustedChannel(category="Financial cyber fraud", title="National Cyber Crime Reporting Portal", official_url="https://cybercrime.gov.in/", phone="1930", instruction="For a suspected financial cyber-fraud loss, call 1930 promptly and file a report at cybercrime.gov.in using a device you trust."),
    TrustedChannel(category="Bank and payment safety", title="Your bank or payment app", official_url=None, phone=None, instruction="Open the official bank or payment app yourself, or use the number printed on your card or statement. Never use a number from a suspicious message."),
    TrustedChannel(category="SIM loss or SIM fraud", title="Sanchar Saathi", official_url="https://sancharsaathi.gov.in/", phone=None, instruction="Use the official Sanchar Saathi portal and your telecom provider's known support channel for SIM-related safety steps."),
    TrustedChannel(category="Remote-access or screen-sharing app", title="Device safety", official_url=None, phone=None, instruction="Disconnect the app or screen share, uninstall the remote-access app, change important passwords from a trusted device, and contact your bank through its official app if money or banking access was involved."),
    TrustedChannel(category="Email phishing", title="Account recovery", official_url=None, phone=None, instruction="Open the affected email or social-media service by typing its known website or using its official app. Change the password there and enable two-step verification."),
    TrustedChannel(category="Identity documents", title="UIDAI", official_url="https://uidai.gov.in/", phone=None, instruction="For Aadhaar-related claims, start from uidai.gov.in directly. Do not share an OTP received for an unexpected request."),
    TrustedChannel(category="Family support", title="Support a stressed family member", official_url=None, phone=None, instruction="Pause the payment or conversation, sit with a trusted person, and use only independently known official channels. Do not share card numbers, passwords, PINs, or OTPs with anyone."),
)
