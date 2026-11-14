from app.schemas.evaluation import EvaluationResult


class NotificationService:
    """
    Servicio de notificaciones (versión básica para el hackatón).
    Más adelante se puede conectar a WebSockets, email o Mission Control.
    """

    def notify(self, evaluation: EvaluationResult, astronaut_name: str = "Astronaut") -> None:
        """
        Por ahora solo imprime en consola.
        En producción aquí iría el envío real de la alerta.
        """
        status_emoji = {
            "green": "✅",
            "yellow": "⚠️",
            "red": "🚨"
        }

        emoji = status_emoji.get(evaluation.overall_status, "ℹ️")
        print(f"\n{emoji} ALERTA para {astronaut_name}")
        print(f"Estado: {evaluation.overall_status.upper()}")
        print(f"Resumen: {evaluation.summary}")
        if evaluation.recommendations:
            print(f"Recomendación prioritaria: {evaluation.recommendations[0].title}")
        print("-" * 50)


notification_service = NotificationService()