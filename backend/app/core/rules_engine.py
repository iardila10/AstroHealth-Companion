from typing import Any, Dict, List, Tuple
from pathlib import Path
import yaml

from app.core.config import settings
from app.core.environment_manager import environment_manager
from app.schemas.evaluation import IndicatorStatus


class RulesEngine:
    """
    Motor de evaluación de salud.
    1. Evalúa cada indicador contra los umbrales del entorno.
    2. Aplica las reglas de combinación.
    3. Determina el estado global (green / yellow / red).
    """

    def __init__(self, knowledge_dir: Path | None = None):
        self.knowledge_dir = knowledge_dir or settings.KNOWLEDGE_DIR
        self._combination_rules: List[Dict[str, Any]] = []
        self._load_combination_rules()

    def _load_combination_rules(self) -> None:
        file_path = self.knowledge_dir / "combination_rules.yaml"
        if not file_path.exists():
            raise FileNotFoundError(f"No se encontró: {file_path}")

        with open(file_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)

        self._combination_rules = data.get("rules", [])

    def _evaluate_single_indicator(
        self,
        value: float | int,
        thresholds: Dict[str, Any]
    ) -> str:
        """
        Evalúa un solo valor contra los umbrales green/yellow/red.
        Soporta rangos con min/max y min2/max2 (para rangos partidos).
        """
        def in_range(val: float, rule: Dict[str, Any]) -> bool:
            # Rango principal
            min_v = rule.get("min")
            max_v = rule.get("max")
            if min_v is not None and max_v is not None:
                if min_v <= val <= max_v:
                    return True
            elif min_v is not None and max_v is None:
                if val >= min_v:
                    return True
            elif min_v is None and max_v is not None:
                if val <= max_v:
                    return True

            # Rango secundario (min2/max2)
            min2 = rule.get("min2")
            max2 = rule.get("max2")
            if min2 is not None and max2 is not None:
                if min2 <= val <= max2:
                    return True
            elif min2 is not None and max2 is None:
                if val >= min2:
                    return True
            elif min2 is None and max2 is not None:
                if val <= max2:
                    return True

            return False

        # Orden de prioridad: red > yellow > green
        if "red" in thresholds and in_range(value, thresholds["red"]):
            return "red"
        if "yellow" in thresholds and in_range(value, thresholds["yellow"]):
            return "yellow"
        if "green" in thresholds and in_range(value, thresholds["green"]):
            return "green"

        # Si no entra en ningún rango, lo tratamos como yellow por seguridad
        return "yellow"

    def evaluate_indicators(
        self,
        measurement_data: Dict[str, float | int],
        environment: str
    ) -> Dict[str, IndicatorStatus]:
        """
        Evalúa los 6 indicadores y devuelve su estado individual.
        """
        env_thresholds = environment_manager.get_thresholds(environment)
        results: Dict[str, IndicatorStatus] = {}

        for indicator, value in measurement_data.items():
            if indicator not in env_thresholds:
                continue

            status = self._evaluate_single_indicator(value, env_thresholds[indicator])
            results[indicator] = IndicatorStatus(
                status=status,
                value=value,
                explanation=None  # se llena después en el recommendation engine
            )

        return results

    def apply_combination_rules(
        self,
        indicator_statuses: Dict[str, IndicatorStatus]
    ) -> Tuple[str, List[str]]:
        """
        Aplica las reglas de combinación.
        Devuelve: (overall_status, lista de rule_ids disparadas)
        """
        triggered: List[str] = []
        highest_status = "green"
        status_priority = {"green": 0, "yellow": 1, "red": 2}

        # Contamos cuántos yellow hay (para la regla MULTIPLE_YELLOW)
        yellow_count = sum(1 for s in indicator_statuses.values() if s.status == "yellow")

        for rule in self._combination_rules:
            rule_id = rule["id"]
            matched = True

            # Regla especial por conteo
            if "min_yellow_count" in rule:
                if yellow_count >= rule["min_yellow_count"]:
                    triggered.append(rule_id)
                    if status_priority[rule["resulting_status"]] > status_priority[highest_status]:
                        highest_status = rule["resulting_status"]
                continue

            # Reglas por condiciones de indicadores
            conditions = rule.get("conditions", [])
            for cond in conditions:
                ind = cond["indicator"]
                allowed_statuses = cond["status"]
                current = indicator_statuses.get(ind)
                if not current or current.status not in allowed_statuses:
                    matched = False
                    break

            if matched:
                triggered.append(rule_id)
                if status_priority[rule["resulting_status"]] > status_priority[highest_status]:
                    highest_status = rule["resulting_status"]

        # También consideramos el peor estado individual
        for status_obj in indicator_statuses.values():
            if status_priority[status_obj.status] > status_priority[highest_status]:
                highest_status = status_obj.status

        return highest_status, triggered

    def evaluate(
        self,
        measurement_data: Dict[str, float | int],
        environment: str
    ) -> Dict[str, Any]:
        """
        Punto de entrada principal del motor de reglas.
        """
        indicator_statuses = self.evaluate_indicators(measurement_data, environment)
        overall_status, triggered_rules = self.apply_combination_rules(indicator_statuses)

        return {
            "overall_status": overall_status,
            "indicator_statuses": indicator_statuses,
            "triggered_rules": triggered_rules,
            "environment": environment,
        }


# Instancia global
rules_engine = RulesEngine()