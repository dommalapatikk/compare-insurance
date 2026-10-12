"""Deterministic domain services for ranking and premium differences."""

from collections.abc import Iterable
from decimal import Decimal

from compare_insurance_api.domain.models import (
    CostRelation,
    PremiumOffer,
    RankedPremiumOffer,
    ReferenceComparison,
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

    if not 1 <= top_n <= 10:
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

