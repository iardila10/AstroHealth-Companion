
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import create_tables
from app.core.logging_config import setup_logging

from app.api.routes import (
    astronauts,
    measurements,
    evaluations,
    environments,
    demo,
)


logger = logging.getLogger("astrohealth.application")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gestiona el inicio y apagado de AstroHealth Companion.
    """

    setup_logging()

    logger.info(
        "Iniciando aplicación",
        extra={
            "event": "application_starting",
            "environment": settings.ENVIRONMENT,
        },
    )

    try:
        if settings.ENVIRONMENT == "development":
            create_tables()

            logger.info(
                "Tablas de base de datos verificadas",
                extra={"event": "database_tables_ready"},
            )
        else:
            logger.info(
                "Creación automática de tablas desactivada. "
                "Utilice Alembic para aplicar migraciones.",
                extra={"event": "database_migrations_required"},
            )

        yield

    except Exception:
        logger.exception(
            "Error durante el ciclo de vida de la aplicación",
            extra={"event": "application_lifecycle_error"},
        )
        raise

    finally:
        logger.info(
            "Apagando aplicación",
            extra={"event": "application_stopping"},
        )


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Health Monitoring Software for Astronauts "
        "– NASA Space Apps Challenge"
    ),
    lifespan=lifespan,
)


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=[
        "GET",
        "POST",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],
    allow_headers=[
        "Authorization",
        "Content-Type",
    ],
    max_age=600,
)


@app.get("/health", tags=["System"])
def health_check():
    """
    Comprueba el estado de la aplicación.
    """

    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }


# API Routers

app.include_router(
    astronauts.router,
    prefix="/api/v1/astronauts",
    tags=["Astronauts"],
)

app.include_router(
    measurements.router,
    prefix="/api/v1/measurements",
    tags=["Measurements"],
)

app.include_router(
    evaluations.router,
    prefix="/api/v1/evaluations",
    tags=["Evaluations"],
)

app.include_router(
    environments.router,
    prefix="/api/v1/environments",
    tags=["Environments"],
)

app.include_router(
    demo.router,
    prefix="/api/v1/demo",
    tags=["Local Demo"],
)
