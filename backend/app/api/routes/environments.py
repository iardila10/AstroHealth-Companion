from fastapi import APIRouter, HTTPException
from app.core.environment_manager import environment_manager

router = APIRouter()


@router.get("/")
def list_environments():
    """Lista los entornos disponibles (spacecraft, lunar_base)."""
    return {
        "environments": environment_manager.get_available_environments()
    }


@router.get("/{environment}/thresholds")
def get_environment_thresholds(environment: str):
    """Devuelve todos los umbrales de un entorno específico."""
    try:
        thresholds = environment_manager.get_thresholds(environment)
        return {
            "environment": environment,
            "thresholds": thresholds
        }
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))