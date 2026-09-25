import pandas as pd
import os


INPUT_PATH = "ml/data/processed/clean_icu_data.csv"
OUTPUT_PATH = "ml/data/processed/labeled_icu_data.csv"


def create_future_label(df, hours):
    """
    Create a future sepsis label.

    The label is 1 if sepsis occurs at any point
    during the next `hours` hours for the same patient.
    """

    df = df.copy()

    df["timestamp"] = pd.to_datetime(df["timestamp"])

    df = df.sort_values(
        ["patient_id", "timestamp"]
    ).reset_index(drop=True)

    # Store future sepsis values
    future_values = []

    for step in range(1, hours + 1):

        future_sepsis = (
            df.groupby("patient_id")["sepsis"]
            .shift(-step)
        )

        future_values.append(future_sepsis)

    # Combine future values
    future_data = pd.concat(
        future_values,
        axis=1
    )

    # If sepsis appears anywhere in the future window,
    # label = 1
    label = future_data.max(axis=1)

    # Rows without enough future information
    # should not be used for training.
    future_time = (
        df.groupby("patient_id")["timestamp"]
        .transform("max")
        - df["timestamp"]
    )

    label[
        future_time < pd.Timedelta(hours=hours)
    ] = pd.NA

    df[f"sepsis_{hours}h"] = label

    return df


def main():

    print("\n========== FUTURE LABEL CREATION ==========\n")

    # ------------------------------------------
    # Load cleaned data
    # ------------------------------------------

    print("Loading cleaned ICU data...")

    df = pd.read_csv(INPUT_PATH)

    print("Rows:", len(df))
    print("Patients:", df["patient_id"].nunique())

    print("\nCurrent sepsis distribution:")

    print(df["sepsis"].value_counts())

    # ------------------------------------------
    # Create labels
    # ------------------------------------------

    print("\nCreating 3-hour label...")

    df = create_future_label(df, 3)

    print("Creating 6-hour label...")

    df = create_future_label(df, 6)

    print("Creating 12-hour label...")

    df = create_future_label(df, 12)

    # ------------------------------------------
    # Check labels
    # ------------------------------------------

    print("\n========== LABEL DISTRIBUTION ==========\n")

    for column in [
        "sepsis_3h",
        "sepsis_6h",
        "sepsis_12h"
    ]:

        print(f"\n{column}:")

        print(
            df[column]
            .value_counts(dropna=False)
        )

    # ------------------------------------------
    # Save
    # ------------------------------------------

    os.makedirs(
        "ml/data/processed",
        exist_ok=True
    )

    df.to_csv(
        OUTPUT_PATH,
        index=False
    )

    print("\n==========================================")
    print("Future labels created successfully!")
    print("==========================================")

    print("\nSaved to:")
    print(OUTPUT_PATH)


if __name__ == "__main__":
    main()