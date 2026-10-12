"""Thin HTTP controllers that translate transport data into use-case calls."""

from datetime import date
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from compare_insurance_api.api.dependencies import get_explain_insurance_choices
from compare_insurance_api.api.schemas import (
    ADULT_DEDUCTIBLE_VALUES,
    ChatRequest,
    ChatResponse,
    HealthResponse,
    PremiumSearchRequest,
    PremiumSearchResponse,
)
from compare_insurance_api.application.use_cases import ExplainInsuranceChoices
from compare_insurance_api.domain.models import Deductible


router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["system"])
async def health() -> HealthResponse:
    return HealthResponse(status="ok")


@router.post("/v1/chat", response_model=ChatResponse, tags=["assistant"])
async def chat(
    request: ChatRequest,
    use_case: Annotated[
        ExplainInsuranceChoices,
        Depends(get_explain_insurance_choices),
    ],
) -> ChatResponse:
    try:
        message = await use_case.execute(
            message=request.message,
            thread_id=request.thread_id,
        )
    except RuntimeError as exc:
        detail = str(exc)
        if "not configured" in detail:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="The insurance chat assistant is not configured.",
            ) from exc
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The insurance chat assistant could not complete the request.",
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The insurance chat assistant could not complete the request.",
        ) from exc

    return ChatResponse(message=message, thread_id=request.thread_id)


@router.get(
    "/v1/premiums/search",
    response_model=PremiumSearchResponse,
    tags=["premiums"],
)
async def search_premiums(
    canton: Annotated[str | None, Query(min_length=2, max_length=2)] = None,
    region: Annotated[str | None, Query(min_length=1, max_length=100)] = None,
    postal_code: Annotated[str | None, Query(pattern=r"^\d{4}$")] = None,
    municipality_id: Annotated[str | None, Query(min_length=1, max_length=20)] = None,
    birth_date: date | None = None,
    age: Annotated[int | None, Query(ge=0, le=120)] = None,
    deductible: Annotated[list[Deductible] | None, Query()] = None,
    accident_coverage: bool = True,
    insurance_model: Annotated[str | None, Query(min_length=1, max_length=100)] = None,
    year: Annotated[int | None, Query(ge=2020, le=2100)] = None,
    top_n: Annotated[int, Query(ge=1, le=10)] = 10,
    reference_monthly_premium_chf: Annotated[Decimal | None, Query(ge=0)] = None,
) -> PremiumSearchResponse:
    # Keep transport validation explicit while the repository adapter is built.
    PremiumSearchRequest(
        canton=canton,
        region=region,
        postal_code=postal_code,
        municipality_id=municipality_id,
        birth_date=birth_date,
        age=age,
        deductibles=deductible or list(ADULT_DEDUCTIBLE_VALUES),
        accident_coverage=accident_coverage,
        insurance_model=insurance_model,
        year=year,
        top_n=top_n,
        reference_monthly_premium_chf=reference_monthly_premium_chf,
    )

    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail=(
            "Premium search is not available until the official premium dataset "
            "has been ingested and validated."
        ),
    )

