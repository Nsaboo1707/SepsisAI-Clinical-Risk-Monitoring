import numpy as np
import pandas as pd


np.random.seed(42)

NUM_PATIENTS = 200
HOURS_PER_PATIENT = 24


rows = []

for patient in range(1, NUM_PATIENTS + 1):

    patient_id = f"P{patient:04d}"

    # Randomly decide whether this patient's trajectory
    # will become high-risk.
    high_risk = np.random.rand() < 0.25

    base_hr = np.random.normal(80, 8)
    base_sbp = np.random.normal(120, 10)
    base_dbp = np.random.normal(75, 7)
    base_temp = np.random.normal(37.0, 0.3)
    base_spo2 = np.random.normal(97, 1)
    base_rr = np.random.normal(16, 2)

    for hour in range(HOURS_PER_PATIENT):

        if high_risk and hour > 12:
            deterioration = hour - 12
        else:
            deterioration = 0

        heart_rate = base_hr + deterioration * np.random.uniform(1.5, 3.0)
        systolic_bp = base_sbp - deterioration * np.random.uniform(1.0, 2.0)
        diastolic_bp = base_dbp - deterioration * np.random.uniform(0.5, 1.5)
        temperature = base_temp + deterioration * np.random.uniform(0.02, 0.08)
        spo2 = base_spo2 - deterioration * np.random.uniform(0.05, 0.15)
        respiratory_rate = base_rr + deterioration * np.random.uniform(0.3, 0.8)

        wbc = np.random.normal(8, 1.5) + deterioration * 0.15
        lactate = np.random.normal(1.2, 0.2) + deterioration * 0.12
        platelets = np.random.normal(220, 25) - deterioration * 2
        creatinine = np.random.normal(0.9, 0.15) + deterioration * 0.03
        bilirubin = np.random.normal(0.8, 0.15) + deterioration * 0.02
        hemoglobin = np.random.normal(13, 1) - deterioration * 0.05

        # Basic label for this synthetic demonstration dataset.
        sepsis = int(high_risk and hour >= 20)

        rows.append({
            "patient_id": patient_id,
            "timestamp": pd.Timestamp("2026-01-01") + pd.Timedelta(hours=hour),
            "heart_rate": heart_rate,
            "systolic_bp": systolic_bp,
            "diastolic_bp": diastolic_bp,
            "temperature": temperature,
            "spo2": spo2,
            "respiratory_rate": respiratory_rate,
            "wbc": wbc,
            "lactate": lactate,
            "platelets": platelets,
            "creatinine": creatinine,
            "bilirubin": bilirubin,
            "hemoglobin": hemoglobin,
            "sepsis": sepsis
        })


df = pd.DataFrame(rows)

output_path = "ml/data/raw/synthetic_icu_data.csv"

df.to_csv(output_path, index=False)

print(f"Dataset created: {output_path}")
print(f"Rows: {len(df)}")
print(f"Patients: {df['patient_id'].nunique()}")
print("\nClass distribution:")
print(df["sepsis"].value_counts())