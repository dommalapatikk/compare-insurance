"""Ports implemented by infrastructure adapters."""

from collections.abc import Sequence
from dataclasses import dataclass
from typing import Any, Literal, Protocol

from compare_insurance_api.domain.models import (
    PremiumLocation,
    PremiumOffer,
    SearchCriteria,
)


class PremiumRepository(Protocol):
    async def find_matching(
        self,
        criteria: SearchCriteria,
    ) -> Sequence[PremiumOffer]:
        """Return source-backed offers eligible for the confirmed criteria."""


class LocationRepository(Protocol):
    async def search(
        self,
        query: str,
        *,
        limit: int,
    ) -> Sequence[PremiumLocation]:
        """Return official postcode/municipality matches for a user query."""


@dataclass(frozen=True, slots=True)
class ChatHistoryMessage:
    """One bounded, caller-supplied conversational turn."""

    role: Literal["user", "assistant"]
    content: str


@dataclass(frozen=True, slots=True)
class SourceCitation:
    """A source reference extracted from a trusted tool result."""

    title: str
    url: str


@dataclass(frozen=True, slots=True)
class GuideReply:
    """Application-facing agent result with optional trusted tool artifacts."""

    message: str
    comparison: dict[str, Any] | None = None
    citations: tuple[SourceCitation, ...] = ()
    profile: dict[str, Any] | None = None


class InsuranceGuide(Protocol):
    async def reply(
        self,
        *,
        message: str,
        thread_id: str,
        history: tuple[ChatHistoryMessage, ...],
    ) -> GuideReply:
        """Guide a conversation and return only trusted structured artifacts."""

