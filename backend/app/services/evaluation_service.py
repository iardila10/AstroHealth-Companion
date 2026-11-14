import logging
from typing import Dict
from sqlalchemy.orm import Session

from app.models.measurement import Measurement
from app.models.alert import Alert
from app.models.astronaut import Astronaut
from app.core.rules_engine import rules_engine
from app.core.recommendation_engine import recommendation_engine
from app.core.environment_manager import environment_manager
from app.schemas.evaluation import EvaluationResult
from app.schemas.measurement import MeasurementCreate

logger = logging.getLogger(__name__)


class EvaluationService:
    """
    Orquesta el flujo completo de evaluación de salud.
    """

    def evaluate_and_save(
        self,
        db: Session,
        measurement_in: MeasurementCreate
    ) -> EvaluationResult:
        logger.info(
            f"Iniciando evaluación | astronaut_id={measurement_in.astronaut_id} "
            f"| environment={measurement_in.environment}"
        )

        # 1. Verificar astronauta
        astronaut = db.get(Astronaut, measurement_in.astronaut_id)
        if not astronaut:
            logger.warning(f"Astronauta no encontrado: id={measurement_in.astronaut_id}")
            raise ValueError(f"Astronauta con id {measurement_in.astronaut_id} no encontrado")

        # 2. Verificar entorno
        available_envs = environment_manager.get_available_environments()
        if measurement_in.environment not in available_envs:
            logger.warning(f"Entorno no válido: {measurement_in.environment}")
            raise ValueError(
                f"Entorno '{measurement_in.environment}' no soportado. "
                f"Disponibles: {available_envs}"
            )

        # 3. Crear medición
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
        db.flush()
        logger.debug(f"Medición creada | measurement_id={measurement.id}")

        # 4. Datos para el motor
        measurement_data: Dict[str, float | int] = {
            "heart_rate": measurement.heart_rate,
            "blood_pressure_sys": measurement.blood_pressure_sys,
            "blood_pressure_dia": measurement.blood_pressure_dia,
            "temperature": measurement.temperature,
            "sleep_hours": measurement.sleep_hours,
            "glucose": measurement.glucose,
            "fatigue_level": measurement.fatigue_level,
        }

        # 5. Rules Engine
        raw_evaluation = rules_engine.evaluate(
            measurement_data=measurement_data,
            environment=measurement.environment
        )
        logger.info(
            f"Evaluación completada | status={raw_evaluation['overall_status']} "
            f"| rules={raw_evaluation['triggered_rules']}"
        )

        # 6. Recommendation Engine
        evaluation_result: EvaluationResult = recommendation_engine.generate(raw_evaluation)

        # 7. Guardar Alert
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

        logger.info(
            f"Alerta guardada | alert_id={alert.id} "
            f"| status={alert.overall_status} "
            f"| recommendations={len(evaluation_result.recommendations)}"
        )

        return evaluation_result


evaluation_service = EvaluationService()