from typing import Dict, Any
from sqlalchemy.orm import Session

from app.models.measurement import Measurement
from app.models.alert import Alert
from app.models.astronaut import Astronaut
from app.core.rules_engine import rules_engine
from app.core.recommendation_engine import recommendation_engine
from app.schemas.evaluation import EvaluationResult
from app.schemas.measurement import MeasurementCreate


class EvaluationService:
    """
    Orquesta el flujo completo:
    1. Guarda la medición
    2. Ejecuta el Rules Engine
    3. Genera recomendaciones
    4. Guarda la Alert
    5. Devuelve el resultado completo
    """

    def evaluate_and_save(
        self,
        db: Session,
        measurement_in: MeasurementCreate
    ) -> EvaluationResult:
        # 1. Verificar que el astronauta existe
        astronaut = db.get(Astronaut, measurement_in.astronaut_id)
        if not astronaut:
            raise ValueError(f"Astronauta con id {measurement_in.astronaut_id} no encontrado")

        # 2. Crear y guardar la medición
        measurement = Measurement(
            astronaut_id=measurement_in.astronaut_id,
            environment=measurement_in.environment,
            heart_rate=measurement_in.heart_rate,
            blood_pressure_sys=measurement_in.blood_pressure_sys,
            blood_pressure_dia=measurement_in.blood_pressure_dia,
            temperature=measurement_in.temperature,
            sleep_hours=measurement_in.sleep_hours,
            glucose=measurement_in.glucose,
            fatigue_level=measurement_in.fatigue_level,
            notes=measurement_in.notes,
        )
        db.add(measurement)
        db.flush()  # Obtenemos el id sin hacer commit todavía

        # 3. Preparar datos para el motor de reglas
        measurement_data: Dict[str, float | int] = {
            "heart_rate": measurement.heart_rate,
            "blood_pressure_sys": measurement.blood_pressure_sys,
            "blood_pressure_dia": measurement.blood_pressure_dia,
            "temperature": measurement.temperature,
            "sleep_hours": measurement.sleep_hours,
            "glucose": measurement.glucose,
            "fatigue_level": measurement.fatigue_level,
        }

        # 4. Ejecutar Rules Engine
        raw_evaluation = rules_engine.evaluate(
            measurement_data=measurement_data,
            environment=measurement.environment
        )

        # 5. Generar recomendaciones
        evaluation_result: EvaluationResult = recommendation_engine.generate(raw_evaluation)

        # 6. Crear y guardar la Alert
        alert = Alert(
            measurement_id=measurement.id,
            astronaut_id=measurement.astronaut_id,
            overall_status=evaluation_result.overall_status,
            indicator_statuses={
                k: v.model_dump() for k, v in evaluation_result.indicator_statuses.items()
            },
            triggered_rules=evaluation_result.triggered_rules,
            recommendations=[r.model_dump() for r in evaluation_result.recommendations],
            summary=evaluation_result.summary,
        )
        db.add(alert)
        db.commit()
        db.refresh(measurement)
        db.refresh(alert)

        return evaluation_result


# Instancia para usar en las rutas
evaluation_service = EvaluationService()