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
    build_location_search_tool,
    build_official_guidance_tool,
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


class StubLocationSearch:
    async def execute(self, query: str, *, limit: int = 8):
        assert query == "3011"
        assert limit == 8
        from compare_insurance_api.domain.models import PremiumLocation

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


def test_langchain_tool_uses_the_deterministic_comparison_use_case() -> None:
    repository = StubPremiumRepository()
    comparison_tool = build_premium_comparison_tool(ComparePremiums(repository))

    result = asyncio.run(
        comparison_tool.ainvoke(
            {
                "canton": "AG",
                "premium_region": "0",
                "birth_year": 1980,
                "deductibles": [2500],
                "accident_coverage": False,
                "insurance_models": ["praxis"],
                "premium_year": 2027,
                "top_n": 10,
            }
        )
    )

    assert repository.criteria is not None
    assert repository.criteria.age_category is AgeCategory.ADULT
    assert repository.criteria.insurance_models == (InsuranceModel.PRAXIS,)
    assert result["source"] == "Swiss Federal Office of Public Health (BAG)"
    assert result["offers"][0]["monthly_premium_chf"] == "320.00"
    assert result["offers"][0]["annual_premium_chf"] == "3840.00"
    assert result["offers"][0]["rank"] == 1
    assert result["query"]["birth_year"] == 1980
    assert result["query"]["age_category"] == "adult"
    assert result["cheapest_by_deductible"][0]["monthly_premium_chf"] == "320.00"
    assert result["cheapest_by_model"][0]["insurance_model"] == "praxis"
    assert result["cheapest_by_deductible_and_model"][0]["deductible_chf"] == 2500


def test_location_tool_returns_source_backed_structured_matches() -> None:
    location_tool = build_location_search_tool(StubLocationSearch())

    result = asyncio.run(location_tool.ainvoke({"query": "3011", "limit": 8}))

    assert result["source_year"] == 2027
    assert result["locations"] == [
        {
            "postal_code": "3011",
            "locality": "Bern",
            "municipality_id": "351",
            "municipality_name": "Bern",
            "canton": "BE",
            "premium_region": "1",
            "label": "3011 Bern, BE",
        }
    ]


def test_official_guidance_tool_returns_reviewed_content_and_citation() -> None:
    guidance_tool = build_official_guidance_tool()

    result = asyncio.run(guidance_tool.ainvoke({"topic": "2027_premiums"}))

    assert "5.0" in result["content"]
    assert result["citations"][0]["url"].startswith("https://www.bag.admin.ch/")
