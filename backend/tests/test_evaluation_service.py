
import pytest

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.models.base import Base
from app.models.astronaut import Astronaut
from app.models.measurement import Measurement
from app.models.alert import Alert

from app.schemas.measurement import MeasurementCreate

from app.services.evaluation_service import EvaluationService
from app.core.environment_manager import environment_manager


@pytest.fixture
def db_session():
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

    with TestingSessionLocal() as session:
        yield session

    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture
def astronaut(db_session):
    astronaut = Astronaut(
        name="Test Astronaut",
        role="Commander",
        current_environment="spacecraft",
    )

    db_session.add(astronaut)
    db_session.commit()
    db_session.refresh(astronaut)

    return astronaut


def make_measurement_input(astronaut_id, **overrides):
    data = {
        "environment": "spacecraft",
        "heart_rate": 80,
        "blood_pressure_sys": 110,
        "blood_pressure_dia": 70,
        "temperature": 36.8,
        "sleep_hours": 8,
        "glucose": 90,
        "fatigue_level": 2,
        "notes": "Integration test",
    }

    data.update(overrides)

    return MeasurementCreate(
        astronaut_id=astronaut_id,
        **data,
    )


def test_green_evaluation_and_persistence(db_session, astronaut):
    service = EvaluationService()

    measurement_in = make_measurement_input(astronaut.id)

    result = service.evaluate_and_save(
        db=db_session,
        measurement_in=measurement_in,
    )

    assert result.overall_status == "green"

    measurement = (
        db_session.query(Measurement)
        .filter_by(astronaut_id=astronaut.id)
        .one()
    )

    alert = (
        db_session.query(Alert)
        .filter_by(measurement_id=measurement.id)
        .one()
    )

    assert measurement.environment == "spacecraft"
    assert alert.measurement_id == measurement.id
    assert alert.astronaut_id == astronaut.id
    assert alert.overall_status == result.overall_status

    assert (
        alert.indicator_statuses["heart_rate"]["status"]
        == result.indicator_statuses["heart_rate"].status
    )

    assert alert.triggered_rules == result.triggered_rules

    assert alert.recommendations == [
        recommendation.model_dump()
        for recommendation in result.recommendations
    ]


def test_yellow_evaluation_and_persistence(db_session, astronaut):
    service = EvaluationService()

    measurement_in = make_measurement_input(
        astronaut.id,
        heart_rate=55,
    )

    result = service.evaluate_and_save(
        db=db_session,
        measurement_in=measurement_in,
    )

    assert result.overall_status == "yellow"

    measurement = db_session.query(Measurement).one()
    alert = db_session.query(Alert).one()

    assert measurement.id == alert.measurement_id
    assert alert.overall_status == "yellow"


def test_red_evaluation_and_persistence(db_session, astronaut):
    service = EvaluationService()

    measurement_in = make_measurement_input(
        astronaut.id,
        heart_rate=110,
        blood_pressure_sys=130,
    )

    result = service.evaluate_and_save(
        db=db_session,
        measurement_in=measurement_in,
    )

    assert result.overall_status == "red"
    assert "CARDIO_STRESS" in result.triggered_rules

    measurement = db_session.query(Measurement).one()
    alert = db_session.query(Alert).one()

    assert alert.overall_status == "red"
    assert alert.measurement_id == measurement.id
    assert alert.astronaut_id == astronaut.id


def test_nonexistent_astronaut_raises_error(db_session):
    service = EvaluationService()

    measurement_in = make_measurement_input(999)

    with pytest.raises(ValueError, match="no encontrado"):
        service.evaluate_and_save(
            db=db_session,
            measurement_in=measurement_in,
        )

    assert db_session.query(Measurement).count() == 0
    assert db_session.query(Alert).count() == 0


def test_unsupported_environment_raises_error(
    db_session,
    astronaut,
    monkeypatch,
):
    service = EvaluationService()

    monkeypatch.setattr(
        environment_manager,
        "get_available_environments",
        lambda: ["spacecraft"],
    )

    measurement_in = make_measurement_input(
        astronaut.id,
        environment="lunar_base",
    )

    with pytest.raises(ValueError, match="no soportado"):
        service.evaluate_and_save(
            db=db_session,
            measurement_in=measurement_in,
        )

    assert db_session.query(Measurement).count() == 0
    assert db_session.query(Alert).count() == 0
