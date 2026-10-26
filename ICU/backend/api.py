from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Generator

import joblib
import numpy as np
import pandas as pd
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker

HERE = Path(__file__).resolve().parent
ICU = HERE.parent
MODEL_PATH = ICU / "ml" / "models" / "sepsis_6h_model.pkl"
DB_URL = os.getenv("DATABASE_URL", f"sqlite:///{(HERE / 'sepsisai.db').as_posix()}")
if DB_URL.startswith("postgres://"):
    DB_URL = DB_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif DB_URL.startswith("postgresql://"):
    DB_URL = DB_URL.replace("postgresql://", "postgresql+psycopg://", 1)
engine = create_engine(DB_URL, pool_pre_ping=True, connect_args={"check_same_thread": False} if DB_URL.startswith("sqlite") else {})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def now() -> datetime:
    return datetime.now(timezone.utc)


class Patient(Base):
    __tablename__ = "patients"
    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    bed: Mapped[str] = mapped_column(String(40), nullable=False)
    heart_rate: Mapped[float] = mapped_column(Float, nullable=False)
    systolic_bp: Mapped[float] = mapped_column(Float, nullable=False)
    diastolic_bp: Mapped[float] = mapped_column(Float, nullable=False)
    spo2: Mapped[float] = mapped_column(Float, nullable=False)
    respiratory_rate: Mapped[float] = mapped_column(Float, nullable=False)
    temperature: Mapped[float] = mapped_column(Float, nullable=False)
    lactate: Mapped[float] = mapped_column(Float, nullable=False)
    wbc: Mapped[float | None] = mapped_column(Float, nullable=True)
    platelets: Mapped[float | None] = mapped_column(Float, nullable=True)
    creatinine: Mapped[float | None] = mapped_column(Float, nullable=True)
    bilirubin: Mapped[float | None] = mapped_column(Float, nullable=True)
    hemoglobin: Mapped[float | None] = mapped_column(Float, nullable=True)
    risk: Mapped[float] = mapped_column(Float, nullable=False)
    risk_level: Mapped[str] = mapped_column(String(16), nullable=False)
    risk_method: Mapped[str] = mapped_column(String(80), nullable=False)
    explanation_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    is_demo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=now, onupdate=now)


class Observation(Base):
    __tablename__ = "observations"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id"), index=True)
    values_json: Mapped[str] = mapped_column(Text, nullable=False)
    risk: Mapped[float] = mapped_column(Float, nullable=False)
    risk_level: Mapped[str] = mapped_column(String(16), nullable=False)
    risk_method: Mapped[str] = mapped_column(String(80), nullable=False)
    explanation_json: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=now)


class Alert(Base):
    __tablename__ = "alerts"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    patient_id: Mapped[str] = mapped_column(String(32), index=True)
    bed: Mapped[str] = mapped_column(String(40))
    title: Mapped[str] = mapped_column(String(160))
    severity: Mapped[str] = mapped_column(String(16))
    message: Mapped[str] = mapped_column(Text)
    reviewed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=now)


class Vitals(BaseModel):
    patient_id: str | None = None
    name: str | None = None
    bed: str | None = None
    heart_rate: float = Field(gt=0, le=300)
    systolic_bp: float = Field(gt=0, le=350)
    diastolic_bp: float = Field(gt=0, le=250)
    spo2: float = Field(ge=0, le=100)
    respiratory_rate: float = Field(gt=0, le=100)
    temperature: float = Field(ge=25, le=45)
    lactate: float = Field(ge=0, le=50)
    wbc: float | None = Field(default=None, ge=0, le=500)
    platelets: float | None = Field(default=None, ge=0, le=3000)
    creatinine: float | None = Field(default=None, ge=0, le=100)
    bilirubin: float | None = Field(default=None, ge=0, le=100)
    hemoglobin: float | None = Field(default=None, ge=0, le=40)


class PatientInput(Vitals):
    name: str = Field(min_length=1, max_length=120)
    bed: str = Field(min_length=1, max_length=40)


FEATURES = [
    "heart_rate", "systolic_bp", "diastolic_bp", "temperature", "spo2", "respiratory_rate",
    "wbc", "lactate", "platelets", "creatinine", "bilirubin", "hemoglobin",
    "hr_change", "hr_rolling_mean", "hr_rolling_max", "sbp_change", "dbp_change",
    "temperature_change", "spo2_change", "spo2_rolling_mean", "rr_change",
    "rr_rolling_mean", "lactate_change", "lactate_rolling_mean", "hr_baseline", "hr_from_baseline",
]
LABS = ("wbc", "platelets", "creatinine", "bilirubin", "hemoglobin")
LABELS = dict(zip(FEATURES, [
    "Heart rate", "Systolic blood pressure", "Diastolic blood pressure", "Temperature",
    "Oxygen saturation", "Respiratory rate", "White blood cell count", "Lactate",
    "Platelets", "Creatinine", "Bilirubin", "Hemoglobin", "Heart-rate change",
    "Recent mean heart rate", "Recent maximum heart rate", "Systolic pressure change",
    "Diastolic pressure change", "Temperature change", "Oxygen saturation change",
    "Recent mean oxygen saturation", "Respiratory-rate change", "Recent mean respiratory rate",
    "Lactate change", "Recent mean lactate", "Heart-rate baseline", "Heart rate versus baseline",
]))
MODEL: Any = None
MODEL_NOTE = "Saved model not found."
try:
    if MODEL_PATH.exists():
        MODEL = joblib.load(MODEL_PATH)
        MODEL_NOTE = "Saved research model loaded."
except Exception as exc:
    MODEL_NOTE = f"Model unavailable ({type(exc).__name__}); rules-only fallback enabled."


def db_session() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def level(value: float) -> str:
    return "HIGH" if value >= 70 else "MEDIUM" if value >= 40 else "LOW"


def explanations(data: dict[str, Any]) -> list[dict[str, str]]:
    checks = [
        (float(data["heart_rate"]) > 100, "Heart rate exceeds the configured threshold."),
        (float(data["systolic_bp"]) < 100, "Systolic blood pressure is below the configured threshold."),
        (float(data["spo2"]) < 94, "Oxygen saturation is below the configured threshold."),
        (float(data["respiratory_rate"]) > 22, "Respiratory rate exceeds the configured threshold."),
        (float(data["temperature"]) > 38, "Temperature exceeds the configured threshold."),
        (float(data["lactate"]) > 2, "Lactate exceeds the configured threshold."),
    ]
    rows = [{"factor": message, "effect": "Contributes to the prototype screening index."} for hit, message in checks if hit]
    return rows or [{"factor": "No configured threshold was exceeded.", "effect": "This does not rule out sepsis."}]


def model_row(data: dict[str, Any], history: list[dict[str, Any]]) -> pd.DataFrame:
    prior = history[-3:]

    def series(key: str) -> list[float]:
        return [float(x[key]) for x in prior if x.get(key) is not None] + [float(data[key])]

    def delta(key: str) -> float:
        return float(data[key]) - float(prior[-1][key]) if prior and prior[-1].get(key) is not None else 0.0

    hr, spo2, rr, lactate = (series(k) for k in ("heart_rate", "spo2", "respiratory_rate", "lactate"))
    hrs = [float(x["heart_rate"]) for x in history if x.get("heart_rate") is not None] + [float(data["heart_rate"])]
    values = {
        **{k: float(data[k]) for k in FEATURES[:12]},
        "hr_change": delta("heart_rate"), "hr_rolling_mean": float(np.mean(hr)),
        "hr_rolling_max": float(np.max(hr)), "sbp_change": delta("systolic_bp"),
        "dbp_change": delta("diastolic_bp"), "temperature_change": delta("temperature"),
        "spo2_change": delta("spo2"), "spo2_rolling_mean": float(np.mean(spo2)),
        "rr_change": delta("respiratory_rate"), "rr_rolling_mean": float(np.mean(rr)),
        "lactate_change": delta("lactate"), "lactate_rolling_mean": float(np.mean(lactate)),
        "hr_baseline": float(np.mean(hrs)), "hr_from_baseline": float(data["heart_rate"]) - float(np.mean(hrs)),
    }
    return pd.DataFrame([{key: values[key] for key in FEATURES}], columns=FEATURES)


def assess(data: dict[str, Any], history: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    history = history or []
    flags = [
        float(data["heart_rate"]) > 100, float(data["systolic_bp"]) < 100,
        float(data["spo2"]) < 94, float(data["respiratory_rate"]) > 22,
        float(data["temperature"]) > 38, float(data["lactate"]) > 2,
    ]
    count = sum(flags)
    # A transparent index for interface development only; this is not a probability.
    index = [5, 25, 45, 60, 75, 90, 98][count]
    factors = explanations(data)
    all_labs = all(data.get(k) is not None for k in LABS)
    if MODEL is not None and all_labs:
        try:
            frame = model_row(data, history)
            probability = float(MODEL.predict_proba(frame)[0][1])
            result = round(min(100.0, max(0.0, probability * 100)), 2)
            # These are model-driven factors, not causal explanations.
            importances = getattr(MODEL, "feature_importances_", None)
            if importances is not None and len(importances) == len(FEATURES):
                top = np.argsort(np.asarray(importances))[::-1][:5]
                factors = [{"factor": LABELS[FEATURES[int(i)]], "effect": "Among the model's most influential features."} for i in top]
            return {
                "risk": result, "risk_level": level(result), "risk_method": "random_forest_6h",
                "explanation": factors, "warning": "Experimental model trained on repository data; not clinically validated.",
                "is_probability": False, "model_available": True,
            }
        except Exception as exc:
            note = f"Model inference failed ({type(exc).__name__}); using the fallback index."
    else:
        note = "Required lab values are missing; using fallback index." if MODEL is not None else MODEL_NOTE
    return {
        "risk": float(index), "risk_level": level(float(index)), "risk_method": "threshold_rules",
        "explanation": factors, "warning": note + " The fallback index is not a probability.",
        "is_probability": False, "model_available": MODEL is not None,
    }


def serialize_patient(p: Patient) -> dict[str, Any]:
    status = {"HIGH": "Critical", "MEDIUM": "Watch", "LOW": "Stable"}.get(p.risk_level, "Watch")
    return {
        "id": p.id, "patient_id": p.id, "name": p.name, "bed": p.bed,
        "hr": p.heart_rate, "bp": f"{p.systolic_bp:g}/{p.diastolic_bp:g}",
        "systolic_bp": p.systolic_bp, "diastolic_bp": p.diastolic_bp,
        "spo2": p.spo2, "rr": p.respiratory_rate, "temp": f"{p.temperature:g}°",
        "temperature": p.temperature, "lactate": p.lactate, "wbc": p.wbc,
        "platelets": p.platelets, "creatinine": p.creatinine, "bilirubin": p.bilirubin,
        "hemoglobin": p.hemoglobin, "risk": round(float(p.risk), 2),
        "risk_level": p.risk_level, "status": status, "risk_method": p.risk_method,
        "explanation": json.loads(p.explanation_json or "[]"), "is_demo": p.is_demo,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
    }


def serialize_alert(a: Alert) -> dict[str, Any]:
    return {
        "id": a.id, "title": a.title, "patient": a.patient_id, "patient_id": a.patient_id,
        "bed": a.bed, "time": a.created_at.astimezone().strftime("%H:%M") if a.created_at else "",
        "severity": a.severity, "message": a.message, "reviewed": a.reviewed,
        "created_at": a.created_at.isoformat() if a.created_at else None,
    }


def store_observation(db: Session, p: Patient, values: dict[str, Any], result: dict[str, Any]) -> None:
    db.add(Observation(
        patient_id=p.id, values_json=json.dumps(values), risk=result["risk"],
        risk_level=result["risk_level"], risk_method=result["risk_method"],
        explanation_json=json.dumps(result["explanation"]),
    ))


def alert_if_high(db: Session, p: Patient) -> None:
    if p.risk_level != "HIGH":
        return
    exists = db.query(Alert).filter(Alert.patient_id == p.id, Alert.reviewed.is_(False), Alert.title == "High risk index").first()
    if exists:
        return
    factors = "; ".join(x.get("factor", "") for x in json.loads(p.explanation_json or "[]")[:3])
    db.add(Alert(
        patient_id=p.id, bed=p.bed, title="High risk index", severity="critical",
        message=f"Prototype index {p.risk:.0f}/100 is in the high category. Review patient observations. Factors: {factors}",
    ))


def seed() -> None:
    with SessionLocal() as db:
        if db.query(Patient).count():
            return
        samples = [
            ("M. Anderson", "PT-10482", "ICU-04", 118, 92, 58, 91, 27, 38.9, 3.8, 87, "HIGH"),
            ("J. Williams", "PT-10477", "ICU-02", 102, 101, 64, 94, 23, 38.1, 2.7, 64, "MEDIUM"),
            ("S. Patel", "PT-10491", "ICU-07", 96, 109, 68, 96, 19, 37.7, 1.9, 42, "MEDIUM"),
            ("R. Kumar", "PT-10493", "ICU-08", 88, 118, 72, 98, 17, 37.1, 1.4, 28, "LOW"),
            ("A. Sharma", "PT-10494", "ICU-09", 110, 96, 61, 93, 24, 38.4, 2.9, 71, "HIGH"),
            ("P. Singh", "PT-10495", "ICU-10", 82, 121, 76, 97, 16, 36.9, 1.2, 19, "LOW"),
            ("N. Gupta", "PT-10496", "ICU-11", 99, 105, 67, 95, 21, 37.8, 2.1, 48, "MEDIUM"),
            ("K. Mehta", "PT-10497", "ICU-12", 76, 124, 80, 99, 15, 36.7, 1.1, 12, "LOW"),
        ]
        for n, pid, bed, hr, sbp, dbp, oxygen, rr, temp, lactate, risk, lvl in samples:
            data = {"heart_rate": hr, "systolic_bp": sbp, "diastolic_bp": dbp, "spo2": oxygen, "respiratory_rate": rr, "temperature": temp, "lactate": lactate, "wbc": None, "platelets": None, "creatinine": None, "bilirubin": None, "hemoglobin": None}
            p = Patient(id=pid, name=n, bed=bed, **{k: data[k] for k in data},
                        risk=risk, risk_level=lvl, risk_method="demo_sample",
                        explanation_json=json.dumps([{"factor": "Synthetic demo record", "effect": "Illustrative data only."}]),
                        is_demo=True)
            db.add(p)
            db.flush()
            store_observation(db, p, data, {"risk": risk, "risk_level": lvl, "risk_method": "demo_sample", "explanation": [{"factor": "Synthetic demo record", "effect": "Illustrative data only."}]})
        db.add_all([
            Alert(patient_id="PT-10482", bed="ICU-04", title="Rising lactate detected", severity="critical", message="Synthetic demo alert. Sample lactate trend requires review."),
            Alert(patient_id="PT-10486", bed="ICU-03", title="MAP below threshold", severity="critical", message="Synthetic demo alert. Sample blood-pressure threshold event."),
            Alert(patient_id="PT-10491", bed="ICU-07", title="Respiratory rate elevated", severity="warning", message="Synthetic demo alert. Sample respiratory-rate threshold event."),
        ])
        db.commit()


app = FastAPI(title="SepsisAI Clinical Risk Monitoring API", version="0.2.0",
              description="Educational research prototype only; not for diagnosis or treatment.")
origins = [x.strip() for x in os.getenv("ALLOWED_ORIGINS", "http://localhost:5174,http://127.0.0.1:5174").split(",") if x.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins or ["*"], allow_credentials=False, allow_methods=["*"], allow_headers=["*"])
Base.metadata.create_all(bind=engine)
seed()


@app.get("/")
def root():
    return {"message": "SepsisAI API", "status": "running", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "healthy", "model_loaded": MODEL is not None, "model_note": MODEL_NOTE,
            "notice": "Research prototype only; not clinically validated."}


@app.get("/model/status")
def model_status():
    return {"model_loaded": MODEL is not None, "model_file_present": MODEL_PATH.exists(),
            "note": MODEL_NOTE, "model_target": "sepsis_6h",
            "data_note": "Repository dataset is synthetic; clinical validation has not been performed."}


@app.get("/patients")
def list_patients(db: Session = Depends(db_session)):
    return [serialize_patient(p) for p in db.query(Patient).order_by(Patient.created_at.asc()).all()]


@app.post("/patients")
def create_patient(payload: PatientInput, db: Session = Depends(db_session)):
    data = payload.model_dump()
    pid = (data.get("patient_id") or f"PT-{uuid.uuid4().hex[:8].upper()}").strip()
    if db.get(Patient, pid):
        raise HTTPException(status_code=409, detail="Patient ID already exists.")
    result = assess(data)
    p = Patient(id=pid, name=data["name"].strip(), bed=data["bed"].strip(),
                **{k: data[k] for k in ("heart_rate", "systolic_bp", "diastolic_bp", "spo2", "respiratory_rate", "temperature", "lactate", *LABS)},
                risk=result["risk"], risk_level=result["risk_level"], risk_method=result["risk_method"],
                explanation_json=json.dumps(result["explanation"]), is_demo=False)
    db.add(p)
    db.flush()
    store_observation(db, p, data, result)
    alert_if_high(db, p)
    db.commit()
    db.refresh(p)
    response = serialize_patient(p)
    response.update({"prediction_warning": result["warning"], "explanation_source": result["risk_method"]})
    return response


@app.get("/patients/{patient_id}")
def get_patient(patient_id: str, db: Session = Depends(db_session)):
    p = db.get(Patient, patient_id)
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found.")
    return serialize_patient(p)


@app.post("/patients/{patient_id}/observations")
def add_observation(patient_id: str, payload: Vitals, db: Session = Depends(db_session)):
    p = db.get(Patient, patient_id)
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found.")
    incoming = payload.model_dump()
    values = {k: incoming[k] for k in ("heart_rate", "systolic_bp", "diastolic_bp", "spo2", "respiratory_rate", "temperature", "lactate")}
    for k in LABS:
        values[k] = incoming.get(k) if incoming.get(k) is not None else getattr(p, k)
    old = db.query(Observation).filter(Observation.patient_id == patient_id).order_by(Observation.created_at.asc()).all()
    history = [json.loads(o.values_json) for o in old[-4:]]
    result = assess(values, history)
    for k, v in values.items():
        setattr(p, k, v)
    p.risk, p.risk_level, p.risk_method = result["risk"], result["risk_level"], result["risk_method"]
    p.explanation_json, p.is_demo, p.updated_at = json.dumps(result["explanation"]), False, now()
    store_observation(db, p, values, result)
    alert_if_high(db, p)
    db.commit()
    db.refresh(p)
    response = serialize_patient(p)
    response.update({"prediction_warning": result["warning"], "explanation_source": result["risk_method"]})
    return response


@app.get("/patients/{patient_id}/history")
def patient_history(patient_id: str, db: Session = Depends(db_session)):
    if not db.get(Patient, patient_id):
        raise HTTPException(status_code=404, detail="Patient not found.")
    rows = db.query(Observation).filter(Observation.patient_id == patient_id).order_by(Observation.created_at.desc()).limit(30).all()
    return [{"id": o.id, **json.loads(o.values_json), "risk": o.risk, "risk_level": o.risk_level,
             "risk_method": o.risk_method, "explanation": json.loads(o.explanation_json),
             "created_at": o.created_at.isoformat()} for o in rows]


@app.get("/alerts")
def list_alerts(db: Session = Depends(db_session)):
    rows = db.query(Alert).filter(Alert.reviewed.is_(False)).order_by(Alert.created_at.desc()).all()
    return [serialize_alert(a) for a in rows]


@app.patch("/alerts/{alert_id}/review")
def review_alert(alert_id: int, db: Session = Depends(db_session)):
    a = db.get(Alert, alert_id)
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found.")
    a.reviewed = True
    db.commit()
    db.refresh(a)
    return serialize_alert(a)


@app.get("/analytics/summary")
def analytics(db: Session = Depends(db_session)):
    people = db.query(Patient).all()
    return {
        "total_patients": len(people),
        "high_risk": sum(p.risk_level == "HIGH" for p in people),
        "medium_risk": sum(p.risk_level == "MEDIUM" for p in people),
        "low_risk": sum(p.risk_level == "LOW" for p in people),
        "active_alerts": db.query(Alert).filter(Alert.reviewed.is_(False)).count(),
        "average_risk_index": round(sum(p.risk for p in people) / len(people), 2) if people else 0,
        "demo_records": sum(bool(p.is_demo) for p in people),
        "clinical_validation": "Not validated",
    }


@app.get("/analytics/trend")
def analytics_trend(db: Session = Depends(db_session)):
    rows = db.query(Observation).order_by(Observation.created_at.desc()).limit(12).all()
    rows.reverse()
    return [{
        "label": o.created_at.astimezone().strftime("%H:%M") if o.created_at else "",
        "risk": round(float(o.risk), 2),
        "risk_level": o.risk_level,
        "risk_method": o.risk_method,
        "patient_id": o.patient_id,
    } for o in rows]


@app.post("/predict")
def predict(payload: Vitals, db: Session = Depends(db_session)):
    data = payload.model_dump()
    history = []
    if payload.patient_id:
        rows = db.query(Observation).filter(Observation.patient_id == payload.patient_id).order_by(Observation.created_at.asc()).all()
        history = [json.loads(o.values_json) for o in rows[-4:]]
    result = assess(data, history)
    return {"patient_id": payload.patient_id, "risk_score": result["risk"], **result}
