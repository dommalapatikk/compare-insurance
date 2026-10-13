"""Parse and compare one official Priminfo result with the product response."""

from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from html.parser import HTMLParser
from typing import Any


class ParityError(RuntimeError):
    """Raised when the product result differs from the official calculator."""


@dataclass(frozen=True, slots=True)
class PriminfoOffer:
    insurer: str
    model: str
    monthly_premium: Decimal


@dataclass(frozen=True, slots=True)
class ParityResult:
    offer_count: int
    compared_prices: int
    lowest_monthly_premium: Decimal


class _SavingsTableParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.in_table = False
        self.in_body = False
        self.in_row = False
        self.in_cell = False
        self.cell_parts: list[str] = []
        self.cells: list[str] = []
        self.rows: list[list[str]] = []

    def handle_starttag(
        self,
        tag: str,
        attrs: list[tuple[str, str | None]],
    ) -> None:
        attributes = dict(attrs)
        if tag == "table" and attributes.get("id") == "savingsTable":
            self.in_table = True
        elif self.in_table and tag == "tbody":
            self.in_body = True
        elif self.in_body and tag == "tr":
            self.in_row = True
            self.cells = []
        elif self.in_row and tag in {"th", "td"}:
            self.in_cell = True
            self.cell_parts = []

    def handle_data(self, data: str) -> None:
        if self.in_cell:
            self.cell_parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        if self.in_cell and tag in {"th", "td"}:
            value = " ".join(
                "".join(self.cell_parts).replace("\N{SOFT HYPHEN}", "").split()
            )
            self.cells.append(value)
            self.in_cell = False
        elif self.in_row and tag == "tr":
            if self.cells:
                self.rows.append(self.cells)
            self.in_row = False
        elif self.in_body and tag == "tbody":
            self.in_body = False
        elif self.in_table and tag == "table":
            self.in_table = False


def parse_priminfo_offers(html: str) -> tuple[PriminfoOffer, ...]:
    parser = _SavingsTableParser()
    parser.feed(html)
    offers: list[PriminfoOffer] = []
    for cells in parser.rows:
        if len(cells) < 3:
            raise ParityError("Priminfo returned an incomplete premium row")
        try:
            premium = Decimal(cells[2].replace("'", ""))
        except InvalidOperation as exc:
            raise ParityError("Priminfo returned an invalid monthly premium") from exc
        offers.append(
            PriminfoOffer(
                insurer=cells[0],
                model=cells[1],
                monthly_premium=premium,
            )
        )
    if not offers:
        raise ParityError("Priminfo returned no premium rows")
    return tuple(offers)


def compare_priminfo_with_product(
    official: tuple[PriminfoOffer, ...],
    product: dict[str, Any],
) -> ParityResult:
    product_count = product.get("total_eligible_offers")
    if product_count != len(official):
        raise ParityError(
            f"offer-count mismatch: Priminfo={len(official)}, product={product_count}"
        )

    raw_offers = product.get("offers")
    if not isinstance(raw_offers, list) or not raw_offers:
        raise ParityError("product returned no ranked premium rows")
    try:
        product_prices = [
            Decimal(str(offer["monthly_premium_chf"]))
            for offer in raw_offers
        ]
    except (KeyError, InvalidOperation, TypeError) as exc:
        raise ParityError("product returned an invalid monthly premium") from exc

    official_prices = [offer.monthly_premium for offer in official[: len(product_prices)]]
    if product_prices != official_prices:
        raise ParityError(
            f"premium mismatch: Priminfo={official_prices}, product={product_prices}"
        )

    return ParityResult(
        offer_count=len(official),
        compared_prices=len(product_prices),
        lowest_monthly_premium=official_prices[0],
    )
