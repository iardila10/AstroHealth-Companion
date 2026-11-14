from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class AstronautBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    role: Optional[str] = Field(None, max_length=50)
    current_environment: str = Field(
        default="spacecraft",
        pattern="^(spacecraft|lunar_base)$"
    )


class AstronautCreate(AstronautBase):
    pass


class AstronautRead(AstronautBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AstronautUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    role: Optional[str] = Field(None, max_length=50)
    current_environment: Optional[str] = Field(
        None, pattern="^(spacecraft|lunar_base)$"
    )