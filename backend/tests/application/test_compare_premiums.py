import asyncio
from decimal import Decimal

from compare_insurance_api.application.use_cases import (
    ComparePremiums,
    ExplainInsuranceChoices,
)
from compare_insurance_api.domain.models import (
    AgeCategory,
    Deductible,
    InsuranceModel,
    PremiumOffer,
    SearchCriteria,
)


class InMemoryPremiumRepository:
    def __init__(self, offers: list[PremiumOffer]) -> None:
        self.offers = offers
        self.received_criteria: SearchCriteria | None = None

    async def find_matching(self, criteria: SearchCriteria) -> list[PremiumOffer]:
        self.received_criteria = criteria
        return self.offers


class StubInsuranceGuide:
    def __init__(self) -> None:
        self.received: tuple[str, str] | None = None

    async def reply(self, *, message: str, thread_id: str) -> str:
        self.received = (message, thread_id)
        return "A deterministic explanation"


def make_criteria() -> SearchCriteria:
    return SearchCriteria(
        canton="ZH",
        region="1",
        age_category=AgeCategory.ADULT,
        accident_coverage=False,
        deductibles=(Deductible.CHF_2500,),
        insurance_models=(InsuranceModel.TELMED,),
        premium_year=2027,
        top_n=1,
        reference_monthly_premium_chf=Decimal("400.00"),
    )


def make_offer(insurer_id: str, monthly: str) -> PremiumOffer:
    return PremiumOffer(
        insurer_id=insurer_id,
        insurer_name=f"Insurer {insurer_id}",
        plan_id=insurer_id,
        product_name=f"Product {insurer_id}",
        municipality_id="261",
        canton="ZH",
        region="1",
        age_category=AgeCategory.ADULT,
        deductible=Deductible.CHF_2500,
        accident_coverage=False,
        insurance_model=InsuranceModel.TELMED,
        premium_year=2027,
        monthly_premium_chf=Decimal(monthly),
    )


def test_compare_premiums_orchestrates_repository_and_domain_ranking() -> None:
    repository = InMemoryPremiumRepository(
        [make_offer("expensive", "360.00"), make_offer("cheap", "320.00")]
    )
    criteria = make_criteria()

    result = asyncio.run(ComparePremiums(repository).execute(criteria))

    assert repository.received_criteria is criteria
    assert result.total_eligible_offers == 2
    assert len(result.offers) == 1
    assert result.offers[0].offer.insurer_id == "cheap"
    assert result.offers[0].reference_comparison is not None
    assert result.offers[0].reference_comparison.monthly_difference_chf == Decimal("80.00")


def test_explain_insurance_choices_uses_the_guide_port() -> None:
    guide = StubInsuranceGuide()

    response = asyncio.run(
        ExplainInsuranceChoices(guide).execute(
            message="Explain Telmed",
            thread_id="thread-123",
        )
    )

    assert response == "A deterministic explanation"
    assert guide.received == ("Explain Telmed", "thread-123")

