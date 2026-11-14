from pathlib import Path
from typing import Any, Dict, Optional
import yaml

from app.core.config import settings


class EnvironmentManager:
    """
    Gestiona los umbrales de salud según el entorno
    (spacecraft | lunar_base).
    Carga los datos desde knowledge/thresholds.yaml.
    """

    def __init__(self, knowledge_dir: Optional[Path] = None):
        self.knowledge_dir = knowledge_dir or settings.KNOWLEDGE_DIR
        self._thresholds: Dict[str, Any] = {}
        self._load_thresholds()

    def _load_thresholds(self) -> None:
        """Carga el archivo YAML de umbrales."""
        file_path = self.knowledge_dir / "thresholds.yaml"
        if not file_path.exists():
            raise FileNotFoundError(f"No se encontró el archivo de umbrales: {file_path}")

        with open(file_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)

        self._thresholds = data.get("environments", {})
        if not self._thresholds:
            raise ValueError("El archivo thresholds.yaml no contiene la clave 'environments'")

    def get_available_environments(self) -> list[str]:
        """Devuelve la lista de entornos disponibles."""
        return list(self._thresholds.keys())

    def get_thresholds(self, environment: str) -> Dict[str, Any]:
        """
        Devuelve todos los umbrales de un entorno.
        Lanza KeyError si el entorno no existe.
        """
        if environment not in self._thresholds:
            raise KeyError(f"Entorno no soportado: {environment}. "
                           f"Disponibles: {self.get_available_environments()}")
        return self._thresholds[environment]

    def get_indicator_thresholds(self, environment: str, indicator: str) -> Dict[str, Any]:
        """Devuelve los umbrales de un indicador concreto en un entorno."""
        env_thresholds = self.get_thresholds(environment)
        if indicator not in env_thresholds:
            raise KeyError(f"Indicador '{indicator}' no encontrado en el entorno '{environment}'")
        return env_thresholds[indicator]


# Instancia global (se puede inyectar también)
environment_manager = EnvironmentManager()