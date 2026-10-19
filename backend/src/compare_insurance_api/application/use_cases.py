"""Application orchestration around the pure domain model."""

from dataclasses import dataclass
from decimal import Decimal

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
    ranked_by_deductible: tuple["RankedDeductibleGroup", ...] = ()


@dataclass(frozen=True, slots=True)
class RankedOfferSet:
    total_eligible_offers: int
    within_five_offer_count: int
    within_five_insurer_count: int
    offers: tuple[RankedPremiumOffer, ...]


@dataclass(frozen=True, slots=True)
class RankedModelOfferSet:
    insurance_model: str
    ranking: RankedOfferSet


@dataclass(frozen=True, slots=True)
class RankedDeductibleGroup:
    deductible_chf: int
    all_selected_models: RankedOfferSet
    models: tuple[RankedModelOfferSet, ...]


def _ranked_offer_set(
    offers: tuple[PremiumOffer, ...],
    criteria: SearchCriteria,
) -> RankedOfferSet:
    ranked = rank_premium_offers(
        offers,
        top_n=criteria.top_n,
        reference_monthly_premium_chf=criteria.reference_monthly_premium_chf,
    )
    if not offers:
        return RankedOfferSet(0, 0, 0, ())
    lowest = min(offer.monthly_premium_chf for offer in offers)
    ceiling = lowest + Decimal("5.00")
    near = tuple(offer for offer in offers if offer.monthly_premium_chf <= ceiling)
    return RankedOfferSet(
        total_eligible_offers=len(offers),
        within_five_offer_count=len(near),
        within_five_insurer_count=len({offer.insurer_id for offer in near}),
        offers=ranked,
    )


def _ranked_by_deductible(
    offers: tuple[PremiumOffer, ...],
    criteria: SearchCriteria,
) -> tuple[RankedDeductibleGroup, ...]:
    groups: list[RankedDeductibleGroup] = []
    for deductible in sorted(criteria.deductibles, key=int):
        franchise_offers = tuple(
            offer for offer in offers if offer.deductible is deductible
        )
        model_groups = tuple(
            RankedModelOfferSet(
                insurance_model=model.value,
                ranking=_ranked_offer_set(
                    tuple(
                        offer
                        for offer in franchise_offers
                        if offer.insurance_model is model
                    ),
                    criteria,
                ),
            )
            for model in criteria.insurance_models
        )
        groups.append(
            RankedDeductibleGroup(
                deductible_chf=int(deductible),
                all_selected_models=_ranked_offer_set(franchise_offers, criteria),
                models=model_groups,
            )
        )
    return tuple(groups)


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
            ranked_by_deductible=_ranked_by_deductible(eligible_offers, criteria),
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


