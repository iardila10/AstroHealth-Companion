from typing import Generator
from sqlalchemy.orm import Session

from app.core.database import get_db

# Re-exportamos para que las rutas importen desde aquí
def get_database() -> Generator[Session, None, None]:
    yield from get_db()