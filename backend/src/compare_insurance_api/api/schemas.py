"""Pydantic request and response contracts for the HTTP boundary."""

from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field

from compare_insurance_api.domain.models import (
    AgeCategory,
    CostRelation,
    Deductible,
    InsuranceModel,
)


class HealthResponse(BaseModel):
    status: str


class PremiumSearchRequest(BaseModel):
    """Transport representation of premium-search filters."""

    canton: str = Field(min_length=2, max_length=2)
    region: str = Field(min_length=1, max_length=8)
    age_category: AgeCategory
    birth_year: int | None = Field(default=None, ge=1900, le=2100)
    deductibles: list[Deductible] = Field(min_length=1)
    accident_coverage: bool = True
    insurance_models: list[InsuranceModel] = Field(min_length=1)
    year: int = Field(default=2027, ge=2020, le=2100)
    top_n: int = Field(default=10, ge=1, le=10)
    reference_monthly_premium_chf: Decimal | None = Field(
        default=None,
        ge=0,
        decimal_places=2,
    )


class ReferenceComparisonResponse(BaseModel):
    relation: CostRelation
    monthly_difference_chf: Decimal = Field(ge=0, decimal_places=2)
    annual_difference_chf: Decimal = Field(ge=0, decimal_places=2)


class PremiumOfferResponse(BaseModel):
    rank: int = Field(ge=1)
    insurer_id: str
    insurer_name: str
    plan_id: str | None = None
    product_name: str
    canton: str
    region: str
    deductible_chf: Deductible
    accident_coverage: bool
    insurance_model: str
    monthly_premium_chf: Decimal = Field(ge=0, decimal_places=2)
    annual_premium_chf: Decimal = Field(ge=0, decimal_places=2)
    monthly_difference_from_cheapest_chf: Decimal = Field(ge=0, decimal_places=2)
    annual_difference_from_cheapest_chf: Decimal = Field(ge=0, decimal_places=2)
    reference_comparison: ReferenceComparisonResponse | None = None


class CategoryMinimumResponse(BaseModel):
    insurer_id: str
    insurer_name: str
    plan_id: str | None = None
    product_name: str
    canton: str
    region: str
    deductible_chf: Deductible
    accident_coverage: bool
    insurance_model: str
    monthly_premium_chf: Decimal = Field(ge=0, decimal_places=2)
    annual_premium_chf: Decimal = Field(ge=0, decimal_places=2)


class RankedOfferSetResponse(BaseModel):
    total_eligible_offers: int = Field(ge=0)
    within_five_offer_count: int = Field(ge=0)
    within_five_insurer_count: int = Field(ge=0)
    offers: list[PremiumOfferResponse]


class RankedModelOfferSetResponse(BaseModel):
    insurance_model: InsuranceModel
    ranking: RankedOfferSetResponse


class RankedDeductibleGroupResponse(BaseModel):
    deductible_chf: Deductible
    all_selected_models: RankedOfferSetResponse
    models: list[RankedModelOfferSetResponse]


class PremiumSearchResponse(BaseModel):
    query: PremiumSearchRequest
    source_year: int
    source_name: str
    total_eligible_offers: int = Field(ge=0)
    offers: list[PremiumOfferResponse]
    cheapest_by_deductible: list[CategoryMinimumResponse]
    cheapest_by_model: list[CategoryMinimumResponse]
    cheapest_by_deductible_and_model: list[CategoryMinimumResponse]
    ranked_by_deductible: list[RankedDeductibleGroupResponse] = Field(default_factory=list)


class LocationResponse(BaseModel):
    postal_code: str
    locality: str
    municipality_id: str
    municipality_name: str
    canton: str
    premium_region: str
    label: str


class LocationSearchResponse(BaseModel):
    query: str
    premium_year: int
    source_name: str
    locations: list[LocationResponse]


class ChatHistoryItem(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=2_000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2_000)
    thread_id: str = Field(min_length=8, max_length=100, pattern=r"^[A-Za-z0-9_-]+$")
    history: list[ChatHistoryItem] = Field(default_factory=list, max_length=12)


class CitationResponse(BaseModel):
    title: str
    url: str


class ResolvedLocationProfileResponse(BaseModel):
    postal_code: str | None = None
    locality: str | None = None
    municipality_id: str | None = None
    municipality_name: str | None = None
    label: str
    canton: str
    premium_region: str


class ChatProfileResponse(BaseModel):
    resolved_location: ResolvedLocationProfileResponse | None = None
    birth_year: int | None = Field(default=None, ge=1900, le=2100)
    age_category: AgeCategory | None = None
    accident_coverage: bool | None = None
    insurance_models: list[InsuranceModel] | None = None
    deductibles: list[Deductible] | None = None


class ChatResponse(BaseModel):
    message: str
    thread_id: str
    data_status: str = "comparison_available_when_catalogue_configured"
    comparison: PremiumSearchResponse | None = None
    citations: list[CitationResponse] | None = None
    profile: ChatProfileResponse | None = None

