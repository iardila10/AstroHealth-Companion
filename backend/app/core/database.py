
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.models.base import Base


database_url = make_url(settings.DATABASE_URL)

is_sqlite = database_url.get_backend_name() == "sqlite"

connect_args = (
    {"check_same_thread": False}
    if is_sqlite
    else {}
)


engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    echo=settings.DEBUG,
)


SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)


def create_tables() -> None:
    """Crea las tablas registradas en SQLAlchemy."""

    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Proporciona una sesión de base de datos."""

    db = SessionLocal()

    try:
        yield db

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()
