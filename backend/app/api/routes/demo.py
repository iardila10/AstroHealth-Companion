from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_database
from app.core.config import settings
from app.schemas.demo import DemoTickRequest
from app.schemas.evaluation import EvaluationResult
from app.services.demo_simulator import generate_measurement
from app.services.evaluation_service import evaluation_service

router = APIRouter()


@router.post(
    "/simulator/tick",
    response_model=EvaluationResult,
    status_code=status.HTTP_201_CREATED,
)
def create_simulated_tick(
    request: DemoTickRequest,
    db: Session = Depends(get_database),
) -> EvaluationResult:
    """Guarda y evalúa una lectura sintética; se desactiva en producción."""
    if settings.ENVIRONMENT == "production":
        raise HTTPException(status_code=404, detail="Demo no disponible")

    measurement = generate_measurement(request)
    try:
        return evaluation_service.evaluate_and_save(db, measurement)
    except ValueError as cause:
        raise HTTPException(status_code=404, detail=str(cause)) from cause
