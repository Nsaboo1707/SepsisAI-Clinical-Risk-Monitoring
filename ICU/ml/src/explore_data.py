import pandas as pd
# 1. Load dataset
DATA_PATH = "ml/data/raw/synthetic_icu_data.csv"

df = pd.read_csv(DATA_PATH)

print("\n DATASET OVERVIEW \n")

print("Number of rows:", len(df))
print("Number of columns:", len(df.columns))
print("Number of patients:", df["patient_id"].nunique())
# 2. Display column names
print("\n COLUMNS\n")

for column in df.columns:
    print(column)

# 3. Display first 5 rows
print("\nFIRST 5 ROWS\n")

print(df.head())
# 4. Check data types
print("\n========== DATA TYPES ==========\n")

print(df.dtypes)


# --------------------------------------------------
# 5. Check missing values
# --------------------------------------------------

print("\n========== MISSING VALUES ==========\n")

print(df.isnull().sum())


# --------------------------------------------------
# 6. Basic statistics
# --------------------------------------------------

print("\n========== STATISTICS ==========\n")

print(df.describe())


# --------------------------------------------------
# 7. Check sepsis distribution
# --------------------------------------------------

print("\n========== SEPSIS DISTRIBUTION ==========\n")

print(df["sepsis"].value_counts())

print("\nPercentage distribution:\n")

print(
    df["sepsis"]
    .value_counts(normalize=True)
    .mul(100)
    .round(2)
)


# --------------------------------------------------
# 8. Check duplicate rows
# --------------------------------------------------

print("\n========== DUPLICATES ==========\n")

print("Duplicate rows:", df.duplicated().sum())


# --------------------------------------------------
# 9. Check duplicate patient/timestamp combinations
# --------------------------------------------------

print("\n========== DUPLICATE TIMESTAMPS ==========\n")

duplicates = df.duplicated(
    subset=["patient_id", "timestamp"]
).sum()

print("Duplicate patient/timestamp records:", duplicates)


# --------------------------------------------------
# 10. Check patient timeline
# --------------------------------------------------

print("\n========== PATIENT TIMELINE ==========\n")

patient = df[df["patient_id"] == "P0001"]

print(patient[
    [
        "patient_id",
        "timestamp",
        "heart_rate",
        "systolic_bp",
        "diastolic_bp",
        "temperature",
        "spo2",
        "respiratory_rate",
        "lactate",
        "sepsis"
    ]
].to_string(index=False))