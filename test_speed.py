import time
from pathlib import Path
from vahan_parallel_scraper import VahanStateWorker

test_dir = Path("Test_Scrape_Speed")
test_dir.mkdir(exist_ok=True)

start = time.time()
worker = VahanStateWorker("Goa", output_root=test_dir, year="2025")
state, total, success, failed = worker.run()
duration = time.time() - start

print(f"State: {state}, Total RTOs: {total}, Success: {success}, Failed: {failed}, Time: {duration:.1f}s, Avg per RTO: {duration/max(total,1):.2f}s")
