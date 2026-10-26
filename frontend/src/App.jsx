import { useEffect, useState } from "react";
import "./App.css";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\\/$/, "");

function normalizePatient(p) {
  const risk = Number(p.risk ?? p.risk_value ?? 0);
  const level = String(p.risk_level || (risk >= 70 ? "HIGH" : risk >= 40 ? "MEDIUM" : "LOW")).toUpperCase();
  return { ...p, id: p.id || p.patient_id, hr: Number(p.hr ?? p.heart_rate ?? 0), bp: p.bp || `${p.systolic_bp ?? 0}/${p.diastolic_bp ?? 0}`, spo2: Number(p.spo2 ?? 0), rr: Number(p.rr ?? p.respiratory_rate ?? 0), temp: String(p.temp ?? `${p.temperature ?? 0}°`), lactate: String(p.lactate ?? ""), risk, risk_level: level, status: p.status || (level === "HIGH" ? "Critical" : level === "MEDIUM" ? "Watch" : "Stable") };
}

async function fetchJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try { const body = await response.json(); detail = body.detail || detail; } catch { /* keep default */ }
    throw new Error(detail);
  }
  return response.json();
}

/* =====================================================
   INITIAL PATIENT DATA
===================================================== */

const initialPatients = [
  {
    name: "M. Anderson",
    id: "PT-10482",
    bed: "ICU-04",
    hr: 118,
    bp: "92/58",
    spo2: 91,
    rr: 27,
    temp: "38.9°",
    lactate: "3.8",
    risk: 87,
    status: "Critical",
  },
  {
    name: "J. Williams",
    id: "PT-10477",
    bed: "ICU-02",
    hr: 102,
    bp: "101/64",
    spo2: 94,
    rr: 23,
    temp: "38.1°",
    lactate: "2.7",
    risk: 64,
    status: "Watch",
  },
  {
    name: "S. Patel",
    id: "PT-10491",
    bed: "ICU-07",
    hr: 96,
    bp: "109/68",
    spo2: 96,
    rr: 19,
    temp: "37.7°",
    lactate: "1.9",
    risk: 42,
    status: "Watch",
  },
  {
    name: "R. Kumar",
    id: "PT-10493",
    bed: "ICU-08",
    hr: 88,
    bp: "118/72",
    spo2: 98,
    rr: 17,
    temp: "37.1°",
    lactate: "1.4",
    risk: 28,
    status: "Stable",
  },
  {
    name: "A. Sharma",
    id: "PT-10494",
    bed: "ICU-09",
    hr: 110,
    bp: "96/61",
    spo2: 93,
    rr: 24,
    temp: "38.4°",
    lactate: "2.9",
    risk: 71,
    status: "Critical",
  },
  {
    name: "P. Singh",
    id: "PT-10495",
    bed: "ICU-10",
    hr: 82,
    bp: "121/76",
    spo2: 97,
    rr: 16,
    temp: "36.9°",
    lactate: "1.2",
    risk: 19,
    status: "Stable",
  },
  {
    name: "N. Gupta",
    id: "PT-10496",
    bed: "ICU-11",
    hr: 99,
    bp: "105/67",
    spo2: 95,
    rr: 21,
    temp: "37.8°",
    lactate: "2.1",
    risk: 48,
    status: "Watch",
  },
  {
    name: "K. Mehta",
    id: "PT-10497",
    bed: "ICU-12",
    hr: 76,
    bp: "124/80",
    spo2: 99,
    rr: 15,
    temp: "36.7°",
    lactate: "1.1",
    risk: 12,
    status: "Stable",
  },
];

/* =====================================================
   INITIAL ALERT DATA
===================================================== */

const initialAlerts = [
  {
    id: 1,
    title: "Rising lactate detected",
    patient: "PT-10482",
    bed: "ICU-04",
    time: "20:38",
    severity: "critical",
    message:
      "Lactate has increased from 2.6 mmol/L to 3.8 mmol/L during the monitoring period.",
  },
  {
    id: 2,
    title: "MAP below threshold",
    patient: "PT-10486",
    bed: "ICU-03",
    time: "20:31",
    severity: "critical",
    message:
      "Mean arterial pressure has remained below the configured clinical threshold.",
  },
  {
    id: 3,
    title: "Respiratory rate elevated",
    patient: "PT-10491",
    bed: "ICU-07",
    time: "20:12",
    severity: "warning",
    message:
      "Respiratory rate is elevated compared with the patient's recent baseline.",
  },
];

/* =====================================================
   HELPER FUNCTIONS
===================================================== */

function getNextPatientId(patients) {
  const numbers = patients
    .map((patient) => Number(patient.id.replace("PT-", "")))
    .filter((number) => !Number.isNaN(number));

  const nextNumber =
    numbers.length > 0
      ? Math.max(...numbers) + 1
      : 10500;

  return `PT-${nextNumber}`;
}

/*
  The current backend returns:
  
  risk_score: 0 - 6
  risk_level: LOW / MEDIUM / HIGH

  The existing UI displays a percentage, so we convert
  the backend level into a display percentage range.
*/

function getDisplayRisk(riskScore, riskLevel) {
  const score = Number(riskScore) || 0;

  if (riskLevel === "HIGH") {
    return Math.min(100, Math.max(70, 70 + score * 5));
  }

  if (riskLevel === "MEDIUM") {
    return Math.min(69, Math.max(40, 40 + score * 5));
  }

  return Math.min(39, Math.max(0, score * 5));
}

/* =====================================================
   APP
===================================================== */

function App() {
  const [activePage, setActivePage] = useState("Overview");

  const [patients, setPatients] = useState(initialPatients);

  const [alerts, setAlerts] = useState(initialAlerts);

  const [showAddPatient, setShowAddPatient] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState(null);

  const [selectedAlert, setSelectedAlert] = useState(null);

  const [roundsStarted, setRoundsStarted] = useState(false);

  const [search, setSearch] = useState("");

  const [apiConnected, setApiConnected] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadServerState = async () => {
      try {
        const [patientRows, alertRows] = await Promise.all([
          fetchJson("/patients"),
          fetchJson("/alerts"),
        ]);
        if (cancelled) return;
        setPatients(patientRows.map(normalizePatient));
        setAlerts(alertRows);
        setApiConnected(true);
      } catch (error) {
        if (!cancelled) {
          setApiConnected(false);
          console.error("SepsisAI API connection failed:", error);
        }
      }
    };
    loadServerState();
    return () => { cancelled = true; };
  }, []);

  /* =====================================================
     ADD PATIENT + BACKEND PREDICTION
  ===================================================== */

  const addPatient = async (newPatient) => {
    try {
      const [systolicBP, diastolicBP] = String(newPatient.bp || "120/80").split("/").map((part) => Number(part.trim()));
      const payload = {
        patient_id: getNextPatientId(patients),
        name: String(newPatient.name || "").trim(),
        bed: String(newPatient.bed || "").trim(),
        heart_rate: Number(newPatient.hr),
        systolic_bp: systolicBP,
        diastolic_bp: diastolicBP,
        spo2: Number(newPatient.spo2),
        respiratory_rate: Number(newPatient.rr),
        temperature: Number(String(newPatient.temp || "").replace("°", "").trim()),
        lactate: Number(newPatient.lactate),
        wbc: newPatient.wbc === "" ? undefined : Number(newPatient.wbc),
        platelets: newPatient.platelets === "" ? undefined : Number(newPatient.platelets),
        creatinine: newPatient.creatinine === "" ? undefined : Number(newPatient.creatinine),
        bilirubin: newPatient.bilirubin === "" ? undefined : Number(newPatient.bilirubin),
        hemoglobin: newPatient.hemoglobin === "" ? undefined : Number(newPatient.hemoglobin),
      };
      Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);
      const result = await fetchJson("/patients", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const patientToAdd = normalizePatient(result);
      setPatients((current) => [...current.filter((p) => p.id !== patientToAdd.id), patientToAdd]);
      const currentAlerts = await fetchJson("/alerts");
      setAlerts(currentAlerts);
      setApiConnected(true);
      setShowAddPatient(false);
      setSelectedPatient(patientToAdd);
    } catch (error) {
      console.error("Could not create patient:", error);
      alert("Unable to save this patient. Check that the SepsisAI API is running and review the error in the browser console.\n\n" + error.message);
    }
  };

  /* =====================================================
     DISMISS ALERT
  ===================================================== */

  const dismissAlert = async (alertId) => {
    try {
      await fetchJson(`/alerts/${alertId}/review`, { method: "PATCH" });
      const refreshed = await fetchJson("/alerts");
      setAlerts(refreshed);
    } catch (error) {
      console.error("Could not update alert review status:", error);
      alert("Unable to update alert status: " + error.message);
    } finally {
      setSelectedAlert(null);
    }
  };

  return (
    <div className="app-shell">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-icon">
            <span>+</span>
          </div>

          <div>
            <h1>SepsisAI</h1>
            <p>Clinical Intelligence</p>
          </div>

        </div>

        <nav className="navigation">

          <button
            className={`nav-item ${
              activePage === "Overview"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage("Overview")
            }
          >
            <span className="nav-icon">▦</span>
            <span>Overview</span>
          </button>

          <button
            className={`nav-item ${
              activePage === "Patients"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage("Patients")
            }
          >
            <span className="nav-icon">♙</span>
            <span>Patients</span>
            <b>{patients.length}</b>
          </button>

          <button
            className={`nav-item ${
              activePage === "Alerts"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage("Alerts")
            }
          >
            <span className="nav-icon">♧</span>
            <span>Alerts</span>
            <b>{alerts.length}</b>
          </button>

          <button
            className={`nav-item ${
              activePage === "Analytics"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage("Analytics")
            }
          >
            <span className="nav-icon">↗</span>
            <span>Analytics</span>
          </button>

          <button
            className={`nav-item ${
              activePage === "Settings"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage("Settings")
            }
          >
            <span className="nav-icon">⚙</span>
            <span>Settings</span>
          </button>

        </nav>

        <div className="sidebar-footer">

          <div className="system-status">

            <span className="status-dot"></span>

            <div>
              <strong>
                System operational
              </strong>

              <small>
                All services connected
              </small>
            </div>

          </div>

        </div>

      </aside>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="main-content">

        <div className={`api-status ${apiConnected ? "connected" : "disconnected"}`} role="status">
          <span className="api-status-dot"></span>
          {apiConnected ? "API connected · prototype/demo data may be shown" : "API disconnected · showing local sample data"}
        </div>

        <header className="topbar">

          <div>

            <p className="eyebrow">
              ICU MONITORING CENTER
            </p>

            <h2>{activePage}</h2>

          </div>

          <div className="topbar-right">

            <div className="live-status">

              <span className="live-dot"></span>

              Live monitoring

            </div>

            <div className="date-display">

              Tuesday, September 6, 2026

              <strong>
                20:42
              </strong>

            </div>

            <button
              className="icon-button"
              onClick={() =>
                setActivePage("Alerts")
              }
              title="View alerts"
            >
              ♧

              {alerts.length > 0 && (
                <span className="notification-dot"></span>
              )}

            </button>

            <button
              className="profile-button"
              onClick={() =>
                setActivePage("Settings")
              }
              title="Open settings"
            >
              DR
            </button>

          </div>

        </header>

        {/* =================================================
            OVERVIEW
        ================================================= */}

        {activePage === "Overview" && (
          <Overview
            patients={patients}
            alerts={alerts}
            roundsStarted={roundsStarted}
            setRoundsStarted={setRoundsStarted}
            navigate={setActivePage}
            openPatient={setSelectedPatient}
            openAlert={setSelectedAlert}
          />
        )}

        {/* =================================================
            PATIENTS
        ================================================= */}

        {activePage === "Patients" && (
          <PatientsPage
            patients={patients}
            search={search}
            setSearch={setSearch}
            onAddPatient={() =>
              setShowAddPatient(true)
            }
            onSelectPatient={setSelectedPatient}
          />
        )}

        {/* =================================================
            ALERTS
        ================================================= */}

        {activePage === "Alerts" && (
          <AlertsPage
            alerts={alerts}
            onReview={setSelectedAlert}
            onDismiss={dismissAlert}
          />
        )}

        {/* =================================================
            ANALYTICS
        ================================================= */}

        {activePage === "Analytics" && (
          <AnalyticsPage />
        )}

        {/* =================================================
            SETTINGS
        ================================================= */}

        {activePage === "Settings" && (
          <SettingsPage />
        )}

      </main>

      {/* =================================================
          ADD PATIENT MODAL
      ================================================= */}

      {showAddPatient && (
        <AddPatientModal
          onClose={() =>
            setShowAddPatient(false)
          }
          onAdd={addPatient}
        />
      )}

      {/* =================================================
          PATIENT DETAILS MODAL
      ================================================= */}

      {selectedPatient && (
        <PatientDetails
          patient={selectedPatient}
          onClose={() =>
            setSelectedPatient(null)
          }
        />
      )}

      {/* =================================================
          ALERT REVIEW MODAL
      ================================================= */}

      {selectedAlert && (
        <AlertReview
          alert={selectedAlert}
          onClose={() =>
            setSelectedAlert(null)
          }
          onDismiss={() =>
            dismissAlert(selectedAlert.id)
          }
        />
      )}

    </div>
  );
}

/* =====================================================
   OVERVIEW
===================================================== */

function Overview({
  patients,
  alerts,
  roundsStarted,
  setRoundsStarted,
  navigate,
  openPatient,
  openAlert,
}) {
  const highRisk = patients.filter(
    (p) => p.risk >= 70
  ).length;

  const mediumRisk = patients.filter(
    (p) =>
      p.risk >= 40 &&
      p.risk < 70
  ).length;

  const lowRisk = patients.filter(
    (p) => p.risk < 40
  ).length;

  return (
    <section className="page">

      <div className="welcome-row">

        <div>

          <p className="date-label">
            TUESDAY, SEPTEMBER 6, 2026 · 20:42 LOCAL TIME
          </p>

          <h3>
            Good evening, Dr. Rivera
          </h3>

          <p className="welcome-text">
            Here is the current status of your intensive care unit.
          </p>

        </div>

        <button
          className="primary-button"
          onClick={() =>
            setRoundsStarted(!roundsStarted)
          }
        >
          {roundsStarted
            ? "✓ Rounds in progress"
            : "+ Start clinical rounds"}
        </button>

      </div>

      {/* METRICS */}

      <div className="metrics-grid">

        <MetricCard
          label="TOTAL ICU PATIENTS"
          value={patients.length}
          description="Patients currently admitted"
        />

        <MetricCard
          label="HIGH-RISK PATIENTS"
          value={String(highRisk).padStart(2, "0")}
          description="Requires immediate review"
          tone="danger"
        />

        <MetricCard
          label="MEDIUM-RISK PATIENTS"
          value={String(mediumRisk).padStart(2, "0")}
          description="Close monitoring advised"
          tone="warning"
        />

        <MetricCard
          label="LOW-RISK PATIENTS"
          value={String(lowRisk).padStart(2, "0")}
          description="Stable condition"
          tone="success"
        />

        <MetricCard
          label="AVERAGE SEPSIS RISK"
          value="51%"
          description="↑ 4% from 6 hours ago"
          tone="cyan"
        />

      </div>

      {/* CHART + ALERTS */}

      <div className="dashboard-grid">

        <section className="panel">

          <div className="panel-header">

            <div>

              <p className="panel-label">
                UNIT OVERVIEW
              </p>

              <h4>
                Average sepsis risk
              </h4>

            </div>

            <span className="chart-label">
              Last 6 hours
            </span>

          </div>

          <div className="chart">

            <div className="chart-line one"></div>
            <div className="chart-line two"></div>
            <div className="chart-line three"></div>
            <div className="chart-line four"></div>

            <div className="risk-threshold">
              <span>60%</span>
            </div>

            <div className="risk-graph">

              <div className="point p1"></div>
              <div className="point p2"></div>
              <div className="point p3"></div>
              <div className="point p4"></div>
              <div className="point p5"></div>

            </div>

          </div>

          <div className="chart-bottom">

            <span>6h ago</span>
            <span>4h ago</span>
            <span>2h ago</span>
            <span>Now</span>

          </div>

        </section>

        <section className="panel">

          <div className="panel-header">

            <div>

              <p className="panel-label">
                REQUIRES REVIEW
              </p>

              <h4>
                Recent alerts
              </h4>

            </div>

            <button
              className="outline-button"
              onClick={() =>
                navigate("Alerts")
              }
            >
              View all →
            </button>

          </div>

          <div className="alert-list">

            {alerts.length === 0 ? (
              <div className="empty-state">
                No active alerts
              </div>
            ) : (
              alerts.map((alert) => (
                <button
                  className="alert-row"
                  key={alert.id}
                  onClick={() =>
                    openAlert(alert)
                  }
                >

                  <div
                    className={`alert-icon ${alert.severity}`}
                  >
                    !
                  </div>

                  <div className="alert-info">

                    <strong>
                      {alert.title}
                    </strong>

                    <span>
                      {alert.patient} · {alert.bed}
                    </span>

                  </div>

                  <time>
                    {alert.time}
                  </time>

                </button>
              ))
            )}

          </div>

        </section>

      </div>

      {/* PATIENT ATTENTION */}

      <div className="dashboard-grid second-row">

        <section className="panel">

          <div className="panel-header">

            <div>

              <p className="panel-label">
                PRIORITIZED BY MODEL
              </p>

              <h4>
                Patients requiring attention
              </h4>

            </div>

            <span>◈</span>

          </div>

          <div className="attention-list">

            {patients
              .filter(
                (patient) =>
                  patient.risk >= 40
              )
              .map((patient) => (
                <button
                  className="attention-row"
                  key={patient.id}
                  onClick={() =>
                    openPatient(patient)
                  }
                >

                  <span
                    className={`risk-indicator ${
                      patient.risk >= 70
                        ? "high"
                        : "medium"
                    }`}
                  ></span>

                  <div>

                    <strong>
                      {patient.name}
                    </strong>

                    <span>
                      {patient.bed}
                    </span>

                    <small>
                      {patient.risk >= 70
                        ? "Immediate clinical review recommended"
                        : "Continue close monitoring"}
                    </small>

                  </div>

                  <span
                    className={`risk-pill ${
                      patient.risk >= 70
                        ? "high-risk"
                        : ""
                    }`}
                  >
                    {patient.risk}%
                  </span>

                  <span>›</span>

                </button>
              ))}

          </div>

        </section>

        {/* CAPACITY */}

        <section className="panel capacity-panel">

          <div className="panel-header">

            <div>

              <p className="panel-label">
                UNIT CAPACITY
              </p>

              <h4>
                ICU utilization
              </h4>

            </div>

            <span className="help-button">
              ?
            </span>

          </div>

          <div className="capacity-number">

            <strong>
              {patients.length}
            </strong>

            <span>
              / 28 beds occupied
            </span>

          </div>

          <div className="progress">

            <div
              style={{
                width: `${Math.min(
                  (patients.length / 28) * 100,
                  100
                )}%`,
              }}
            ></div>

          </div>

          <div className="capacity-meta">

            <span>
              {Math.max(
                28 - patients.length,
                0
              )}{" "}
              beds available
            </span>

            <span>
              {Math.round(
                (patients.length / 28) * 100
              )}
              % utilized
            </span>

          </div>

          <div className="capacity-status">

            <span>
              <i className="status-dot"></i>
              Telemetry connected
            </span>

            <strong>
              {patients.length} / {patients.length}
            </strong>

          </div>

          <div className="capacity-status">

            <span>
              <i className="status-dot"></i>
              Data freshness
            </span>

            <strong>
              &lt; 30 sec
            </strong>

          </div>

        </section>

      </div>

      {/* TABLE */}

      <section className="panel telemetry-panel">

        <div className="panel-header">

          <div>

            <p className="panel-label">
              LIVE TELEMETRY
            </p>

            <h4>
              Patient monitoring
            </h4>

          </div>

          <button
            className="outline-button"
            onClick={() =>
              navigate("Patients")
            }
          >
            View all patients →
          </button>

        </div>

        <PatientTable
          patients={patients}
          onSelectPatient={openPatient}
        />

      </section>

    </section>
  );
}

/* =====================================================
   METRIC CARD
===================================================== */

function MetricCard({
  label,
  value,
  description,
  tone = "",
}) {
  return (
    <div className="metric-card">

      <div className="metric-top">

        <span>{label}</span>

        <div
          className={`metric-icon ${tone}`}
        >
          ●
        </div>

      </div>

      <div className="metric-value">
        {value}
      </div>

      <p
        className={`metric-description ${tone}`}
      >
        {description}
      </p>

    </div>
  );
}

/* =====================================================
   PATIENT PAGE
===================================================== */

function PatientsPage({
  patients,
  search,
  setSearch,
  onAddPatient,
  onSelectPatient,
}) {
  const filteredPatients =
    patients.filter((patient) =>
      `${patient.name} ${patient.id} ${patient.bed}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  return (
    <section className="page">

      <div className="page-heading">

        <div>

          <p className="date-label">
            LIVE PATIENT DIRECTORY
          </p>

          <h3>
            ICU Patients
          </h3>

          <p>
            Monitor patients currently admitted to
            the intensive care unit.
          </p>

        </div>

        <button
          className="primary-button"
          onClick={onAddPatient}
        >
          + Add patient
        </button>

      </div>

      <div className="panel patients-page-panel">

        <div className="patient-search">

          <input
            type="text"
            placeholder="Search patient, ID or bed..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          <span>
            {filteredPatients.length} patients shown
          </span>

        </div>

        <PatientTable
          patients={filteredPatients}
          onSelectPatient={onSelectPatient}
        />

      </div>

    </section>
  );
}

/* =====================================================
   ALERT PAGE
===================================================== */

function AlertsPage({
  alerts,
  onReview,
}) {
  return (
    <section className="page">

      <div className="page-heading">

        <div>

          <p className="date-label">
            CLINICAL MONITORING
          </p>

          <h3>
            Clinical Alerts
          </h3>

          <p>
            Review alerts generated from patient
            telemetry and risk analysis.
          </p>

        </div>

      </div>

      <div className="panel full-panel">

        {alerts.length === 0 ? (
          <div className="empty-state large">

            <h4>
              No active alerts
            </h4>

            <p>
              All current clinical alerts have been reviewed.
            </p>

          </div>
        ) : (
          alerts.map((alert) => (
            <div
              className="large-alert"
              key={alert.id}
            >

              <div
                className={`alert-icon ${alert.severity}`}
              >
                !
              </div>

              <div>

                <strong>
                  {alert.title}
                </strong>

                <span>
                  {alert.patient} · {alert.bed}
                </span>

                <small>
                  {alert.message}
                </small>

              </div>

              <time>
                {alert.time}
              </time>

              <button
                className="review-button"
                onClick={() =>
                  onReview(alert)
                }
              >
                Review →
              </button>

            </div>
          ))
        )}

      </div>

    </section>
  );
}

/* =====================================================
   ANALYTICS
===================================================== */

function AnalyticsPage() {
  const [summary, setSummary] = useState(null);
  const [loadError, setLoadError] = useState("");
  useEffect(() => {
    let cancelled = false;
    fetchJson("/analytics/summary")
      .then((data) => { if (!cancelled) setSummary(data); })
      .catch((error) => { if (!cancelled) setLoadError(error.message); });
    return () => { cancelled = true; };
  }, []);
  return (
    <section className="page">

      <div className="page-heading">

        <div>

          <p className="date-label">
            MODEL PERFORMANCE
          </p>

          <h3>
            Analytics
          </h3>

          <p>
            Analyze sepsis risk trends and model performance.
          </p>

        </div>

      </div>

      <div className="analytics-grid">

        <div className="panel analytics-card">

          <p className="panel-label">
            AVERAGE RISK
          </p>

          <strong>{summary ? `${summary.average_risk_index}` : "—"}</strong>
          <span>Average risk index (not a probability)</span>

        </div>

        <div className="panel analytics-card">

          <p className="panel-label">
            HIGH-RISK CASES
          </p>

          <strong>{summary ? String(summary.high_risk).padStart(2, "0") : "—"}</strong>
          <span>Require clinical review</span>

        </div>

        <div className="panel analytics-card">

          <p className="panel-label">ACTIVE ALERTS</p>
          <strong>{summary ? summary.active_alerts : "—"}</strong>
          <span>{summary ? `${summary.total_patients} patient records · ${summary.demo_records} demo` : "Loading analytics"}</span>

        </div>

      </div>

      {summary && (
        <div className="analytics-grid" style={{ marginTop: 16 }}>
          <div className="panel analytics-card"><p className="panel-label">TOTAL PATIENTS</p><strong>{summary.total_patients}</strong><span>Stored records</span></div>
          <div className="panel analytics-card"><p className="panel-label">MEDIUM-RISK</p><strong>{summary.medium_risk}</strong><span>Risk-index category</span></div>
          <div className="panel analytics-card"><p className="panel-label">LOW-RISK</p><strong>{summary.low_risk}</strong><span>Risk-index category</span></div>
        </div>
      )}
      {loadError && <p role="status">Analytics API unavailable: {loadError}</p>}
      <div className="panel analytics-chart">

        <div className="panel-header">

          <div>

            <p className="panel-label">
              RISK TREND
            </p>

            <h4>
              Sepsis risk over time
            </h4>

          </div>

        </div>

        <div className="large-chart">

          <div></div>
          <div></div>
          <div></div>
          <div></div>

        </div>

      </div>

    </section>
  );
}

/* =====================================================
   SETTINGS
===================================================== */

function SettingsPage() {
  const [notifications, setNotifications] =
    useState(true);

  const [telemetry, setTelemetry] =
    useState(true);

  const [alertsEnabled, setAlertsEnabled] =
    useState(true);

  return (
    <section className="page">

      <div className="page-heading">

        <div>

          <p className="date-label">
            SYSTEM CONFIGURATION
          </p>

          <h3>
            Settings
          </h3>

          <p>
            Configure SepsisAI monitoring preferences.
          </p>

        </div>

      </div>

      <div className="panel settings-panel">

        <Setting
          title="Live telemetry"
          description="Receive real-time patient telemetry updates."
          enabled={telemetry}
          setEnabled={setTelemetry}
        />

        <Setting
          title="Clinical notifications"
          description="Receive notifications when important events occur."
          enabled={notifications}
          setEnabled={setNotifications}
        />

        <Setting
          title="AI risk alerts"
          description="Show alerts generated by the sepsis prediction model."
          enabled={alertsEnabled}
          setEnabled={setAlertsEnabled}
        />

      </div>

    </section>
  );
}

/* =====================================================
   SETTING
===================================================== */

function Setting({
  title,
  description,
  enabled,
  setEnabled,
}) {
  return (
    <div className="setting-row">

      <div>

        <strong>
          {title}
        </strong>

        <p>
          {description}
        </p>

      </div>

      <button
        className={`toggle ${
          enabled ? "on" : ""
        }`}
        onClick={() =>
          setEnabled(!enabled)
        }
      >
        <span></span>
      </button>

    </div>
  );
}

/* =====================================================
   PATIENT TABLE
===================================================== */

function PatientTable({
  patients,
  onSelectPatient,
}) {
  return (
    <div className="table-wrapper">

      <table>

        <thead>

          <tr>

            <th>PATIENT</th>
            <th>BED</th>
            <th>HR</th>
            <th>BP</th>
            <th>SPO₂</th>
            <th>RR</th>
            <th>TEMP</th>
            <th>LACTATE</th>
            <th>SEPSIS RISK</th>
            <th>STATUS</th>

          </tr>

        </thead>

        <tbody>

          {patients.map((patient) => (

            <tr
              key={patient.id}
              onClick={() =>
                onSelectPatient(patient)
              }
              style={{
                cursor: "pointer",
              }}
            >

              <td>

                <strong>
                  {patient.name}
                </strong>

                <small>
                  {patient.id}
                </small>

              </td>

              <td>
                {patient.bed}
              </td>

              <td>

                {patient.hr}

                <small>
                  bpm
                </small>

              </td>

              <td>

                {patient.bp}

                <small>
                  mmHg
                </small>

              </td>

              <td>
                {patient.spo2}%
              </td>

              <td>

                {patient.rr}

                <small>
                  /min
                </small>

              </td>

              <td>
                {patient.temp}
              </td>

              <td>
                {patient.lactate}
              </td>

              <td>

                <span
                  className={`risk-pill ${
                    patient.risk >= 70
                      ? "high-risk"
                      : ""
                  }`}
                >
                  {patient.risk}%
                </span>

              </td>

              <td>

                <span
                  className={`status-label ${
                    patient.status === "Critical"
                      ? "critical"
                      : patient.status === "Watch"
                      ? "watch"
                      : "stable"
                  }`}
                >

                  <i></i>

                  {patient.status}

                </span>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}

/* =====================================================
   ADD PATIENT MODAL
===================================================== */

function AddPatientModal({
  onClose,
  onAdd,
}) {
  const [form, setForm] = useState({
    name: "", bed: "", hr: "", bp: "", spo2: "", rr: "", temp: "", lactate: "",
    wbc: "", platelets: "", creatinine: "", bilirubin: "", hemoglobin: "",
  });

  const [submitting, setSubmitting] =
    useState(false);

  const update = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !form.name ||
      !form.bed ||
      !form.hr ||
      !form.bp ||
      !form.spo2 ||
      !form.rr ||
      !form.temp ||
      !form.lactate
    ) {
      alert(
        "Please enter all patient vital information."
      );

      return;
    }

    const bpPattern = /^\d+\s*\/\s*\d+$/;

    if (!bpPattern.test(form.bp)) {
      alert(
        "Please enter blood pressure like 110/70."
      );

      return;
    }

    try {
      setSubmitting(true);

      await onAdd(form);

    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">

      <div className="modal">

        <div className="modal-header">

          <div>

            <p className="panel-label">
              PATIENT MANAGEMENT
            </p>

            <h3>
              Add New Patient
            </h3>

          </div>

          <button
            className="modal-close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>

        </div>

        <form onSubmit={handleSubmit}>

          {/* FORM FIELDS */}

          <div className="form-grid">

            <label>

              Patient name

              <input
                value={form.name}
                onChange={(e) =>
                  update(
                    "name",
                    e.target.value
                  )
                }
                placeholder="e.g. R. Sharma"
              />

            </label>

            <label>

              ICU Bed

              <input
                value={form.bed}
                onChange={(e) =>
                  update(
                    "bed",
                    e.target.value
                  )
                }
                placeholder="e.g. ICU-13"
              />

            </label>

            <label>

              Heart Rate

              <input
                type="number"
                value={form.hr}
                onChange={(e) =>
                  update(
                    "hr",
                    e.target.value
                  )
                }
                placeholder="bpm"
              />

            </label>

            <label>

              Blood Pressure

              <input
                value={form.bp}
                onChange={(e) =>
                  update(
                    "bp",
                    e.target.value
                  )
                }
                placeholder="e.g. 110/70"
              />

            </label>

            <label>

              SpO₂

              <input
                type="number"
                value={form.spo2}
                onChange={(e) =>
                  update(
                    "spo2",
                    e.target.value
                  )
                }
                placeholder="%"
              />

            </label>

            <label>

              Respiratory Rate

              <input
                type="number"
                value={form.rr}
                onChange={(e) =>
                  update(
                    "rr",
                    e.target.value
                  )
                }
                placeholder="/min"
              />

            </label>

            <label>

              Temperature

              <input
                value={form.temp}
                onChange={(e) =>
                  update(
                    "temp",
                    e.target.value
                  )
                }
                placeholder="e.g. 37.2°"
              />

            </label>

            <label>
              Lactate
              <input type="number" step="0.1" value={form.lactate}
                onChange={(e) => update("lactate", e.target.value)} placeholder="mmol/L" />
            </label>
            <label>
              WBC count <small>(optional)</small>
              <input type="number" step="0.1" value={form.wbc}
                onChange={(e) => update("wbc", e.target.value)} placeholder="cells / unit" />
            </label>
            <label>
              Platelets <small>(optional)</small>
              <input type="number" step="0.1" value={form.platelets}
                onChange={(e) => update("platelets", e.target.value)} placeholder="count" />
            </label>
            <label>
              Creatinine <small>(optional)</small>
              <input type="number" step="0.1" value={form.creatinine}
                onChange={(e) => update("creatinine", e.target.value)} placeholder="mg/dL" />
            </label>
            <label>
              Bilirubin <small>(optional)</small>
              <input type="number" step="0.1" value={form.bilirubin}
                onChange={(e) => update("bilirubin", e.target.value)} placeholder="mg/dL" />
            </label>
            <label>
              Hemoglobin <small>(optional)</small>
              <input type="number" step="0.1" value={form.hemoglobin}
                onChange={(e) => update("hemoglobin", e.target.value)} placeholder="g/dL" />
            </label>

          </div>

          {/* BACKEND PREDICTION NOTICE */}

          <div className="risk-input">

            <div className="risk-input-header">

              <label>
                AI Sepsis Prediction
              </label>

              <strong>
                Automatic
              </strong>

            </div>

            <p>
              The backend records the assessment and its method. Optional lab values allow the experimental model path when available; otherwise a rule-based index is shown. This prototype is not clinically validated and is not for medical decisions.
            </p>

          </div>

          {/* BUTTONS */}

          <div className="form-actions">

            <button
              type="button"
              className="outline-button"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={submitting}
            >
              {submitting
                ? "Analyzing..."
                : "Add Patient"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

/* =====================================================
   PATIENT DETAILS
===================================================== */

function PatientDetails({
  patient,
  onClose,
}) {
  const [history, setHistory] = useState([]);
  useEffect(() => {
    let cancelled = false;
    fetchJson(`/patients/${encodeURIComponent(patient.id)}/history`)
      .then((rows) => { if (!cancelled) setHistory(rows); })
      .catch((error) => console.warn("History unavailable:", error.message));
    return () => { cancelled = true; };
  }, [patient.id]);
  return (
    <div className="modal-overlay">

      <div className="modal patient-modal">

        <div className="modal-header">

          <div>

            <p className="panel-label">
              PATIENT DETAILS
            </p>

            <h3>
              {patient.name}
            </h3>

            <span>
              {patient.id} · {patient.bed}
            </span>

          </div>

          <button
            className="modal-close"
            onClick={onClose}
          >
            ×
          </button>

        </div>

        <div className="patient-detail-grid">

          <Vital
            name="Heart Rate"
            value={patient.hr}
            unit="bpm"
          />

          <Vital
            name="Blood Pressure"
            value={patient.bp}
            unit="mmHg"
          />

          <Vital
            name="SpO₂"
            value={`${patient.spo2}%`}
            unit=""
          />

          <Vital
            name="Respiratory Rate"
            value={patient.rr}
            unit="/min"
          />

          <Vital
            name="Temperature"
            value={patient.temp}
            unit=""
          />

          <Vital
            name="Lactate"
            value={patient.lactate}
            unit="mmol/L"
          />

        </div>

        <div className="patient-risk-box">

          <span>
            AI SEPSIS RISK
          </span>

          <strong>
            {patient.risk}%
          </strong>

          <p>
            Method: {patient.risk_method || "demo/sample"}. A rule-based risk index is not a probability; this research prototype has not been clinically validated.
          </p>

          <span>
            STATUS: {patient.status}
          </span>

        </div>

        <div className="review-section">
          <h4>Recent assessment history</h4>
          {history.length === 0 ? <p>No saved assessment history yet.</p> : (
            <div className="history-list">
              {history.slice(0, 5).map((item) => (
                <div className="history-row" key={item.id || item.created_at}>
                  <span>{item.created_at ? new Date(item.created_at).toLocaleString() : "Recorded assessment"}</span>
                  <strong>{item.risk} {item.risk_method === "threshold_rules" ? "index" : "score"} · {item.risk_level}</strong>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-actions">

          <button
            className="outline-button"
            onClick={onClose}
          >
            Close
          </button>

        </div>

      </div>

    </div>
  );
}

/* =====================================================
   VITAL
===================================================== */

function Vital({
  name,
  value,
  unit,
}) {
  return (
    <div className="vital-box">

      <span>
        {name}
      </span>

      <strong>
        {value}
      </strong>

      {unit && (
        <small>
          {unit}
        </small>
      )}

    </div>
  );
}

/* =====================================================
   ALERT REVIEW
===================================================== */

function AlertReview({
  alert,
  onClose,
  onDismiss,
}) {
  return (
    <div className="modal-overlay">

      <div className="modal alert-modal">

        <div className="modal-header">

          <div>

            <p className="panel-label">
              CLINICAL ALERT REVIEW
            </p>

            <h3>
              {alert.title}
            </h3>

            <span>
              {alert.patient} · {alert.bed}
            </span>

          </div>

          <button
            className="modal-close"
            onClick={onClose}
          >
            ×
          </button>

        </div>

        <div className="review-alert-box">

          <div
            className={`alert-icon ${alert.severity}`}
          >
            !
          </div>

          <div>

            <strong>
              {alert.severity === "critical"
                ? "High priority alert"
                : "Clinical warning"}
            </strong>

            <p>
              {alert.message}
            </p>

          </div>

        </div>

        <div className="review-section">

          <h4>
            Recommended action
          </h4>

          <p>
            Review the patient's current vitals,
            recent trends and clinical condition before
            making a treatment decision.
          </p>

        </div>

        <div className="review-section">

          <h4>
            Alert time
          </h4>

          <p>
            {alert.time}
          </p>

        </div>

        <div className="form-actions">

          <button
            className="outline-button"
            onClick={onClose}
          >
            Close
          </button>

          <button
            className="primary-button"
            onClick={onDismiss}
          >
            ✓ Mark as reviewed
          </button>

        </div>

      </div>

    </div>
  );
}

export default App;