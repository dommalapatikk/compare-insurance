import asyncio

import pytest

from compare_insurance_api.application.use_cases import SearchLocations
from compare_insurance_api.domain.models import DomainValidationError, PremiumLocation


class StubLocationRepository:
    def __init__(self) -> None:
        self.calls: list[tuple[str, int]] = []

    async def search(self, query: str, *, limit: int):
        self.calls.append((query, limit))
        return (
            PremiumLocation(
                postal_code="3011",
                locality="Bern",
                municipality_id="351",
                municipality_name="Bern",
                canton="BE",
                premium_region="1",
            ),
        )


def test_search_locations_normalizes_query_and_delegates() -> None:
    repository = StubLocationRepository()
    use_case = SearchLocations(repository)

    result = asyncio.run(use_case.execute("  3011  ", limit=6))

    assert result[0].label == "3011 Bern, BE"
    assert repository.calls == [("3011", 6)]


def test_search_locations_rejects_short_query() -> None:
    use_case = SearchLocations(StubLocationRepository())

    with pytest.raises(DomainValidationError, match="at least 2"):
        asyncio.run(use_case.execute("3"))
