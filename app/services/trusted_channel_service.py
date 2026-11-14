from __future__ import annotations

from app.data.trusted_channels import TRUSTED_CHANNELS
from app.schemas import TrustedChannel


class TrustedChannelService:
    def list_channels(self) -> list[TrustedChannel]:
        return list(TRUSTED_CHANNELS)
