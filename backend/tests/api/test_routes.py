from fastapi.testclient import TestClient

from compare_insurance_api.agent import get_insurance_agent
from compare_insurance_api.api.dependencies import get_explain_insurance_choices
from compare_insurance_api.main import app


client = TestClient(app)


class StubExplainInsuranceChoices:
    async def execute(self, *, message: str, thread_id: str) -> str:
        return f"Explained: {message} ({thread_id})"


def test_health() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_premium_search_is_explicitly_not_implemented() -> None:
    response = client.get("/v1/premiums/search")

    assert response.status_code == 501
    assert response.json() == {
        "detail": (
            "Premium search is not available until the official premium dataset "
            "has been ingested and validated."
        )
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
        "data_status": "comparison_search_not_implemented",
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

