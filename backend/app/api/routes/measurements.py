from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_database
from app.models.measurement import Measurement
from app.models.astronaut import Astronaut
from app.schemas.measurement import MeasurementCreate, MeasurementRead
from app.schemas.evaluation import EvaluationResult
from app.services.evaluation_service import evaluation_service
from app.services.notification_service import notification_service

router = APIRouter()


@router.post("/", response_model=EvaluationResult, status_code=status.HTTP_201_CREATED)
def create_measurement_and_evaluate(
    measurement_in: MeasurementCreate,
    db: Session = Depends(get_database)
):
    """
    Crea una medición y ejecuta automáticamente la evaluación de salud.
    Este es el endpoint principal del sistema.
    """
    try:
        result = evaluation_service.evaluate_and_save(db, measurement_in)

        # Notificación simple (consola)
        astronaut = db.get(Astronaut, measurement_in.astronaut_id)
        name = astronaut.name if astronaut else "Unknown"
        notification_service.notify(result, astronaut_name=name)

        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/", response_model=List[MeasurementRead])
def list_measurements(
    astronaut_id: int | None = None,
    limit: int = 50,
    db: Session = Depends(get_database)
):
    """Lista mediciones (opcionalmente filtradas por astronauta)."""
    query = db.query(Measurement)
    if astronaut_id is not None:
        query = query.filter(Measurement.astronaut_id == astronaut_id)
    return query.order_by(Measurement.id.desc()).limit(limit).all()


@router.get("/{measurement_id}", response_model=MeasurementRead)
def get_measurement(measurement_id: int, db: Session = Depends(get_database)):
    """Obtiene una medición específica."""
    measurement = db.get(Measurement, measurement_id)
    if not measurement:
        raise HTTPException(status_code=404, detail="Medición no encontrada")
    return measurement