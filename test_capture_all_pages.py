import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager

chrome_options = Options()
chrome_options.add_argument("--headless=new")
chrome_options.add_argument("--window-size=1680,1050")
chrome_options.add_argument("--disable-gpu")
chrome_options.add_argument("--no-sandbox")

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)

try:
    print("Navigating to dashboard...")
    driver.get("http://127.0.0.1:5173/")
    time.sleep(3)
    
    pages = [
        ("Overview", "rendered_overview.png"),
        ("Market Matrix", "rendered_market_matrix.png"),
        ("Regional Hub", "rendered_regional_hub.png"),
        ("Competitors", "rendered_competitors.png"),
        ("Dealer Network", "rendered_dealer_network.png"),
        ("Brand Hub", "rendered_brand_hub.png")
    ]
    
    for page_name, filename in pages:
        print(f"Clicking on {page_name}...")
        # Find button with text
        buttons = driver.find_elements(By.TAG_NAME, "button")
        clicked = False
        for b in buttons:
            if page_name in b.text:
                b.click()
                clicked = True
                break
        if not clicked:
            print(f"Could not find button for {page_name}")
        time.sleep(1.5)
        driver.save_screenshot(filename)
        print(f"Saved screenshot: {filename}")
        
    print("All pages successfully captured!")
finally:
    driver.quit()
