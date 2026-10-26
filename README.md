# SepsisAI — Clinical Risk Monitoring

SepsisAI is a student research prototype for a doctor-facing ICU monitoring dashboard. The implementation includes a React UI, FastAPI endpoints, patient/observation persistence, risk-index history, alert review, and API-derived analytics.

> **Clinical safety:** This is an educational prototype only. Seeded records and the model training dataset are synthetic; the model has not been clinically validated. Do not use it for diagnosis, triage, treatment decisions, or real patient data. A fallback risk index is not a probability. The optional saved model is experimental and its output is not a clinically calibrated probability. No patient portal or continuous medical-device telemetry is implemented.

## Implemented now

- Doctor interface: Overview, Patients, Alerts, Analytics, Settings
- FastAPI patient and observation endpoints, history, active alerts and review action
- SQLite for local development; PostgreSQL supported with DATABASE_URL
- Explainable fallback index using six configured vital-sign thresholds
- Optional Random Forest six-hour model inference when the artifact loads and all required lab fields are supplied
- Simple feature-importance labels when available, otherwise visible threshold explanations
- API-backed dashboard records and analytics summary
- Synthetic demo patients/alerts seeded on first startup
- Automated frontend build and backend risk-index tests

Not implemented: authentication/authorization, role-based access, real EHR integration, continuous device connectivity, clinical governance, alarm tuning for clinical use, a patient portal, and validation using appropriate licensed clinical data.

## Run locally on Windows

Open two VS Code terminals at the repository root.

### 1. Backend

    cd ICU
    py -m venv .venv
    .venv\Scripts\activate
    pip install -r backend/requirements.txt
    uvicorn backend.api:app --reload --port 8000

API docs: http://127.0.0.1:8000/docs  
Health endpoint: http://127.0.0.1:8000/health

### 2. Frontend

    cd frontend
    npm ci
    npm run dev -- --host 127.0.0.1 --port 5174

Open http://127.0.0.1:5174.

The frontend defaults to http://127.0.0.1:8000. To override it, create frontend/.env.local based on frontend/.env.example:

    VITE_API_URL=http://127.0.0.1:8000

## API endpoints

- GET /health and GET /model/status — service/model readiness
- GET /patients, POST /patients, GET /patients/{patient_id} — patient directory
- POST /patients/{patient_id}/observations — append vitals, recalculate the index and store history
- GET /patients/{patient_id}/history — last 30 saved observations/predictions
- GET /alerts, PATCH /alerts/{alert_id}/review — active alerts and review workflow
- GET /analytics/summary — patient/risk-category/alert counts
- POST /predict — ad hoc assessment

The saved model is read from ICU/ml/models/sepsis_6h_model.pkl. Model inference requires all five lab inputs and a model artifact that loads successfully. Otherwise, the API transparently returns a rule-based fallback index and a warning. Current feature explanations use threshold reasons or model-level feature importance; they are not validated causal explanations.

## Tests

    cd ICU
    pip install -r backend/requirements.txt
    python -m pytest backend/tests -q

Frontend production build:

    cd frontend
    npm ci
    npm run build

## Deploy to Render

The root render.yaml defines a static frontend, FastAPI service and a Render Postgres instance.

1. Open Render and choose New → Blueprint.
2. Connect this GitHub repository and select feature branch feat/sepsisai-doctor-workflow to review the configuration, or merge the pull request and select main.
3. Review all resources and plan choices before applying. The included Postgres plan is Free; Render documents that a Free Postgres database expires after 30 days. Free web services can spin down when idle, and SQLite data on a free web service is not durable.
4. Check the API /health endpoint after deployment. If Render assigns a different public hostname than the default in the Blueprint, update VITE_API_URL on the static site and ALLOWED_ORIGINS on the API, then rebuild/redeploy.
5. Do not enter actual patient information. This prototype has no authentication/authorization and is not approved for clinical use.

Render's free-service limitations and database expiration can change; review the current Render dashboard plan and limits before provisioning or adding a payment method.

## Architecture

- frontend/ — React/Vite doctor dashboard
- ICU/backend/api.py — REST API, persistence, fallback assessment and optional model integration
- ICU/backend/tests/ — API logic tests
- ICU/ml/src/ — preprocessing, label generation, feature creation and training scripts
- ICU/ml/models/sepsis_6h_model.pkl — saved research model artifact
- render.yaml — deployment blueprint
- .github/workflows/sepsisai-checks.yml — frontend build and backend checks
