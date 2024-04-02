import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

options = webdriver.ChromeOptions()
options.add_argument("--headless=new")
options.add_argument("--disable-gpu")
options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36")

driver = webdriver.Chrome(options=options)
try:
    print("Loading Vahan dashboard...")
    driver.get("https://vahan.parivahan.gov.in/vahan4dashboard/vahan/view/reportview.xhtml")
    time.sleep(5)
    
    # Check all select / dropdown elements on the page
    selects = driver.find_elements(By.TAG_NAME, "select")
    for s in selects:
        sid = s.get_attribute("id")
        options = s.find_elements(By.TAG_NAME, "option")
        opt_texts = [o.get_attribute("textContent").strip() for o in options]
        print(f"Dropdown ID: {sid} -> Options: {opt_texts[:15]}")
        
    # Also check if there is a 'Year Type' or 'Financial Year' toggle or radio button!
    radios = driver.find_elements(By.CSS_SELECTOR, "input[type='radio']")
    for r in radios:
        print(f"Radio: id={r.get_attribute('id')}, name={r.get_attribute('name')}, val={r.get_attribute('value')}")
finally:
    driver.quit()
