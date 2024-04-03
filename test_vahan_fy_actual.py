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
    
    # 1. State: Goa
    state_div = driver.find_element(By.XPATH, "//div[contains(@id, 'j_idt') and .//label[contains(text(), 'Running States')]]")
    state_id = state_div.get_attribute("id")
    select_pf_menu(state_id, "Goa")
    
    # 2. RTO: South Goa
    rto_options = driver.find_elements(By.CSS_SELECTOR, "#selectedRto_input option")
    for o in rto_options:
        t = o.get_attribute("textContent").strip()
        v = o.get_attribute("value")
        if v != "-1" and "SOUTH GOA" in t:
            select_pf_menu("selectedRto", t)
            break
            
    # 3. Y-Axis: Maker
    select_pf_menu("yaxisVar", "Maker")
    
    # 4. X-Axis: Month Wise
    select_pf_menu("xaxisVar", "Month Wise")
    
    # 5. Year Type: Financial Year
    print("Selecting Financial Year...")
    select_pf_menu("selectedYearType", "Financial Year")
    
    # 6. Selected Year: 2024-2025
    print("Selecting 2024-2025...")
    select_pf_menu("selectedYear", "2024-2025")
    
    print("Clicking refresh...")
    refresh_btn = driver.find_element(By.XPATH, "//button[.//span[contains(text(), 'Refresh') or contains(@class, 'ui-icon-refresh')]]")
    driver.execute_script("arguments[0].click();", refresh_btn)
    wait_for_ajax(30)
    time.sleep(2)
    
    th_elements = driver.find_elements(By.XPATH, "//div[contains(@id, 'groupingTable')]//thead//th")
    headers = [th.text.strip() for th in th_elements if th.text.strip()]
    print(f"Headers: {headers}")
    
    excel_btn = driver.find_elements(By.XPATH, "//a[contains(@id, 'xls') or contains(@id, 'excel') or .//span[contains(@class, 'excel')]] | //button[contains(@id, 'xls') or .//span[contains(@class, 'excel')]]")
    print(f"Excel btn elements found: {len(excel_btn)}")
    for b in excel_btn:
        print(f"Tag: {b.tag_name}, id: {b.get_attribute('id')}, class: {b.get_attribute('class')}")

finally:
    driver.quit()
