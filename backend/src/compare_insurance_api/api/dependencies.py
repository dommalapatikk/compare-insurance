"""Composition helpers for HTTP dependency injection."""

from functools import lru_cache

from compare_insurance_api.application.use_cases import ComparePremiums, ExplainInsuranceChoices
from compare_insurance_api.infrastructure.langchain_guide import LangChainInsuranceGuide
from compare_insurance_api.infrastructure.supabase_repository import (
    SupabasePremiumRepository,
)


@lru_cache(maxsize=1)
def get_compare_premiums() -> ComparePremiums:
    """Compose deterministic ranking with the Supabase catalogue adapter."""

    return ComparePremiums(SupabasePremiumRepository.from_env())


@lru_cache(maxsize=1)
def get_explain_insurance_choices() -> ExplainInsuranceChoices:
    return ExplainInsuranceChoices(LangChainInsuranceGuide())

