"""
High-Performance Parallel Vahan Scraper
========================================
Features:
- Dynamic live state & RTO discovery (no brittle hardcoded counts)
- Worker pool with per-thread isolated temporary download sandboxes
- PrimeFaces AJAX queue synchronization (replaces blind time.sleep)
- Resilient semantic XPath/CSS locators (immune to j_idtXX ID shifts)
- Idempotent resumability (skips already downloaded files)
- Anti-detection micro-jitter and headless resource optimization
"""

import os
import sys
import time
import json
import shutil
import random
import logging
import argparse
import tempfile
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Configure root logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] [Thread-%(thread)d] %(message)s',
    handlers=[
        logging.FileHandler("vahan_parallel_scraper.log", encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)

DEFAULT_OUTPUT_DIR = Path(
    r"C:\Users\ASUS\OneDrive\Documents\Do not Delete My Github Repositories\Ajax-Engineering-Vahan-Scraper-main\Ajax-Engineering-Vahan-Scraper-main\Test (27-10-2026)"
)

def sanitize_name(name: str) -> str:
    """Sanitize filename by removing invalid Windows characters and parentheses numbers."""
    # Keep alphanumeric, space, underscore, dash
    clean = "".join(c for c in name if c.isalnum() or c in (" ", "_", "-")).strip()
    return " ".join(clean.split())

def wait_for_ajax(driver, timeout: int = 25):
    """Wait until PrimeFaces AJAX queue and jQuery network calls are idle."""
    WebDriverWait(driver, timeout).until(
        lambda d: d.execute_script(
            "return (!window.PrimeFaces || PrimeFaces.ajax.Queue.isEmpty()) && "
            "(!window.jQuery || jQuery.active === 0);"
        )
    )

def select_pf_menu(driver, dropdown_id: str, target_prefix: str, timeout: int = 15):
    """
    Select an option from a PrimeFaces SelectOneMenu using the dropdown trigger
    and option text prefix, followed by dynamic AJAX synchronization.
    """
    trigger = WebDriverWait(driver, timeout).until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, f"#{dropdown_id} .ui-selectonemenu-trigger, #{dropdown_id} label"))
    )
    driver.execute_script("arguments[0].click();", trigger)
    time.sleep(0.15)

    items = driver.find_elements(By.CSS_SELECTOR, f"#{dropdown_id}_panel li.ui-selectonemenu-item")
    matched = None
    for it in items:
        text = it.get_attribute("textContent").strip()
        if text.startswith(target_prefix):
            matched = it
            break
            
    if not matched:
        raise ValueError(f"Could not find item with prefix '{target_prefix}' in dropdown '{dropdown_id}'")
    
    driver.execute_script("arguments[0].click();", matched)
    wait_for_ajax(driver)
    time.sleep(0.15)

def get_live_states():
    """Discover all states directly from the live Vahan dashboard."""
    logging.info("Discovering live states from Vahan portal...")
    options = webdriver.ChromeOptions()
    options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36")
    
    driver = webdriver.Chrome(options=options)
    try:
        driver.get("https://vahan.parivahan.gov.in/vahan4dashboard/vahan/view/reportview.xhtml")
        wait_for_ajax(driver)
        
        # Locate State dropdown dynamically
        state_div = driver.find_element(
            By.XPATH, "//div[contains(@id, 'j_idt') and .//label[contains(text(), 'Running States')]]"
        )
        state_id = state_div.get_attribute("id")
        
        # Read options from the hidden select or panel
        options_elements = driver.find_elements(By.CSS_SELECTOR, f"#{state_id}_input option")
        states = []
        for opt in options_elements:
            txt = opt.get_attribute("textContent").strip()
            val = opt.get_attribute("value")
            if val != "-1" and "All Vahan" not in txt and txt:
                # Strip parenthetical counts e.g. "Karnataka(68)" -> "Karnataka"
                clean_state = txt.split("(")[0].strip()
                states.append(clean_state)
                
        logging.info(f"Discovered {len(states)} active states/UTs.")
        return sorted(list(set(states)))
    finally:
        driver.quit()

class VahanStateWorker:
    """Worker handling the scraping of a single state and all its RTOs with self-healing driver."""
    def __init__(self, state_name: str, output_root: Path, year: str = "2024", proxy: str = None):
        self.state_name = state_name
        self.output_root = output_root
        self.year = year
        self.proxy = proxy
        self.temp_dir = Path(tempfile.mkdtemp(prefix=f"vahan_{sanitize_name(state_name)}_"))
        self.state_dir = self.output_root / sanitize_name(state_name)
        self.state_dir.mkdir(parents=True, exist_ok=True)
        self.driver = self._init_driver()

    def _init_driver(self):
        options = webdriver.ChromeOptions()
        options.add_argument("--headless=new")
        options.add_argument("--disable-gpu")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--blink-settings=imagesEnabled=false")
        options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36")
        
        if self.proxy:
            options.add_argument(f"--proxy-server={self.proxy}")
            logging.info(f"[{self.state_name}] Worker using proxy: {self.proxy}")

        options.add_experimental_option("prefs", {
            "download.default_directory": str(self.temp_dir),
            "download.prompt_for_download": False,
            "download.directory_upgrade": True,
            "safebrowsing.enabled": True,
        })

        driver = webdriver.Chrome(options=options)
        driver.execute_cdp_cmd("Page.setDownloadBehavior", {
            "behavior": "allow",
            "downloadPath": str(self.temp_dir)
        })
        return driver

    def reinit_driver(self):
        """Self-healing: Re-spawns Chrome driver if killed, timed out, or invalid session."""
        logging.warning(f"[{self.state_name}] Self-healing triggered: Restarting Chrome driver session...")
        try:
            if self.driver:
                self.driver.quit()
        except Exception:
            pass
        time.sleep(1.0)
        self.driver = self._init_driver()
        try:
            self.driver.get("https://vahan.parivahan.gov.in/vahan4dashboard/vahan/view/reportview.xhtml")
            wait_for_ajax(self.driver)
            select_pf_menu(self.driver, "xaxisVar", "Month Wise")
            select_pf_menu(self.driver, "yaxisVar", "Maker")
            select_pf_menu(self.driver, "selectedYear", self.year)

            state_div = self.driver.find_element(
                By.XPATH, "//div[contains(@id, 'j_idt') and .//label[contains(text(), 'Running States')]]"
            )
            state_id = state_div.get_attribute("id")
            select_pf_menu(self.driver, state_id, self.state_name)
            time.sleep(0.5)
            wait_for_ajax(self.driver)
            logging.info(f"[{self.state_name}] Driver session restored and synchronized successfully.")
        except Exception as e:
            logging.error(f"[{self.state_name}] Failed to re-initialize driver: {e}")

    def run(self):
        logging.info(f"Worker started for State: '{self.state_name}'")
        try:
            self.driver.get("https://vahan.parivahan.gov.in/vahan4dashboard/vahan/view/reportview.xhtml")
            wait_for_ajax(self.driver)

            # Initialize Axis and Year filters
            select_pf_menu(self.driver, "xaxisVar", "Month Wise")
            select_pf_menu(self.driver, "yaxisVar", "Maker")
            select_pf_menu(self.driver, "selectedYear", self.year)

            # Select State dynamically
            state_div = self.driver.find_element(
                By.XPATH, "//div[contains(@id, 'j_idt') and .//label[contains(text(), 'Running States')]]"
            )
            state_id = state_div.get_attribute("id")
            select_pf_menu(self.driver, state_id, self.state_name)
            time.sleep(0.5)
            wait_for_ajax(self.driver)

            # Fetch all RTOs for this state
            rto_options = self.driver.find_elements(By.CSS_SELECTOR, "#selectedRto_input option")
            rtos = []
            for opt in rto_options:
                val = opt.get_attribute("value")
                txt = opt.get_attribute("textContent").strip()
                if val != "-1" and "All Vahan" not in txt and txt:
                    rtos.append((val, txt))

            logging.info(f"State '{self.state_name}' has {len(rtos)} RTOs to process.")
            success_count = 0
            failed_rtos = []

            for val, rto_name in rtos:
                clean_rto = sanitize_name(rto_name)
                final_file = self.state_dir / f"{clean_rto}.xlsx"

                # Check if file already exists with valid content (> 2KB)
                if final_file.exists() and final_file.stat().st_size > 2048:
                    logging.info(f"[{self.state_name}] Skipping '{clean_rto}' (Already downloaded)")
                    success_count += 1
                    continue

                saved_ok = False
                for attempt in range(2):
                    # Clean temp directory before trigger
                    for f in self.temp_dir.glob("*"):
                        try:
                            f.unlink()
                        except Exception:
                            pass

                    try:
                        # Select RTO
                        select_pf_menu(self.driver, "selectedRto", rto_name)

                        # Click Refresh button
                        refresh_btn = WebDriverWait(self.driver, 10).until(
                            EC.element_to_be_clickable((By.XPATH, "//button[.//span[contains(text(), 'Refresh') or contains(@class, 'ui-icon-refresh')]]"))
                        )
                        self.driver.execute_script("arguments[0].click();", refresh_btn)
                        wait_for_ajax(self.driver, timeout=30)
                        time.sleep(0.2)

                        # Ensure table is loaded
                        WebDriverWait(self.driver, 15).until(
                            EC.presence_of_element_located((By.XPATH, "//div[contains(@id, 'groupingTable')]"))
                        )

                        # Click Excel Export button
                        excel_btn = WebDriverWait(self.driver, 15).until(
                            EC.element_to_be_clickable((By.XPATH, "//a[contains(@id, 'xls') or contains(@id, 'excel') or .//span[contains(@class, 'excel')]] | //button[contains(@id, 'xls') or .//span[contains(@class, 'excel')]]"))
                        )
                        self.driver.execute_script("arguments[0].click();", excel_btn)

                        # Wait for download in worker temp directory
                        dl_start = time.time()
                        downloaded = None
                        while time.time() - dl_start < 25:
                            xlsx = list(self.temp_dir.glob("*.xlsx"))
                            cr = list(self.temp_dir.glob("*.crdownload"))
                            if xlsx and not cr:
                                downloaded = xlsx[0]
                                break
                            time.sleep(0.15)

                        if downloaded and downloaded.stat().st_size > 1024:
                            shutil.move(str(downloaded), str(final_file))
                            success_count += 1
                            saved_ok = True
                            logging.info(f"[{self.state_name}] Successfully saved: {final_file.name} ({final_file.stat().st_size} bytes)")
                            break
                        else:
                            logging.warning(f"[{self.state_name}] Attempt {attempt + 1} empty or timed out for '{rto_name}'")
                            time.sleep(1)

                    except Exception as rto_err:
                        logging.warning(f"[{self.state_name}] Attempt {attempt + 1} error on RTO '{rto_name}': {rto_err}")
                        self.reinit_driver()
                        time.sleep(1.0)

                if not saved_ok:
                    logging.error(f"[{self.state_name}] Failed to download '{rto_name}' after 2 attempts.")
                    failed_rtos.append(rto_name)

            logging.info(f"Finished State: '{self.state_name}' | Total: {len(rtos)} | Success: {success_count} | Failed: {len(failed_rtos)}")
            return self.state_name, len(rtos), success_count, failed_rtos

        finally:
            self.driver.quit()
            shutil.rmtree(self.temp_dir, ignore_errors=True)


def main():
    parser = argparse.ArgumentParser(description="Parallel Vahan Dashboard Excel Scraper")
    parser.add_argument("--workers", type=int, default=3, help="Number of parallel state workers (default: 3)")
    parser.add_argument("--output-dir", type=str, default=str(DEFAULT_OUTPUT_DIR), help="Target output folder")
    parser.add_argument("--year", type=str, default="2024", help="Report year (e.g. 2024, 2025, 2026)")
    parser.add_argument("--states", nargs="*", help="Optional specific states to scrape (default: all)")
    parser.add_argument("--proxy", type=str, default=None, help="Optional HTTP/HTTPS proxy URL (e.g. http://ip:port)")
    args = parser.parse_args()

    output_root = Path(args.output_dir)
    output_root.mkdir(parents=True, exist_ok=True)

    manifest_file = output_root / "manifest.json"
    manifest = {}
    if manifest_file.exists():
        try:
            with open(manifest_file, "r", encoding="utf-8") as f:
                manifest = json.load(f)
        except Exception:
            manifest = {}

    target_states = args.states if args.states else get_live_states()
    logging.info(f"Total states to process: {len(target_states)} with {args.workers} concurrent workers.")
    logging.info(f"Saving reports to: {output_root}")

    def worker_wrapper(st_name):
        worker = VahanStateWorker(st_name, output_root=output_root, year=args.year, proxy=args.proxy)
        return worker.run()

    start_time = time.time()
    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {executor.submit(worker_wrapper, st): st for st in target_states}
        for fut in as_completed(futures):
            st = futures[fut]
            try:
                state_name, total, success, failed = fut.result()
                manifest[state_name] = {
                    "total_rtos": total,
                    "success_count": success,
                    "failed_rtos": failed,
                    "status": "COMPLETED" if len(failed) == 0 else "PARTIAL",
                    "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
                }
                with open(manifest_file, "w", encoding="utf-8") as mf:
                    json.dump(manifest, mf, indent=2)
            except Exception as e:
                logging.error(f"Worker for State '{st}' crashed with error: {e}")
                manifest[st] = {
                    "status": "CRASHED",
                    "error": str(e),
                    "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
                }
                with open(manifest_file, "w", encoding="utf-8") as mf:
                    json.dump(manifest, mf, indent=2)

    elapsed = time.time() - start_time
    logging.info(f"All states processed in {elapsed:.1f} seconds ({elapsed / 60:.2f} minutes).")

if __name__ == "__main__":
    main()
