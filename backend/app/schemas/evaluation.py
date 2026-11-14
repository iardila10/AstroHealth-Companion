from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
from app.schemas.recommendation import Recommendation


class IndicatorStatus(BaseModel):
    """Estado de un indicador individual."""
    status: str = Field(..., pattern="^(green|yellow|red)$")
    value: float | int
    explanation: Optional[str] = None


class EvaluationResult(BaseModel):
    """
    Resultado completo de la evaluación de una medición.
    Este es el objeto principal que devolverá el motor de reglas.
    """
    overall_status: str = Field(..., pattern="^(green|yellow|red)$")
    indicator_statuses: Dict[str, IndicatorStatus]
    triggered_rules: List[str] = Field(default_factory=list)
    recommendations: List[Recommendation] = Field(default_factory=list)
    summary: str

    # Metadatos útiles
    environment: str
    evaluated_at: Optional[str] = None