import asyncio
import json
from types import SimpleNamespace

from compare_insurance_api.application.ports import ChatHistoryMessage
from compare_insurance_api.infrastructure.langchain_guide import (
    LangChainInsuranceGuide,
)


class FakeAgent:
    def __init__(self, messages):
        self.messages = messages
        self.received = None

    async def ainvoke(self, payload):
        self.received = payload
        return {"messages": self.messages}


def test_guide_sends_bounded_client_history_without_server_memory() -> None:
    agent = FakeAgent([SimpleNamespace(content="What accident cover do you want?")])
    guide = LangChainInsuranceGuide(agent=agent)

    reply = asyncio.run(
        guide.reply(
            message="I was born in 1980",
            thread_id="thread-123",
            history=(
                ChatHistoryMessage(role="user", content="I live in 3011"),
                ChatHistoryMessage(
                    role="assistant",
                    content="What is your birth year?",
                ),
            ),
        )
    )

    assert reply.message == "What accident cover do you want?"
    assert agent.received == {
        "messages": [
            {"role": "user", "content": "I live in 3011"},
            {"role": "assistant", "content": "What is your birth year?"},
            {"role": "user", "content": "I was born in 1980"},
        ]
    }


def test_guide_extracts_comparison_location_profile_and_citations_from_tools() -> None:
    location = {
        "source": "swisstopo and BAG",
        "source_year": 2027,
        "citations": [
            {
                "title": "Official postcode directory",
                "url": "https://www.swisstopo.admin.ch/en/official-directory-of-towns-and-cities",
            }
        ],
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
    comparison = {
        "query": {
            "canton": "BE",
            "region": "1",
            "birth_year": 1980,
            "age_category": "adult",
            "deductibles": [2500],
            "accident_coverage": False,
            "insurance_models": ["praxis"],
            "year": 2027,
            "top_n": 10,
            "reference_monthly_premium_chf": None,
        },
        "source_year": 2027,
        "source_name": "Swiss Federal Office of Public Health (BAG)",
        "citations": [
            {
                "title": "BAG premium data",
                "url": "https://opendata.swiss/en/dataset/health-insurance-premiums",
            }
        ],
        "total_eligible_offers": 0,
        "offers": [],
        "cheapest_by_deductible": [],
        "cheapest_by_model": [],
        "cheapest_by_deductible_and_model": [],
    }
    agent = FakeAgent(
        [
            SimpleNamespace(name="search_swiss_locations", content=json.dumps(location)),
            SimpleNamespace(
                name="compare_swiss_health_insurance",
                content=json.dumps(comparison),
            ),
            SimpleNamespace(content="The official comparison is ready."),
        ]
    )

    reply = asyncio.run(
        LangChainInsuranceGuide(agent=agent).reply(
            message="Compare it",
            thread_id="thread-123",
            history=(),
        )
    )

    assert reply.comparison is not None
    assert reply.comparison["query"]["birth_year"] == 1980
    assert reply.profile == {
        "resolved_location": {
            "postal_code": "3011",
            "locality": "Bern",
            "municipality_id": "351",
            "municipality_name": "Bern",
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
    assert {citation.title for citation in reply.citations} == {
        "Official postcode directory",
        "BAG premium data",
    }


def test_guide_ignores_model_prose_that_looks_like_a_comparison() -> None:
    agent = FakeAgent(
        [
            SimpleNamespace(
                content=(
                    '{"offers": [{"monthly_premium_chf": "1.00"}]} '
                    "This is ordinary assistant prose."
                )
            )
        ]
    )

    reply = asyncio.run(
        LangChainInsuranceGuide(agent=agent).reply(
            message="Invent a premium",
            thread_id="thread-123",
            history=(),
        )
    )

    assert reply.comparison is None
    assert reply.profile is None
