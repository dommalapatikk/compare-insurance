"""Deterministic domain services for ranking and premium differences."""

from collections.abc import Iterable
from decimal import Decimal

from compare_insurance_api.domain.models import (
    CostRelation,
    PremiumOffer,
    RankedDeductibleGroup,
    RankedModelOfferSet,
    RankedOfferSet,
    RankedPremiumOffer,
    RankedPremiumOfferPage,
    ReferenceComparison,
    SearchCriteria,
    money,
)


def _offer_sort_key(offer: PremiumOffer) -> tuple[object, ...]:
    return (
        offer.monthly_premium_chf,
        offer.annual_premium_chf,
        offer.insurer_name.casefold(),
        offer.product_name.casefold(),
        offer.insurer_id,
        offer.plan_id,
        int(offer.deductible),
        offer.insurance_model.value,
    )


def cheapest_offers_by_deductible(
    offers: Iterable[PremiumOffer],
) -> tuple[PremiumOffer, ...]:
    """Return the true minimum for every deductible in the eligible set."""

    minima: dict[int, PremiumOffer] = {}
    for offer in offers:
        key = int(offer.deductible)
        current = minima.get(key)
        if current is None or _offer_sort_key(offer) < _offer_sort_key(current):
            minima[key] = offer
    return tuple(minima[key] for key in sorted(minima))


def cheapest_offers_by_model(
    offers: Iterable[PremiumOffer],
) -> tuple[PremiumOffer, ...]:
    """Return the true minimum for every model in the eligible set."""

    minima: dict[str, PremiumOffer] = {}
    for offer in offers:
        key = offer.insurance_model.value
        current = minima.get(key)
        if current is None or _offer_sort_key(offer) < _offer_sort_key(current):
            minima[key] = offer
    return tuple(minima[key] for key in sorted(minima))


def cheapest_offers_by_deductible_and_model(
    offers: Iterable[PremiumOffer],
) -> tuple[PremiumOffer, ...]:
    """Return one source-backed minimum for each deductible/model cell."""

    minima: dict[tuple[int, str], PremiumOffer] = {}
    for offer in offers:
        key = (int(offer.deductible), offer.insurance_model.value)
        current = minima.get(key)
        if current is None or _offer_sort_key(offer) < _offer_sort_key(current):
            minima[key] = offer
    return tuple(minima[key] for key in sorted(minima))


def _compare_with_reference(
    offer: PremiumOffer,
    reference_monthly_premium_chf: Decimal,
) -> ReferenceComparison:
    reference = money(reference_monthly_premium_chf)
    if offer.monthly_premium_chf < reference:
        relation = CostRelation.CHEAPER
    elif offer.monthly_premium_chf > reference:
        relation = CostRelation.MORE_EXPENSIVE
    else:
        relation = CostRelation.SAME

    monthly_difference = money(abs(reference - offer.monthly_premium_chf))
    return ReferenceComparison(
        relation=relation,
        monthly_difference_chf=monthly_difference,
        annual_difference_chf=money(monthly_difference * 12),
    )


def rank_premium_offers(
    offers: Iterable[PremiumOffer],
    *,
    top_n: int,
    reference_monthly_premium_chf: Decimal | None = None,
) -> tuple[RankedPremiumOffer, ...]:
    """Return a stable, cheapest-first shortlist with transparent differences."""

    if (
        not isinstance(top_n, int)
        or isinstance(top_n, bool)
        or not 1 <= top_n <= 10
    ):
        raise ValueError("top_n must be between 1 and 10")

    ordered = sorted(offers, key=_offer_sort_key)
    if not ordered:
        return ()

    cheapest = ordered[0].monthly_premium_chf
    ranked: list[RankedPremiumOffer] = []
    for index, offer in enumerate(ordered[:top_n], start=1):
        monthly_difference = money(offer.monthly_premium_chf - cheapest)
        reference_comparison = (
            _compare_with_reference(offer, reference_monthly_premium_chf)
            if reference_monthly_premium_chf is not None
            else None
        )
        ranked.append(
            RankedPremiumOffer(
                rank=index,
                offer=offer,
                monthly_difference_from_cheapest_chf=monthly_difference,
                annual_difference_from_cheapest_chf=money(monthly_difference * 12),
                reference_comparison=reference_comparison,
            )
        )
    return tuple(ranked)


def ranked_offer_set(
    offers: Iterable[PremiumOffer],
    *,
    top_n: int,
    reference_monthly_premium_chf: Decimal | None = None,
) -> RankedOfferSet:
    """Rank one eligible set and derive the inclusive CHF 5 trust indicators."""

    eligible = tuple(offers)
    ranked = rank_premium_offers(
        eligible,
        top_n=top_n,
        reference_monthly_premium_chf=reference_monthly_premium_chf,
    )
    if not eligible:
        return RankedOfferSet(0, 0, 0, ())

    lowest = min(offer.monthly_premium_chf for offer in eligible)
    ceiling = lowest + Decimal("5.00")
    near = tuple(
        offer for offer in eligible if offer.monthly_premium_chf <= ceiling
    )
    return RankedOfferSet(
        total_eligible_offers=len(eligible),
        within_five_offer_count=len(near),
        within_five_insurer_count=len({offer.insurer_id for offer in near}),
        offers=ranked,
    )


def ranked_offers_by_deductible(
    offers: Iterable[PremiumOffer],
    *,
    criteria: SearchCriteria,
) -> tuple[RankedDeductibleGroup, ...]:
    """Build complete per-deductible and per-model ranking groups."""

    eligible = tuple(offers)
    groups: list[RankedDeductibleGroup] = []
    for deductible in sorted(criteria.deductibles, key=int):
        deductible_offers = tuple(
            offer for offer in eligible if offer.deductible == deductible
        )
        model_groups = tuple(
            RankedModelOfferSet(
                insurance_model=model,
                ranking=ranked_offer_set(
                    (
                        offer
                        for offer in deductible_offers
                        if offer.insurance_model == model
                    ),
                    top_n=criteria.top_n,
                    reference_monthly_premium_chf=(
                        criteria.reference_monthly_premium_chf
                    ),
                ),
            )
            for model in criteria.insurance_models
        )
        groups.append(
            RankedDeductibleGroup(
                deductible_chf=deductible,
                all_selected_models=ranked_offer_set(
                    deductible_offers,
                    top_n=criteria.top_n,
                    reference_monthly_premium_chf=(
                        criteria.reference_monthly_premium_chf
                    ),
                ),
                models=model_groups,
            )
        )
    return tuple(groups)


def paginate_ranked_premium_offers(
    offers: Iterable[PremiumOffer],
    *,
    offset: int,
    limit: int,
    reference_monthly_premium_chf: Decimal | None = None,
) -> RankedPremiumOfferPage:
    """Return a stable page while retaining ranks relative to the full group."""

    if not isinstance(offset, int) or isinstance(offset, bool) or offset < 0:
        raise ValueError("offset must be zero or greater")
    if (
        not isinstance(limit, int)
        or isinstance(limit, bool)
        or not 1 <= limit <= 50
    ):
        raise ValueError("limit must be between 1 and 50")

    ordered = sorted(offers, key=_offer_sort_key)
    total = len(ordered)
    selected = ordered[offset : offset + limit]
    if not ordered:
        return RankedPremiumOfferPage(total, offset, limit, False, ())

    cheapest = ordered[0].monthly_premium_chf
    ranked: list[RankedPremiumOffer] = []
    for rank, offer in enumerate(selected, start=offset + 1):
        monthly_difference = money(offer.monthly_premium_chf - cheapest)
        reference_comparison = (
            _compare_with_reference(offer, reference_monthly_premium_chf)
            if reference_monthly_premium_chf is not None
            else None
        )
        ranked.append(
            RankedPremiumOffer(
                rank=rank,
                offer=offer,
                monthly_difference_from_cheapest_chf=monthly_difference,
                annual_difference_from_cheapest_chf=money(
                    monthly_difference * 12
                ),
                reference_comparison=reference_comparison,
            )
        )
    return RankedPremiumOfferPage(
        total_eligible_offers=total,
        offset=offset,
        limit=limit,
        has_more=offset + len(selected) < total,
        offers=tuple(ranked),
    )

