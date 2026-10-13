import asyncio
from decimal import Decimal

from compare_insurance_api.application.use_cases import ComparePremiums
from compare_insurance_api.domain.models import (
    AgeCategory,
    Deductible,
    InsuranceModel,
    PremiumOffer,
    SearchCriteria,
)
from compare_insurance_api.infrastructure.langchain_tools import (
    build_premium_comparison_tool,
)


class StubPremiumRepository:
    def __init__(self) -> None:
        self.criteria: SearchCriteria | None = None

    async def find_matching(self, criteria: SearchCriteria) -> list[PremiumOffer]:
        self.criteria = criteria
        return [
            PremiumOffer(
                insurer_id="8",
                insurer_name="Agrisano Krankenkasse AG",
                plan_id="01_016",
                product_name="HMO example",
                municipality_id=None,
                canton="AG",
                region="0",
                age_category=AgeCategory.ADULT,
                deductible=Deductible.CHF_2500,
                accident_coverage=False,
                insurance_model=InsuranceModel.PRAXIS,
                premium_year=2027,
                monthly_premium_chf=Decimal("320.00"),
            )
        ]


def test_langchain_tool_uses_the_deterministic_comparison_use_case() -> None:
    repository = StubPremiumRepository()
    comparison_tool = build_premium_comparison_tool(ComparePremiums(repository))

    result = asyncio.run(
        comparison_tool.ainvoke(
            {
                "canton": "AG",
                "premium_region": "0",
                "age_category": "adult",
                "deductibles": [2500],
                "accident_coverage": False,
                "insurance_models": ["praxis"],
                "premium_year": 2027,
                "top_n": 10,
            }
        )
    )

    assert repository.criteria is not None
    assert repository.criteria.insurance_models == (InsuranceModel.PRAXIS,)
    assert result["source"] == "Swiss Federal Office of Public Health (BAG)"
    assert result["offers"][0]["monthly_premium_chf"] == "320.00"
    assert result["offers"][0]["annual_premium_chf"] == "3840.00"
    assert result["offers"][0]["rank"] == 1
