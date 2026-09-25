from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import pandas as pd
import os


# ==========================================
# APP
# ==========================================

app = FastAPI(
    title="SepsisAI ICU Monitoring API",
    description="ICU sepsis early-warning prediction API",
    version="1.0.0"
)


# ==========================================
# MODEL
# ==========================================

MODEL_PATH = "ml/models/sepsis_6h_model.pkl"

model = joblib.load(MODEL_PATH)


# ==========================================
# INPUT SCHEMA
# ==========================================

class PatientVitals(BaseModel):

    heart_rate: float
    systolic_bp: float
    diastolic_bp: float
    temperature: float
    spo2: float
    respiratory_rate: float

    wbc: float
    lactate: float
    platelets: float
    creatinine: float
    bilirubin: float
    hemoglobin: float

    hr_change: float
    hr_rolling_mean: float
    hr_rolling_max: float

    sbp_change: float
    dbp_change: float

    temperature_change: float

    spo2_change: float
    spo2_rolling_mean: float

    rr_change: float
    rr_rolling_mean: float

    lactate_change: float
    lactate_rolling_mean: float

    hr_baseline: float
    hr_from_baseline: float


# ==========================================
# HEALTH CHECK
# ==========================================

@app.get("/")
def root():

    return {
        "message": "SepsisAI ICU Monitoring API",
        "status": "running"
    }


# ==========================================
# PREDICTION
# ==========================================

@app.post("/predict")
def predict(vitals: PatientVitals):

    # Convert input to dictionary
    data = vitals.model_dump()

    # Convert to DataFrame
    df = pd.DataFrame(
        [data]
    )

    # Get probability
    probability = model.predict_proba(
        df
    )[0][1]

    # Convert to percentage
    risk_percentage = probability * 100

    # Determine risk level
    if risk_percentage >= 70:

        risk_level = "HIGH"

    elif risk_percentage >= 40:

        risk_level = "MEDIUM"

    else:

        risk_level = "LOW"

    return {

        "sepsis_risk": round(
            risk_percentage,
            2
        ),

        "risk_level": risk_level,

        "prediction": int(
            probability >= 0.5
        )
    }