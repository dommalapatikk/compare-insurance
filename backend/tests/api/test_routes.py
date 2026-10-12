from decimal import Decimal

from fastapi.testclient import TestClient

from compare_insurance_api.agent import get_insurance_agent
from compare_insurance_api.api.dependencies import (
    get_compare_premiums,
    get_explain_insurance_choices,
)
from compare_insurance_api.application.use_cases import PremiumComparison
from compare_insurance_api.domain.models import (
    AgeCategory,
    Deductible,
    InsuranceModel,
    PremiumOffer,
    RankedPremiumOffer,
    SearchCriteria,
)
from compare_insurance_api.main import app


client = TestClient(app)


class StubExplainInsuranceChoices:
    async def execute(self, *, message: str, thread_id: str) -> str:
        return f"Explained: {message} ({thread_id})"


class StubComparePremiums:
    async def execute(self, criteria: SearchCriteria) -> PremiumComparison:
        offer = PremiumOffer(
            insurer_id="8",
            insurer_name="Agrisano Krankenkasse AG",
            plan_id="01_016",
            product_name="Health Maintenance Organisation Insurance",
            municipality_id=None,
            canton="AG",
            region="0",
            age_category=AgeCategory.ADULT,
            deductible=Deductible.CHF_2500,
            accident_coverage=False,
            insurance_model=InsuranceModel.HMO,
            premium_year=2027,
            monthly_premium_chf=Decimal("320.00"),
        )
        ranked = RankedPremiumOffer(
            rank=1,
            offer=offer,
            monthly_difference_from_cheapest_chf=Decimal("0.00"),
            annual_difference_from_cheapest_chf=Decimal("0.00"),
            reference_comparison=None,
        )
        return PremiumComparison(
            criteria=criteria,
            total_eligible_offers=1,
            offers=(ranked,),
        )


class UnconfiguredComparePremiums:
    async def execute(self, criteria: SearchCriteria) -> PremiumComparison:
        raise RuntimeError("Supabase is not configured")


def test_health() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_premium_search_maps_ranked_offers_to_the_http_contract() -> None:
    app.dependency_overrides[get_compare_premiums] = lambda: StubComparePremiums()
    try:
        response = client.get(
            "/v1/premiums/search",
            params={
                "canton": "ag",
                "region": "0",
                "age_category": "adult",
                "deductible": 2500,
                "accident_coverage": False,
                "insurance_model": "hmo",
                "year": 2027,
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    body = response.json()
    assert body["source_year"] == 2027
    assert body["source_name"] == "Swiss Federal Office of Public Health (BAG)"
    assert body["total_eligible_offers"] == 1
    assert body["query"]["canton"] == "ag"
    assert body["offers"][0] == {
        "rank": 1,
        "insurer_id": "8",
        "insurer_name": "Agrisano Krankenkasse AG",
        "plan_id": "01_016",
        "product_name": "Health Maintenance Organisation Insurance",
        "canton": "AG",
        "region": "0",
        "deductible_chf": 2500,
        "accident_coverage": False,
        "insurance_model": "hmo",
        "monthly_premium_chf": "320.00",
        "annual_premium_chf": "3840.00",
        "monthly_difference_from_cheapest_chf": "0.00",
        "annual_difference_from_cheapest_chf": "0.00",
        "reference_comparison": None,
    }


def test_premium_search_requires_source_filters() -> None:
    response = client.get("/v1/premiums/search")

    assert response.status_code == 422


def test_premium_search_reports_missing_supabase_configuration() -> None:
    app.dependency_overrides[get_compare_premiums] = (
        lambda: UnconfiguredComparePremiums()
    )
    try:
        response = client.get(
            "/v1/premiums/search",
            params={
                "canton": "AG",
                "region": "0",
                "age_category": "adult",
                "deductible": 2500,
                "insurance_model": "hmo",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 503
    assert response.json() == {
        "detail": "The official premium catalogue is not configured."
    }


def test_chat_maps_the_application_response_to_the_http_contract() -> None:
    app.dependency_overrides[get_explain_insurance_choices] = (
        lambda: StubExplainInsuranceChoices()
    )
    try:
        response = client.post(
            "/v1/chat",
            json={"message": "Explain Telmed", "thread_id": "test-thread"},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {
        "message": "Explained: Explain Telmed (test-thread)",
        "thread_id": "test-thread",
        "data_status": "comparison_available_when_catalogue_configured",
    }


def test_chat_reports_missing_server_configuration(monkeypatch) -> None:
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_MODEL", raising=False)
    get_insurance_agent.cache_clear()

    response = client.post(
        "/v1/chat",
        json={"message": "Help me compare deductibles", "thread_id": "test-thread"},
    )

    assert response.status_code == 503
    assert response.json() == {
        "detail": "The insurance chat assistant is not configured."
    }

