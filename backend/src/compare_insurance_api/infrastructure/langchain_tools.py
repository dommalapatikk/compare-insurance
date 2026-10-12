"""LangChain tools that delegate facts and calculations to application use cases."""

from decimal import Decimal
from typing import Any

from langchain_core.tools import BaseTool, tool

from compare_insurance_api.application.use_cases import ComparePremiums
from compare_insurance_api.domain.models import (
    AgeCategory,
    Deductible,
    InsuranceModel,
    SearchCriteria,
)


def build_premium_comparison_tool(use_case: ComparePremiums) -> BaseTool:
    """Build an agent tool around the same deterministic use case as the API."""

    @tool("compare_swiss_health_insurance")
    async def compare_swiss_health_insurance(
        canton: str,
        premium_region: str,
        age_category: str,
        deductibles: list[int],
        accident_coverage: bool,
        insurance_models: list[str],
        premium_year: int = 2027,
        top_n: int = 10,
        reference_monthly_premium_chf: float | None = None,
    ) -> dict[str, Any]:
        """Find and rank official Swiss basic-insurance premiums for exact filters."""

        criteria = SearchCriteria(
            canton=canton,
            region=premium_region,
            age_category=AgeCategory(age_category),
            accident_coverage=accident_coverage,
            deductibles=tuple(Deductible(value) for value in deductibles),
            insurance_models=tuple(
                InsuranceModel(value) for value in insurance_models
            ),
            premium_year=premium_year,
            top_n=top_n,
            reference_monthly_premium_chf=(
                Decimal(str(reference_monthly_premium_chf))
                if reference_monthly_premium_chf is not None
                else None
            ),
        )
        comparison = await use_case.execute(criteria)
        return {
            "source": "Swiss Federal Office of Public Health (BAG)",
            "source_year": criteria.premium_year,
            "total_eligible_offers": comparison.total_eligible_offers,
            "offers": [
                {
                    "rank": ranked.rank,
                    "insurer_id": ranked.offer.insurer_id,
                    "insurer_name": ranked.offer.insurer_name,
                    "plan_id": ranked.offer.plan_id,
                    "product_name": ranked.offer.product_name,
                    "deductible_chf": int(ranked.offer.deductible),
                    "insurance_model": ranked.offer.insurance_model.value,
                    "accident_coverage": ranked.offer.accident_coverage,
                    "monthly_premium_chf": str(ranked.offer.monthly_premium_chf),
                    "annual_premium_chf": str(ranked.offer.annual_premium_chf),
                    "monthly_difference_from_cheapest_chf": str(
                        ranked.monthly_difference_from_cheapest_chf
                    ),
                    "annual_difference_from_cheapest_chf": str(
                        ranked.annual_difference_from_cheapest_chf
                    ),
                }
                for ranked in comparison.offers
            ],
        }

    return compare_swiss_health_insurance
