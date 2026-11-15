
from pathlib import Path
from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[2]
DEFAULT_KNOWLEDGE_DIR = BACKEND_DIR / "app" / "knowledge"


class Settings(BaseSettings):
    """
    Configuración centralizada de AstroHealth Companion.
    """

    APP_NAME: str = "AstroHealth Companion"
    APP_VERSION: str = "0.1.0"

    ENVIRONMENT: Literal["development", "testing", "production"] = "development"
    DEBUG: bool = False

    DATABASE_URL: str = (
        f"sqlite:///{(BACKEND_DIR / 'astrohealth.db').as_posix()}"
    )

    KNOWLEDGE_DIR: Path = DEFAULT_KNOWLEDGE_DIR

    CORS_ORIGINS: list[str] = []

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
        env_ignore_empty=True,
    )

    @model_validator(mode="after")
    def validate_production_settings(self):
        if self.ENVIRONMENT == "production" and self.DEBUG:
            raise ValueError(
                "DEBUG debe estar desactivado en producción."
            )

        return self


settings = Settings()
