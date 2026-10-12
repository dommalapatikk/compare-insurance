from compare_insurance_api.infrastructure.bag_ingestion import (
    clean_insurer_display_name,
)


def test_cleans_wrapped_multilingual_insurer_name() -> None:
    assert clean_insurer_display_name(
        [
            "CSS Kranken-\nVersicherung AG\nCSS Assurance-maladie SA",
            "CSS Assicurazione malattie SA",
        ]
    ) == "CSS Krankenversicherung AG"


def test_cleans_name_spread_across_register_rows() -> None:
    assert clean_insurer_display_name(
        ["Avenir Assurance", "Maladie SA", "Avenir Krankenver-", "sicherung AG"]
    ) == "Avenir Assurance Maladie SA"
