from decimal import Decimal

import pytest

from compare_insurance_api.infrastructure.bag_normalization import (
    DataNormalizationError,
    normalize_premium_row,
)


def test_normalizes_an_official_bag_premium_row() -> None:
    row = {
        "Versicherer": "8",
        "Kanton": "AG",
        "Geschäftsjahr": "2027",
        "Region": "PR_REG_0",
        "Altersklasse": "AKA_03_ERW",
        "Unfalleinschluss": "MIT_UNF",
        "Tarif": "01_016",
        "Tariftyp": "PRAXIS",
        "Altersuntergruppe": "E1",
        "Franchise": "FRA_01_E_0300",
        "Prämie": "549.5",
        "Tarifbezeichnung": "Gesundheitspraxisversicherung",
    }

    normalized = normalize_premium_row(
        row,
        insurer_names={"8": "Agrisano Krankenkasse AG"},
        model_names={
            ("8", "01_016"): "Health Maintenance Organisation Insurance"
        },
    )

    assert normalized == {
        "premium_year": 2027,
        "insurer_id": "8",
        "insurer_name": "Agrisano Krankenkasse AG",
        "plan_id": "01_016",
        "product_name": "Health Maintenance Organisation Insurance",
        "canton": "AG",
        "premium_region": "0",
        "age_category": "adult",
        "age_subgroup": "E1",
        "deductible_chf": 300,
        "accident_coverage": True,
        "insurance_model": "hmo",
        "monthly_premium_chf": Decimal("549.50"),
        "source_tariff_type": "PRAXIS",
    }


def test_rejects_unknown_source_codes_instead_of_dropping_rows() -> None:
    row = {
        "Versicherer": "8",
        "Kanton": "AG",
        "Geschäftsjahr": "2027",
        "Region": "PR_REG_0",
        "Altersklasse": "UNKNOWN",
        "Unfalleinschluss": "MIT_UNF",
        "Tarif": "01_016",
        "Tariftyp": "PRAXIS",
        "Altersuntergruppe": "E1",
        "Franchise": "FRA_01_E_0300",
        "Prämie": "549.5",
        "Tarifbezeichnung": "Example",
    }

    with pytest.raises(DataNormalizationError, match="age category"):
        normalize_premium_row(row, insurer_names={}, model_names={})


def test_maps_non_hmo_practice_tariff_to_family_doctor() -> None:
    row = {
        "Versicherer": "8",
        "Kanton": "AG",
        "Geschäftsjahr": "2027",
        "Region": "PR_REG_0",
        "Altersklasse": "AKA_03_ERW",
        "Unfalleinschluss": "OHN_UNF",
        "Tarif": "GP_1",
        "Tariftyp": "PRAXIS",
        "Altersuntergruppe": "E1",
        "Franchise": "FRA_01_E_2500",
        "Prämie": "320.0",
        "Tarifbezeichnung": "General practitioner model",
    }

    normalized = normalize_premium_row(
        row,
        insurer_names={"8": "Example insurer"},
        model_names={},
    )

    assert normalized["insurance_model"] == "family_doctor"
