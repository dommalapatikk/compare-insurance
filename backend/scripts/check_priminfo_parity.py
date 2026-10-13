"""Compare one equivalent query on Priminfo and the production product."""

import argparse
import json
from pathlib import Path
import sys

import httpx


BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT / "src"))

from compare_insurance_api.infrastructure.priminfo_parity import (  # noqa: E402
    compare_priminfo_with_product,
    parse_priminfo_offers,
)


PRIMINFO_MODEL_BY_PRODUCT_MODEL = {
    "standard": "BASE",
    "flex": "FLEX",
    "praxis": "PRAXIS",
    "tel_dig": "TEL_DIG",
    "pharm": "PHARM",
}


def age_category(*, birth_year: int, premium_year: int) -> str:
    age = premium_year - birth_year
    if age <= 18:
        return "child"
    if age <= 25:
        return "young_adult"
    return "adult"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--priminfo-url",
        default="https://www.priminfo.admin.ch/de/praemien",
    )
    parser.add_argument(
        "--product-url",
        default="https://compare-insurance.vercel.app/api/premiums",
    )
    parser.add_argument("--location-id", default="30112147406347")
    parser.add_argument("--canton", default="BE")
    parser.add_argument("--region", default="1")
    parser.add_argument("--birth-year", type=int, default=1980)
    parser.add_argument("--deductible", type=int, default=300)
    parser.add_argument("--accident", action="store_true")
    parser.add_argument(
        "--model",
        choices=tuple(PRIMINFO_MODEL_BY_PRODUCT_MODEL),
        default="standard",
    )
    parser.add_argument("--year", type=int, default=2027)
    parser.add_argument("--top-n", type=int, default=10)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    official_params = [
        ("location_id", args.location_id),
        ("yob[0]", str(args.birth_year)),
        ("franchise[0]", str(args.deductible)),
        ("coverage[0]", "1" if args.accident else "0"),
        ("models[]", PRIMINFO_MODEL_BY_PRODUCT_MODEL[args.model]),
        ("display", "savings"),
    ]
    product_params = [
        ("canton", args.canton),
        ("region", args.region),
        (
            "age_category",
            age_category(birth_year=args.birth_year, premium_year=args.year),
        ),
        ("deductible", str(args.deductible)),
        ("accident_coverage", str(args.accident).lower()),
        ("insurance_model", args.model),
        ("year", str(args.year)),
        ("top_n", str(args.top_n)),
    ]

    headers = {"User-Agent": "Compare-Insurance parity check/1.0"}
    with httpx.Client(headers=headers, follow_redirects=True, timeout=30) as client:
        official_response = client.get(args.priminfo_url, params=official_params)
        official_response.raise_for_status()
        product_response = client.get(args.product_url, params=product_params)
        product_response.raise_for_status()

    official = parse_priminfo_offers(official_response.text)
    result = compare_priminfo_with_product(official, product_response.json())
    print(
        json.dumps(
            {
                "status": "match",
                "profile": {
                    "location_id": args.location_id,
                    "canton": args.canton,
                    "region": args.region,
                    "birth_year": args.birth_year,
                    "deductible_chf": args.deductible,
                    "accident_coverage": args.accident,
                    "model": args.model,
                    "premium_year": args.year,
                },
                "offer_count": result.offer_count,
                "compared_prices": result.compared_prices,
                "lowest_monthly_premium_chf": str(
                    result.lowest_monthly_premium
                ),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
