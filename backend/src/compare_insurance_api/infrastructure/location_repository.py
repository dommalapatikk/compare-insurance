"""Read-only adapter for the pinned postcode-to-premium-region catalogue."""

from collections.abc import Sequence
import csv
from functools import lru_cache
from importlib.resources import files
from pathlib import Path
import unicodedata

from compare_insurance_api.domain.models import PremiumLocation


def _search_text(value: str) -> str:
    decomposed = unicodedata.normalize("NFKD", value.casefold())
    return "".join(character for character in decomposed if not unicodedata.combining(character))


@lru_cache(maxsize=4)
def _load_locations(path: str) -> tuple[PremiumLocation, ...]:
    with Path(path).open(encoding="utf-8", newline="") as source:
        return tuple(
            PremiumLocation(
                postal_code=row["postal_code"],
                locality=row["locality"],
                municipality_id=row["municipality_id"],
                municipality_name=row["municipality_name"],
                canton=row["canton"],
                premium_region=row["premium_region"],
            )
            for row in csv.DictReader(source)
        )


class CsvLocationRepository:
    """Search a generated catalogue built from pinned swisstopo and BAG data."""

    def __init__(self, path: Path) -> None:
        self._path = path

    @classmethod
    def from_package(cls) -> "CsvLocationRepository":
        resource = files("compare_insurance_api.infrastructure.data").joinpath(
            "locations_2027.csv"
        )
        return cls(Path(str(resource)))

    async def search(
        self,
        query: str,
        *,
        limit: int,
    ) -> Sequence[PremiumLocation]:
        normalized_query = _search_text(query)
        matches: list[tuple[int, PremiumLocation]] = []
        for location in _load_locations(str(self._path)):
            locality = _search_text(location.locality)
            municipality = _search_text(location.municipality_name)
            combined = _search_text(
                f"{location.postal_code} {location.locality} "
                f"{location.municipality_name} {location.canton}"
            )
            if normalized_query.isdigit():
                if not location.postal_code.startswith(normalized_query):
                    continue
                score = 0 if location.postal_code == normalized_query else 1
            elif normalized_query == locality:
                score = 0
            elif locality.startswith(normalized_query):
                score = 1
            elif municipality.startswith(normalized_query):
                score = 2
            elif normalized_query in combined:
                score = 3
            else:
                continue
            matches.append((score, location))

        matches.sort(
            key=lambda item: (
                item[0],
                item[1].postal_code,
                item[1].locality.casefold(),
                item[1].municipality_name.casefold(),
            )
        )
        return tuple(location for _, location in matches[:limit])
