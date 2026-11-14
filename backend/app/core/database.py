from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from app.core.config import settings
from app.models.base import Base

# Engine
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},  # Necesario solo para SQLite
    echo=settings.DEBUG,  # Muestra las queries en consola cuando DEBUG=True
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def create_tables() -> None:
    """Crea todas las tablas en la base de datos."""
    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Dependency de FastAPI para obtener una sesión de base de datos."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()