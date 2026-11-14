from typing import Any, Dict, List
from pathlib import Path
import yaml

from app.core.config import settings
from app.schemas.recommendation import Recommendation
from app.schemas.evaluation import IndicatorStatus, EvaluationResult


class RecommendationEngine:
    """
    Genera recomendaciones priorizadas y explicaciones
    a partir del resultado del RulesEngine.
    """

    def __init__(self, knowledge_dir: Path | None = None):
        self.knowledge_dir = knowledge_dir or settings.KNOWLEDGE_DIR
        self._recommendations: Dict[str, Any] = {}
        self._indicator_explanations: Dict[str, Any] = {}
        self._combination_rules: List[Dict[str, Any]] = []
        self._load_knowledge()

    def _load_knowledge(self) -> None:
        # Explanations + recommendations
        exp_path = self.knowledge_dir / "explanations.yaml"
        with open(exp_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)

        self._recommendations = data.get("recommendations", {})
        self._indicator_explanations = data.get("indicator_explanations", {})

        # Combination rules (para saber qué recommendation_ids usar)
        rules_path = self.knowledge_dir / "combination_rules.yaml"
        with open(rules_path, "r", encoding="utf-8") as f:
            rules_data = yaml.safe_load(f)
        self._combination_rules = rules_data.get("rules", [])

    def _get_recommendation_by_id(self, rec_id: str) -> Recommendation | None:
        raw = self._recommendations.get(rec_id)
        if not raw:
            return None
        return Recommendation(
            id=rec_id,
            title=raw["title"],
            priority=raw["priority"],
            message=raw["message"],
            actions=raw.get("actions", [])
        )

    def _enrich_indicator_explanations(
        self,
        indicator_statuses: Dict[str, IndicatorStatus]
    ) -> Dict[str, IndicatorStatus]:
        """Añade explicaciones legibles a cada indicador que no esté en green."""
        enriched = {}
        for indicator, status_obj in indicator_statuses.items():
            explanation = None
            if status_obj.status != "green":
                exp_map = self._indicator_explanations.get(indicator, {})
                explanation = exp_map.get(status_obj.status)

            enriched[indicator] = IndicatorStatus(
                status=status_obj.status,
                value=status_obj.value,
                explanation=explanation
            )
        return enriched

    def generate(
        self,
        evaluation: Dict[str, Any]
    ) -> EvaluationResult:
        """
        Genera el EvaluationResult completo con recomendaciones priorizadas.
        """
        indicator_statuses = evaluation["indicator_statuses"]
        triggered_rules = evaluation["triggered_rules"]
        overall_status = evaluation["overall_status"]
        environment = evaluation["environment"]

        # 1. Enriquecer con explicaciones
        enriched_statuses = self._enrich_indicator_explanations(indicator_statuses)

        # 2. Recolectar recomendaciones desde las reglas disparadas
        rec_ids: set[str] = set()
        for rule in self._combination_rules:
            if rule["id"] in triggered_rules:
                for rid in rule.get("recommendation_ids", []):
                    rec_ids.add(rid)

        # 3. Si no hay reglas de combinación pero hay indicadores en yellow/red,
        #    generamos recomendaciones básicas por indicador
        if not rec_ids:
            for indicator, status_obj in enriched_statuses.items():
                if status_obj.status in ("yellow", "red"):
                    # Mapeo simple de fallback
                    fallback_map = {
                        "heart_rate": "REC_CARDIO_01",
                        "blood_pressure_sys": "REC_CARDIO_01",
                        "blood_pressure_dia": "REC_CARDIO_01",
                        "temperature": "REC_TEMP_01",
                        "sleep_hours": "REC_SLEEP_01",
                        "glucose": "REC_GLUCOSE_01",
                        "fatigue_level": "REC_REST_01",
                    }
                    if indicator in fallback_map:
                        rec_ids.add(fallback_map[indicator])

        # 4. Construir lista de Recommendation y ordenar por prioridad
        recommendations: List[Recommendation] = []
        for rid in rec_ids:
            rec = self._get_recommendation_by_id(rid)
            if rec:
                recommendations.append(rec)

        recommendations.sort(key=lambda r: r.priority)

        # 5. Generar resumen legible
        summary = self._build_summary(overall_status, enriched_statuses, recommendations)

        return EvaluationResult(
            overall_status=overall_status,
            indicator_statuses=enriched_statuses,
            triggered_rules=triggered_rules,
            recommendations=recommendations,
            summary=summary,
            environment=environment,
        )

    def _build_summary(
        self,
        overall_status: str,
        statuses: Dict[str, IndicatorStatus],
        recommendations: List[Recommendation]
    ) -> str:
        if overall_status == "green":
            return "Todos los indicadores se encuentran dentro de rangos normales. Continúa con el monitoreo rutinario."

        problems = [
            f"{ind.replace('_', ' ').title()} ({obj.status})"
            for ind, obj in statuses.items() if obj.status != "green"
        ]

        problem_text = ", ".join(problems)
        rec_text = recommendations[0].title if recommendations else "Revisar protocolo de salud"

        return (
            f"Estado general: {overall_status.upper()}. "
            f"Indicadores fuera de rango: {problem_text}. "
            f"Acción prioritaria: {rec_text}."
        )


# Instancia global
recommendation_engine = RecommendationEngine()