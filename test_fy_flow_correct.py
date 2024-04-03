import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

options = webdriver.ChromeOptions()
options.add_argument("--headless=new")
options.add_argument("--disable-gpu")
options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36")

driver = webdriver.Chrome(options=options)

def wait_for_ajax(timeout=25):
    WebDriverWait(driver, timeout).until(
        lambda d: d.execute_script("return (!window.PrimeFaces || PrimeFaces.ajax.Queue.isEmpty()) && (!window.jQuery || jQuery.active === 0);")
    )

def select_pf_menu(dropdown_id: str, target_prefix: str, timeout: int = 15):
    trigger = WebDriverWait(driver, timeout).until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, f"#{dropdown_id} .ui-selectonemenu-trigger, #{dropdown_id} label"))
    )
    driver.execute_script("arguments[0].click();", trigger)
    time.sleep(0.4)
    items = driver.find_elements(By.CSS_SELECTOR, f"#{dropdown_id}_panel li.ui-selectonemenu-item")
    matched = None
    for it in items:
        text = it.get_attribute("textContent").strip()
        if text.startswith(target_prefix):
            matched = it
            break
    if not matched:
        all_opts = [it.get_attribute("textContent").strip() for it in items]
        raise ValueError(f"Could not find '{target_prefix}' in '{dropdown_id}'. Available: {all_opts}")
    driver.execute_script("arguments[0].click();", matched)
    wait_for_ajax()
    time.sleep(0.5)

try:
    driver.get("https://vahan.parivahan.gov.in/vahan4dashboard/vahan/view/reportview.xhtml")
    wait_for_ajax()
    
    print("1. Selecting selectedYearType = Financial Year")
    select_pf_menu("selectedYearType", "Financial Year")
    
    print("2. Checking options in selectedYear:")
    year_items = driver.find_elements(By.CSS_SELECTOR, "#selectedYear_panel li.ui-selectonemenu-item")
    print([it.get_attribute("textContent").strip() for it in year_items[:10]])
    
    print("3. Selecting selectedYear = 2024-2025")
    select_pf_menu("selectedYear", "2024-2025")
    
    print("4. Selecting yaxisVar = Maker")
    select_pf_menu("yaxisVar", "Maker")
    
    print("5. Selecting xaxisVar = Month Wise")
    select_pf_menu("xaxisVar", "Month Wise")
    
    print("6. Checking state dropdown...")
    state_div = driver.find_element(By.XPATH, "//div[contains(@id, 'j_idt') and .//label[contains(text(), 'Running States')]]")
    state_id = state_div.get_attribute("id")
    select_pf_menu(state_id, "Goa")
    
    print("7. Selecting Goa RTO...")
    rto_options = driver.find_elements(By.CSS_SELECTOR, "#selectedRto_input option")
    first_rto = [o.get_attribute("textContent").strip() for o in rto_options if o.get_attribute("value") != "-1"][0]
    select_pf_menu("selectedRto", first_rto)
    
    print("8. Clicking refresh...")
    refresh_btn = driver.find_element(By.XPATH, "//button[.//span[contains(text(), 'Refresh') or contains(@class, 'ui-icon-refresh')]]")
    driver.execute_script("arguments[0].click();", refresh_btn)
    wait_for_ajax(30)
    time.sleep(2)
    
    # Check headers
    th_elements = driver.find_elements(By.XPATH, "//div[contains(@id, 'groupingTable')]//thead//th")
    print(f"Table headers: {[th.text.strip() for th in th_elements if th.text.strip()]}")
    
    # Check if download xls button is present
    xls_btn = driver.find_element(By.XPATH, "//button[contains(@id, 'groupingTable:xls') or contains(@id, 'groupingTable:j_idt')]")
    print(f"XLS button found: {xls_btn.get_attribute('id')}")

finally:
    driver.quit()
