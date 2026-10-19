import asyncio
from decimal import Decimal

from compare_insurance_api.application.ports import (
    ChatHistoryMessage,
    GuideReply,
    SourceCitation,
)
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
        self.received: tuple[str, str, tuple[ChatHistoryMessage, ...]] | None = None

    async def reply(
        self,
        *,
        message: str,
        thread_id: str,
        history: tuple[ChatHistoryMessage, ...],
    ) -> GuideReply:
        self.received = (message, thread_id, history)
        return GuideReply(
            message="A deterministic explanation",
            citations=(
                SourceCitation(
                    title="Official guidance",
                    url="https://www.ch.ch/en/health/health-insurance/",
                ),
            ),
        )


def make_criteria() -> SearchCriteria:
    return SearchCriteria(
        canton="ZH",
        region="1",
        age_category=AgeCategory.ADULT,
        accident_coverage=False,
        deductibles=(Deductible.CHF_2500,),
        insurance_models=(InsuranceModel.TEL_DIG,),
        premium_year=2027,
        top_n=1,
        reference_monthly_premium_chf=Decimal("400.00"),
    )


def make_offer(
    insurer_id: str,
    monthly: str,
    *,
    deductible: Deductible = Deductible.CHF_2500,
    model: InsuranceModel = InsuranceModel.TEL_DIG,
) -> PremiumOffer:
    return PremiumOffer(
        insurer_id=insurer_id,
        insurer_name=f"Insurer {insurer_id}",
        plan_id=insurer_id,
        product_name=f"Product {insurer_id}",
        municipality_id="261",
        canton="ZH",
        region="1",
        age_category=AgeCategory.ADULT,
        deductible=deductible,
        accident_coverage=False,
        insurance_model=model,
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
    assert result.cheapest_by_deductible[0].insurer_id == "cheap"
    assert result.cheapest_by_model[0].insurer_id == "cheap"
    assert result.cheapest_by_deductible_and_model[0].insurer_id == "cheap"
    assert result.ranked_by_deductible[0].deductible_chf == 2500
    assert result.ranked_by_deductible[0].all_selected_models.offers[0].offer.insurer_id == "cheap"


def test_compare_premiums_builds_independent_top_ten_for_each_franchise() -> None:
    offers = [
        make_offer(
            f"low-{index}",
            str(300 + index),
            deductible=Deductible.CHF_2500,
        )
        for index in range(12)
    ] + [
        make_offer(
            f"standard-{index}",
            str(500 + index),
            deductible=Deductible.CHF_300,
        )
        for index in range(12)
    ]
    criteria = SearchCriteria(
        canton="ZH",
        region="1",
        age_category=AgeCategory.ADULT,
        accident_coverage=False,
        deductibles=(Deductible.CHF_300, Deductible.CHF_2500),
        insurance_models=(InsuranceModel.TEL_DIG,),
        premium_year=2027,
        top_n=10,
    )

    result = asyncio.run(ComparePremiums(InMemoryPremiumRepository(offers)).execute(criteria))

    assert [group.deductible_chf for group in result.ranked_by_deductible] == [300, 2500]
    assert [group.all_selected_models.total_eligible_offers for group in result.ranked_by_deductible] == [12, 12]
    assert len(result.ranked_by_deductible[0].all_selected_models.offers) == 10
    assert result.ranked_by_deductible[0].all_selected_models.offers[0].offer.insurer_id == "standard-0"
    assert result.ranked_by_deductible[1].all_selected_models.offers[0].offer.insurer_id == "low-0"


def test_grouped_results_include_requested_empty_model_and_true_five_franc_counts() -> None:
    offers = [
        make_offer("a", "400.00"),
        make_offer("a-second", "404.99"),
        make_offer("b", "405.00"),
        make_offer("c", "405.01"),
    ]
    criteria = SearchCriteria(
        canton="ZH",
        region="1",
        age_category=AgeCategory.ADULT,
        accident_coverage=False,
        deductibles=(Deductible.CHF_2500,),
        insurance_models=(InsuranceModel.TEL_DIG, InsuranceModel.PRAXIS),
        premium_year=2027,
        top_n=10,
    )

    group = asyncio.run(
        ComparePremiums(InMemoryPremiumRepository(offers)).execute(criteria)
    ).ranked_by_deductible[0]

    assert group.all_selected_models.within_five_offer_count == 3
    assert group.all_selected_models.within_five_insurer_count == 3
    assert [model.insurance_model for model in group.models] == ["tel_dig", "praxis"]
    assert group.models[1].ranking.total_eligible_offers == 0
    assert group.models[1].ranking.offers == ()


def test_explain_insurance_choices_uses_the_guide_port() -> None:
    guide = StubInsuranceGuide()
    history = (
        ChatHistoryMessage(role="user", content="I live in Bern"),
        ChatHistoryMessage(role="assistant", content="What is your birth year?"),
    )

    response = asyncio.run(
        ExplainInsuranceChoices(guide).execute(
            message="Explain Telmed",
            thread_id="thread-123",
            history=history,
        )
    )

    assert response.message == "A deterministic explanation"
    assert response.citations[0].title == "Official guidance"
    assert guide.received == ("Explain Telmed", "thread-123", history)


def test_explain_insurance_choices_bounds_history_at_the_application_boundary() -> None:
    guide = StubInsuranceGuide()
    history = tuple(
        ChatHistoryMessage(role="user", content=f"message {index}")
        for index in range(20)
    )

    asyncio.run(
        ExplainInsuranceChoices(guide).execute(
            message="Continue",
            thread_id="thread-123",
            history=history,
        )
    )

    assert guide.received is not None
    assert len(guide.received[2]) == 12
    assert guide.received[2][0].content == "message 8"

