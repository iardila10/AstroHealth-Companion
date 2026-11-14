import logging
import sys
from app.core.config import settings


def setup_logging() -> None:
    """
    Configura el sistema de logging de la aplicación.
    """
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO

    # Formato claro y legible
    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    # Handler de consola
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)

    # Logger raíz
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)

    # Evitar handlers duplicados si se llama varias veces
    if not root_logger.handlers:
        root_logger.addHandler(console_handler)

    # Reducir ruido de librerías externas
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)