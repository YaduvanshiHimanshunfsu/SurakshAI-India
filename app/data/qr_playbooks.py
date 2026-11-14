from __future__ import annotations

UPI_ACTIONS = (
    "Do not enter your UPI PIN to receive money.",
    "Do not approve a collect request just to receive money.",
    "Verify the payee in your own UPI app before any payment.",
)

URL_ACTIONS = (
    "Do not sign in or pay through the QR link yet.",
    "Open the official app or type a known website address yourself.",
    "Preserve the QR as evidence if it came with a suspicious request.",
)

UNKNOWN_ACTIONS = (
    "Do not enter passwords, OTPs, or a UPI PIN.",
    "Ask the sender for an independently verifiable explanation.",
    "Keep the QR image as evidence if the request felt suspicious.",
)
