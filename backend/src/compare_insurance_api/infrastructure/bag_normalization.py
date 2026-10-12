"""Pure mappings from BAG source rows to the premium catalogue schema."""

from collections.abc import Mapping
from decimal import Decimal, InvalidOperation
import re

from compare_insurance_api.domain.models import money


class DataNormalizationError(ValueError):
    """Raised when a BAG row contains an unsupported or malformed value."""


AGE_CATEGORY_CODES = {
    "AKA_01_KIN": "child",
    "AKA_02_JUG": "young_adult",
    "AKA_03_ERW": "adult",
}
ACCIDENT_CODES = {"MIT_UNF": True, "OHN_UNF": False}
KNOWN_TARIFF_TYPES = {"BASE", "PRAXIS", "FLEX", "TEL_DIG", "PHARM"}
DEDUCTIBLE_PATTERN = re.compile(r"_(\d{4})$")


def _required(row: Mapping[str, str], field: str) -> str:
    value = row.get(field, "").strip()
    if not value:
        raise DataNormalizationError(f"missing BAG field: {field}")
    return value


def _insurance_model(tariff_type: str, product_name: str) -> str:
    if tariff_type not in KNOWN_TARIFF_TYPES:
        raise DataNormalizationError(f"unknown tariff type: {tariff_type}")

    label = product_name.casefold()
    if tariff_type == "BASE":
        return "standard"
    if tariff_type == "TEL_DIG":
        return "telmed"
    if "hmo" in label or "health maintenance organisation" in label:
        return "hmo"
    family_doctor_terms = (
        "hausarzt",
        "family doctor",
        "médecin de famille",
        "medico di famiglia",
    )
    if any(term in label for term in family_doctor_terms):
        return "family_doctor"
    if tariff_type == "PRAXIS":
        return "family_doctor"
    return "other"


def normalize_premium_row(
    row: Mapping[str, str],
    *,
    insurer_names: Mapping[str, str],
    model_names: Mapping[tuple[str, str], str],
) -> dict[str, object]:
    """Normalize one official BAG premium row or fail on an unknown code."""

    age_code = _required(row, "Altersklasse")
    try:
        age_category = AGE_CATEGORY_CODES[age_code]
    except KeyError as exc:
        raise DataNormalizationError(f"unknown age category: {age_code}") from exc

    accident_code = _required(row, "Unfalleinschluss")
    try:
        accident_coverage = ACCIDENT_CODES[accident_code]
    except KeyError as exc:
        raise DataNormalizationError(f"unknown accident code: {accident_code}") from exc

    insurer_id = _required(row, "Versicherer")
    if insurer_id not in insurer_names:
        raise DataNormalizationError(f"unknown insurer: {insurer_id}")

    plan_id = _required(row, "Tarif")
    tariff_type = _required(row, "Tariftyp")
    product_name = model_names.get(
        (insurer_id, plan_id),
        _required(row, "Tarifbezeichnung"),
    )

    region_code = _required(row, "Region")
    if not region_code.startswith("PR_REG_"):
        raise DataNormalizationError(f"unknown premium region: {region_code}")
    premium_region = region_code.removeprefix("PR_REG_")
    if premium_region not in {"0", "1", "2", "3"}:
        raise DataNormalizationError(f"unknown premium region: {region_code}")

    deductible_code = _required(row, "Franchise")
    deductible_match = DEDUCTIBLE_PATTERN.search(deductible_code)
    if deductible_match is None:
        raise DataNormalizationError(f"unknown deductible code: {deductible_code}")

    try:
        monthly_premium = money(Decimal(_required(row, "Prämie")))
    except InvalidOperation as exc:
        raise DataNormalizationError("invalid monthly premium") from exc

    return {
        "premium_year": int(_required(row, "Geschäftsjahr")),
        "insurer_id": insurer_id,
        "insurer_name": insurer_names[insurer_id],
        "plan_id": plan_id,
        "product_name": product_name,
        "canton": _required(row, "Kanton").upper(),
        "premium_region": premium_region,
        "age_category": age_category,
        "age_subgroup": _required(row, "Altersuntergruppe"),
        "deductible_chf": int(deductible_match.group(1)),
        "accident_coverage": accident_coverage,
        "insurance_model": _insurance_model(tariff_type, product_name),
        "monthly_premium_chf": monthly_premium,
        "source_tariff_type": tariff_type,
    }
