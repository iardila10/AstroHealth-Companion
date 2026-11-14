from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, model_validator


class MeasurementBase(BaseModel):
    """Campos comunes de una medición."""
    environment: str = Field(..., pattern="^(spacecraft|lunar_base)$")
    
    heart_rate: float = Field(..., gt=30, lt=220, description="bpm")
    blood_pressure_sys: float = Field(..., gt=70, lt=220, description="mmHg")
    blood_pressure_dia: float = Field(..., gt=40, lt=140, description="mmHg")
    temperature: float = Field(..., gt=34.0, lt=42.0, description="°C")
    sleep_hours: float = Field(..., ge=0, le=16, description="hours")
    glucose: float = Field(..., gt=40, lt=400, description="mg/dL")
    fatigue_level: int = Field(..., ge=1, le=10, description="1-10")
    notes: Optional[str] = Field(None, max_length=500)

    @model_validator(mode="after")
    def validate_blood_pressure(self) -> "MeasurementBase":
        """La presión sistólica debe ser mayor que la diastólica."""
        if self.blood_pressure_sys <= self.blood_pressure_dia:
            raise ValueError(
                f"blood_pressure_sys ({self.blood_pressure_sys}) debe ser mayor que "
                f"blood_pressure_dia ({self.blood_pressure_dia})"
            )
        return self


class MeasurementCreate(MeasurementBase):
    """Schema para crear una nueva medición."""
    astronaut_id: int = Field(..., gt=0)


class MeasurementRead(MeasurementBase):
    """Schema de respuesta de una medición."""
    id: int
    astronaut_id: int
    recorded_at: datetime

    model_config = ConfigDict(from_attributes=True)