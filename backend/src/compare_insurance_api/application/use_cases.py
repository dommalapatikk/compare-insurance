"""Application orchestration around the pure domain model."""

from dataclasses import dataclass

from compare_insurance_api.application.ports import (
    ChatHistoryMessage,
    GuideReply,
    InsuranceGuide,
    LocationRepository,
    PremiumRepository,
)
from compare_insurance_api.domain.models import (
    DomainValidationError,
    PremiumLocation,
    PremiumOffer,
    RankedPremiumOffer,
    SearchCriteria,
)
from compare_insurance_api.domain.services import (
    cheapest_offers_by_deductible,
    cheapest_offers_by_deductible_and_model,
    cheapest_offers_by_model,
    rank_premium_offers,
)


@dataclass(frozen=True, slots=True)
class PremiumComparison:
    criteria: SearchCriteria
    total_eligible_offers: int
    offers: tuple[RankedPremiumOffer, ...]
    cheapest_by_deductible: tuple[PremiumOffer, ...]
    cheapest_by_model: tuple[PremiumOffer, ...]
    cheapest_by_deductible_and_model: tuple[PremiumOffer, ...]


class ComparePremiums:
    """Fetch eligible offers, then apply deterministic domain ranking."""

    def __init__(self, repository: PremiumRepository) -> None:
        self._repository = repository

    async def execute(self, criteria: SearchCriteria) -> PremiumComparison:
        eligible_offers = tuple(await self._repository.find_matching(criteria))
        ranked = rank_premium_offers(
            eligible_offers,
            top_n=criteria.top_n,
            reference_monthly_premium_chf=criteria.reference_monthly_premium_chf,
        )
        return PremiumComparison(
            criteria=criteria,
            total_eligible_offers=len(eligible_offers),
            offers=ranked,
            cheapest_by_deductible=cheapest_offers_by_deductible(eligible_offers),
            cheapest_by_model=cheapest_offers_by_model(eligible_offers),
            cheapest_by_deductible_and_model=(
                cheapest_offers_by_deductible_and_model(eligible_offers)
            ),
        )


class SearchLocations:
    """Validate a customer query before searching the official location catalogue."""

    def __init__(self, repository: LocationRepository) -> None:
        self._repository = repository

    async def execute(
        self,
        query: str,
        *,
        limit: int = 8,
    ) -> tuple[PremiumLocation, ...]:
        normalized_query = " ".join(query.split())
        if len(normalized_query) < 2:
            raise DomainValidationError("location query must contain at least 2 characters")
        if not 1 <= limit <= 20:
            raise DomainValidationError("location result limit must be between 1 and 20")
        return tuple(await self._repository.search(normalized_query, limit=limit))


class ExplainInsuranceChoices:
    """Delegate explanatory conversation through a replaceable guide port."""

    def __init__(self, guide: InsuranceGuide) -> None:
        self._guide = guide

    async def execute(
        self,
        *,
        message: str,
        thread_id: str,
        history: tuple[ChatHistoryMessage, ...] = (),
    ) -> GuideReply:
        bounded_history = tuple(history[-12:])
        return await self._guide.reply(
            message=message,
            thread_id=thread_id,
            history=bounded_history,
        )


