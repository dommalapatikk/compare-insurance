"""Pydantic request and response contracts for the HTTP boundary."""

from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field

from compare_insurance_api.domain.models import CostRelation, Deductible


ADULT_DEDUCTIBLE_VALUES = (
    Deductible.CHF_300,
    Deductible.CHF_500,
    Deductible.CHF_1000,
    Deductible.CHF_1500,
    Deductible.CHF_2000,
    Deductible.CHF_2500,
)


class HealthResponse(BaseModel):
    status: str


class PremiumSearchRequest(BaseModel):
    """Transport representation of premium-search filters."""

    canton: str | None = Field(default=None, min_length=2, max_length=2)
    region: str | None = Field(default=None, min_length=1, max_length=100)
    postal_code: str | None = Field(default=None, pattern=r"^\d{4}$")
    municipality_id: str | None = Field(default=None, min_length=1, max_length=20)
    birth_date: date | None = None
    age: int | None = Field(default=None, ge=0, le=120)
    deductibles: list[Deductible] = Field(
        default_factory=lambda: list(ADULT_DEDUCTIBLE_VALUES),
        min_length=1,
    )
    accident_coverage: bool = True
    insurance_model: str | None = Field(default=None, min_length=1, max_length=100)
    year: int | None = Field(default=None, ge=2020, le=2100)
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
    canton: str
    region: str | None = None
    postal_code: str | None = None
    deductible_chf: Deductible
    accident_coverage: bool
    insurance_model: str
    monthly_premium_chf: Decimal = Field(ge=0, decimal_places=2)
    annual_premium_chf: Decimal = Field(ge=0, decimal_places=2)
    monthly_difference_from_cheapest_chf: Decimal = Field(ge=0, decimal_places=2)
    annual_difference_from_cheapest_chf: Decimal = Field(ge=0, decimal_places=2)
    reference_comparison: ReferenceComparisonResponse | None = None


class PremiumSearchResponse(BaseModel):
    query: PremiumSearchRequest
    source_year: int
    source_name: str
    total_eligible_offers: int = Field(ge=0)
    offers: list[PremiumOfferResponse]


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2_000)
    thread_id: str = Field(min_length=8, max_length=100, pattern=r"^[A-Za-z0-9_-]+$")


class ChatResponse(BaseModel):
    message: str
    thread_id: str
    data_status: str = "comparison_search_not_implemented"

