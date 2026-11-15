
import pytest

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
import app.main as main_module

from app.api.deps import get_database
from app.models.base import Base

from app.models.astronaut import Astronaut
from app.models.measurement import Measurement
from app.models.alert import Alert
import app.api.routes.demo as demo_module


@pytest.fixture
def session_factory():
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    Base.metadata.create_all(bind=engine)

    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
    )

    yield TestingSessionLocal

    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture
def client(session_factory, monkeypatch):
    monkeypatch.setattr(main_module, "create_tables", lambda: None)
    monkeypatch.setattr(main_module, "setup_logging", lambda: None)

    def override_get_database():
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_database] = override_get_database

    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.pop(get_database, None)


def create_astronaut(client, **overrides):
    data = {
        "name": "Test Astronaut",
        "role": "Commander",
        "current_environment": "spacecraft",
    }

    data.update(overrides)

    response = client.post("/api/v1/astronauts/", json=data)

    assert response.status_code == 201, response.text

    return response.json()


def create_measurement(client, astronaut_id, **overrides):
    data = {
        "astronaut_id": astronaut_id,
        "environment": "spacecraft",
        "heart_rate": 80,
        "blood_pressure_sys": 110,
        "blood_pressure_dia": 70,
        "temperature": 36.8,
        "sleep_hours": 8,
        "glucose": 90,
        "fatigue_level": 2,
        "notes": "API integration test",
    }

    data.update(overrides)

    response = client.post(
        "/api/v1/measurements/",
        json=data,
    )

    assert response.status_code == 201, response.text

    return response.json()


# HEALTH

def test_health_check(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert "app" in response.json()
    assert "version" in response.json()


# ASTRONAUTS

def test_create_astronaut(client):
    result = create_astronaut(client)

    assert result["name"] == "Test Astronaut"
    assert result["role"] == "Commander"
    assert result["current_environment"] == "spacecraft"
    assert result["id"] > 0


def test_create_astronaut_invalid_data(client):
    response = client.post(
        "/api/v1/astronauts/",
        json={"name": "A"},
    )

    assert response.status_code == 422


def test_list_astronauts(client):
    create_astronaut(client)

    response = client.get("/api/v1/astronauts/")

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_get_astronaut(client):
    astronaut = create_astronaut(client)

    response = client.get(
        f"/api/v1/astronauts/{astronaut['id']}"
    )

    assert response.status_code == 200
    assert response.json()["id"] == astronaut["id"]


def test_get_nonexistent_astronaut(client):
    response = client.get("/api/v1/astronauts/999")

    assert response.status_code == 404


def test_update_astronaut(client):
    astronaut = create_astronaut(client)

    response = client.patch(
        f"/api/v1/astronauts/{astronaut['id']}",
        json={"name": "Updated Astronaut"},
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Updated Astronaut"


def test_update_nonexistent_astronaut(client):
    response = client.patch(
        "/api/v1/astronauts/999",
        json={"name": "Updated Astronaut"},
    )

    assert response.status_code == 404


def test_delete_astronaut(client):
    astronaut = create_astronaut(client)

    response = client.delete(
        f"/api/v1/astronauts/{astronaut['id']}"
    )

    assert response.status_code == 204

    check = client.get(
        f"/api/v1/astronauts/{astronaut['id']}"
    )

    assert check.status_code == 404


def test_delete_nonexistent_astronaut(client):
    response = client.delete("/api/v1/astronauts/999")

    assert response.status_code == 404


# MEASUREMENTS

def test_create_measurement_and_evaluation(client):
    astronaut = create_astronaut(client)

    result = create_measurement(client, astronaut["id"])

    assert result["overall_status"] == "green"
    assert "heart_rate" in result["indicator_statuses"]

    measurements = client.get(
        "/api/v1/measurements/",
        params={"astronaut_id": astronaut["id"]},
    )

    assert measurements.status_code == 200
    assert len(measurements.json()) == 1


def test_offline_measurement_retry_does_not_duplicate(client):
    astronaut = create_astronaut(client)
    first = create_measurement(
        client,
        astronaut["id"],
        client_measurement_id="offline-measurement-1",
    )
    second = create_measurement(
        client,
        astronaut["id"],
        client_measurement_id="offline-measurement-1",
    )

    measurements = client.get(
        "/api/v1/measurements/",
        params={"astronaut_id": astronaut["id"]},
    ).json()
    evaluations = client.get(
        "/api/v1/evaluations/",
        params={"astronaut_id": astronaut["id"]},
    ).json()

    assert first == second
    assert len(measurements) == 1
    assert len(evaluations) == 1


def test_create_measurement_invalid_data(client):
    astronaut = create_astronaut(client)

    response = client.post(
        "/api/v1/measurements/",
        json={
            "astronaut_id": astronaut["id"],
            "environment": "spacecraft",
            "heart_rate": 80,
            "blood_pressure_sys": 100,
            "blood_pressure_dia": 110,
            "temperature": 36.8,
            "sleep_hours": 8,
            "glucose": 90,
            "fatigue_level": 2,
        },
    )

    assert response.status_code == 422


def test_measurement_with_nonexistent_astronaut(client):
    response = client.post(
        "/api/v1/measurements/",
        json={
            "astronaut_id": 999,
            "environment": "spacecraft",
            "heart_rate": 80,
            "blood_pressure_sys": 110,
            "blood_pressure_dia": 70,
            "temperature": 36.8,
            "sleep_hours": 8,
            "glucose": 90,
            "fatigue_level": 2,
        },
    )

    assert response.status_code == 404


@pytest.mark.parametrize(
    ("profile", "expected_status"),
    [
        ("normal", "green"),
        ("attention", "yellow"),
        ("critical", "red"),
    ],
)
def test_local_demo_simulator_generates_and_saves_profile(
    client, profile, expected_status
):
    astronaut = create_astronaut(client)

    response = client.post(
        "/api/v1/demo/simulator/tick",
        json={
            "astronaut_id": astronaut["id"],
            "environment": "spacecraft",
            "profile": profile,
        },
    )

    assert response.status_code == 201, response.text
    assert response.json()["overall_status"] == expected_status

    measurements = client.get(
        "/api/v1/measurements/",
        params={"astronaut_id": astronaut["id"]},
    ).json()
    assert len(measurements) == 1
    assert f"perfil {profile}" in measurements[0]["notes"]


def test_local_demo_simulator_is_disabled_in_production(client, monkeypatch):
    astronaut = create_astronaut(client)
    monkeypatch.setattr(demo_module.settings, "ENVIRONMENT", "production")

    response = client.post(
        "/api/v1/demo/simulator/tick",
        json={
            "astronaut_id": astronaut["id"],
            "environment": "spacecraft",
            "profile": "normal",
        },
    )

    assert response.status_code == 404


def test_local_demo_simulator_varies_alert_indicators(client):
    astronaut = create_astronaut(client)
    anomaly_indicators = []

    for _ in range(2):
        response = client.post(
            "/api/v1/demo/simulator/tick",
            json={
                "astronaut_id": astronaut["id"],
                "environment": "spacecraft",
                "profile": "attention",
            },
        )
        assert response.status_code == 201, response.text
        statuses = response.json()["indicator_statuses"]
        anomaly_indicators.append(
            [
                indicator
                for indicator, result in statuses.items()
                if result["status"] != "green"
            ]
        )

    assert len(anomaly_indicators[0]) == 1
    assert len(anomaly_indicators[1]) == 1
    assert anomaly_indicators[0] != anomaly_indicators[1]


def test_list_measurements_filtered_by_astronaut(client):
    first = create_astronaut(client)
    second = create_astronaut(client, name="Second Astronaut")

    create_measurement(client, first["id"])
    create_measurement(client, second["id"])

    response = client.get(
        "/api/v1/measurements/",
        params={"astronaut_id": first["id"]},
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["astronaut_id"] == first["id"]


def test_get_measurement(client):
    astronaut = create_astronaut(client)

    create_measurement(client, astronaut["id"])

    measurements = client.get(
        "/api/v1/measurements/",
        params={"astronaut_id": astronaut["id"]},
    ).json()

    measurement_id = measurements[0]["id"]

    response = client.get(
        f"/api/v1/measurements/{measurement_id}"
    )

    assert response.status_code == 200
    assert response.json()["id"] == measurement_id


def test_get_nonexistent_measurement(client):
    response = client.get("/api/v1/measurements/999")

    assert response.status_code == 404


# EVALUATIONS / ALERTS

def test_list_alerts_filtered_by_status(client):
    astronaut = create_astronaut(client)

    create_measurement(client, astronaut["id"])
    create_measurement(client, astronaut["id"], heart_rate=55)

    response = client.get(
        "/api/v1/evaluations/",
        params={"status": "yellow"},
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["overall_status"] == "yellow"


def test_get_alert(client):
    astronaut = create_astronaut(client)
    create_measurement(client, astronaut["id"])

    alerts = client.get("/api/v1/evaluations/").json()
    alert_id = alerts[0]["id"]

    response = client.get(
        f"/api/v1/evaluations/{alert_id}"
    )

    assert response.status_code == 200
    assert response.json()["id"] == alert_id


def test_get_nonexistent_alert(client):
    response = client.get("/api/v1/evaluations/999")

    assert response.status_code == 404


def test_acknowledge_alert(client):
    astronaut = create_astronaut(client)
    create_measurement(client, astronaut["id"])

    alerts = client.get("/api/v1/evaluations/").json()
    alert_id = alerts[0]["id"]

    response = client.patch(
        f"/api/v1/evaluations/{alert_id}/acknowledge"
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Alerta reconocida"

    updated_alert = client.get(
        f"/api/v1/evaluations/{alert_id}"
    )

    assert updated_alert.json()["acknowledged"] is True


def test_acknowledge_nonexistent_alert(client):
    response = client.patch(
        "/api/v1/evaluations/999/acknowledge"
    )

    assert response.status_code == 404


# ENVIRONMENTS

def test_list_environments(client):
    response = client.get("/api/v1/environments/")

    assert response.status_code == 200

    environments = response.json()["environments"]

    assert "spacecraft" in environments
    assert "lunar_base" in environments


def test_get_spacecraft_thresholds(client):
    response = client.get(
        "/api/v1/environments/spacecraft/thresholds"
    )

    assert response.status_code == 200
    assert response.json()["environment"] == "spacecraft"
    assert "thresholds" in response.json()


def test_get_lunar_base_thresholds(client):
    response = client.get(
        "/api/v1/environments/lunar_base/thresholds"
    )

    assert response.status_code == 200
    assert response.json()["environment"] == "lunar_base"


def test_get_invalid_environment_thresholds(client):
    response = client.get(
        "/api/v1/environments/mars/thresholds"
    )

    assert response.status_code == 404


def test_list_alerts_filtered_by_astronaut(client):
    first = create_astronaut(
        client,
        name="First Astronaut"
    )

    second = create_astronaut(
        client,
        name="Second Astronaut"
    )

    create_measurement(client, first["id"])
    create_measurement(client, second["id"])

    response = client.get(
        "/api/v1/evaluations/",
        params={"astronaut_id": first["id"]}
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["astronaut_id"] == first["id"]
