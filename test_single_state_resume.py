import time
from pathlib import Path
from vahan_parallel_scraper import VahanStateWorker

out_dir = Path("FY 2025-26")
worker = VahanStateWorker("Haryana", output_root=out_dir, year="2025")
state, total, success, failed = worker.run()
print(f"State: {state}, Total: {total}, Success: {success}, Failed: {failed}")
