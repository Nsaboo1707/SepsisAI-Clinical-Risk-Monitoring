from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="SepsisAI Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Patient(BaseModel):
    patient_id: str
    heart_rate: float
    systolic_bp: float
    diastolic_bp: float
    spo2: float
    respiratory_rate: float
    temperature: float
    lactate: float


@app.get("/")
def root():
    return {"message": "SepsisAI backend is running"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/predict")
def predict(patient: Patient):

    # Simple initial risk calculation
    risk_score = 0

    if patient.heart_rate > 100:
        risk_score += 1

    if patient.systolic_bp < 100:
        risk_score += 1

    if patient.spo2 < 94:
        risk_score += 1

    if patient.respiratory_rate > 22:
        risk_score += 1

    if patient.temperature > 38:
        risk_score += 1

    if patient.lactate > 2:
        risk_score += 1

    if risk_score >= 4:
        risk = "HIGH"
    elif risk_score >= 2:
        risk = "MEDIUM"
    else:
        risk = "LOW"

    return {
        "patient_id": patient.patient_id,
        "risk_score": risk_score,
        "risk_level": risk
    }