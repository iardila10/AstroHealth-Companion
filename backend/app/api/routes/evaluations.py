from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_database
from app.models.alert import Alert

router = APIRouter()


@router.get("/", response_model=List[dict[str, Any]])
def list_alerts(
    astronaut_id: int | None = None,
    status: str | None = None,
    limit: int = 50,
    db: Session = Depends(get_database)
):
    """
    Lista el historial de alertas/evaluaciones.
    Se puede filtrar por astronauta y por estado (green/yellow/red).
    """
    query = db.query(Alert)
    if astronaut_id is not None:
        query = query.filter(Alert.astronaut_id == astronaut_id)
    if status is not None:
        query = query.filter(Alert.overall_status == status)

    alerts = query.order_by(Alert.created_at.desc()).limit(limit).all()

    # Convertimos a dict para mayor flexibilidad en la respuesta
    return [
        {
            "id": a.id,
            "measurement_id": a.measurement_id,
            "astronaut_id": a.astronaut_id,
            "overall_status": a.overall_status,
            "indicator_statuses": a.indicator_statuses,
            "triggered_rules": a.triggered_rules,
            "recommendations": a.recommendations,
            "summary": a.summary,
            "acknowledged": a.acknowledged,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in alerts
    ]


@router.get("/{alert_id}")
def get_alert(alert_id: int, db: Session = Depends(get_database)):
    """Obtiene una alerta específica."""
    alert = db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")

    return {
        "id": alert.id,
        "measurement_id": alert.measurement_id,
        "astronaut_id": alert.astronaut_id,
        "overall_status": alert.overall_status,
        "indicator_statuses": alert.indicator_statuses,
        "triggered_rules": alert.triggered_rules,
        "recommendations": alert.recommendations,
        "summary": alert.summary,
        "acknowledged": alert.acknowledged,
        "created_at": alert.created_at.isoformat() if alert.created_at else None,
    }


@router.patch("/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: int, db: Session = Depends(get_database)):
    """Marca una alerta como reconocida por el astronauta."""
    alert = db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")

    alert.acknowledged = True
    db.commit()
    db.refresh(alert)

    return {"message": "Alerta reconocida", "alert_id": alert.id}