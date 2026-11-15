from typing import Literal

from pydantic import BaseModel, Field


class DemoTickRequest(BaseModel):
    astronaut_id: int = Field(..., gt=0)
    environment: Literal["spacecraft", "lunar_base"]
    profile: Literal["normal", "attention", "critical"]
