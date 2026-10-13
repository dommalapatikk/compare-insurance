"""Backward-compatible imports for the LangChain infrastructure adapter.

New code should depend on the application ``InsuranceGuide`` port rather than
importing this module directly.
"""

from compare_insurance_api.infrastructure.langchain_guide import (
    LangChainInsuranceGuide,
    SYSTEM_PROMPT,
    get_langchain_agent,
)


get_insurance_agent = get_langchain_agent


async def chat_with_insurance_agent(message: str, thread_id: str) -> str:
    reply = await LangChainInsuranceGuide().reply(
        message=message,
        thread_id=thread_id,
        history=(),
    )
    return reply.message


__all__ = [
    "SYSTEM_PROMPT",
    "chat_with_insurance_agent",
    "get_insurance_agent",
]

