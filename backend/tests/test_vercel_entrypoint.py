"""Deployment boundary checks for Vercel's Python runtime."""

from compare_insurance_api.main import app as application


def test_vercel_entrypoint_exports_the_fastapi_application() -> None:
    from index import app

    assert app is application
