from decimal import Decimal

from fastapi.testclient import TestClient

from compare_insurance_api.agent import get_insurance_agent
from compare_insurance_api.api.dependencies import (
    get_compare_premiums,
    get_explain_insurance_choices,
    get_search_locations,
)
from compare_insurance_api.application.ports import (
    ChatHistoryMessage,
    GuideReply,
    SourceCitation,
)
from compare_insurance_api.application.use_cases import PremiumComparison
from compare_insurance_api.domain.models import (
    AgeCategory,
    CostRelation,
    Deductible,
    InsuranceModel,
    PremiumOffer,
    PremiumLocation,
    RankedPremiumOffer,
    ReferenceComparison,
    SearchCriteria,
)
from compare_insurance_api.main import app


client = TestClient(app)


class StubExplainInsuranceChoices:
    async def execute(
        self,
        *,
        message: str,
        thread_id: str,
        history: tuple[ChatHistoryMessage, ...] = (),
    ) -> GuideReply:
        assert history == ()
        return GuideReply(message=f"Explained: {message} ({thread_id})")


class StubStructuredInsuranceChoices:
    async def execute(
        self,
        *,
        message: str,
        thread_id: str,
        history: tuple[ChatHistoryMessage, ...] = (),
    ) -> GuideReply:
        assert history[-1].content == "What is your birth year?"
        return GuideReply(
            message="The comparison is ready.",
            comparison={
                "query": {
                    "canton": "BE",
                    "region": "1",
                    "age_category": "adult",
                    "birth_year": 1980,
                    "deductibles": [2500],
                    "accident_coverage": False,
                    "insurance_models": ["praxis"],
                    "year": 2027,
                    "top_n": 10,
                    "reference_monthly_premium_chf": None,
                },
                "source_year": 2027,
                "source_name": "Swiss Federal Office of Public Health (BAG)",
                "total_eligible_offers": 0,
                "offers": [],
                "cheapest_by_deductible": [],
                "cheapest_by_model": [],
                "cheapest_by_deductible_and_model": [],
            },
            citations=(
                SourceCitation(
                    title="BAG premium data",
                    url="https://opendata.swiss/en/dataset/health-insurance-premiums",
                ),
            ),
            profile={
                "resolved_location": {
                    "label": "3011 Bern, BE",
                    "canton": "BE",
                    "premium_region": "1",
                },
                "birth_year": 1980,
                "age_category": "adult",
                "accident_coverage": False,
                "insurance_models": ["praxis"],
                "deductibles": [2500],
            },
        )


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
            insurance_model=InsuranceModel.PRAXIS,
            premium_year=2027,
            monthly_premium_chf=Decimal("320.00"),
        )
        ranked = RankedPremiumOffer(
            rank=1,
            offer=offer,
            monthly_difference_from_cheapest_chf=Decimal("0.00"),
            annual_difference_from_cheapest_chf=Decimal("0.00"),
            reference_comparison=(
                ReferenceComparison(
                    relation=CostRelation.CHEAPER,
                    monthly_difference_chf=Decimal("80.00"),
                    annual_difference_chf=Decimal("960.00"),
                )
                if criteria.reference_monthly_premium_chf is not None
                else None
            ),
        )
        return PremiumComparison(
            criteria=criteria,
            total_eligible_offers=1,
            offers=(ranked,),
            cheapest_by_deductible=(offer,),
            cheapest_by_model=(offer,),
            cheapest_by_deductible_and_model=(offer,),
        )


class UnconfiguredComparePremiums:
    async def execute(self, criteria: SearchCriteria) -> PremiumComparison:
        raise RuntimeError("Supabase is not configured")


class StubSearchLocations:
    async def execute(self, query: str, *, limit: int):
        assert query == "3011"
        assert limit == 8
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


def test_health() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_location_search_resolves_postcode_to_premium_region() -> None:
    app.dependency_overrides[get_search_locations] = lambda: StubSearchLocations()
    try:
        response = client.get("/v1/locations", params={"q": "3011"})
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {
        "query": "3011",
        "premium_year": 2027,
        "source_name": "swisstopo and Swiss Federal Office of Public Health (BAG)",
        "locations": [
            {
                "postal_code": "3011",
                "locality": "Bern",
                "municipality_id": "351",
                "municipality_name": "Bern",
                "canton": "BE",
                "premium_region": "1",
                "label": "3011 Bern, BE",
            }
        ],
    }


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
                "insurance_model": "praxis",
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
        "insurance_model": "praxis",
        "monthly_premium_chf": "320.00",
        "annual_premium_chf": "3840.00",
        "monthly_difference_from_cheapest_chf": "0.00",
        "annual_difference_from_cheapest_chf": "0.00",
        "reference_comparison": None,
    }
    assert body["cheapest_by_deductible"][0]["deductible_chf"] == 2500
    assert body["cheapest_by_deductible"][0]["monthly_premium_chf"] == "320.00"
    assert body["cheapest_by_model"][0]["insurance_model"] == "praxis"
    assert body["cheapest_by_model"][0]["insurer_id"] == "8"
    assert body["cheapest_by_deductible_and_model"][0]["deductible_chf"] == 2500
    assert body["cheapest_by_deductible_and_model"][0]["insurance_model"] == "praxis"


def test_premium_search_requires_source_filters() -> None:
    response = client.get("/v1/premiums/search")

    assert response.status_code == 422


def test_premium_search_derives_age_category_from_birth_year() -> None:
    app.dependency_overrides[get_compare_premiums] = lambda: StubComparePremiums()
    try:
        response = client.get(
            "/v1/premiums/search",
            params={
                "canton": "BE",
                "region": "1",
                "birth_year": 2008,
                "deductible": 2500,
                "insurance_model": "praxis",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["query"]["age_category"] == "young_adult"
    assert response.json()["query"]["birth_year"] == 2008


def test_premium_search_rejects_age_category_that_conflicts_with_birth_year() -> None:
    app.dependency_overrides[get_compare_premiums] = lambda: StubComparePremiums()
    try:
        response = client.get(
            "/v1/premiums/search",
            params={
                "canton": "BE",
                "region": "1",
                "birth_year": 2008,
                "age_category": "adult",
                "deductible": 2500,
                "insurance_model": "praxis",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 422
    assert response.json()["detail"] == (
        "age_category does not match birth_year for the premium year"
    )


def test_premium_search_serializes_reference_savings() -> None:
    app.dependency_overrides[get_compare_premiums] = lambda: StubComparePremiums()
    try:
        response = client.get(
            "/v1/premiums/search",
            params={
                "canton": "AG",
                "region": "0",
                "age_category": "adult",
                "deductible": 2500,
                "insurance_model": "praxis",
                "reference_monthly_premium_chf": "400.00",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["offers"][0]["reference_comparison"] == {
        "relation": "cheaper",
        "monthly_difference_chf": "80.00",
        "annual_difference_chf": "960.00",
    }


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
                "insurance_model": "praxis",
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


def test_chat_accepts_history_and_returns_structured_tool_artifacts() -> None:
    app.dependency_overrides[get_explain_insurance_choices] = (
        lambda: StubStructuredInsuranceChoices()
    )
    try:
        response = client.post(
            "/v1/chat",
            json={
                "message": "1980",
                "thread_id": "test-thread",
                "history": [
                    {"role": "user", "content": "I live in 3011"},
                    {"role": "assistant", "content": "What is your birth year?"},
                ],
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    body = response.json()
    assert body["message"] == "The comparison is ready."
    assert body["comparison"]["query"]["birth_year"] == 1980
    assert body["citations"][0]["title"] == "BAG premium data"
    assert body["profile"] == {
        "resolved_location": {
            "label": "3011 Bern, BE",
            "canton": "BE",
            "premium_region": "1",
        },
        "birth_year": 1980,
        "age_category": "adult",
        "accident_coverage": False,
        "insurance_models": ["praxis"],
        "deductibles": [2500],
    }


def test_chat_rejects_unbounded_history() -> None:
    response = client.post(
        "/v1/chat",
        json={
            "message": "Continue",
            "thread_id": "test-thread",
            "history": [
                {"role": "user", "content": f"message {index}"}
                for index in range(13)
            ],
        },
    )

    assert response.status_code == 422


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

