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
try:
    print("Loading Vahan dashboard...")
    driver.get("https://vahan.parivahan.gov.in/vahan4dashboard/vahan/view/reportview.xhtml")
    time.sleep(5)
    
    def wait_for_ajax():
        WebDriverWait(driver, 20).until(
            lambda d: d.execute_script("return (!window.PrimeFaces || PrimeFaces.ajax.Queue.isEmpty()) && (!window.jQuery || jQuery.active === 0);")
        )

    # Click selectedYearType trigger and select 'Financial Year'
    print("Selecting Financial Year in selectedYearType...")
    trigger = driver.find_element(By.CSS_SELECTOR, "#selectedYearType .ui-selectonemenu-trigger, #selectedYearType label")
    driver.execute_script("arguments[0].click();", trigger)
    time.sleep(0.5)
    
    items = driver.find_elements(By.CSS_SELECTOR, "#selectedYearType_panel li.ui-selectonemenu-item")
    for it in items:
        txt = it.get_attribute("textContent").strip()
        if "Financial Year" in txt:
            driver.execute_script("arguments[0].click();", it)
            break
            
    wait_for_ajax()
    time.sleep(1)
    
    # Now check what options appear in selectedYear_input
    year_opts = driver.find_elements(By.CSS_SELECTOR, "#selectedYear_input option")
    opts = [o.get_attribute("textContent").strip() for o in year_opts]
    print(f"selectedYear options after selecting Financial Year: {opts}")
    
    # Also check what options appear in xaxisVar
    xaxis_opts = driver.find_elements(By.CSS_SELECTOR, "#xaxisVar_input option")
    print(f"xaxisVar options: {[o.get_attribute('textContent').strip() for o in xaxis_opts]}")
    
finally:
    driver.quit()
