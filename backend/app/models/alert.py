from datetime import datetime
from typing import Optional, Any

from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.models.base import Base


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    measurement_id: Mapped[int] = mapped_column(ForeignKey("measurements.id"), nullable=False, unique=True)
    astronaut_id: Mapped[int] = mapped_column(ForeignKey("astronauts.id"), nullable=False)

    # Estado global de la evaluación
    overall_status: Mapped[str] = mapped_column(String(10), nullable=False)  # green | yellow | red

    # Detalle de qué indicadores fallaron
    # Ejemplo: {"heart_rate": "yellow", "fatigue_level": "red"}
    indicator_statuses: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)

    # Reglas de combinación que se dispararon
    triggered_rules: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)

    # Recomendaciones generadas (lista de dicts)
    recommendations: Mapped[list[dict[str, Any]]] = mapped_column(JSON, nullable=False, default=list)

    # Resumen legible para el astronauta
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # Relaciones
    measurement: Mapped["Measurement"] = relationship(back_populates="alert")
    astronaut: Mapped["Astronaut"] = relationship(back_populates="alerts")

    def __repr__(self) -> str:
        return f"<Alert id={self.id} status={self.overall_status} astronaut_id={self.astronaut_id}>"