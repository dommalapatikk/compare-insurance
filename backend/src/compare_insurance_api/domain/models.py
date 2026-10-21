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

    @property
    def ordinary_source_subgroup(self) -> str:
        """BAG subgroup without optional multi-child premium discounts."""

        return {
            AgeCategory.CHILD: "K1",
            AgeCategory.YOUNG_ADULT: "J1",
            AgeCategory.ADULT: "E1",
        }[self]


def age_category_for_birth_year(
    birth_year: int,
    *,
    premium_year: int,
) -> AgeCategory:
    """Return the statutory category based on age at the end of the premium year."""

    if birth_year < 1900 or birth_year > premium_year:
        raise DomainValidationError(
            "birth_year must be between 1900 and the premium year"
        )
    age = premium_year - birth_year
    if age <= 18:
        return AgeCategory.CHILD
    if age <= 25:
        return AgeCategory.YOUNG_ADULT
    return AgeCategory.ADULT


class InsuranceModel(str, Enum):
    STANDARD = "standard"
    FLEX = "flex"
    PRAXIS = "praxis"
    TEL_DIG = "tel_dig"
    PHARM = "pharm"


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
class PremiumLocation:
    """A postcode/locality resolved to the official premium region."""

    postal_code: str
    locality: str
    municipality_id: str
    municipality_name: str
    canton: str
    premium_region: str

    def __post_init__(self) -> None:
        postal_code = self.postal_code.strip()
        if len(postal_code) != 4 or not postal_code.isdigit():
            raise DomainValidationError("postal_code must contain four digits")
        object.__setattr__(self, "postal_code", postal_code)

        for field_name in ("locality", "municipality_id", "municipality_name"):
            value = getattr(self, field_name).strip()
            if not value:
                raise DomainValidationError(f"{field_name} cannot be blank")
            object.__setattr__(self, field_name, value)

        canton = self.canton.strip().upper()
        if len(canton) != 2 or not canton.isalpha():
            raise DomainValidationError("canton must be a two-letter code")
        object.__setattr__(self, "canton", canton)

        premium_region = self.premium_region.removeprefix("PR_REG_").strip()
        if premium_region not in {"0", "1", "2", "3"}:
            raise DomainValidationError("premium_region must be 0, 1, 2, or 3")
        object.__setattr__(self, "premium_region", premium_region)

    @property
    def label(self) -> str:
        municipality = ""
        if self.locality.casefold() != self.municipality_name.casefold():
            municipality = f" ({self.municipality_name})"
        return f"{self.postal_code} {self.locality}{municipality}, {self.canton}"


@dataclass(frozen=True, slots=True)
class SearchCriteria:
    """Confirmed, normalized inputs for one premium comparison."""

    canton: str
    region: str
    age_category: AgeCategory
    accident_coverage: bool
    deductibles: tuple[Deductible, ...]
    insurance_models: tuple[InsuranceModel, ...]
    premium_year: int
    municipality_id: str | None = None
    top_n: int = 10
    reference_monthly_premium_chf: Decimal | None = None

    def __post_init__(self) -> None:
        normalized_canton = self.canton.strip().upper()
        if len(normalized_canton) != 2 or not normalized_canton.isalpha():
            raise DomainValidationError("canton must be a two-letter code")
        object.__setattr__(self, "canton", normalized_canton)

        normalized_region = self.region.removeprefix("PR_REG_").strip()
        if normalized_region not in {"0", "1", "2", "3"}:
            raise DomainValidationError("region must be 0, 1, 2, or 3")
        object.__setattr__(self, "region", normalized_region)

        if self.municipality_id is not None and not self.municipality_id.strip():
            raise DomainValidationError("municipality_id cannot be blank")
        if not self.deductibles:
            raise DomainValidationError("at least one deductible is required")
        if not self.insurance_models:
            raise DomainValidationError("at least one insurance model is required")
        if (
            not isinstance(self.top_n, int)
            or isinstance(self.top_n, bool)
            or not 1 <= self.top_n <= 10
        ):
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
    municipality_id: str | None
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


@dataclass(frozen=True, slots=True)
class RankedOfferSet:
    """A bounded ranking plus facts calculated over its complete eligible set."""

    total_eligible_offers: int
    within_five_offer_count: int
    within_five_insurer_count: int
    offers: tuple[RankedPremiumOffer, ...]


@dataclass(frozen=True, slots=True)
class RankedModelOfferSet:
    """The ranking for one requested insurance model."""

    insurance_model: InsuranceModel
    ranking: RankedOfferSet


@dataclass(frozen=True, slots=True)
class RankedDeductibleGroup:
    """Rankings for one requested deductible across selected models."""

    deductible_chf: Deductible
    all_selected_models: RankedOfferSet
    models: tuple[RankedModelOfferSet, ...]


@dataclass(frozen=True, slots=True)
class RankedPremiumOfferPage:
    """One bounded page from a single deductible/model comparison scope."""

    total_eligible_offers: int
    offset: int
    limit: int
    has_more: bool
    offers: tuple[RankedPremiumOffer, ...]

