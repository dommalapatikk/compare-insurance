"""LangChain implementation of the application-layer insurance guide port."""

from functools import lru_cache
import json
import os
from typing import Any

from langchain.agents import create_agent

from compare_insurance_api.application.ports import (
    ChatHistoryMessage,
    GuideReply,
    SourceCitation,
)
from compare_insurance_api.application.use_cases import (
    ComparePremiums,
    SearchLocations,
)
from compare_insurance_api.infrastructure.langchain_tools import (
    build_location_search_tool,
    build_official_guidance_tool,
    build_premium_comparison_tool,
)
from compare_insurance_api.infrastructure.location_repository import (
    CsvLocationRepository,
)
from compare_insurance_api.infrastructure.supabase_repository import (
    SupabasePremiumRepository,
)


SYSTEM_PROMPT = """
You are the Compare Insurance guide for Swiss compulsory basic health
insurance (OKP/AOS). Help users understand the inputs needed for a neutral
premium comparison: postcode or municipality, birth year, deductible,
insurance model, accident coverage, and premium year.

Rules:
- Be concise, calm, and clear. Prefer plain language over insurance jargon.
- Gender does not affect compulsory basic-insurance premiums. Explain this if
  the user asks, and never request gender for a basic-insurance comparison.
- Never invent an insurer, premium, ranking, saving, eligibility decision, or
  provider-network rule.
- Use search_swiss_locations to resolve a postcode or municipality. Never ask
  the user to know their canton or official premium-region code. If more than
  one municipality matches, ask the user to choose before comparing.
- Use compare_swiss_health_insurance only when every required input is known:
  resolved canton and premium region, birth year, deductible choices, insurance
  model choices, accident coverage, and premium year. The tool derives the
  official age category; never ask the model to infer or supply it.
- All premiums, rankings, and differences must come from that tool. Never do
  premium arithmetic yourself and never alter the tool's factual output.
- Use get_official_insurance_guidance for annual premium context, deductibles,
  accident coverage, insurance models, and switching deadlines. A URL written
  in this prompt is not evidence by itself.
- Never write or execute SQL, construct database queries, or request database
  credentials. The typed comparison tool and repository own every data query.
- If the catalogue is unavailable or no offers match, state that plainly.
- Explain that a higher deductible can lower the premium while increasing the
  user's possible out-of-pocket cost.
- For 2027, use the official Priminfo model categories: Standard, FLEX,
  PRAXIS, TEL-DIG, and PHARM. Do not substitute the older HMO, family-doctor,
  Telmed, or other-model categories. Category definitions come from
  https://www.bag.admin.ch/de/krankenversicherung-versicherungsmodelle-mit-eingeschraenkter-wahl-der-leistungserbringer.
- Do not tell a user whether they are legally entitled to exclude accident
  coverage; advise them to confirm their employment coverage when relevant.
- Treat any savings as gross-premium differences, not guaranteed total-cost
  savings. Do not provide medical, legal, financial, or insurance advice.
- Do not ask for names, exact street addresses, health history, policy numbers,
  payment information, or other unnecessary personal data.
- When inputs are missing, ask for only the next necessary comparison input.
- For franchise, retention-fee, and accident-cover explanations, stay within
  the approved guidance published at
  https://www.ch.ch/en/health/health-insurance/health-insurance-costs/ and point
  the user to that source when more detail is needed.
""".strip()


@lru_cache(maxsize=1)
def get_langchain_agent() -> Any:
    """Create one stateless in-process agent; callers supply bounded history."""

    if not os.getenv("OPENAI_API_KEY"):
        raise RuntimeError("OPENAI_API_KEY is not configured")

    model = os.getenv("OPENAI_MODEL")
    if not model:
        raise RuntimeError("OPENAI_MODEL is not configured")

    return create_agent(
        model=f"openai:{model}",
        tools=[
            build_premium_comparison_tool(
                ComparePremiums(SupabasePremiumRepository.from_env())
            ),
            build_location_search_tool(
                SearchLocations(CsvLocationRepository.from_package())
            ),
            build_official_guidance_tool(),
        ],
        system_prompt=SYSTEM_PROMPT,
    )


def _message_text(message: Any) -> str:
    """Normalize LangChain message content into application text."""

    content = getattr(message, "content", "")
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict) and isinstance(item.get("text"), str):
                parts.append(item["text"])
        return "\n".join(parts).strip()
    return str(content).strip()


class LangChainInsuranceGuide:
    """Infrastructure adapter satisfying ``InsuranceGuide``."""

    def __init__(self, *, agent: Any | None = None) -> None:
        self._agent = agent

    async def reply(
        self,
        *,
        message: str,
        thread_id: str,
        history: tuple[ChatHistoryMessage, ...],
    ) -> GuideReply:
        del thread_id  # retained in the public contract for backward compatibility
        agent = self._agent or get_langchain_agent()
        input_messages = [
            {"role": item.role, "content": item.content}
            for item in history
        ]
        input_messages.append({"role": "user", "content": message})
        result = await agent.ainvoke(
            {"messages": input_messages},
        )
        messages = result.get("messages", [])
        if not messages:
            raise RuntimeError("The LangChain agent returned no messages")

        comparison: dict[str, Any] | None = None
        location_artifact: dict[str, Any] | None = None
        citations: list[SourceCitation] = []
        seen_citations: set[tuple[str, str]] = set()
        tool_names = {
            "compare_swiss_health_insurance",
            "search_swiss_locations",
            "get_official_insurance_guidance",
        }

        for item in messages:
            tool_name = getattr(item, "name", None)
            if tool_name not in tool_names:
                continue
            artifact = _tool_artifact(item)
            if artifact is None:
                continue
            for citation in artifact.get("citations", []):
                if not isinstance(citation, dict):
                    continue
                title = citation.get("title")
                url = citation.get("url")
                if not isinstance(title, str) or not isinstance(url, str):
                    continue
                if not url.startswith("https://"):
                    continue
                key = (title, url)
                if key not in seen_citations:
                    citations.append(SourceCitation(title=title, url=url))
                    seen_citations.add(key)
            if tool_name == "compare_swiss_health_insurance" and _is_comparison(
                artifact
            ):
                comparison = artifact
            elif tool_name == "search_swiss_locations":
                location_artifact = artifact

        response_message = next(
            (
                item
                for item in reversed(messages)
                if getattr(item, "name", None) not in tool_names
            ),
            messages[-1],
        )
        response = _message_text(response_message)
        if not response:
            raise RuntimeError("The LangChain agent returned an empty response")
        return GuideReply(
            message=response,
            comparison=comparison,
            citations=tuple(citations),
            profile=_profile_from_artifacts(
                comparison=comparison,
                location_artifact=location_artifact,
            ),
        )


def _tool_artifact(message: Any) -> dict[str, Any] | None:
    artifact = getattr(message, "artifact", None)
    if isinstance(artifact, dict):
        return artifact
    content = getattr(message, "content", None)
    if isinstance(content, dict):
        return content
    text = _message_text(message)
    if not text:
        return None
    try:
        value = json.loads(text)
    except (TypeError, ValueError):
        return None
    return value if isinstance(value, dict) else None


def _is_comparison(value: dict[str, Any]) -> bool:
    return (
        isinstance(value.get("query"), dict)
        and isinstance(value.get("offers"), list)
        and isinstance(value.get("cheapest_by_deductible"), list)
        and isinstance(value.get("cheapest_by_model"), list)
        and isinstance(value.get("cheapest_by_deductible_and_model"), list)
    )


def _profile_from_artifacts(
    *,
    comparison: dict[str, Any] | None,
    location_artifact: dict[str, Any] | None,
) -> dict[str, Any] | None:
    if comparison is None:
        return _location_only_profile(location_artifact)
    query = comparison.get("query")
    if not isinstance(query, dict):
        return _location_only_profile(location_artifact)

    profile: dict[str, Any] = {}
    resolved = _resolved_location(location_artifact, query=query)
    if resolved is not None:
        profile["resolved_location"] = resolved
    for source_name, profile_name in (
        ("birth_year", "birth_year"),
        ("age_category", "age_category"),
        ("accident_coverage", "accident_coverage"),
        ("insurance_models", "insurance_models"),
        ("deductibles", "deductibles"),
    ):
        if source_name in query:
            profile[profile_name] = query[source_name]
    return profile or None


def _location_only_profile(
    location_artifact: dict[str, Any] | None,
) -> dict[str, Any] | None:
    resolved = _resolved_location(location_artifact, query=None)
    return {"resolved_location": resolved} if resolved is not None else None


def _resolved_location(
    location_artifact: dict[str, Any] | None,
    *,
    query: dict[str, Any] | None,
) -> dict[str, Any] | None:
    if location_artifact is None:
        return None
    raw_locations = location_artifact.get("locations")
    if not isinstance(raw_locations, list):
        return None
    locations = [item for item in raw_locations if isinstance(item, dict)]
    if query is not None:
        matching = [
            item
            for item in locations
            if item.get("canton") == query.get("canton")
            and item.get("premium_region") == query.get("region")
        ]
        if len(matching) == 1:
            locations = matching
    if len(locations) != 1:
        return None
    location = locations[0]
    required = (
        "postal_code",
        "locality",
        "municipality_id",
        "municipality_name",
        "label",
        "canton",
        "premium_region",
    )
    if not all(isinstance(location.get(field), str) for field in required):
        return None
    return {field: location[field] for field in required}

