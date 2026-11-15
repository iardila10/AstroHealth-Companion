import random
from uuid import uuid4

from app.schemas.demo import DemoTickRequest
from app.schemas.measurement import MeasurementCreate


BASE_VALUES: dict[str, float | int] = {
    "heart_rate": 80.0,
    "blood_pressure_sys": 110.0,
    "blood_pressure_dia": 70.0,
    "temperature": 36.8,
    "sleep_hours": 8.0,
    "glucose": 90.0,
    "fatigue_level": 2,
}

PROFILE_SCENARIOS: dict[str, dict[str, dict[str, float | int]]] = {
    "attention": {
        "heart_rate": {"heart_rate": 110.0},
        "blood_pressure_sys": {"blood_pressure_sys": 130.0},
        "blood_pressure_dia": {"blood_pressure_dia": 85.0},
        "temperature": {"temperature": 37.5},
        "sleep_hours": {"sleep_hours": 6.0},
        "glucose": {"glucose": 110.0},
        "fatigue_level": {"fatigue_level": 4},
    },
    "critical": {
        "heart_rate": {"heart_rate": 130.0},
        "blood_pressure_sys": {"blood_pressure_sys": 145.0},
        "blood_pressure_dia": {"blood_pressure_dia": 95.0},
        "temperature": {"temperature": 38.4},
        "sleep_hours": {"sleep_hours": 4.0},
        "glucose": {"glucose": 140.0},
        "fatigue_level": {"fatigue_level": 8},
    },
}

_last_scenario_by_astronaut: dict[tuple[int, str], str] = {}


def generate_measurement(request: DemoTickRequest) -> MeasurementCreate:
    """Genera una lectura sintética para la demo local."""
    values = BASE_VALUES.copy()
    if request.profile != "normal":
        scenarios = PROFILE_SCENARIOS[request.profile]
        history_key = (request.astronaut_id, request.profile)
        previous_scenario = _last_scenario_by_astronaut.get(history_key)
        available_scenarios = [
            scenario
            for scenario in scenarios
            if scenario != previous_scenario
        ]
        selected_scenario = random.choice(available_scenarios)
        _last_scenario_by_astronaut[history_key] = selected_scenario
        values.update(scenarios[selected_scenario])

    return MeasurementCreate(
        astronaut_id=request.astronaut_id,
        client_measurement_id=str(uuid4()),
        environment=request.environment,
        heart_rate=float(values["heart_rate"]),
        blood_pressure_sys=float(values["blood_pressure_sys"]),
        blood_pressure_dia=float(values["blood_pressure_dia"]),
        temperature=float(values["temperature"]),
        sleep_hours=float(values["sleep_hours"]),
        glucose=float(values["glucose"]),
        fatigue_level=int(values["fatigue_level"]),
        notes=(
            "DEMO SINTÉTICA · perfil normal"
            if request.profile == "normal"
            else f"DEMO SINTÉTICA · perfil {request.profile} · indicador {selected_scenario}"
        ),
    )
