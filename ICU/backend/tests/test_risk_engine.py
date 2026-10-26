from backend.main import assess_risk, category_for


def base_vitals():
    return {
        "heart_rate": 80, "systolic_bp": 120, "diastolic_bp": 80,
        "spo2": 98, "respiratory_rate": 16, "temperature": 37.0,
        "lactate": 1.0, "wbc": None, "platelets": None,
        "creatinine": None, "bilirubin": None, "hemoglobin": None,
    }


def test_low_rule_index_is_explicitly_rule_based():
    result = assess_risk(base_vitals())
    assert result["risk_method"] == "threshold_rules"
    assert result["risk_level"] == "LOW"
    assert result["model_probability"] is None
    assert "not a probability" in result["warning"]


def test_multiple_thresholds_raise_index_and_explain_factors():
    vitals = base_vitals()
    vitals.update({
        "heart_rate": 125, "systolic_bp": 85, "spo2": 88,
        "respiratory_rate": 30, "temperature": 39.0, "lactate": 4.0,
    })
    result = assess_risk(vitals)
    assert result["rule_count"] == 6
    assert result["risk_level"] == "HIGH"
    assert result["risk_value"] == 98
    assert len(result["explanation"]) >= 6


def test_category_boundaries():
    assert category_for(39.99) == "LOW"
    assert category_for(40) == "MEDIUM"
    assert category_for(69.99) == "MEDIUM"
    assert category_for(70) == "HIGH"
