from decimal import Decimal

import pytest

from compare_insurance_api.domain.models import (
    AgeCategory,
    CostRelation,
    Deductible,
    DomainValidationError,
    InsuranceModel,
    PremiumOffer,
    RankedDeductibleGroup,
    SearchCriteria,
)
from compare_insurance_api.domain.services import (
    cheapest_offers_by_deductible,
    cheapest_offers_by_deductible_and_model,
    cheapest_offers_by_model,
    paginate_ranked_premium_offers,
    rank_premium_offers,
    ranked_offers_by_deductible,
)


def test_uses_the_official_2027_priminfo_model_categories() -> None:
    assert {model.value for model in InsuranceModel} == {
        "standard",
        "flex",
        "praxis",
        "tel_dig",
        "pharm",
    }


def make_offer(
    *,
    insurer_id: str,
    plan_id: str,
    monthly_premium: str,
    deductible: Deductible = Deductible.CHF_2500,
    insurance_model: InsuranceModel = InsuranceModel.TEL_DIG,
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
        insurance_model=insurance_model,
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
        insurance_models=(InsuranceModel.STANDARD, InsuranceModel.TEL_DIG),
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


def test_search_criteria_requires_a_bounded_top_n() -> None:
    with pytest.raises(DomainValidationError, match="top_n must be between 1 and 10"):
        SearchCriteria(
            canton="ZH",
            region="1",
            age_category=AgeCategory.ADULT,
            accident_coverage=False,
            deductibles=(Deductible.CHF_2500,),
            insurance_models=(InsuranceModel.TEL_DIG,),
            premium_year=2027,
            top_n=None,  # type: ignore[arg-type]
        )


def test_grouped_ranking_is_a_domain_rule_over_the_complete_eligible_set() -> None:
    criteria = SearchCriteria(
        canton="ZH",
        region="1",
        age_category=AgeCategory.ADULT,
        accident_coverage=False,
        deductibles=(Deductible.CHF_300, Deductible.CHF_2500),
        insurance_models=(InsuranceModel.STANDARD, InsuranceModel.TEL_DIG),
        premium_year=2027,
        top_n=2,
    )
    offers = [
        make_offer(
            insurer_id="standard-low",
            plan_id="1",
            monthly_premium="400.00",
            deductible=Deductible.CHF_300,
            insurance_model=InsuranceModel.STANDARD,
        ),
        make_offer(
            insurer_id="standard-near",
            plan_id="2",
            monthly_premium="405.00",
            deductible=Deductible.CHF_300,
            insurance_model=InsuranceModel.STANDARD,
        ),
        make_offer(
            insurer_id="telmed-expensive",
            plan_id="3",
            monthly_premium="406.00",
            deductible=Deductible.CHF_300,
            insurance_model=InsuranceModel.TEL_DIG,
        ),
    ]

    groups = ranked_offers_by_deductible(offers, criteria=criteria)

    assert all(isinstance(group, RankedDeductibleGroup) for group in groups)
    assert [int(group.deductible_chf) for group in groups] == [300, 2500]
    assert groups[0].all_selected_models.total_eligible_offers == 3
    assert groups[0].all_selected_models.within_five_offer_count == 2
    assert len(groups[0].all_selected_models.offers) == 2
    assert [group.insurance_model for group in groups[0].models] == [
        InsuranceModel.STANDARD,
        InsuranceModel.TEL_DIG,
    ]
    assert groups[1].all_selected_models.total_eligible_offers == 0


def test_offer_pagination_preserves_global_ranks_and_stable_differences() -> None:
    offers = [
        make_offer(
            insurer_id=insurer_id,
            plan_id=plan_id,
            monthly_premium=monthly,
        )
        for insurer_id, plan_id, monthly in [
            ("B", "2", "300.00"),
            ("A", "1", "300.00"),
            ("C", "3", "304.00"),
            ("D", "4", "310.00"),
            ("E", "5", "320.00"),
        ]
    ]

    page = paginate_ranked_premium_offers(offers, offset=1, limit=2)

    assert page.total_eligible_offers == 5
    assert page.offset == 1
    assert page.limit == 2
    assert page.has_more is True
    assert [(item.rank, item.offer.insurer_id) for item in page.offers] == [
        (2, "B"),
        (3, "C"),
    ]
    assert page.offers[0].monthly_difference_from_cheapest_chf == Decimal("0.00")
    assert page.offers[1].monthly_difference_from_cheapest_chf == Decimal("4.00")


@pytest.mark.parametrize(("offset", "limit"), [(-1, 10), (0, 0), (0, 51)])
def test_offer_pagination_enforces_public_page_bounds(offset: int, limit: int) -> None:
    with pytest.raises(ValueError):
        paginate_ranked_premium_offers([], offset=offset, limit=limit)


def test_cheapest_by_deductible_uses_all_eligible_offers() -> None:
    offers = [
        make_offer(
            insurer_id="300-expensive",
            plan_id="a",
            monthly_premium="410.00",
            deductible=Deductible.CHF_300,
        ),
        make_offer(
            insurer_id="2500-cheap",
            plan_id="b",
            monthly_premium="300.00",
            deductible=Deductible.CHF_2500,
        ),
        make_offer(
            insurer_id="300-cheap",
            plan_id="c",
            monthly_premium="390.00",
            deductible=Deductible.CHF_300,
        ),
    ]

    grouped = cheapest_offers_by_deductible(offers)

    assert [(int(offer.deductible), offer.insurer_id) for offer in grouped] == [
        (300, "300-cheap"),
        (2500, "2500-cheap"),
    ]


def test_cheapest_by_model_is_stable_and_model_ordered() -> None:
    standard = make_offer(
        insurer_id="standard",
        plan_id="1",
        monthly_premium="340.00",
        insurance_model=InsuranceModel.STANDARD,
    )
    telmed_expensive = make_offer(
        insurer_id="telmed-expensive",
        plan_id="2",
        monthly_premium="330.00",
    )
    telmed_cheapest = make_offer(
        insurer_id="telmed-cheap",
        plan_id="3",
        monthly_premium="310.00",
    )
    grouped = cheapest_offers_by_model(
        [telmed_expensive, standard, telmed_cheapest]
    )

    assert [(offer.insurance_model, offer.insurer_id) for offer in grouped] == [
        (InsuranceModel.STANDARD, "standard"),
        (InsuranceModel.TEL_DIG, "telmed-cheap"),
    ]


def test_cheapest_by_deductible_and_model_returns_each_available_cell() -> None:
    offers = [
        make_offer(
            insurer_id="standard-300",
            plan_id="1",
            monthly_premium="400.00",
            deductible=Deductible.CHF_300,
            insurance_model=InsuranceModel.STANDARD,
        ),
        make_offer(
            insurer_id="telmed-300",
            plan_id="2",
            monthly_premium="370.00",
            deductible=Deductible.CHF_300,
        ),
        make_offer(
            insurer_id="telmed-2500",
            plan_id="3",
            monthly_premium="290.00",
            deductible=Deductible.CHF_2500,
        ),
    ]

    grouped = cheapest_offers_by_deductible_and_model(offers)

    assert [
        (int(offer.deductible), offer.insurance_model, offer.insurer_id)
        for offer in grouped
    ] == [
        (300, InsuranceModel.STANDARD, "standard-300"),
        (300, InsuranceModel.TEL_DIG, "telmed-300"),
        (2500, InsuranceModel.TEL_DIG, "telmed-2500"),
    ]

