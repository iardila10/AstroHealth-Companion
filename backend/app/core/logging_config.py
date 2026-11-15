
import json
import logging
import sys

from datetime import datetime, timezone
from typing import Any

from app.core.config import settings


class JsonFormatter(logging.Formatter):
    """Genera registros estructurados en formato JSON."""

    CONTEXT_FIELDS = (
        "event",
        "request_id",
        "astronaut_id",
        "measurement_id",
        "alert_id",
        "environment",
        "status",
        "duration_ms",
        "recommendation_count",
    )

    def format(self, record: logging.LogRecord) -> str:
        log_data: dict[str, Any] = {
            "timestamp": datetime.fromtimestamp(
                record.created,
                tz=timezone.utc
            ).isoformat(timespec="milliseconds"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        for field in self.CONTEXT_FIELDS:
            value = getattr(record, field, None)

            if value is not None:
                log_data[field] = value

        if record.exc_info:
            log_data["exception"] = self.formatException(
                record.exc_info
            )

        if record.stack_info:
            log_data["stack"] = self.formatStack(
                record.stack_info
            )

        return json.dumps(
            log_data,
            ensure_ascii=False,
            default=str,
        )


def setup_logging() -> None:
    """Configura el sistema de logging según el entorno."""

    log_level = (
        logging.DEBUG if settings.DEBUG else logging.INFO
    )

    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)

    # Buscar el handler propio para evitar duplicados.
    console_handler = next(
        (
            handler
            for handler in root_logger.handlers
            if getattr(handler, "_astrohealth_handler", False)
        ),
        None,
    )

    if console_handler is None:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler._astrohealth_handler = True
        root_logger.addHandler(console_handler)

    console_handler.setLevel(log_level)

    # Seleccionar el formato según el entorno.
    if settings.ENVIRONMENT == "production":
        console_handler.setFormatter(JsonFormatter())
    else:
        console_handler.setFormatter(
            logging.Formatter(
                fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
                datefmt="%Y-%m-%d %H:%M:%S",
            )
        )

    # Reducir ruido de librerías externas.
    external_level = (
        logging.INFO if settings.DEBUG else logging.WARNING
    )

    logging.getLogger("uvicorn.access").setLevel(external_level)
    logging.getLogger("sqlalchemy.engine").setLevel(external_level)
