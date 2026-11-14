from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Configuración centralizada de AstroHealth Companion.
    Todos los valores se pueden sobrescribir con variables de entorno o archivo .env
    """

    # --- App ---
    APP_NAME: str = "AstroHealth Companion"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True

    # --- Base de datos ---
    # SQLite por ahora (fácil de resetear en hackatón)
    DATABASE_URL: str = "sqlite:///./astrohealth.db"

    # --- Knowledge Base ---
    # Ruta absoluta calculada desde este archivo → app/knowledge/
    KNOWLEDGE_DIR: Path = Path(__file__).resolve().parent.parent / "knowledge"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",          # ignora variables extra que no estén definidas
        case_sensitive=False,
    )


# Instancia única que importaremos en toda la aplicación
settings = Settings()