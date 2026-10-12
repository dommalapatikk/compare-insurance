"""Domain entities, value objects, and invariants.

This module deliberately has no FastAPI, Pydantic, database, or LangChain
imports. The comparison rules can therefore be tested without infrastructure.
"""

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from enum import Enum, IntEnum


MONEY_QUANTUM = Decimal("0.01")


class DomainValidationError(ValueError):
    """Raised when a value would create an invalid comparison model."""


class AgeCategory(str, Enum):
    CHILD = "child"
    YOUNG_ADULT = "young_adult"
    ADULT = "adult"


class InsuranceModel(str, Enum):
    STANDARD = "standard"
    FAMILY_DOCTOR = "family_doctor"
    HMO = "hmo"
    TELMED = "telmed"
    OTHER = "other"


class Deductible(IntEnum):
    CHF_0 = 0
    CHF_100 = 100
    CHF_200 = 200
    CHF_300 = 300
    CHF_400 = 400
    CHF_500 = 500
    CHF_600 = 600
    CHF_1000 = 1000
    CHF_1500 = 1500
    CHF_2000 = 2000
    CHF_2500 = 2500


CHILD_DEDUCTIBLES = frozenset(
    {
        Deductible.CHF_0,
        Deductible.CHF_100,
        Deductible.CHF_200,
        Deductible.CHF_300,
        Deductible.CHF_400,
        Deductible.CHF_500,
        Deductible.CHF_600,
    }
)

ADULT_DEDUCTIBLES = frozenset(
    {
        Deductible.CHF_300,
        Deductible.CHF_500,
        Deductible.CHF_1000,
        Deductible.CHF_1500,
        Deductible.CHF_2000,
        Deductible.CHF_2500,
    }
)


class CostRelation(str, Enum):
    """The offer's price relationship to a user-supplied reference."""

    CHEAPER = "cheaper"
    SAME = "same"
    MORE_EXPENSIVE = "more_expensive"


def money(value: Decimal) -> Decimal:
    """Normalize a CHF amount to the product's two-decimal precision."""

    return value.quantize(MONEY_QUANTUM, rounding=ROUND_HALF_UP)


def valid_deductibles(age_category: AgeCategory) -> frozenset[Deductible]:
    if age_category is AgeCategory.CHILD:
        return CHILD_DEDUCTIBLES
    return ADULT_DEDUCTIBLES


@dataclass(frozen=True, slots=True)
class SearchCriteria:
    """Confirmed, normalized inputs for one premium comparison."""

    municipality_id: str
    age_category: AgeCategory
    accident_coverage: bool
    deductibles: tuple[Deductible, ...]
    insurance_models: tuple[InsuranceModel, ...]
    premium_year: int
    top_n: int = 10
    reference_monthly_premium_chf: Decimal | None = None

    def __post_init__(self) -> None:
        if not self.municipality_id.strip():
            raise DomainValidationError("municipality_id is required")
        if not self.deductibles:
            raise DomainValidationError("at least one deductible is required")
        if not self.insurance_models:
            raise DomainValidationError("at least one insurance model is required")
        if not 1 <= self.top_n <= 10:
            raise DomainValidationError("top_n must be between 1 and 10")
        if self.premium_year < 2020:
            raise DomainValidationError("premium_year must be 2020 or later")

        allowed = valid_deductibles(self.age_category)
        invalid = sorted(set(self.deductibles) - allowed)
        if invalid:
            values = ", ".join(f"CHF {int(item)}" for item in invalid)
            raise DomainValidationError(
                f"{values} is not valid for age category {self.age_category.value}"
            )

        reference = self.reference_monthly_premium_chf
        if reference is not None:
            if reference < 0:
                raise DomainValidationError("reference premium cannot be negative")
            object.__setattr__(self, "reference_monthly_premium_chf", money(reference))


@dataclass(frozen=True, slots=True)
class PremiumOffer:
    """One source-backed, eligible insurer/product combination."""

    insurer_id: str
    insurer_name: str
    plan_id: str
    product_name: str
    municipality_id: str
    canton: str
    region: str
    age_category: AgeCategory
    deductible: Deductible
    accident_coverage: bool
    insurance_model: InsuranceModel
    premium_year: int
    monthly_premium_chf: Decimal

    def __post_init__(self) -> None:
        if self.monthly_premium_chf < 0:
            raise DomainValidationError("monthly premium cannot be negative")
        object.__setattr__(
            self,
            "monthly_premium_chf",
            money(self.monthly_premium_chf),
        )

    @property
    def annual_premium_chf(self) -> Decimal:
        return money(self.monthly_premium_chf * 12)


@dataclass(frozen=True, slots=True)
class ReferenceComparison:
    relation: CostRelation
    monthly_difference_chf: Decimal
    annual_difference_chf: Decimal


@dataclass(frozen=True, slots=True)
class RankedPremiumOffer:
    rank: int
    offer: PremiumOffer
    monthly_difference_from_cheapest_chf: Decimal
    annual_difference_from_cheapest_chf: Decimal
    reference_comparison: ReferenceComparison | None

