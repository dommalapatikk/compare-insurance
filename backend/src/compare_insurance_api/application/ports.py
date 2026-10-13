"""Ports implemented by infrastructure adapters."""

from collections.abc import Sequence
from typing import Protocol

from compare_insurance_api.domain.models import (
    PremiumLocation,
    PremiumOffer,
    SearchCriteria,
)


class PremiumRepository(Protocol):
    async def find_matching(
        self,
        criteria: SearchCriteria,
    ) -> Sequence[PremiumOffer]:
        """Return source-backed offers eligible for the confirmed criteria."""


class LocationRepository(Protocol):
    async def search(
        self,
        query: str,
        *,
        limit: int,
    ) -> Sequence[PremiumLocation]:
        """Return official postcode/municipality matches for a user query."""


class InsuranceGuide(Protocol):
    async def reply(self, *, message: str, thread_id: str) -> str:
        """Explain insurance concepts without determining premium results."""

