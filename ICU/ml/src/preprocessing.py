import pandas as pd
import os


INPUT_PATH = "ml/data/raw/synthetic_icu_data.csv"
OUTPUT_PATH = "ml/data/processed/clean_icu_data.csv"


def load_data():
    print("Loading raw ICU data...")

    df = pd.read_csv(INPUT_PATH)

    return df


def clean_data(df):

    print("Cleaning data...")

    # Convert timestamp to datetime
    df["timestamp"] = pd.to_datetime(df["timestamp"])

    # Remove duplicate rows
    df = df.drop_duplicates()

    # Remove duplicate patient/timestamp records
    df = df.drop_duplicates(
        subset=["patient_id", "timestamp"]
    )

    # Sort by patient and time
    df = df.sort_values(
        by=["patient_id", "timestamp"]
    )

    # Reset index
    df = df.reset_index(drop=True)

    return df


def check_missing_values(df):

    print("\n========== MISSING VALUES ==========\n")

    print(df.isnull().sum())


def main():

    print("\n========== PREPROCESSING ==========\n")

    # Make sure output directory exists
    os.makedirs(
        "ml/data/processed",
        exist_ok=True
    )

    # Load data
    df = load_data()

    print("Rows before cleaning:", len(df))

    # Clean data
    df = clean_data(df)

    print("Rows after cleaning:", len(df))

    # Check missing values
    check_missing_values(df)

    # Save processed dataset
    df.to_csv(
        OUTPUT_PATH,
        index=False
    )

    print("\n===================================")
    print("Preprocessing completed successfully!")
    print("===================================")

    print("\nSaved file:")
    print(OUTPUT_PATH)


if __name__ == "__main__":
    main()