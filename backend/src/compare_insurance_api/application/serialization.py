"""Framework-free JSON views for application results shared by API and tools."""

from typing import Any

from compare_insurance_api.application.use_cases import PremiumComparison
from compare_insurance_api.domain.models import PremiumOffer


SOURCE_NAME = "Swiss Federal Office of Public Health (BAG)"
PREMIUM_DATA_CITATION = {
    "title": "BAG health-insurance premium data",
    "url": "https://opendata.swiss/en/dataset/health-insurance-premiums",
}


def _minimum(offer: PremiumOffer) -> dict[str, Any]:
    return {
        "insurer_id": offer.insurer_id,
        "insurer_name": offer.insurer_name,
        "plan_id": offer.plan_id,
        "product_name": offer.product_name,
        "canton": offer.canton,
        "region": offer.region,
        "deductible_chf": int(offer.deductible),
        "accident_coverage": offer.accident_coverage,
        "insurance_model": offer.insurance_model.value,
        "monthly_premium_chf": str(offer.monthly_premium_chf),
        "annual_premium_chf": str(offer.annual_premium_chf),
    }


def _ranked_offer(ranked: Any) -> dict[str, Any]:
    return {
        "rank": ranked.rank,
        **_minimum(ranked.offer),
        "monthly_difference_from_cheapest_chf": str(
            ranked.monthly_difference_from_cheapest_chf
        ),
        "annual_difference_from_cheapest_chf": str(
            ranked.annual_difference_from_cheapest_chf
        ),
        "reference_comparison": (
            {
                "relation": ranked.reference_comparison.relation.value,
                "monthly_difference_chf": str(
                    ranked.reference_comparison.monthly_difference_chf
                ),
                "annual_difference_chf": str(
                    ranked.reference_comparison.annual_difference_chf
                ),
            }
            if ranked.reference_comparison is not None
            else None
        ),
    }


def _ranked_set(ranking: Any) -> dict[str, Any]:
    return {
        "total_eligible_offers": ranking.total_eligible_offers,
        "within_five_offer_count": ranking.within_five_offer_count,
        "within_five_insurer_count": ranking.within_five_insurer_count,
        "offers": [_ranked_offer(offer) for offer in ranking.offers],
    }


def premium_comparison_payload(
    comparison: PremiumComparison,
    *,
    birth_year: int | None,
) -> dict[str, Any]:
    """Return exact source-backed comparison data without LLM transformation."""

    criteria = comparison.criteria
    return {
        "query": {
            "canton": criteria.canton,
            "region": criteria.region,
            "age_category": criteria.age_category.value,
            "birth_year": birth_year,
            "deductibles": [int(value) for value in criteria.deductibles],
            "accident_coverage": criteria.accident_coverage,
            "insurance_models": [value.value for value in criteria.insurance_models],
            "year": criteria.premium_year,
            "top_n": criteria.top_n,
            "reference_monthly_premium_chf": (
                str(criteria.reference_monthly_premium_chf)
                if criteria.reference_monthly_premium_chf is not None
                else None
            ),
        },
        "source_year": criteria.premium_year,
        "source_name": SOURCE_NAME,
        "source": SOURCE_NAME,
        "citations": [PREMIUM_DATA_CITATION],
        "total_eligible_offers": comparison.total_eligible_offers,
        "offers": [_ranked_offer(ranked) for ranked in comparison.offers],
        "cheapest_by_deductible": [
            _minimum(offer) for offer in comparison.cheapest_by_deductible
        ],
        "cheapest_by_model": [
            _minimum(offer) for offer in comparison.cheapest_by_model
        ],
        "cheapest_by_deductible_and_model": [
            _minimum(offer)
            for offer in comparison.cheapest_by_deductible_and_model
        ],
        "ranked_by_deductible": [
            {
                "deductible_chf": group.deductible_chf,
                "all_selected_models": _ranked_set(group.all_selected_models),
                "models": [
                    {
                        "insurance_model": model_group.insurance_model,
                        "ranking": _ranked_set(model_group.ranking),
                    }
                    for model_group in group.models
                ],
            }
            for group in comparison.ranked_by_deductible
        ],
    }
