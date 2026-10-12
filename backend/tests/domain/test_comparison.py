from decimal import Decimal

import pytest

from compare_insurance_api.domain.models import (
    AgeCategory,
    CostRelation,
    Deductible,
    DomainValidationError,
    InsuranceModel,
    PremiumOffer,
    SearchCriteria,
)
from compare_insurance_api.domain.services import rank_premium_offers


def make_offer(
    *,
    insurer_id: str,
    plan_id: str,
    monthly_premium: str,
    deductible: Deductible = Deductible.CHF_2500,
) -> PremiumOffer:
    return PremiumOffer(
        insurer_id=insurer_id,
        insurer_name=f"Insurer {insurer_id}",
        plan_id=plan_id,
        product_name=f"Plan {plan_id}",
        municipality_id="261",
        canton="ZH",
        region="1",
        age_category=AgeCategory.ADULT,
        deductible=deductible,
        accident_coverage=False,
        insurance_model=InsuranceModel.TELMED,
        premium_year=2027,
        monthly_premium_chf=Decimal(monthly_premium),
    )


def test_adult_criteria_accept_requested_deductibles() -> None:
    criteria = SearchCriteria(
        canton="ZH",
        region="1",
        age_category=AgeCategory.ADULT,
        accident_coverage=False,
        deductibles=(
            Deductible.CHF_300,
            Deductible.CHF_500,
            Deductible.CHF_1000,
            Deductible.CHF_1500,
            Deductible.CHF_2000,
            Deductible.CHF_2500,
        ),
        insurance_models=(InsuranceModel.STANDARD, InsuranceModel.TELMED),
        premium_year=2027,
    )

    assert criteria.top_n == 10


@pytest.mark.parametrize(
    ("age_category", "deductible"),
    [
        (AgeCategory.CHILD, Deductible.CHF_1000),
        (AgeCategory.ADULT, Deductible.CHF_0),
    ],
)
def test_criteria_rejects_age_incompatible_deductibles(
    age_category: AgeCategory,
    deductible: Deductible,
) -> None:
    with pytest.raises(DomainValidationError, match="not valid"):
        SearchCriteria(
            canton="ZH",
            region="1",
            age_category=age_category,
            accident_coverage=True,
            deductibles=(deductible,),
            insurance_models=(InsuranceModel.STANDARD,),
            premium_year=2027,
        )


def test_ranking_is_cheapest_first_with_deterministic_ties() -> None:
    offers = [
        make_offer(insurer_id="B", plan_id="2", monthly_premium="350.00"),
        make_offer(insurer_id="C", plan_id="3", monthly_premium="320.00"),
        make_offer(insurer_id="A", plan_id="1", monthly_premium="320.00"),
    ]

    ranked = rank_premium_offers(offers, top_n=10)

    assert [(item.rank, item.offer.insurer_id) for item in ranked] == [
        (1, "A"),
        (2, "C"),
        (3, "B"),
    ]
    assert ranked[0].monthly_difference_from_cheapest_chf == Decimal("0.00")
    assert ranked[2].monthly_difference_from_cheapest_chf == Decimal("30.00")
    assert ranked[2].annual_difference_from_cheapest_chf == Decimal("360.00")
    assert ranked[0].offer.annual_premium_chf == Decimal("3840.00")


@pytest.mark.parametrize(
    ("reference", "expected_relation", "expected_difference"),
    [
        ("400.00", CostRelation.CHEAPER, "80.00"),
        ("320.00", CostRelation.SAME, "0.00"),
        ("300.00", CostRelation.MORE_EXPENSIVE, "20.00"),
    ],
)
def test_reference_comparison_never_uses_negative_savings(
    reference: str,
    expected_relation: CostRelation,
    expected_difference: str,
) -> None:
    ranked = rank_premium_offers(
        [make_offer(insurer_id="A", plan_id="1", monthly_premium="320.00")],
        top_n=10,
        reference_monthly_premium_chf=Decimal(reference),
    )

    comparison = ranked[0].reference_comparison
    assert comparison is not None
    assert comparison.relation is expected_relation
    assert comparison.monthly_difference_chf == Decimal(expected_difference)
    assert comparison.annual_difference_chf == Decimal(expected_difference) * 12


def test_ranking_honours_top_n_without_changing_total_input() -> None:
    offers = [
        make_offer(insurer_id=str(index), plan_id=str(index), monthly_premium=str(300 + index))
        for index in range(12)
    ]

    ranked = rank_premium_offers(offers, top_n=3)

    assert len(ranked) == 3
    assert [item.rank for item in ranked] == [1, 2, 3]

