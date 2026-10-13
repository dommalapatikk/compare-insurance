import asyncio
from decimal import Decimal

import httpx
import pytest

from compare_insurance_api.domain.models import (
    AgeCategory,
    Deductible,
    InsuranceModel,
    SearchCriteria,
)
from compare_insurance_api.infrastructure.supabase_repository import (
    SupabasePremiumRepository,
)


class FakeHttpClient:
    def __init__(self, rows: list[dict[str, object]]) -> None:
        self.rows = rows
        self.calls: list[dict[str, object]] = []

    async def get(self, url: str, **kwargs: object) -> httpx.Response:
        self.calls.append({"url": url, **kwargs})
        request = httpx.Request("GET", url)
        return httpx.Response(200, json=self.rows, request=request)


def test_repository_queries_exact_criteria_and_maps_offers() -> None:
    client = FakeHttpClient(
        [
            {
                "insurer_id": "8",
                "insurer_name": "Agrisano Krankenkasse AG",
                "plan_id": "01_016",
                "product_name": "Health Maintenance Organisation Insurance",
                "canton": "AG",
                "premium_region": "0",
                "age_category": "adult",
                "age_subgroup": "E1",
                "deductible_chf": 2500,
                "accident_coverage": False,
                "insurance_model": "hmo",
                "source_tariff_type": "PRAXIS",
                "premium_year": 2027,
                "monthly_premium_chf": "320.00",
            }
        ]
    )
    repository = SupabasePremiumRepository(
        url="https://example.supabase.co",
        service_role_key="server-secret",
        client=client,
    )
    criteria = SearchCriteria(
        canton="AG",
        region="0",
        age_category=AgeCategory.ADULT,
        accident_coverage=False,
        deductibles=(Deductible.CHF_2500,),
        insurance_models=(InsuranceModel.PRAXIS,),
        premium_year=2027,
    )

    offers = asyncio.run(repository.find_matching(criteria))

    assert len(offers) == 1
    assert offers[0].insurer_name == "Agrisano Krankenkasse AG"
    assert offers[0].insurance_model is InsuranceModel.PRAXIS
    assert offers[0].monthly_premium_chf == Decimal("320.00")
    call = client.calls[0]
    assert call["url"] == "https://example.supabase.co/rest/v1/premium_offers"
    params = call["params"]
    assert isinstance(params, dict)
    assert params["canton"] == "eq.AG"
    assert params["premium_region"] == "eq.0"
    assert params["age_category"] == "eq.adult"
    assert params["age_subgroup"] == "eq.E1"
    assert params["accident_coverage"] == "eq.false"
    assert params["deductible_chf"] == "in.(2500)"
    assert params["source_tariff_type"] == "in.(PRAXIS)"
    assert "insurance_model" not in params


def test_repository_requires_server_side_supabase_configuration(monkeypatch) -> None:
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.delenv("SUPABASE_SERVICE_ROLE_KEY", raising=False)

    repository = SupabasePremiumRepository.from_env()
    criteria = SearchCriteria(
        canton="AG",
        region="0",
        age_category=AgeCategory.ADULT,
        accident_coverage=False,
        deductibles=(Deductible.CHF_2500,),
        insurance_models=(InsuranceModel.PRAXIS,),
        premium_year=2027,
    )

    with pytest.raises(RuntimeError, match="Supabase is not configured"):
        asyncio.run(repository.find_matching(criteria))
