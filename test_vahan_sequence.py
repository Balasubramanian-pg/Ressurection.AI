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
        raise ValueError(f"Could not find '{target_prefix}' in '{dropdown_id}'")
    driver.execute_script("arguments[0].click();", matched)
    wait_for_ajax()
    time.sleep(0.5)

try:
    print("Loading Vahan...")
    driver.get("https://vahan.parivahan.gov.in/vahan4dashboard/vahan/view/reportview.xhtml")
    wait_for_ajax()
    
    # Let's inspect the exact initial state:
    for field in ["selectedYearType", "selectedYear", "yaxisVar", "xaxisVar"]:
        val = driver.find_element(By.CSS_SELECTOR, f"#{field} label").text
        print(f"Initial {field} label: '{val}'")
        
    # Order: Let's do xaxisVar first, then yaxisVar
    print("1. Setting xaxisVar to 'Month Wise'")
    select_pf_menu("xaxisVar", "Month Wise")
    print("2. Setting yaxisVar to 'Maker'")
    select_pf_menu("yaxisVar", "Maker")
    
    for field in ["selectedYearType", "selectedYear"]:
        val = driver.find_element(By.CSS_SELECTOR, f"#{field} label").text
        print(f"After axes setup, {field} label: '{val}'")
        
    print("3. Setting selectedYearType to 'Financial Year'")
    select_pf_menu("selectedYearType", "Financial Year")
    
    val = driver.find_element(By.CSS_SELECTOR, "#selectedYear label").text
    print(f"After YearType=Financial Year, selectedYear label: '{val}'")
    
    print("4. Setting selectedYear to '2024-2025'")
    select_pf_menu("selectedYear", "2024-2025")
    
    # Now check state
    state_div = driver.find_element(By.XPATH, "//div[contains(@id, 'j_idt') and .//label[contains(text(), 'Running States')]]")
    state_id = state_div.get_attribute("id")
    print(f"5. Setting state to Goa in {state_id}")
    select_pf_menu(state_id, "Goa")
    
    # Check RTOs
    rtos = driver.find_elements(By.CSS_SELECTOR, "#selectedRto_input option")
    rto_texts = [r.get_attribute("textContent").strip() for r in rtos if r.get_attribute("value") != "-1"]
    print(f"Goa RTOs found: {len(rto_texts)}, first: {rto_texts[0]}")
    
    print(f"6. Setting RTO to {rto_texts[0]}")
    select_pf_menu("selectedRto", rto_texts[0])
    
    print("7. Clicking Refresh")
    refresh_btn = driver.find_element(By.XPATH, "//button[.//span[contains(text(), 'Refresh') or contains(@class, 'ui-icon-refresh')]]")
    driver.execute_script("arguments[0].click();", refresh_btn)
    wait_for_ajax(30)
    time.sleep(2)
    
    # Check table
    tables = driver.find_elements(By.XPATH, "//div[contains(@id, 'groupingTable')]")
    print(f"Tables found: {len(tables)}")
    th_elements = driver.find_elements(By.XPATH, "//div[contains(@id, 'groupingTable')]//th")
    print(f"TH count: {len(th_elements)}")
    for th in th_elements[:15]:
        txt = th.text.strip()
        if txt:
            print(f"TH: {txt}")
            
    # Check export button
    xls_btns = driver.find_elements(By.XPATH, "//button[contains(@id, 'groupingTable:xls') or contains(@id, 'groupingTable:j_idt')]")
    print(f"XLS buttons: {len(xls_btns)}")
    for b in xls_btns:
        print(f"XLS btn id: {b.get_attribute('id')}")

finally:
    driver.quit()
