import asyncio
from pathlib import Path

from compare_insurance_api.infrastructure.location_repository import (
    CsvLocationRepository,
)


def catalogue(tmp_path: Path) -> Path:
    path = tmp_path / "locations.csv"
    path.write_text(
        "postal_code,locality,municipality_id,municipality_name,canton,premium_region\n"
        "3011,Bern,351,Bern,BE,1\n"
        "3174,Thörishaus,355,Köniz,BE,2\n"
        "3174,Thörishaus,670,Neuenegg,BE,2\n"
        "8001,Zürich,261,Zürich,ZH,1\n",
        encoding="utf-8",
    )
    return path


def test_searches_by_postcode_and_keeps_ambiguous_municipalities(
    tmp_path: Path,
) -> None:
    repository = CsvLocationRepository(catalogue(tmp_path))

    matches = asyncio.run(repository.search("3174", limit=8))

    assert [item.municipality_name for item in matches] == ["Köniz", "Neuenegg"]
    assert matches[0].label == "3174 Thörishaus (Köniz), BE"


def test_search_is_case_and_accent_insensitive(tmp_path: Path) -> None:
    repository = CsvLocationRepository(catalogue(tmp_path))

    matches = asyncio.run(repository.search("thoris", limit=8))

    assert len(matches) == 2
    assert all(item.locality == "Thörishaus" for item in matches)


def test_packaged_catalogue_resolves_bern_to_bag_region_one() -> None:
    repository = CsvLocationRepository.from_package()

    matches = asyncio.run(repository.search("3011", limit=8))

    assert [(item.municipality_id, item.canton, item.premium_region) for item in matches] == [
        ("351", "BE", "1")
    ]


def test_packaged_catalogue_preserves_cross_region_postcode_ambiguity() -> None:
    repository = CsvLocationRepository.from_package()

    matches = asyncio.run(repository.search("3174", limit=8))

    assert [(item.municipality_name, item.premium_region) for item in matches] == [
        ("Köniz", "1"),
        ("Neuenegg", "2"),
    ]
