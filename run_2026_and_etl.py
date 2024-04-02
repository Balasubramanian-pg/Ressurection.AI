import sys
import time
import subprocess
import logging
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [2026-PIPELINE] %(message)s'
)

def run_scraper_2026(workers=5):
    logging.info("=== Starting Scraper for Year 2026 (Till Date) into 'FY 2026-Till Date' ===")
    cmd = [
        sys.executable,
        "vahan_parallel_scraper.py",
        "--year", "2026",
        "--output-dir", "FY 2026-Till Date",
        "--workers", str(workers)
    ]
    t0 = time.time()
    ret = subprocess.run(cmd)
    t_elapsed = time.time() - t0
    logging.info(f"2026 Scrape initial pass completed in {t_elapsed:.1f}s ({t_elapsed/60:.2f} mins).")
    
    # Check if any states need a resume pass
    from check_missing_rtos import fy24_states
    import glob
    
    fy26_files = glob.glob("FY 2026-Till Date/*/*.xlsx")
    logging.info(f"FY 2026 downloaded so far: {len(fy26_files)} / 1674")
    
    if len(fy26_files) < 1674:
        # Identify missing states and retry
        fy26_states = {}
        for f in fy26_files:
            st = Path(f).parent.name
            fy26_states[st] = fy26_states.get(st, 0) + 1
        
        missing_states = [st for st, count in fy24_states.items() if fy26_states.get(st, 0) < count]
        if missing_states:
            logging.info(f"Retrying {len(missing_states)} missing states: {missing_states}")
            cmd_retry = [
                sys.executable,
                "vahan_parallel_scraper.py",
                "--year", "2026",
                "--output-dir", "FY 2026-Till Date",
                "--workers", "4",
                "--states"
            ] + missing_states
            subprocess.run(cmd_retry)

def run_final_etl():
    logging.info("=== Running Multi-Year Unified ETL Pipeline ===")
    from multi_year_etl_pipeline import process_multi_year_dataset
    folders = ["FY 2024-25", "FY 2025-26", "FY 2026-Till Date"]
    process_multi_year_dataset(folders, output_file="AJAX_Master_Model.xlsx", max_workers=8)
    logging.info("=== Multi-Year Unified ETL Pipeline Complete! ===")

if __name__ == "__main__":
    t_start = time.time()
    run_scraper_2026(workers=5)
    run_final_etl()
    total_time = time.time() - t_start
    logging.info(f"ALL JOBS FINISHED in {total_time:.1f}s ({total_time/60:.2f} mins).")
