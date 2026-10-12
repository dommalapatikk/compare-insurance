"""Ports implemented by infrastructure adapters."""

from collections.abc import Sequence
from typing import Protocol

from compare_insurance_api.domain.models import PremiumOffer, SearchCriteria


class PremiumRepository(Protocol):
    async def find_matching(
        self,
        criteria: SearchCriteria,
    ) -> Sequence[PremiumOffer]:
        """Return source-backed offers eligible for the confirmed criteria."""


class InsuranceGuide(Protocol):
    async def reply(self, *, message: str, thread_id: str) -> str:
        """Explain insurance concepts without determining premium results."""

