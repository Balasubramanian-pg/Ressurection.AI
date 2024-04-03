import time
import tempfile
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

temp_dir = Path(tempfile.mkdtemp(prefix="vahan_fy_test_"))
options = webdriver.ChromeOptions()
options.add_argument("--headless=new")
options.add_argument("--disable-gpu")
options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36")
options.add_experimental_option("prefs", {
    "download.default_directory": str(temp_dir),
    "download.prompt_for_download": False,
    "download.directory_upgrade": True,
    "safebrowsing.enabled": True,
})

driver = webdriver.Chrome(options=options)
driver.execute_cdp_cmd("Page.setDownloadBehavior", {
    "behavior": "allow",
    "downloadPath": str(temp_dir)
})

def wait_for_ajax(timeout=25):
    WebDriverWait(driver, timeout).until(
        lambda d: d.execute_script("return (!window.PrimeFaces || PrimeFaces.ajax.Queue.isEmpty()) && (!window.jQuery || jQuery.active === 0);")
    )

def select_pf_menu(dropdown_id: str, target_prefix: str, timeout: int = 15):
    trigger = WebDriverWait(driver, timeout).until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, f"#{dropdown_id} .ui-selectonemenu-trigger, #{dropdown_id} label"))
    )
    driver.execute_script("arguments[0].click();", trigger)
    time.sleep(0.3)
    items = driver.find_elements(By.CSS_SELECTOR, f"#{dropdown_id}_panel li.ui-selectonemenu-item")
    matched = None
    for it in items:
        text = it.get_attribute("textContent").strip()
        if text.startswith(target_prefix):
            matched = it
            break
    if not matched:
        raise ValueError(f"Could not find '{target_prefix}' in '{dropdown_id}'")
    driver.execute_script("arguments[0].click();", matched)
    wait_for_ajax()
    time.sleep(0.4)

try:
    print("Navigating to Vahan report...")
    driver.get("https://vahan.parivahan.gov.in/vahan4dashboard/vahan/view/reportview.xhtml")
    wait_for_ajax()
    
    # 1. Select Financial Year
    print("Selecting Financial Year...")
    select_pf_menu("selectedYearType", "Financial Year")
    
    # 2. Select 2024-2025
    print("Selecting 2024-2025 in selectedYear...")
    select_pf_menu("selectedYear", "2024-2025")
    
    # 3. Select Month Wise on X-Axis and Maker on Y-Axis
    print("Selecting Month Wise & Maker...")
    select_pf_menu("xaxisVar", "Month Wise")
    select_pf_menu("yaxisVar", "Maker")
    
    # 4. Select Goa state
    state_div = driver.find_element(By.XPATH, "//div[contains(@id, 'j_idt') and .//label[contains(text(), 'Running States')]]")
    state_id = state_div.get_attribute("id")
    print(f"Selecting Goa in {state_id}...")
    select_pf_menu(state_id, "Goa")
    time.sleep(1)
    
    # 5. Select first RTO
    rto_options = driver.find_elements(By.CSS_SELECTOR, "#selectedRto_input option")
    first_rto = None
    for o in rto_options:
        v = o.get_attribute("value")
        t = o.get_attribute("textContent").strip()
        if v != "-1" and "All Vahan" not in t:
            first_rto = t
            break
            
    print(f"Selecting RTO: {first_rto}...")
    select_pf_menu("selectedRto", first_rto)
    
    # 6. Click Refresh
    refresh_btn = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//button[.//span[contains(text(), 'Refresh') or contains(@class, 'ui-icon-refresh')]]"))
    )
    driver.execute_script("arguments[0].click();", refresh_btn)
    wait_for_ajax(timeout=30)
    time.sleep(1)
    
    # 7. Check columns of table
    th_elements = driver.find_elements(By.XPATH, "//div[contains(@id, 'groupingTable')]//thead//th")
    headers = [th.text.strip() for th in th_elements if th.text.strip()]
    print(f"Table columns: {headers}")
    
    # 8. Click Excel download
    excel_btn = driver.find_element(By.XPATH, "//button[contains(@id, 'groupingTable:xls') or contains(@id, 'groupingTable:j_idt')]")
    driver.execute_script("arguments[0].click();", excel_btn)
    time.sleep(3)
    
    downloaded = list(temp_dir.glob("*.xlsx"))
    print(f"Downloaded files: {downloaded}")
    if downloaded:
        print(f"File size: {downloaded[0].stat().st_size} bytes")
        
finally:
    driver.quit()
