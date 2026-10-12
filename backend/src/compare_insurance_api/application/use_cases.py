"""Application orchestration around the pure domain model."""

from dataclasses import dataclass

from compare_insurance_api.application.ports import InsuranceGuide, PremiumRepository
from compare_insurance_api.domain.models import RankedPremiumOffer, SearchCriteria
from compare_insurance_api.domain.services import rank_premium_offers


@dataclass(frozen=True, slots=True)
class PremiumComparison:
    criteria: SearchCriteria
    total_eligible_offers: int
    offers: tuple[RankedPremiumOffer, ...]


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
        )


class ExplainInsuranceChoices:
    """Delegate explanatory conversation through a replaceable guide port."""

    def __init__(self, guide: InsuranceGuide) -> None:
        self._guide = guide

    async def execute(self, *, message: str, thread_id: str) -> str:
        return await self._guide.reply(message=message, thread_id=thread_id)


