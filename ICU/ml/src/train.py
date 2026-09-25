import pandas as pd
import os
import joblib

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
    average_precision_score
)

# ==========================================
# PATHS
# ==========================================

INPUT_PATH = "ml/data/processed/features.csv"
MODEL_PATH = "ml/models/sepsis_6h_model.pkl"


# ==========================================
# FEATURES
# ==========================================

FEATURE_COLUMNS = [
    "heart_rate",
    "systolic_bp",
    "diastolic_bp",
    "temperature",
    "spo2",
    "respiratory_rate",
    "wbc",
    "lactate",
    "platelets",
    "creatinine",
    "bilirubin",
    "hemoglobin",

    "hr_change",
    "hr_rolling_mean",
    "hr_rolling_max",
    "sbp_change",
    "dbp_change",
    "temperature_change",
    "spo2_change",
    "spo2_rolling_mean",
    "rr_change",
    "rr_rolling_mean",
    "lactate_change",
    "lactate_rolling_mean",
    "hr_baseline",
    "hr_from_baseline"
]


TARGET = "sepsis_6h"


# ==========================================
# LOAD DATA
# ==========================================

def load_data():

    print("\nLoading feature dataset...")

    df = pd.read_csv(INPUT_PATH)

    print("Rows:", len(df))
    print("Patients:", df["patient_id"].nunique())

    return df


# ==========================================
# PREPARE DATA
# ==========================================

def prepare_data(df):

    print("\nPreparing training data...")

    data = df[
        FEATURE_COLUMNS + [TARGET, "patient_id"]
    ].copy()

    # Remove rows where target is unavailable
    data = data.dropna(
        subset=[TARGET]
    )

    # Remove rows where features are missing
    data = data.dropna(
        subset=FEATURE_COLUMNS
    )

    print(
        "Rows available for training:",
        len(data)
    )

    print("\nTarget distribution:")

    print(
        data[TARGET].value_counts()
    )

    return data


# ==========================================
# PATIENT-LEVEL SPLIT
# ==========================================

def split_by_patient(data):

    print("\nCreating patient-level train/test split...")

    # Get unique patients
    patients = data["patient_id"].unique()

    # Use the first 80% of patients for training
    split_index = int(len(patients) * 0.8)

    train_patients = patients[:split_index]
    test_patients = patients[split_index:]

    # Select rows belonging to each patient
    train_data = data[
        data["patient_id"].isin(train_patients)
    ]

    test_data = data[
        data["patient_id"].isin(test_patients)
    ]

    X_train = train_data[FEATURE_COLUMNS]
    y_train = train_data[TARGET]

    X_test = test_data[FEATURE_COLUMNS]
    y_test = test_data[TARGET]

    print(
        "\nTraining patients:",
        len(train_patients)
    )

    print(
        "Testing patients:",
        len(test_patients)
    )

    print(
        "\nTraining rows:",
        len(X_train)
    )

    print(
        "Testing rows:",
        len(X_test)
    )

    return X_train, X_test, y_train, y_test


# ==========================================
# TRAIN MODEL
# ==========================================

def train_model(X_train, y_train):

    print("\nTraining Random Forest...")

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=8,
        random_state=42,
        class_weight="balanced",
        n_jobs=-1
    )

    model.fit(
        X_train,
        y_train
    )

    print("Model training completed!")

    return model


# ==========================================
# EVALUATE MODEL
# ==========================================

def evaluate_model(
    model,
    X_test,
    y_test
):

    print("\n========== MODEL EVALUATION ==========\n")

    predictions = model.predict(X_test)

    probabilities = model.predict_proba(
        X_test
    )[:, 1]

    print("Classification Report:\n")

    print(
        classification_report(
            y_test,
            predictions
        )
    )

    print("Confusion Matrix:\n")

    print(
        confusion_matrix(
            y_test,
            predictions
        )
    )

    if len(y_test.unique()) == 2:

        auc = roc_auc_score(
            y_test,
            probabilities
        )

        pr_auc = average_precision_score(
            y_test,
            probabilities
        )

        print(
            "\nROC-AUC:",
            round(auc, 4)
        )

    # ======================================
    # FEATURE IMPORTANCE
    # ======================================

    importance = pd.DataFrame({
        "feature": FEATURE_COLUMNS,
        "importance": model.feature_importances_
    })

    importance = importance.sort_values(
        "importance",
        ascending=False
    )

    print("\n========== FEATURE IMPORTANCE ==========\n")

    print(
        importance.to_string(index=False)
    )


# ==========================================
# SAVE MODEL
# ==========================================

def save_model(model):

    os.makedirs(
        "ml/models",
        exist_ok=True
    )

    joblib.dump(
        model,
        MODEL_PATH
    )

    print("\nModel saved successfully!")

    print(
        "Model path:",
        MODEL_PATH
    )


# ==========================================
# MAIN
# ==========================================

def main():

    print("\n====================================")
    print("       SEPSISAI MODEL TRAINING")
    print("====================================")

    # Load
    df = load_data()

    # Prepare
    data = prepare_data(df)

    # Patient-level split
    X_train, X_test, y_train, y_test = split_by_patient(
        data
    )

    # Train
    model = train_model(
        X_train,
        y_train
    )

    # Evaluate
    evaluate_model(
        model,
        X_test,
        y_test
    )

    # Save
    save_model(model)


if __name__ == "__main__":
    main()