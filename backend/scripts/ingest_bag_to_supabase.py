"""Validate and upload the pinned BAG premium snapshot to Supabase."""

import argparse
import os
from pathlib import Path

from compare_insurance_api.infrastructure.bag_ingestion import (
    SupabaseCatalogueWriter,
    iter_normalized_rows,
    load_insurer_names,
    load_model_names,
    upload_catalogue,
    validate_source,
)


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DATA_ROOT = PROJECT_ROOT / "data" / "raw"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--validate-only", action="store_true")
    parser.add_argument(
        "--replace-year",
        action="store_true",
        help="Delete the target premium year before the idempotent upload.",
    )
    parser.add_argument("--batch-size", type=int, default=500)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    premiums = DEFAULT_DATA_ROOT / "praemien_ch_2027.csv"
    tariffs = DEFAULT_DATA_ROOT / "tarife_2027.csv"
    insurers = DEFAULT_DATA_ROOT / "zugelassene_krankenversicherer_2026-10-01.xlsx"

    insurer_names = load_insurer_names(insurers)
    model_names = load_model_names(tariffs)
    summary = validate_source(
        premiums,
        insurer_names=insurer_names,
        model_names=model_names,
    )
    print(
        f"Validated {summary.source_rows} source rows; "
        f"{summary.eligible_rows} ordinary-canton rows are eligible; "
        f"{summary.excluded_territorial_rows} territorial rows are excluded."
    )
    if args.validate_only:
        return

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for upload"
        )
    writer = SupabaseCatalogueWriter(url=url, service_role_key=key)
    if args.replace_year:
        writer.replace_year(2027)
    uploaded = upload_catalogue(
        iter_normalized_rows(
            premiums,
            insurer_names=insurer_names,
            model_names=model_names,
        ),
        writer=writer,
        batch_size=args.batch_size,
    )
    print(f"Uploaded {uploaded} normalized premium rows for 2027.")


if __name__ == "__main__":
    main()
