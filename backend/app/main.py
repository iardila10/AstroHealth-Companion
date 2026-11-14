from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import create_tables
from app.core.logging_config import setup_logging   # ← nuevo import


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Eventos de arranque y apagado de la aplicación.
    """
    setup_logging()   # ← activamos los logs
    print(f"🚀 Iniciando {settings.APP_NAME} v{settings.APP_VERSION}")
    create_tables()
    print("✅ Tablas de base de datos listas")
    yield
    print("🛑 Apagando aplicación...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Health Monitoring Software for Astronauts – NASA Space Apps Challenge",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": "development" if settings.DEBUG else "production"
    }


# --- Routers ---
from app.api.routes import astronauts, measurements, evaluations, environments

app.include_router(astronauts.router, prefix="/api/v1/astronauts", tags=["Astronauts"])
app.include_router(measurements.router, prefix="/api/v1/measurements", tags=["Measurements"])
app.include_router(evaluations.router, prefix="/api/v1/evaluations", tags=["Evaluations"])
app.include_router(environments.router, prefix="/api/v1/environments", tags=["Environments"])