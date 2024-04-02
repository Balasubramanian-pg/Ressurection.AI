"""
Multi-Year AJAX Engineering Vahan ETL Pipeline
================================================
Processes scraped Excel reports across:
- FY 2024-25 (Calendar Year 2024)
- FY 2025-26 (Calendar Year 2025)
- FY 2026-Till Date (Calendar Year 2026)

Produces:
1. AJAX_Master_Model.xlsx (5 sheets: Fact Model, Date Dim, Geo Dim, National Summary, State Summary)
2. AJAX_Master_Model.csv
3. AJAX_Master_Model.parquet
4. dashboard/src/data/vahanMaster.json (For real-time React App filtering)
"""

import os
import re
import sys
import time
import glob
import json
import logging
import warnings
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

import openpyxl
import pandas as pd

warnings.filterwarnings("ignore", category=UserWarning, module="openpyxl")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)

STATE_TO_REGION = {
    # North
    "Delhi": "North", "Haryana": "North", "Punjab": "North", "Himachal Pradesh": "North",
    "Jammu and Kashmir": "North", "Ladakh": "North", "Uttar Pradesh": "North",
    "Uttarakhand": "North", "Chandigarh": "North", "Rajasthan": "North",
    # South
    "Karnataka": "South", "Tamil Nadu": "South", "Andhra Pradesh": "South",
    "Telangana": "South", "Kerala": "South", "Puducherry": "South", "Lakshadweep": "South",
    # West
    "Maharashtra": "West", "Gujarat": "West", "Goa": "West", "UT of DNH and DD": "West",
    # East
    "West Bengal": "East", "Bihar": "East", "Jharkhand": "East", "Odisha": "East",
    "Andaman Nicobar Island": "East", "Andaman & Nicobar Island": "East",
    # North East
    "Assam": "North East", "Arunachal Pradesh": "North East", "Manipur": "North East",
    "Meghalaya": "North East", "Mizoram": "North East", "Nagaland": "North East",
    "Sikkim": "North East", "Tripura": "North East",
    # Central
    "Madhya Pradesh": "Central", "Chhattisgarh": "Central"
}

MONTH_MAP = {
    "JAN": 1, "FEB": 2, "MAR": 3, "APR": 4, "MAY": 5, "JUN": 6,
    "JUL": 7, "AUG": 8, "SEP": 9, "OCT": 10, "NOV": 11, "DEC": 12
}

COMPETITOR_BRANDS = [
    "Ajax", "Armix", "Apollo", "Civimech", "Elsa", "Fiori",
    "John Infra", "KYB", "Macons", "Schwing", "Venus", "Others"
]

def classify_maker(maker_str: str) -> str:
    m = maker_str.upper().strip()
    if "AJAX" in m:
        return "Ajax"
    elif "SCHWING" in m:
        return "Schwing"
    elif "KYB" in m or "CONMAT" in m:
        return "KYB"
    elif "MACONS" in m:
        return "Macons"
    elif "APOLLO" in m:
        return "Apollo"
    elif "ARMIX" in m:
        return "Armix"
    elif "CIVIMECH" in m:
        return "Civimech"
    elif "ELSA" in m:
        return "Elsa"
    elif "FIORI" in m:
        return "Fiori"
    elif "JOHN INFRA" in m:
        return "John Infra"
    elif "VENUS" in m:
        return "Venus"
    else:
        return "Others"

def parse_rto_file(filepath: str, default_year: int = 2024):
    p = Path(filepath)
    state = p.parent.name
    filename = p.stem

    # Detect year from path or file
    year = default_year
    if "2026" in str(p):
        year = 2026
    elif "2025" in str(p):
        year = 2025
    elif "2024" in str(p):
        year = 2024

    # Extract clean RTO code
    rto_code_match = re.search(r'-\s*([A-Za-z0-9]+)', filename)
    rto_code = rto_code_match.group(1).strip() if rto_code_match else filename.split()[0]
    district = filename

    try:
        wb = openpyxl.load_workbook(filepath, read_only=True, data_only=True)
        ws = wb.active
        rows = list(ws.iter_rows(values_only=True))
        wb.close()
    except Exception:
        return []

    if len(rows) <= 4:
        return []

    # Check title row for year override if present e.g. "...(2025)"
    if rows[0] and rows[0][0]:
        title_str = str(rows[0][0])
        yr_match = re.search(r'\((\d{4})\)', title_str)
        if yr_match:
            year = int(yr_match.group(1))

    # Row 3 contains month columns: JAN, FEB, ..., DEC
    header_row = rows[3]
    month_cols = {}
    for col_idx, cell_val in enumerate(header_row):
        val_str = str(cell_val).strip().upper() if cell_val else ""
        if val_str in MONTH_MAP:
            month_cols[val_str] = col_idx

    if not month_cols:
        return []

    monthly_data = {m: {b: 0 for b in COMPETITOR_BRANDS} for m in month_cols.keys()}

    for r in rows[4:]:
        if not r or len(r) < 2 or r[1] is None:
            continue
        maker_raw = str(r[1]).strip()
        brand = classify_maker(maker_raw)

        for m_name, col_idx in month_cols.items():
            if col_idx < len(r) and r[col_idx] is not None:
                val = r[col_idx]
                if isinstance(val, (int, float)):
                    monthly_data[m_name][brand] += int(val)
                elif isinstance(val, str):
                    val_clean = val.replace(',', '').strip()
                    if val_clean.isdigit():
                        monthly_data[m_name][brand] += int(val_clean)

    region = STATE_TO_REGION.get(state, "Other")
    records = []

    for m_name, col_idx in month_cols.items():
        m_num = MONTH_MAP[m_name]
        dt = f"{year}-{m_num:02d}-01"
        b_counts = monthly_data[m_name]
        total_market = sum(b_counts.values())
        ajax_val = b_counts["Ajax"]
        ajax_share = round(ajax_val / total_market, 4) if total_market > 0 else 0.0
        others_share = round((total_market - ajax_val) / total_market, 4) if total_market > 0 else 0.0

        # Indian Financial Year: April to March
        # (April 2024 - March 2025 = FY 24-25)
        # (April 2025 - March 2026 = FY 25-26)
        # (April 2026 - March 2027 = FY 26-27 Till Date)
        if m_num >= 4:
            fy = f"FY {str(year)[2:]}-{str(year+1)[2:]}"
            fq = f"Q{((m_num - 4) // 3) + 1}"
        else:
            fy = f"FY {str(year-1)[2:]}-{str(year)[2:]}"
            fq = f"Q{((m_num + 8) // 3) + 1}"

        rec = {
            "Region": region,
            "Subregion": state,
            "Districts": district,
            "RTO_Code": rto_code,
            "Dealer code": rto_code,
            "Date": dt,
            "Date Category": "Actual",
            "Year": year,
            "Month": m_name,
            "Month_Num": m_num,
            "FY": fy,
            "FQ": fq,
            "Ajax": b_counts["Ajax"],
            "Armix": b_counts["Armix"],
            "Apollo": b_counts["Apollo"],
            "Civimech": b_counts["Civimech"],
            "Elsa": b_counts["Elsa"],
            "Fiori": b_counts["Fiori"],
            "John Infra": b_counts["John Infra"],
            "KYB": b_counts["KYB"],
            "Macons": b_counts["Macons"],
            "Schwing": b_counts["Schwing"],
            "Venus": b_counts["Venus"],
            "Others": b_counts["Others"],
            "Total Market": total_market,
            "Ajax Market Share": ajax_share,
            "Others Market Share": others_share
        }
        records.append(rec)

    return records


def process_multi_year_dataset(folders, output_file="AJAX_Master_Model.xlsx", max_workers=8):
    t_start = time.time()
    all_files = []
    for fld in folders:
        pattern = os.path.join(fld, "*", "*.xlsx")
        found = glob.glob(pattern)
        logging.info(f"Folder '{fld}': Found {len(found)} files.")
        all_files.extend(found)

    logging.info(f"Total files across all folders: {len(all_files)}")
    if not all_files:
        logging.error("No files found across specified folders.")
        return False

    all_records = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        results = executor.map(parse_rto_file, all_files)
        for batch in results:
            if batch:
                all_records.extend(batch)

    logging.info(f"Parsed {len(all_records):,} monthly fact records in total.")
    df_fact = pd.DataFrame(all_records)

    # Date Dimension
    min_yr = df_fact["Year"].min()
    max_yr = df_fact["Year"].max()
    dates = []
    month_names = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]
    for yr in range(min_yr, max_yr + 1):
        for m_num, m_name in enumerate(month_names, start=1):
            dt = f"{yr}-{m_num:02d}-01"
            if m_num >= 4:
                fy = f"FY {str(yr)[2:]}-{str(yr+1)[2:]}"
                fq = f"Q{((m_num - 4) // 3) + 1}"
            else:
                fy = f"FY {str(yr-1)[2:]}-{str(yr)[2:]}"
                fq = f"Q{((m_num + 8) // 3) + 1}"
            dates.append({
                "Date": dt,
                "Year": yr,
                "Month": m_name,
                "Month_Short": list(MONTH_MAP.keys())[m_num - 1],
                "Month_Num": m_num,
                "FY": fy,
                "FQ": fq
            })
    df_date = pd.DataFrame(dates)

    # Geography Dimension
    df_geo = df_fact[["Region", "Subregion", "Districts", "RTO_Code"]].drop_duplicates().sort_values(["Region", "Subregion", "Districts"])

    # National Summary
    numeric_cols = ["Ajax", "Armix", "Apollo", "Civimech", "Elsa", "Fiori", "John Infra", "KYB", "Macons", "Schwing", "Venus", "Others", "Total Market"]
    national_sums = df_fact[numeric_cols].sum()
    total_mkt = national_sums["Total Market"]
    df_national = pd.DataFrame({
        "Brand": numeric_cols[:-1],
        "Total_Volume": [national_sums[b] for b in numeric_cols[:-1]],
        "Market_Share_%": [round((national_sums[b] / total_mkt) * 100, 2) if total_mkt > 0 else 0 for b in numeric_cols[:-1]]
    }).sort_values("Total_Volume", ascending=False).reset_index(drop=True)

    # State Summary
    df_state_summary = df_fact.groupby("Subregion")[numeric_cols].sum().reset_index()
    df_state_summary["Ajax_Share_%"] = (df_state_summary["Ajax"] / df_state_summary["Total Market"] * 100).round(2).fillna(0)
    df_state_summary = df_state_summary.sort_values("Total Market", ascending=False).reset_index(drop=True)

    # Export to Excel
    logging.info(f"Saving Master Excel to '{output_file}'...")
    with pd.ExcelWriter(output_file, engine="openpyxl") as writer:
        df_fact.to_excel(writer, sheet_name="AJAX_Fact_Model", index=False)
        df_date.to_excel(writer, sheet_name="Dim_Date", index=False)
        df_geo.to_excel(writer, sheet_name="Dim_Geography", index=False)
        df_national.to_excel(writer, sheet_name="National_Maker_Summary", index=False)
        df_state_summary.to_excel(writer, sheet_name="State_Maker_Summary", index=False)

    csv_file = Path(output_file).with_suffix(".csv")
    parquet_file = Path(output_file).with_suffix(".parquet")
    df_fact.to_csv(csv_file, index=False)
    try:
        df_fact.to_parquet(parquet_file, index=False)
        logging.info(f"Saved Parquet model: '{parquet_file.name}'")
    except Exception as pe:
        logging.warning(f"Parquet save error: {pe}")

    # Build React App compact dataset (dashboard/src/data/vahanMaster.json)
    hierarchy = {}
    for _, row in df_geo.iterrows():
        reg = row["Region"]
        sub = row["Subregion"]
        dist = row["Districts"]
        if reg not in hierarchy:
            hierarchy[reg] = {}
        if sub not in hierarchy[reg]:
            hierarchy[reg][sub] = []
        hierarchy[reg][sub].append(dist)

    json_records = []
    for _, r in df_fact.iterrows():
        json_records.append({
            "reg": r["Region"],
            "st": r["Subregion"],
            "dist": r["Districts"],
            "code": r["RTO_Code"],
            "yr": int(r["Year"]),
            "m": r["Month"],
            "fy": r["FY"],
            "fq": r["FQ"],
            "ajax": int(r["Ajax"]),
            "schwing": int(r["Schwing"]),
            "venus": int(r["Venus"]),
            "kyb": int(r["KYB"]),
            "apollo": int(r["Apollo"]),
            "fiori": int(r["Fiori"]),
            "elsa": int(r["Elsa"]),
            "armix": int(r["Armix"]),
            "macons": int(r["Macons"]),
            "civimech": int(r["Civimech"]),
            "john": int(r["John Infra"]),
            "others": int(r["Others"]),
            "tot": int(r["Total Market"])
        })

    frontend_json = {
        "metadata": {
            "total_records": len(json_records),
            "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "periods": sorted(list(df_fact["FY"].unique())),
            "years": sorted([int(y) for y in df_fact["Year"].unique()])
        },
        "hierarchy": hierarchy,
        "records": json_records
    }

    frontend_path = Path("dashboard/src/data/vahanMaster.json")
    frontend_path.parent.mkdir(parents=True, exist_ok=True)
    with open(frontend_path, "w", encoding="utf-8") as jf:
        json.dump(frontend_json, jf)

    elapsed = time.time() - t_start
    logging.info(f"Multi-year ETL pipeline finished in {elapsed:.2f}s ({elapsed/60:.2f}m).")
    logging.info(f"Frontend JSON updated: {frontend_path.resolve()} ({frontend_path.stat().st_size / (1024*1024):.2f} MB)")
    return True

if __name__ == "__main__":
    folders = ["FY 2024-25"]
    if os.path.exists("FY 2025-26"):
        folders.append("FY 2025-26")
    if os.path.exists("FY 2026-Till Date"):
        folders.append("FY 2026-Till Date")
    process_multi_year_dataset(folders)
