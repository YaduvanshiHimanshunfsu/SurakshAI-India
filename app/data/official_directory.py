from __future__ import annotations

"""Reviewed public verification destinations; never treat a message contact as official."""

from dataclasses import dataclass


@dataclass(frozen=True)
class OfficialDirectoryEntry:
    name: str
    aliases: tuple[str, ...]
    official_domains: tuple[str, ...]
    safe_instruction: str


OFFICIAL_DIRECTORY: tuple[OfficialDirectoryEntry, ...] = (
    OfficialDirectoryEntry("State Bank of India", ("sbi", "state bank"), ("sbi.co.in",), "Open the official SBI app or type sbi.co.in yourself; do not use the message contact."),
    OfficialDirectoryEntry("HDFC Bank", ("hdfc", "hdfc bank"), ("hdfcbank.com",), "Open the official HDFC Bank app or type hdfcbank.com yourself; do not use the message contact."),
    OfficialDirectoryEntry("ICICI Bank", ("icici", "icici bank"), ("icicibank.com",), "Open the official ICICI Bank app or type icicibank.com yourself; do not use the message contact."),
    OfficialDirectoryEntry("Axis Bank", ("axis bank",), ("axisbank.com",), "Open the official Axis Bank app or type axisbank.com yourself; do not use the message contact."),
    OfficialDirectoryEntry("Reserve Bank of India", ("rbi", "reserve bank"), ("rbi.org.in",), "Use rbi.org.in directly. RBI does not ask consumers to share banking secrets."),
    OfficialDirectoryEntry("UIDAI", ("uidai", "aadhaar", "aadhar"), ("uidai.gov.in",), "Use uidai.gov.in directly for Aadhaar services; never share OTPs from a message."),
    OfficialDirectoryEntry("Income Tax Department", ("income tax", "itr refund"), ("incometax.gov.in",), "Use incometax.gov.in directly to check any refund or notice."),
    OfficialDirectoryEntry("EPFO", ("epfo", "pf account"), ("epfindia.gov.in",), "Use epfindia.gov.in directly for provident-fund information."),
    OfficialDirectoryEntry("India Post", ("india post", "speed post"), ("indiapost.gov.in",), "Use indiapost.gov.in directly to check a parcel; do not pay through a message link."),
    OfficialDirectoryEntry("Police or cybercrime authority", ("police", "cyber police", "crime branch"), ("cybercrime.gov.in",), "Do not trust a number in the message. Find your local police contact independently or use cybercrime.gov.in."),
    OfficialDirectoryEntry("Telecom or KYC claim", ("sim blocked", "sim block", "telecom kyc", "kyc update"), ("sancharsaathi.gov.in",), "Use your telecom provider's official app or website. Do not share an OTP or install an app for a caller."),
    OfficialDirectoryEntry("National Cyber Crime Reporting Portal", ("cybercrime", "ncrp", "1930"), ("cybercrime.gov.in",), "For financial cyber fraud, call 1930 promptly and use cybercrime.gov.in directly."),
)
