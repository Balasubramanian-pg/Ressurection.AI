"""
AJAX Engineering - Vahan Data ETL & Modeling Pipeline
======================================================
Transforms 1,600+ scraped Vahan RTO Excel reports into a unified,
production-ready Star Schema and Wide Matrix Data Model matching:
'AJAX Engg Report(24-10-2024).pbix'

Outputs:
1. AJAX_Fact_Model: Granular monthly RTO-level competitor registrations
2. Dim_Date: Date dimension with Indian Financial Calendar (FY, FQ)
3. Dim_Geography: Region -> Subregion (State) -> District (RTO) Hierarchy
4. National_Maker_Summary: High-level executive KPI comparison
5. State_Maker_Summary: State-by-state competitor volumes & market share
"""

import os
import re
import sys
import time
import glob
import logging
import argparse
import warnings
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

import openpyxl
import pandas as pd

# Suppress openpyxl stylesheet warnings
warnings.filterwarnings("ignore", category=UserWarning, module="openpyxl")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)

# Standard Indian Regional Sales Alignments
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
    """Classify full legal Vahan maker name into the 11 target competitors or Others."""
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

def parse_single_rto_file(filepath: str, year: int = 2024):
    """Parses a single RTO excel workbook into 12 monthly normalized records."""
    p = Path(filepath)
    state = p.parent.name
    filename = p.stem

    # Extract clean RTO code (e.g., "MAPUSA RTO - GA3 18-SEP-2017" -> "GA3")
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

    # File without records
    if len(rows) <= 4:
        return []

    # Row 3 contains month column names: JAN, FEB, ..., DEC
    header_row = rows[3]
    month_cols = {}
    for col_idx, cell_val in enumerate(header_row):
        val_str = str(cell_val).strip().upper() if cell_val else ""
        if val_str in MONTH_MAP:
            month_cols[val_str] = col_idx

    if not month_cols:
        return []

    # Initialize monthly competitor counters
    monthly_data = {m: {b: 0 for b in COMPETITOR_BRANDS} for m in MONTH_MAP.keys()}

    # Parse rows starting from row 4
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

    for m_name, m_num in MONTH_MAP.items():
        dt = f"{year}-{m_num:02d}-01"
        b_counts = monthly_data[m_name]
        total_market = sum(b_counts.values())
        ajax_val = b_counts["Ajax"]
        ajax_share = round(ajax_val / total_market, 4) if total_market > 0 else 0.0
        others_share = round((total_market - ajax_val) / total_market, 4) if total_market > 0 else 0.0

        # Indian Financial Year: April 2024 to March 2025 is FY 24-25
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


def build_date_dimension(year: int = 2024) -> pd.DataFrame:
    """Generates the Date dimension table conforming to Power BI standards."""
    dates = []
    month_names = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]
    for m_num, m_name in enumerate(month_names, start=1):
        dt = f"{year}-{m_num:02d}-01"
        if m_num >= 4:
            fy = f"FY {str(year)[2:]}-{str(year+1)[2:]}"
            fq = f"Q{((m_num - 4) // 3) + 1}"
        else:
            fy = f"FY {str(year-1)[2:]}-{str(year)[2:]}"
            fq = f"Q{((m_num + 8) // 3) + 1}"

        dates.append({
            "Date": dt,
            "Year": year,
            "Month": m_name,
            "Month_Short": list(MONTH_MAP.keys())[m_num - 1],
            "Month_Num": m_num,
            "FY": fy,
            "FQ": fq
        })
    return pd.DataFrame(dates)


def run_etl(input_dir: str, output_file: str, year: int = 2024, max_workers: int = 8):
    t_start = time.time()
    search_path = os.path.join(input_dir, "*", "*.xlsx")
    files = glob.glob(search_path)
    logging.info(f"Scanning input directory '{input_dir}'...")
    logging.info(f"Discovered {len(files)} RTO Excel files to process with {max_workers} threads.")

    if not files:
        logging.error(f"No files found in '{search_path}'. Aborting ETL.")
        return False

    all_records = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        results = executor.map(lambda f: parse_single_rto_file(f, year=year), files)
        for batch in results:
            if batch:
                all_records.extend(batch)

    logging.info(f"Extracted {len(all_records):,} monthly fact records from {len(files)} workbooks.")

    df_fact = pd.DataFrame(all_records)

    # 1. Build Date Dimension
    df_date = build_date_dimension(year=year)

    # 2. Build Geography Dimension
    df_geo = df_fact[["Region", "Subregion", "Districts", "RTO_Code"]].drop_duplicates().sort_values(["Region", "Subregion", "Districts"])

    # 3. Build National Summary
    numeric_cols = ["Ajax", "Armix", "Apollo", "Civimech", "Elsa", "Fiori", "John Infra", "KYB", "Macons", "Schwing", "Venus", "Others", "Total Market"]
    national_sums = df_fact[numeric_cols].sum()
    total_mkt = national_sums["Total Market"]
    df_national = pd.DataFrame({
        "Brand": numeric_cols[:-1],
        "Annual_Volume_2024": [national_sums[b] for b in numeric_cols[:-1]],
        "Market_Share_%": [round((national_sums[b] / total_mkt) * 100, 2) if total_mkt > 0 else 0 for b in numeric_cols[:-1]]
    }).sort_values("Annual_Volume_2024", ascending=False).reset_index(drop=True)

    # 4. Build State Summary
    df_state_summary = df_fact.groupby("Subregion")[numeric_cols].sum().reset_index()
    df_state_summary["Ajax_Share_%"] = (df_state_summary["Ajax"] / df_state_summary["Total Market"] * 100).round(2).fillna(0)
    df_state_summary = df_state_summary.sort_values("Total Market", ascending=False).reset_index(drop=True)

    # Export to multi-sheet Excel
    logging.info(f"Writing complete multi-tab Data Model to '{output_file}'...")
    with pd.ExcelWriter(output_file, engine="openpyxl") as writer:
        df_fact.to_excel(writer, sheet_name="AJAX_Fact_Model", index=False)
        df_date.to_excel(writer, sheet_name="Dim_Date", index=False)
        df_geo.to_excel(writer, sheet_name="Dim_Geography", index=False)
        df_national.to_excel(writer, sheet_name="National_Maker_Summary", index=False)
        df_state_summary.to_excel(writer, sheet_name="State_Maker_Summary", index=False)

    # Also save Parquet and CSV for blazing fast direct import into Power BI
    csv_file = Path(output_file).with_suffix(".csv")
    parquet_file = Path(output_file).with_suffix(".parquet")
    df_fact.to_csv(csv_file, index=False)
    try:
        df_fact.to_parquet(parquet_file, index=False)
        logging.info(f"Saved high-speed Parquet model: '{parquet_file.name}'")
    except Exception:
        pass

    elapsed = time.time() - t_start
    logging.info(f"ETL Complete in {elapsed:.2f} seconds ({elapsed / 60:.2f} minutes).")
    logging.info(f"Master Excel file saved to: {Path(output_file).resolve()}")
    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Vahan to Power BI ETL & Data Modeling Pipeline")
    parser.add_argument("--input-dir", type=str, default=r"Test (27-10-2026)", help="Scraped Excel folder")
    parser.add_argument("--output-file", type=str, default="AJAX_Master_Model_2024.xlsx", help="Master Excel output")
    parser.add_argument("--year", type=int, default=2024, help="Scraped report year")
    parser.add_argument("--workers", type=int, default=8, help="Parallel parsing threads")
    args = parser.parse_args()

    run_etl(
        input_dir=args.input_dir,
        output_file=args.output_file,
        year=args.year,
        max_workers=args.workers
    )
