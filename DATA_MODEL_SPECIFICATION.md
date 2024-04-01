# Data Model Specification: Ajax Engineering Vahan BI Star Schema

## 1. Schema Architecture Overview
The Ajax Engineering Vahan Business Intelligence platform utilizes an enterprise **Star Schema** data model designed for high-performance slicing, low memory footprint, and exact replication of PowerBI enterprise reporting relationships.

```
                  +---------------------------+
                  |         Dim_Time          |
                  |---------------------------|
                  | PK  DateKey               |
                  |     Date                  |
                  |     Month                 |
                  |     Month_Name            |
                  |     Quarter               |
                  |     FY (Financial Year)   |
                  |     CY (Calendar Year)    |
                  +-------------+-------------+
                                | 1
                                |
                                | *
+--------------------+    +-----+-----------------------+    +--------------------------+
|   Dim_Geography    |    |   Fact_Registrations        |    |        Dim_Makers        |
|--------------------|    |-----------------------------|    |--------------------------|
| PK  RTO_Key        | 1  | FK  RTO_Key                 |  1 | PK  Maker_Key            |
|     State          +----+ FK  DateKey                 +----+     Maker_Clean          |
|     RTO_Code       |  * | FK  Maker_Key               |  * |     OEM_Group            |
|     RTO_Name       |    | FK  Category_Key            |    |     Is_Ajax (Boolean)    |
|     Region (Zone)  |    |     Units (Registration Count)|   +--------------------------+
+--------------------+    |     Running_Total           |
                          +-------------+---------------+
                                        | *
                                        |
                                        | 1
                          +-------------+---------------+
                          |    Dim_VehicleCategories    |
                          |-----------------------------|
                          | PK  Category_Key            |
                          |     Vehicle_Category        |
                          |     Vehicle_Class           |
                          +-----------------------------+
```

---

## 2. Table Schemas & Cardinality

### Fact Table: `Fact_Registrations`
- **Total Ingested Fact Rows:** 55,838 records
- **Primary Granularity:** 1 record per `[Date, RTO, Maker, Vehicle Class]`
- **Columns:**
  - `DateKey` (Integer / YYYYMMDD): Foreign Key to `Dim_Time`
  - `RTO_Key` (String): Foreign Key to `Dim_Geography` (e.g., `KA01`, `MH12`)
  - `Maker_Key` (String): Standardized OEM Key
  - `Category_Key` (String): Vehicle Category / Class Identifier
  - `Units` (Integer): Count of newly registered vehicles
  - `Period` (String): Fiscal identifier (`FY 2024-25`, `FY 2025-26`, `FY 2026-Till Date`)

### Dimension Table: `Dim_Time`
- **Granularity:** Monthly intervals covering April 2024 through October 2026 (31 months)
- **Attributes:**
  - `Date`: First day of month (e.g. `2024-04-01`)
  - `FY`: Fiscal year conforming to Indian standard (`FY 2024-25`, `FY 2025-26`, `FY 2026-Till Date`)
  - `CY`: Gregorian calendar year (`CY 2024`, `CY 2025`, `CY 2026`)
  - `Month_Name`: `APR`, `MAY`, `JUN`, `JUL`, `AUG`, `SEP`, `OCT`, `NOV`, `DEC`, `JAN`, `FEB`, `MAR`
  - `Quarter`: `Q1 (Apr-Jun)`, `Q2 (Jul-Sep)`, `Q3 (Oct-Dec)`, `Q4 (Jan-Mar)`

### Dimension Table: `Dim_Geography`
- **Granularity:** 1,674 RTOs across 36 Indian States and Union Territories
- **Attributes:**
  - `State`: Official State/UT name (e.g. `KARNATAKA`, `MAHARASHTRA`, `TAMIL NADU`)
  - `RTO_Code`: Unique alphanumeric code (e.g. `KA01`, `MH02`, `DL04`)
  - `RTO_Name`: Full station description (e.g. `BANGALORE CENTRAL - KA01`)
  - `Zone`: Regional grouping (`North`, `South`, `East`, `West`, `Central`, `North East`)

### Dimension Table: `Dim_Makers`
- **Granularity:** Consolidated OEM entities
- **Attributes:**
  - `Maker_Clean`: Standardized manufacturer name (e.g., `AJAX ENGINEERING PVT LTD`, `SCHWING STETTER INDIA`, `PUTZMEISTER`, `KYB-CONMAT`)
  - `OEM_Group`: Industry peer categorization
  - `Is_Ajax`: Boolean flag (`True` for Ajax Engineering, `False` for competitors)

---

## 3. PowerBI DAX Measures Replicated in React Engine

### Measure 1: Total Ajax Volume
```dax
Ajax Volume = 
CALCULATE(
    SUM('Fact_Registrations'[Units]),
    'Dim_Makers'[Is_Ajax] = TRUE()
)
```

### Measure 2: Industry Total Volume
```dax
Industry Volume = 
SUM('Fact_Registrations'[Units])
```

### Measure 3: Ajax Market Share (%)
```dax
Ajax Market Share % = 
DIVIDE(
    [Ajax Volume],
    [Industry Volume],
    0
)
```

### Measure 4: Penetration Index by State
```dax
State Penetration Index = 
DIVIDE(
    DIVIDE([Ajax Volume], CALCULATE([Ajax Volume], ALL('Dim_Geography'))),
    DIVIDE([Industry Volume], CALCULATE([Industry Volume], ALL('Dim_Geography'))),
    0
)
```

---

## 4. Multi-Format Master Data Model Artifacts
The pipeline outputs the master data model simultaneously in 3 formats:
1. **`AJAX_Master_Model.xlsx`** (5.0 MB): Multi-sheet workbook containing `Fact_Registrations`, `Dim_Geography`, `Dim_Makers`, `Dim_Time`, and `Summary_KPIs` for direct Excel analysis.
2. **`AJAX_Master_Model.parquet`** (380 KB): Snappy-compressed columnar format for ultra-fast query execution in Python, Polars, DuckDB, and Spark.
3. **`AJAX_Master_Model.csv`** (7.9 MB): Universally accessible flat file with full relational dimensions denormalized for standard data loaders.
4. **`dashboard/src/data/vahanMaster.json`** (16.8 MB): Pre-computed JSON payload embedded directly into the React 19 single-page application for sub-second client-side filtering.
