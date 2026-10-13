"""LangChain tools that delegate facts and calculations to trusted sources."""

from decimal import Decimal
from typing import Any, Literal

from langchain_core.tools import BaseTool, tool

from compare_insurance_api.application.serialization import (
    premium_comparison_payload,
)
from compare_insurance_api.application.use_cases import (
    ComparePremiums,
    SearchLocations,
)
from compare_insurance_api.domain.models import (
    Deductible,
    InsuranceModel,
    SearchCriteria,
    age_category_for_birth_year,
)
from compare_insurance_api.infrastructure.official_guidance import OFFICIAL_GUIDANCE


def build_premium_comparison_tool(use_case: ComparePremiums) -> BaseTool:
    """Build an agent tool around the same deterministic use case as the API."""

    @tool("compare_swiss_health_insurance")
    async def compare_swiss_health_insurance(
        canton: str,
        premium_region: str,
        birth_year: int,
        deductibles: list[int],
        accident_coverage: bool,
        insurance_models: list[str],
        premium_year: int = 2027,
        top_n: int = 10,
        reference_monthly_premium_chf: float | None = None,
    ) -> dict[str, Any]:
        """Find and rank official Swiss basic-insurance premiums for exact filters."""

        age_category = age_category_for_birth_year(
            birth_year,
            premium_year=premium_year,
        )
        criteria = SearchCriteria(
            canton=canton,
            region=premium_region,
            age_category=age_category,
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
        return premium_comparison_payload(comparison, birth_year=birth_year)

    return compare_swiss_health_insurance


def build_location_search_tool(use_case: SearchLocations) -> BaseTool:
    """Build the official postcode/municipality resolution tool."""

    @tool("search_swiss_locations")
    async def search_swiss_locations(
        query: str,
        limit: int = 8,
    ) -> dict[str, Any]:
        """Resolve a Swiss postcode or municipality to official premium regions."""

        locations = await use_case.execute(query, limit=limit)
        return {
            "source": "swisstopo and Swiss Federal Office of Public Health (BAG)",
            "source_year": 2027,
            "citations": [
                {
                    "title": "swisstopo official locality and postcode directory",
                    "url": "https://www.swisstopo.admin.ch/en/official-directory-of-towns-and-cities",
                }
            ],
            "locations": [
                {
                    "postal_code": location.postal_code,
                    "locality": location.locality,
                    "municipality_id": location.municipality_id,
                    "municipality_name": location.municipality_name,
                    "canton": location.canton,
                    "premium_region": location.premium_region,
                    "label": location.label,
                }
                for location in locations
            ],
        }

    return search_swiss_locations


GuidanceTopic = Literal[
    "2027_premiums",
    "deductible",
    "accident_coverage",
    "insurance_models",
    "switching",
]


def build_official_guidance_tool() -> BaseTool:
    """Build a read-only tool over the reviewed official guidance catalogue."""

    @tool("get_official_insurance_guidance")
    async def get_official_insurance_guidance(
        topic: GuidanceTopic,
    ) -> dict[str, Any]:
        """Return reviewed Swiss-government guidance for one supported topic."""

        entry = OFFICIAL_GUIDANCE[topic]
        return {
            "topic": topic,
            "content": entry.content,
            "citations": [{"title": entry.title, "url": entry.url}],
        }

    return get_official_insurance_guidance
