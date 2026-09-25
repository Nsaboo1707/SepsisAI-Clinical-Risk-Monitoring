import pandas as pd
import os


INPUT_PATH = "ml/data/processed/labeled_icu_data.csv"
OUTPUT_PATH = "ml/data/processed/features.csv"


def create_features(df):

    df = df.copy()

    # Make sure timestamp is datetime
    df["timestamp"] = pd.to_datetime(df["timestamp"])

    # Sort patient records chronologically
    df = df.sort_values(
        ["patient_id", "timestamp"]
    ).reset_index(drop=True)

    # ==========================================
    # HEART RATE FEATURES
    # ==========================================

    df["hr_change"] = (
        df.groupby("patient_id")["heart_rate"]
        .diff()
    )

    df["hr_rolling_mean"] = (
        df.groupby("patient_id")["heart_rate"]
        .transform(
            lambda x: x.rolling(
                window=4,
                min_periods=1
            ).mean()
        )
    )

    df["hr_rolling_max"] = (
        df.groupby("patient_id")["heart_rate"]
        .transform(
            lambda x: x.rolling(
                window=4,
                min_periods=1
            ).max()
        )
    )

    # ==========================================
    # BLOOD PRESSURE FEATURES
    # ==========================================

    df["sbp_change"] = (
        df.groupby("patient_id")["systolic_bp"]
        .diff()
    )

    df["dbp_change"] = (
        df.groupby("patient_id")["diastolic_bp"]
        .diff()
    )

    # ==========================================
    # TEMPERATURE FEATURES
    # ==========================================

    df["temperature_change"] = (
        df.groupby("patient_id")["temperature"]
        .diff()
    )

    # ==========================================
    # SpO2 FEATURES
    # ==========================================

    df["spo2_change"] = (
        df.groupby("patient_id")["spo2"]
        .diff()
    )

    df["spo2_rolling_mean"] = (
        df.groupby("patient_id")["spo2"]
        .transform(
            lambda x: x.rolling(
                window=4,
                min_periods=1
            ).mean()
        )
    )

    # ==========================================
    # RESPIRATORY RATE FEATURES
    # ==========================================

    df["rr_change"] = (
        df.groupby("patient_id")["respiratory_rate"]
        .diff()
    )

    df["rr_rolling_mean"] = (
        df.groupby("patient_id")["respiratory_rate"]
        .transform(
            lambda x: x.rolling(
                window=4,
                min_periods=1
            ).mean()
        )
    )

    # ==========================================
    # LACTATE FEATURES
    # ==========================================

    df["lactate_change"] = (
        df.groupby("patient_id")["lactate"]
        .diff()
    )

    df["lactate_rolling_mean"] = (
        df.groupby("patient_id")["lactate"]
        .transform(
            lambda x: x.rolling(
                window=4,
                min_periods=1
            ).mean()
        )
    )

    # ==========================================
    # PATIENT HEART RATE BASELINE
    # ==========================================

    df["hr_baseline"] = (
        df.groupby("patient_id")["heart_rate"]
        .transform(
            lambda x: x.expanding().mean()
        )
    )

    df["hr_from_baseline"] = (
        df["heart_rate"] - df["hr_baseline"]
    )

    return df


def main():

    print("\n========== FEATURE ENGINEERING ==========\n")

    # Make sure processed directory exists
    os.makedirs(
        "ml/data/processed",
        exist_ok=True
    )

    # Load labeled dataset
    print("Loading labeled ICU data...")

    df = pd.read_csv(INPUT_PATH)

    print("Rows:", len(df))
    print("Patients:", df["patient_id"].nunique())

    # Create features
    print("\nCreating features...")

    df = create_features(df)

    # Save features
    df.to_csv(
        OUTPUT_PATH,
        index=False
    )

    print("\nFeature engineering completed!")

    print("\nNew feature columns:")

    feature_columns = [
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

    for column in feature_columns:
        print(" -", column)

    print("\nSaved to:")
    print(OUTPUT_PATH)


if __name__ == "__main__":
    main()