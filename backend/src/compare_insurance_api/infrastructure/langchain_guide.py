"""LangChain implementation of the application-layer insurance guide port."""

from functools import lru_cache
import os
from typing import Any

from langchain.agents import create_agent
from langgraph.checkpoint.memory import InMemorySaver

from compare_insurance_api.application.use_cases import ComparePremiums
from compare_insurance_api.infrastructure.langchain_tools import (
    build_premium_comparison_tool,
)
from compare_insurance_api.infrastructure.supabase_repository import (
    SupabasePremiumRepository,
)


SYSTEM_PROMPT = """
You are the Compare Insurance guide for Swiss compulsory basic health
insurance (OKP/AOS). Help users understand the inputs needed for a neutral
premium comparison: canton and official premium region, age category, deductible,
insurance model, accident coverage, and premium year.

Rules:
- Be concise, calm, and clear. Prefer plain language over insurance jargon.
- Gender does not affect compulsory basic-insurance premiums. Explain this if
  the user asks, and never request gender for a basic-insurance comparison.
- Never invent an insurer, premium, ranking, saving, eligibility decision, or
  provider-network rule.
- Use compare_swiss_health_insurance only when every required input is known:
  canton, official premium region, age category, deductible choices, insurance
  model choices, accident coverage, and premium year.
- All premiums, rankings, and differences must come from that tool. Never do
  premium arithmetic yourself and never alter the tool's factual output.
- Never write or execute SQL, construct database queries, or request database
  credentials. The typed comparison tool and repository own every data query.
- If the catalogue is unavailable or no offers match, state that plainly.
- Explain that a higher deductible can lower the premium while increasing the
  user's possible out-of-pocket cost.
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
    """Create one in-process agent and conversation checkpointer."""

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
            )
        ],
        system_prompt=SYSTEM_PROMPT,
        checkpointer=InMemorySaver(),
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

    async def reply(self, *, message: str, thread_id: str) -> str:
        agent = get_langchain_agent()
        result = await agent.ainvoke(
            {"messages": [{"role": "user", "content": message}]},
            config={"configurable": {"thread_id": thread_id}},
        )
        messages = result.get("messages", [])
        if not messages:
            raise RuntimeError("The LangChain agent returned no messages")
        response = _message_text(messages[-1])
        if not response:
            raise RuntimeError("The LangChain agent returned an empty response")
        return response

