"""Supabase PostgREST adapter for the premium repository port."""

import os
from decimal import Decimal
from typing import Any

import httpx

from compare_insurance_api.domain.models import (
    AgeCategory,
    Deductible,
    InsuranceModel,
    PremiumOffer,
    SearchCriteria,
)


SELECT_FIELDS = ",".join(
    (
        "insurer_id",
        "insurer_name",
        "plan_id",
        "product_name",
        "canton",
        "premium_region",
        "age_category",
        "age_subgroup",
        "deductible_chf",
        "accident_coverage",
        "source_tariff_type",
        "premium_year",
        "monthly_premium_chf",
    )
)

SOURCE_TARIFF_TYPE_BY_MODEL = {
    InsuranceModel.STANDARD: "BASE",
    InsuranceModel.FLEX: "FLEX",
    InsuranceModel.PRAXIS: "PRAXIS",
    InsuranceModel.TEL_DIG: "TEL_DIG",
    InsuranceModel.PHARM: "PHARM",
}
MODEL_BY_SOURCE_TARIFF_TYPE = {
    source_type: model
    for model, source_type in SOURCE_TARIFF_TYPE_BY_MODEL.items()
}


class SupabasePremiumRepository:
    """Read source-backed offers from a server-only Supabase connection."""

    def __init__(
        self,
        *,
        url: str | None,
        service_role_key: str | None,
        client: Any | None = None,
        page_size: int = 1_000,
    ) -> None:
        self._url = url.rstrip("/") if url else None
        self._service_role_key = service_role_key
        self._client = client
        self._page_size = page_size

    @classmethod
    def from_env(cls) -> "SupabasePremiumRepository":
        return cls(
            url=os.getenv("SUPABASE_URL"),
            service_role_key=os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
        )

    def _configuration(self) -> tuple[str, str]:
        if not self._url or not self._service_role_key:
            raise RuntimeError("Supabase is not configured")
        return self._url, self._service_role_key

    def _params(self, criteria: SearchCriteria) -> dict[str, str]:
        deductibles = ",".join(str(int(value)) for value in criteria.deductibles)
        source_tariff_types = ",".join(
            SOURCE_TARIFF_TYPE_BY_MODEL[value]
            for value in criteria.insurance_models
        )
        return {
            "select": SELECT_FIELDS,
            "canton": f"eq.{criteria.canton}",
            "premium_region": f"eq.{criteria.region}",
            "age_category": f"eq.{criteria.age_category.value}",
            "age_subgroup": f"eq.{criteria.age_category.ordinary_source_subgroup}",
            "accident_coverage": f"eq.{str(criteria.accident_coverage).lower()}",
            "deductible_chf": f"in.({deductibles})",
            "source_tariff_type": f"in.({source_tariff_types})",
            "premium_year": f"eq.{criteria.premium_year}",
            "order": (
                "monthly_premium_chf.asc,insurer_name.asc,product_name.asc,"
                "deductible_chf.asc"
            ),
        }

    async def _fetch_rows(
        self,
        client: Any,
        *,
        endpoint: str,
        key: str,
        criteria: SearchCriteria,
    ) -> list[dict[str, object]]:
        rows: list[dict[str, object]] = []
        start = 0
        while True:
            response = await client.get(
                endpoint,
                params=self._params(criteria),
                headers={
                    "apikey": key,
                    "Authorization": f"Bearer {key}",
                    "Range": f"{start}-{start + self._page_size - 1}",
                },
            )
            response.raise_for_status()
            page = response.json()
            if not isinstance(page, list):
                raise RuntimeError("Supabase returned an invalid premium response")
            rows.extend(page)
            if len(page) < self._page_size:
                return rows
            start += self._page_size

    async def find_matching(self, criteria: SearchCriteria) -> list[PremiumOffer]:
        url, key = self._configuration()
        endpoint = f"{url}/rest/v1/premium_offers"
        if self._client is None:
            async with httpx.AsyncClient(timeout=30) as client:
                rows = await self._fetch_rows(
                    client,
                    endpoint=endpoint,
                    key=key,
                    criteria=criteria,
                )
        else:
            rows = await self._fetch_rows(
                self._client,
                endpoint=endpoint,
                key=key,
                criteria=criteria,
            )

        return [
            PremiumOffer(
                insurer_id=str(row["insurer_id"]),
                insurer_name=str(row["insurer_name"]),
                plan_id=str(row["plan_id"]),
                product_name=str(row["product_name"]),
                municipality_id=criteria.municipality_id,
                canton=str(row["canton"]),
                region=str(row["premium_region"]),
                age_category=AgeCategory(str(row["age_category"])),
                deductible=Deductible(int(row["deductible_chf"])),
                accident_coverage=bool(row["accident_coverage"]),
                insurance_model=MODEL_BY_SOURCE_TARIFF_TYPE[
                    str(row["source_tariff_type"])
                ],
                premium_year=int(row["premium_year"]),
                monthly_premium_chf=Decimal(str(row["monthly_premium_chf"])),
            )
            for row in rows
        ]
