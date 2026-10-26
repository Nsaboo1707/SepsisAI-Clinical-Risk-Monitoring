from backend.api import assess, level


def base_vitals():
    return {
        "heart_rate": 80, "systolic_bp": 120, "diastolic_bp": 80,
        "spo2": 98, "respiratory_rate": 16, "temperature": 37.0,
        "lactate": 1.0, "wbc": None, "platelets": None,
        "creatinine": None, "bilirubin": None, "hemoglobin": None,
    }


def test_fallback_is_not_probability():
    result = assess(base_vitals())
    assert result["risk_method"] == "threshold_rules"
    assert result["risk_level"] == "LOW"
    assert result["is_probability"] is False
    assert "not a probability" in result["warning"]


def test_all_thresholds_raises_high_index():
    data = base_vitals()
    data.update({"heart_rate": 125, "systolic_bp": 85, "spo2": 88,
                 "respiratory_rate": 30, "temperature": 39.0, "lactate": 4.0})
    result = assess(data)
    assert result["risk_level"] == "HIGH"
    assert result["risk"] == 98
    assert len(result["explanation"]) == 6


def test_category_boundaries():
    assert level(39.99) == "LOW"
    assert level(40) == "MEDIUM"
    assert level(69.99) == "MEDIUM"
    assert level(70) == "HIGH"
