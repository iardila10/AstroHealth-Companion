
import pytest

from app.core.rules_engine import rules_engine


@pytest.fixture
def healthy_measurement():
    return {
        "heart_rate": 80,
        "blood_pressure_sys": 110,
        "blood_pressure_dia": 70,
        "temperature": 36.8,
        "sleep_hours": 8,
        "glucose": 90,
        "fatigue_level": 2,
    }


@pytest.mark.parametrize(
    "indicator,value,expected",
    [
        # Heart rate
        ("heart_rate", 60, "green"),
        ("heart_rate", 100, "green"),
        ("heart_rate", 59, "yellow"),
        ("heart_rate", 101, "yellow"),
        ("heart_rate", 49, "red"),
        ("heart_rate", 121, "red"),

        # Blood pressure - systolic
        ("blood_pressure_sys", 90, "green"),
        ("blood_pressure_sys", 120, "green"),
        ("blood_pressure_sys", 89, "yellow"),
        ("blood_pressure_sys", 121, "yellow"),
        ("blood_pressure_sys", 79, "red"),
        ("blood_pressure_sys", 140, "red"),

        # Blood pressure - diastolic
        ("blood_pressure_dia", 60, "green"),
        ("blood_pressure_dia", 80, "green"),
        ("blood_pressure_dia", 59, "yellow"),
        ("blood_pressure_dia", 81, "yellow"),
        ("blood_pressure_dia", 49, "red"),
        ("blood_pressure_dia", 90, "red"),

        # Temperature
        ("temperature", 36.1, "green"),
        ("temperature", 37.2, "green"),
        ("temperature", 36.0, "yellow"),
        ("temperature", 37.3, "yellow"),
        ("temperature", 35.4, "red"),
        ("temperature", 38.1, "red"),

        # Sleep
        ("sleep_hours", 7, "green"),
        ("sleep_hours", 9, "green"),
        ("sleep_hours", 6.9, "yellow"),
        ("sleep_hours", 9.1, "yellow"),
        ("sleep_hours", 4.9, "red"),
        ("sleep_hours", 10.1, "red"),

        # Glucose
        ("glucose", 70, "green"),
        ("glucose", 99, "green"),
        ("glucose", 69, "yellow"),
        ("glucose", 100, "yellow"),
        ("glucose", 54, "red"),
        ("glucose", 126, "red"),

        # Fatigue
        ("fatigue_level", 1, "green"),
        ("fatigue_level", 3, "green"),
        ("fatigue_level", 4, "yellow"),
        ("fatigue_level", 6, "yellow"),
        ("fatigue_level", 7, "red"),
        ("fatigue_level", 10, "red"),
    ],
)
def test_indicator_classification(
    healthy_measurement,
    indicator,
    value,
    expected
):
    healthy_measurement[indicator] = value

    result = rules_engine.evaluate(
        measurement_data=healthy_measurement,
        environment="spacecraft"
    )

    assert result["indicator_statuses"][indicator].status == expected


def test_all_indicators_green(healthy_measurement):
    result = rules_engine.evaluate(
        measurement_data=healthy_measurement,
        environment="spacecraft"
    )

    assert result["overall_status"] == "green"
    assert result["triggered_rules"] == []


def test_cardio_stress_combination(healthy_measurement):
    healthy_measurement["heart_rate"] = 110
    healthy_measurement["blood_pressure_sys"] = 130

    result = rules_engine.evaluate(
        measurement_data=healthy_measurement,
        environment="spacecraft"
    )

    assert "CARDIO_STRESS" in result["triggered_rules"]
    assert result["overall_status"] == "red"


def test_fatigue_sleep_combination(healthy_measurement):
    healthy_measurement["sleep_hours"] = 6
    healthy_measurement["fatigue_level"] = 5

    result = rules_engine.evaluate(
        measurement_data=healthy_measurement,
        environment="spacecraft"
    )

    assert "FATIGUE_SLEEP_DEBT" in result["triggered_rules"]
    assert result["overall_status"] == "red"


def test_multiple_yellow_indicators(healthy_measurement):
    healthy_measurement["heart_rate"] = 55
    healthy_measurement["temperature"] = 36.0
    healthy_measurement["glucose"] = 110

    result = rules_engine.evaluate(
        measurement_data=healthy_measurement,
        environment="spacecraft"
    )

    assert "MULTIPLE_YELLOW" in result["triggered_rules"]
    assert result["overall_status"] == "yellow"


def test_environment_changes_thresholds(healthy_measurement):
    healthy_measurement["heart_rate"] = 119

    spacecraft_result = rules_engine.evaluate(
        measurement_data=healthy_measurement,
        environment="spacecraft"
    )

    lunar_result = rules_engine.evaluate(
        measurement_data=healthy_measurement,
        environment="lunar_base"
    )

    assert spacecraft_result["indicator_statuses"]["heart_rate"].status == "yellow"
    assert lunar_result["indicator_statuses"]["heart_rate"].status == "red"


def test_invalid_environment_raises_error(healthy_measurement):
    with pytest.raises(KeyError):
        rules_engine.evaluate(
            measurement_data=healthy_measurement,
            environment="mars"
        )


def test_missing_combination_rules_file_raises_error(tmp_path, monkeypatch):
    monkeypatch.setattr(rules_engine, "knowledge_dir", tmp_path)

    with pytest.raises(FileNotFoundError, match="No se encontró"):
        rules_engine._load_combination_rules()


def test_unmatched_thresholds_default_to_yellow():
    result = rules_engine._evaluate_single_indicator(
        150,
        {}
    )

    assert result == "yellow"


def test_unknown_measurement_indicators_are_ignored(healthy_measurement):
    healthy_measurement["unknown_metric"] = 123

    result = rules_engine.evaluate(
        measurement_data=healthy_measurement,
        environment="spacecraft"
    )

    assert "unknown_metric" not in result["indicator_statuses"]

