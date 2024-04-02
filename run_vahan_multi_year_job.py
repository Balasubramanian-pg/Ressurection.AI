"""
Multi-Year Vahan Job Orchestrator
===================================
1. Scrapes Year 2025 for all 36 States into 'FY 2025-26'
2. Scrapes Year 2026 (Till Date) for all 36 States into 'FY 2026-Till Date'
3. Runs Multi-Year Star Schema ETL pipeline
4. Updates AJAX_Master_Model (Excel, CSV, Parquet) and dashboard/src/data/vahanMaster.json
"""

import sys
import time
import subprocess
import logging
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [ORCHESTRATOR] %(message)s'
)

def run_scraper(year: str, output_dir: str, workers: int = 5):
    logging.info(f"=== Starting scrape for Year {year} -> Folder '{output_dir}' ===")
    cmd = [
        sys.executable,
        "vahan_parallel_scraper.py",
        "--year", year,
        "--output-dir", output_dir,
        "--workers", str(workers)
    ]
    t0 = time.time()
    ret = subprocess.run(cmd)
    t_elapsed = time.time() - t0
    if ret.returncode != 0:
        logging.error(f"Scraper for {year} returned exit code {ret.returncode}")
        return False
    logging.info(f"Scraper for {year} finished successfully in {t_elapsed:.1f}s ({t_elapsed/60:.2f} mins).")
    return True

def main():
    total_start = time.time()
    root = Path(".")
    
    # Target folders
    fy24_dir = root / "FY 2024-25"
    fy25_dir = root / "FY 2025-26"
    fy26_dir = root / "FY 2026-Till Date"
    
    fy24_dir.mkdir(parents=True, exist_ok=True)
    fy25_dir.mkdir(parents=True, exist_ok=True)
    fy26_dir.mkdir(parents=True, exist_ok=True)
    
    # 1. Scrape Year 2025
    ok25 = run_scraper(year="2025", output_dir=str(fy25_dir), workers=5)
    if not ok25:
        logging.warning("Year 2025 had errors or was partial.")
        
    # 2. Scrape Year 2026 (Till Date)
    ok26 = run_scraper(year="2026", output_dir=str(fy26_dir), workers=5)
    if not ok26:
        logging.warning("Year 2026 had errors or was partial.")
        
    # 3. Run Multi-Year ETL
    logging.info("=== Running Multi-Year ETL across all 3 Financial Periods ===")
    from multi_year_etl_pipeline import process_multi_year_dataset
    folders = [str(fy24_dir), str(fy25_dir), str(fy26_dir)]
    process_multi_year_dataset(folders, output_file="AJAX_Master_Model.xlsx", max_workers=8)
    
    total_elapsed = time.time() - total_start
    logging.info(f"*** ALL MULTI-YEAR JOBS COMPLETED in {total_elapsed:.1f}s ({total_elapsed/60:.2f} mins) ***")

if __name__ == "__main__":
    main()
