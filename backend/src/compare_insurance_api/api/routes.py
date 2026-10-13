"""Thin HTTP controllers that translate transport data into use-case calls."""

from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from compare_insurance_api.api.dependencies import (
    get_compare_premiums,
    get_explain_insurance_choices,
    get_search_locations,
)
from compare_insurance_api.api.schemas import (
    ChatRequest,
    ChatResponse,
    HealthResponse,
    LocationSearchResponse,
    PremiumSearchRequest,
    PremiumSearchResponse,
)
from compare_insurance_api.application.use_cases import (
    ComparePremiums,
    ExplainInsuranceChoices,
    SearchLocations,
)
from compare_insurance_api.domain.models import (
    AgeCategory,
    Deductible,
    DomainValidationError,
    InsuranceModel,
    PremiumOffer,
    SearchCriteria,
    age_category_for_birth_year,
    valid_deductibles,
)


router = APIRouter()


def _minimum_response(offer: PremiumOffer) -> dict[str, object]:
    return {
        "insurer_id": offer.insurer_id,
        "insurer_name": offer.insurer_name,
        "plan_id": offer.plan_id,
        "product_name": offer.product_name,
        "canton": offer.canton,
        "region": offer.region,
        "deductible_chf": offer.deductible,
        "accident_coverage": offer.accident_coverage,
        "insurance_model": offer.insurance_model.value,
        "monthly_premium_chf": offer.monthly_premium_chf,
        "annual_premium_chf": offer.annual_premium_chf,
    }


@router.get("/health", response_model=HealthResponse, tags=["system"])
async def health() -> HealthResponse:
    return HealthResponse(status="ok")


@router.get(
    "/v1/locations",
    response_model=LocationSearchResponse,
    tags=["locations"],
)
async def search_locations(
    use_case: Annotated[SearchLocations, Depends(get_search_locations)],
    q: Annotated[str, Query(min_length=2, max_length=100)],
    limit: Annotated[int, Query(ge=1, le=20)] = 8,
) -> LocationSearchResponse:
    try:
        locations = await use_case.execute(q, limit=limit)
    except DomainValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc
    return LocationSearchResponse(
        query=" ".join(q.split()),
        premium_year=2027,
        source_name="swisstopo and Swiss Federal Office of Public Health (BAG)",
        locations=[
            {
                "postal_code": location.postal_code,
                "locality": location.locality,
                "municipality_id": location.municipality_id,
                "municipality_name": location.municipality_name,
                "canton": location.canton,
                "premium_region": location.premium_region,
                "label": location.label,
            }
            for location in locations
        ],
    )


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
    use_case: Annotated[ComparePremiums, Depends(get_compare_premiums)],
    canton: Annotated[str, Query(min_length=2, max_length=2)],
    region: Annotated[str, Query(min_length=1, max_length=8)],
    age_category: AgeCategory | None = None,
    birth_year: Annotated[int | None, Query(ge=1900, le=2100)] = None,
    deductible: Annotated[list[Deductible] | None, Query()] = None,
    accident_coverage: bool = True,
    insurance_model: Annotated[list[InsuranceModel] | None, Query()] = None,
    year: Annotated[int, Query(ge=2020, le=2100)] = 2027,
    top_n: Annotated[int, Query(ge=1, le=10)] = 10,
    reference_monthly_premium_chf: Annotated[Decimal | None, Query(ge=0)] = None,
) -> PremiumSearchResponse:
    try:
        if birth_year is not None:
            derived_age_category = age_category_for_birth_year(
                birth_year,
                premium_year=year,
            )
            if age_category is not None and age_category is not derived_age_category:
                raise DomainValidationError(
                    "age_category does not match birth_year for the premium year"
                )
        elif age_category is not None:
            derived_age_category = age_category
        else:
            raise DomainValidationError("birth_year or age_category is required")

        selected_deductibles = deductible or sorted(
            valid_deductibles(derived_age_category),
            key=int,
        )
        selected_models = insurance_model or list(InsuranceModel)
        request = PremiumSearchRequest(
            canton=canton,
            region=region,
            age_category=derived_age_category,
            birth_year=birth_year,
            deductibles=selected_deductibles,
            accident_coverage=accident_coverage,
            insurance_models=selected_models,
            year=year,
            top_n=top_n,
            reference_monthly_premium_chf=reference_monthly_premium_chf,
        )
        criteria = SearchCriteria(
            canton=request.canton,
            region=request.region,
            age_category=request.age_category,
            accident_coverage=request.accident_coverage,
            deductibles=tuple(request.deductibles),
            insurance_models=tuple(request.insurance_models),
            premium_year=request.year,
            top_n=request.top_n,
            reference_monthly_premium_chf=request.reference_monthly_premium_chf,
        )
        comparison = await use_case.execute(criteria)
    except DomainValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc
    except RuntimeError as exc:
        if "not configured" in str(exc):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="The official premium catalogue is not configured.",
            ) from exc
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The official premium catalogue could not be queried.",
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The official premium catalogue could not be queried.",
        ) from exc

    return PremiumSearchResponse(
        query=request,
        source_year=criteria.premium_year,
        source_name="Swiss Federal Office of Public Health (BAG)",
        total_eligible_offers=comparison.total_eligible_offers,
        offers=[
            {
                "rank": ranked.rank,
                "insurer_id": ranked.offer.insurer_id,
                "insurer_name": ranked.offer.insurer_name,
                "plan_id": ranked.offer.plan_id,
                "product_name": ranked.offer.product_name,
                "canton": ranked.offer.canton,
                "region": ranked.offer.region,
                "deductible_chf": ranked.offer.deductible,
                "accident_coverage": ranked.offer.accident_coverage,
                "insurance_model": ranked.offer.insurance_model.value,
                "monthly_premium_chf": ranked.offer.monthly_premium_chf,
                "annual_premium_chf": ranked.offer.annual_premium_chf,
                "monthly_difference_from_cheapest_chf": (
                    ranked.monthly_difference_from_cheapest_chf
                ),
                "annual_difference_from_cheapest_chf": (
                    ranked.annual_difference_from_cheapest_chf
                ),
                "reference_comparison": (
                    {
                        "relation": ranked.reference_comparison.relation,
                        "monthly_difference_chf": (
                            ranked.reference_comparison.monthly_difference_chf
                        ),
                        "annual_difference_chf": (
                            ranked.reference_comparison.annual_difference_chf
                        ),
                    }
                    if ranked.reference_comparison is not None
                    else None
                ),
            }
            for ranked in comparison.offers
        ],
        cheapest_by_deductible=[
            _minimum_response(offer)
            for offer in comparison.cheapest_by_deductible
        ],
        cheapest_by_model=[
            _minimum_response(offer)
            for offer in comparison.cheapest_by_model
        ],
        cheapest_by_deductible_and_model=[
            _minimum_response(offer)
            for offer in comparison.cheapest_by_deductible_and_model
        ],
    )

