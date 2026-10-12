"""FastAPI composition root for Compare Insurance."""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from compare_insurance_api.api.routes import router


def create_app() -> FastAPI:
    """Wire delivery and infrastructure at the outermost application edge."""

    application = FastAPI(
        title="Compare Insurance API",
        version="0.2.0",
        description="Compare official Swiss mandatory health-insurance premiums.",
    )

    frontend_origins = [
        origin.strip()
        for origin in os.getenv(
            "FRONTEND_ORIGINS",
            "http://localhost:3000,http://127.0.0.1:3000",
        ).split(",")
        if origin.strip()
    ]
    application.add_middleware(
        CORSMiddleware,
        allow_origins=frontend_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )
    application.include_router(router)
    return application


app = create_app()

