import pytest

from compare_insurance_api.domain.models import (
    AgeCategory,
    DomainValidationError,
    PremiumLocation,
    age_category_for_birth_year,
)


@pytest.mark.parametrize(
    ("birth_year", "expected"),
    [
        (2009, AgeCategory.CHILD),
        (2008, AgeCategory.YOUNG_ADULT),
        (2002, AgeCategory.YOUNG_ADULT),
        (2001, AgeCategory.ADULT),
    ],
)
def test_derives_official_age_category_for_premium_year(
    birth_year: int,
    expected: AgeCategory,
) -> None:
    assert age_category_for_birth_year(birth_year, premium_year=2027) is expected


def test_rejects_birth_year_after_premium_year() -> None:
    with pytest.raises(DomainValidationError, match="birth_year"):
        age_category_for_birth_year(2028, premium_year=2027)


def test_location_normalizes_source_codes_and_builds_customer_label() -> None:
    location = PremiumLocation(
        postal_code="3174",
        locality="Thörishaus",
        municipality_id="355",
        municipality_name="Köniz",
        canton="be",
        premium_region="PR_REG_2",
    )

    assert location.canton == "BE"
    assert location.premium_region == "2"
    assert location.label == "3174 Thörishaus (Köniz), BE"


def test_location_rejects_invalid_postal_code() -> None:
    with pytest.raises(DomainValidationError, match="postal_code"):
        PremiumLocation(
            postal_code="301",
            locality="Bern",
            municipality_id="351",
            municipality_name="Bern",
            canton="BE",
            premium_region="1",
        )
