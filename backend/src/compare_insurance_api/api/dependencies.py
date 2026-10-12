"""Composition helpers for HTTP dependency injection."""

from functools import lru_cache

from compare_insurance_api.application.use_cases import ExplainInsuranceChoices
from compare_insurance_api.infrastructure.langchain_guide import LangChainInsuranceGuide


@lru_cache(maxsize=1)
def get_explain_insurance_choices() -> ExplainInsuranceChoices:
    return ExplainInsuranceChoices(LangChainInsuranceGuide())

