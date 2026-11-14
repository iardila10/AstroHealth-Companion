from datetime import datetime
from typing import Optional

from sqlalchemy import String, Float, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Measurement(Base):
    __tablename__ = "measurements"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    astronaut_id: Mapped[int] = mapped_column(ForeignKey("astronauts.id"), nullable=False)

    # Entorno en el momento de la medición
    environment: Mapped[str] = mapped_column(String(20), nullable=False)  # spacecraft | lunar_base

    # --- Los 6 indicadores ---
    heart_rate: Mapped[float] = mapped_column(Float, nullable=False)          # bpm
    blood_pressure_sys: Mapped[float] = mapped_column(Float, nullable=False)  # mmHg
    blood_pressure_dia: Mapped[float] = mapped_column(Float, nullable=False)  # mmHg
    temperature: Mapped[float] = mapped_column(Float, nullable=False)         # °C
    sleep_hours: Mapped[float] = mapped_column(Float, nullable=False)         # hours
    glucose: Mapped[float] = mapped_column(Float, nullable=False)             # mg/dL
    fatigue_level: Mapped[int] = mapped_column(Integer, nullable=False)       # 1-10

    notes: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # Relaciones
    astronaut: Mapped["Astronaut"] = relationship(back_populates="measurements")
    alert: Mapped[Optional["Alert"]] = relationship(
        back_populates="measurement",
        uselist=False,
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Measurement id={self.id} astronaut_id={self.astronaut_id} env={self.environment}>"