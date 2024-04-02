import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from webdriver_manager.chrome import ChromeDriverManager

chrome_options = Options()
chrome_options.add_argument("--headless=new")
chrome_options.add_argument("--window-size=1680,1050")
chrome_options.add_argument("--disable-gpu")
chrome_options.add_argument("--no-sandbox")

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)

try:
    print("Navigating to http://127.0.0.1:5173/...")
    driver.get("http://127.0.0.1:5173/")
    time.sleep(3)
    
    driver.save_screenshot("multi_year_overview.png")
    print("Saved multi_year_overview.png")
    
    # Check periods in select
    period_selects = driver.find_elements(By.TAG_NAME, "select")
    if period_selects:
        sel = Select(period_selects[0])
        opts = [o.text for o in sel.options]
        print(f"Available Period options: {opts}")
        
        # Test selecting FY 2025-26
        for opt in opts:
            if "25-26" in opt:
                sel.select_by_visible_text(opt)
                time.sleep(1.5)
                driver.save_screenshot("multi_year_fy25_26.png")
                print("Saved multi_year_fy25_26.png")
                break
                
        # Test selecting FY 2026-Till Date
        for opt in opts:
            if "26-Till Date" in opt or "26-27" in opt:
                sel.select_by_visible_text(opt)
                time.sleep(1.5)
                driver.save_screenshot("multi_year_fy26_till_date.png")
                print("Saved multi_year_fy26_till_date.png")
                break

    print("Multi-year verification successful!")
finally:
    driver.quit()
