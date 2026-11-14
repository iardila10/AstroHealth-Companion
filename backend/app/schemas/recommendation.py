from typing import List
from pydantic import BaseModel, Field


class Recommendation(BaseModel):
    """Recomendación accionable y explicada."""
    id: str
    title: str
    priority: int = Field(..., ge=1, le=5, description="1 = más urgente")
    message: str
    actions: List[str] = Field(default_factory=list)