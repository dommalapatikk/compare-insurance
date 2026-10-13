from decimal import Decimal

import pytest

from compare_insurance_api.infrastructure.priminfo_parity import (
    ParityError,
    compare_priminfo_with_product,
    parse_priminfo_offers,
)


PRIMINFO_TABLE = """
<table id="savingsTable">
  <thead><tr><th>Krankenkasse</th><th>Modell</th><th>Prämie</th></tr></thead>
  <tbody>
    <tr><th>Sanitas</th><th>Grundversicherung</th><td>608.60</td><td>4.75</td></tr>
    <tr><th>Vivao Sympany</th><th>Grundversicherung</th><td>615.70</td><td>4.75</td></tr>
  </tbody>
</table>
"""


def test_parses_official_priminfo_monthly_premiums() -> None:
    offers = parse_priminfo_offers(PRIMINFO_TABLE)

    assert [(offer.insurer, offer.model, offer.monthly_premium) for offer in offers] == [
        ("Sanitas", "Grundversicherung", Decimal("608.60")),
        ("Vivao Sympany", "Grundversicherung", Decimal("615.70")),
    ]


def test_compares_the_same_query_count_and_top_prices() -> None:
    official = parse_priminfo_offers(PRIMINFO_TABLE)
    product = {
        "total_eligible_offers": 2,
        "offers": [
            {"monthly_premium_chf": "608.60"},
            {"monthly_premium_chf": "615.70"},
        ],
    }

    result = compare_priminfo_with_product(official, product)

    assert result.offer_count == 2
    assert result.compared_prices == 2
    assert result.lowest_monthly_premium == Decimal("608.60")


def test_rejects_a_price_mismatch() -> None:
    official = parse_priminfo_offers(PRIMINFO_TABLE)
    product = {
        "total_eligible_offers": 2,
        "offers": [
            {"monthly_premium_chf": "608.65"},
            {"monthly_premium_chf": "615.70"},
        ],
    }

    with pytest.raises(ParityError, match="premium mismatch"):
        compare_priminfo_with_product(official, product)
