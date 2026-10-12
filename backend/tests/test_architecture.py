"""Architecture fitness functions that protect inward dependencies."""

import ast
from pathlib import Path


PACKAGE_ROOT = Path(__file__).parents[1] / "src" / "compare_insurance_api"
FRAMEWORK_MODULES = {"fastapi", "pydantic", "langchain", "langgraph"}


def imported_modules(path: Path) -> set[str]:
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    modules: set[str] = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            modules.update(alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module:
            modules.add(node.module)
    return modules


def python_files(layer: str) -> list[Path]:
    return list((PACKAGE_ROOT / layer).glob("*.py"))


def test_domain_has_no_framework_or_outer_layer_dependencies() -> None:
    forbidden_prefixes = (
        "compare_insurance_api.api",
        "compare_insurance_api.application",
        "compare_insurance_api.infrastructure",
    )

    for path in python_files("domain"):
        imports = imported_modules(path)
        assert not (FRAMEWORK_MODULES & {name.split(".")[0] for name in imports})
        assert not any(name.startswith(forbidden_prefixes) for name in imports)


def test_application_does_not_depend_on_delivery_or_infrastructure() -> None:
    forbidden_prefixes = (
        "compare_insurance_api.api",
        "compare_insurance_api.infrastructure",
    )

    for path in python_files("application"):
        imports = imported_modules(path)
        assert not (FRAMEWORK_MODULES & {name.split(".")[0] for name in imports})
        assert not any(name.startswith(forbidden_prefixes) for name in imports)

