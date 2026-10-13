"""Generate the packaged 2027 postcode-to-premium-region catalogue."""

import argparse
from pathlib import Path
import tempfile

from compare_insurance_api.infrastructure.location_catalogue import (
    build_location_catalogue,
    write_location_catalogue,
)


PROJECT_ROOT = Path(__file__).resolve().parents[2]
RAW_ROOT = PROJECT_ROOT / "data" / "raw"
DEFAULT_OUTPUT = (
    PROJECT_ROOT
    / "backend"
    / "src"
    / "compare_insurance_api"
    / "infrastructure"
    / "data"
    / "locations_2027.csv"
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--check",
        action="store_true",
        help="Fail when the committed generated catalogue is out of date.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    rows = build_location_catalogue(
        RAW_ROOT / "ortschaftenverzeichnis_plz_2026-10-01.csv",
        RAW_ROOT / "praemienregionen_2027.xlsx",
    )
    if args.check:
        with tempfile.TemporaryDirectory() as directory:
            candidate = Path(directory) / "locations_2027.csv"
            write_location_catalogue(rows, candidate)
            if not DEFAULT_OUTPUT.exists() or candidate.read_bytes() != DEFAULT_OUTPUT.read_bytes():
                raise SystemExit("Generated location catalogue is out of date")
    else:
        write_location_catalogue(rows, DEFAULT_OUTPUT)
    print(f"Validated {len(rows)} postcode/municipality mappings for 2027.")


if __name__ == "__main__":
    main()
