from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class MeasurementBase(BaseModel):
    """Campos comunes de una medición."""
    environment: str = Field(..., pattern="^(spacecraft|lunar_base)$")
    heart_rate: float = Field(..., gt=20, lt=250, description="bpm")
    blood_pressure_sys: float = Field(..., gt=50, lt=250, description="mmHg")
    blood_pressure_dia: float = Field(..., gt=30, lt=150, description="mmHg")
    temperature: float = Field(..., gt=30, lt=45, description="°C")
    sleep_hours: float = Field(..., ge=0, le=24, description="hours")
    glucose: float = Field(..., gt=20, lt=500, description="mg/dL")
    fatigue_level: int = Field(..., ge=1, le=10, description="1-10")
    notes: Optional[str] = Field(None, max_length=500)


class MeasurementCreate(MeasurementBase):
    """Schema para crear una nueva medición."""
    astronaut_id: int


class MeasurementRead(MeasurementBase):
    """Schema de respuesta de una medición."""
    id: int
    astronaut_id: int
    recorded_at: datetime

    model_config = ConfigDict(from_attributes=True)