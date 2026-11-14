from datetime import datetime
from typing import List, Optional

from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Astronaut(Base):
    __tablename__ = "astronauts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # ej: Commander, Pilot, Specialist
    current_environment: Mapped[str] = mapped_column(
        String(20), 
        nullable=False, 
        default="spacecraft"
    )  # "spacecraft" | "lunar_base"

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )

    # Relaciones
    measurements: Mapped[List["Measurement"]] = relationship(
        back_populates="astronaut",
        cascade="all, delete-orphan"
    )
    alerts: Mapped[List["Alert"]] = relationship(
        back_populates="astronaut",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Astronaut id={self.id} name={self.name} env={self.current_environment}>"