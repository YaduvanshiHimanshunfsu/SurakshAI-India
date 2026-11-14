"""Reviewed, domain-level descriptions for a small set of public official sites.

These profiles intentionally identify only an exact registered domain.  They do
not validate a particular page, account, campaign, download, or request on that
domain.  Unknown domains receive a transparent "not in directory" profile.
"""

KNOWN_SITES: dict[str, dict[str, str]] = {
    "google.com": {"name": "Google", "description": "Official domain used for Google search and Google services."},
    "unicef.org": {"name": "UNICEF", "description": "Official domain for the United Nations Children’s Fund (UNICEF)."},
    "cybercrime.gov.in": {"name": "National Cyber Crime Reporting Portal", "description": "Official Indian government portal for cybercrime reporting guidance and complaints."},
    "rbi.org.in": {"name": "Reserve Bank of India", "description": "Official domain of the Reserve Bank of India."},
    "uidai.gov.in": {"name": "UIDAI", "description": "Official domain of the Unique Identification Authority of India."},
    "incometax.gov.in": {"name": "Income Tax Department", "description": "Official domain for India’s Income Tax Department services."},
    "epfindia.gov.in": {"name": "EPFO", "description": "Official domain of the Employees’ Provident Fund Organisation."},
    "sbi.co.in": {"name": "State Bank of India", "description": "Official domain of State Bank of India."},
    "hdfcbank.com": {"name": "HDFC Bank", "description": "Official domain of HDFC Bank."},
    "icicibank.com": {"name": "ICICI Bank", "description": "Official domain of ICICI Bank."},
    "axisbank.com": {"name": "Axis Bank", "description": "Official domain of Axis Bank."},
    "phonepe.com": {"name": "PhonePe", "description": "Official domain for PhonePe services."},
    "paytm.com": {"name": "Paytm", "description": "Official domain for Paytm services."},
    "amazon.in": {"name": "Amazon India", "description": "Official domain for Amazon India services."},
    "microsoft.com": {"name": "Microsoft", "description": "Official domain used for Microsoft products and services."},
}
