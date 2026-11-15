
from app.core.rules_engine import rules_engine
from app.core.recommendation_engine import recommendation_engine


def get_healthy_measurement():
    return {
        "heart_rate": 80,
        "blood_pressure_sys": 110,
        "blood_pressure_dia": 70,
        "temperature": 36.8,
        "sleep_hours": 8,
        "glucose": 90,
        "fatigue_level": 2,
    }


def test_green_evaluation_has_no_recommendations():
    measurement = get_healthy_measurement()

    raw_evaluation = rules_engine.evaluate(
        measurement_data=measurement,
        environment="spacecraft"
    )

    result = recommendation_engine.generate(raw_evaluation)

    assert result.overall_status == "green"
    assert result.recommendations == []
    assert "rangos normales" in result.summary


def test_cardio_rule_generates_recommendations():
    measurement = get_healthy_measurement()

    measurement["heart_rate"] = 110
    measurement["blood_pressure_sys"] = 130

    raw_evaluation = rules_engine.evaluate(
        measurement_data=measurement,
        environment="spacecraft"
    )

    result = recommendation_engine.generate(raw_evaluation)

    recommendation_ids = {
        recommendation.id
        for recommendation in result.recommendations
    }

    assert result.overall_status == "red"

    assert "REC_CARDIO_01" in recommendation_ids
    assert "REC_REST_01" in recommendation_ids

    assert result.indicator_statuses["heart_rate"].explanation is not None
    assert result.summary.startswith("Estado general: RED.")


def test_fallback_recommendation_for_single_indicator():
    measurement = get_healthy_measurement()

    measurement["heart_rate"] = 55

    raw_evaluation = rules_engine.evaluate(
        measurement_data=measurement,
        environment="spacecraft"
    )

    result = recommendation_engine.generate(raw_evaluation)

    recommendation_ids = [
        recommendation.id
        for recommendation in result.recommendations
    ]

    assert raw_evaluation["triggered_rules"] == []
    assert "REC_CARDIO_01" in recommendation_ids

    assert (
        result.indicator_statuses["heart_rate"].explanation
        is not None
    )


def test_recommendations_are_sorted_by_priority():
    measurement = get_healthy_measurement()

    measurement["heart_rate"] = 110
    measurement["blood_pressure_sys"] = 130
    measurement["glucose"] = 110
    measurement["fatigue_level"] = 5

    raw_evaluation = rules_engine.evaluate(
        measurement_data=measurement,
        environment="spacecraft"
    )

    result = recommendation_engine.generate(raw_evaluation)

    priorities = [
        recommendation.priority
        for recommendation in result.recommendations
    ]

    assert priorities == sorted(priorities)

    assert 1 in priorities
    assert 2 in priorities
    assert 3 in priorities


def test_indicator_explanation_is_enriched():
    measurement = get_healthy_measurement()
    measurement["heart_rate"] = 55

    raw_evaluation = rules_engine.evaluate(
        measurement_data=measurement,
        environment="spacecraft"
    )

    result = recommendation_engine.generate(raw_evaluation)

    explanation = result.indicator_statuses["heart_rate"].explanation

    assert explanation is not None
    assert isinstance(explanation, str)
    assert len(explanation) > 0


def test_unknown_recommendation_id_returns_none():
    result = recommendation_engine._get_recommendation_by_id(
        "UNKNOWN_RECOMMENDATION"
    )

    assert result is None
