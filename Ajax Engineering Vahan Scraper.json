from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from datetime import datetime
import logging
import time
import json
import os
import re
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('vahan_scraper.log'),
        logging.StreamHandler()
    ]
)

class VahanScraper:
    def __init__(self, chrome_binary_path):
        self.chrome_binary_path = chrome_binary_path
        self.driver = None
        self.wait = None
        self.current_state_index = 0
        self.current_rto_index = 0
        
        # Set base download path
        self.base_download_path = r"C:\Users\ASUS\OneDrive\Documents\Ajax Reports"
        if not os.path.exists(self.base_download_path):
            os.makedirs(self.base_download_path)

        # Create date folder
        self.current_date = datetime.now().strftime("%d-%m-%Y")
        self.date_folder = os.path.join(self.base_download_path, self.current_date)
        if not os.path.exists(self.date_folder):
            os.makedirs(self.date_folder)

        # Initialize the driver
        self.setup_driver()
        
        # Create/load progress file
        self.progress_file = 'scraping_progress.json'
        if os.path.exists(self.progress_file):
            # Ask if user wants to continue from last session
            user_input = input("Previous progress file found. Continue from last session? (y/n): ")
            if user_input.lower() != 'y':
                os.remove(self.progress_file)
        self.load_progress()

    def load_progress(self):
        """Load progress from file if it exists"""
        if os.path.exists(self.progress_file):
            with open(self.progress_file, 'r') as f:
                self.progress = json.load(f)
                self.current_state_index = int(self.progress.get('current_state_index', 0))
                self.current_rto_index = int(self.progress.get('current_rto_index', 0))
        else:
            self.progress = {
                'current_state_index': 0,
                'current_rto_index': 0,
                'completed_states': {},
            }

    def save_progress(self):
        """Save progress to file"""
        self.progress['current_state_index'] = self.current_state_index
        self.progress['current_rto_index'] = self.current_rto_index
        with open(self.progress_file, 'w') as f:
            json.dump(self.progress, f)

    def setup_driver(self):
        """Initialize Chrome driver with appropriate options"""
        chrome_options = webdriver.ChromeOptions()
        chrome_options.binary_location = self.chrome_binary_path
        chrome_options.add_argument('--start-maximized')
        chrome_options.add_argument('--disable-popup-blocking')
        chrome_options.add_argument('--disable-notifications')
        
        # Set download directory
        chrome_options.add_experimental_option('prefs', {
            'download.default_directory': self.date_folder,
            'download.prompt_for_download': False,
            'download.directory_upgrade': True,
            'safebrowsing.enabled': True,
        })
        
        self.driver = webdriver.Chrome(options=chrome_options)
        self.wait = WebDriverWait(self.driver, 30)
        self.actions = ActionChains(self.driver)

    def select_primefaces_dropdown(self, dropdown_id, option_text, max_retries=3):
        """Handle PrimeFaces dropdown selection with retries"""
        for attempt in range(max_retries):
            try:
                # Get current selected value
                current_value = self.driver.find_element(By.CSS_SELECTOR, f"#{dropdown_id}_label").text.strip()
                if current_value == option_text:
                    logging.info(f"'{option_text}' is already selected in dropdown '{dropdown_id}'")
                    return True

                trigger = self.wait.until(EC.element_to_be_clickable(
                    (By.CSS_SELECTOR, f"#{dropdown_id} .ui-selectonemenu-trigger")
                ))
                self.driver.execute_script("arguments[0].click();", trigger)
                time.sleep(1)

                option_xpath = f"//li[contains(@class, 'ui-selectonemenu-item') and text()='{option_text}']"
                option = self.wait.until(EC.element_to_be_clickable((By.XPATH, option_xpath)))
                self.driver.execute_script("arguments[0].click();", option)
                time.sleep(1)
                
                logging.info(f"Selected '{option_text}' from dropdown '{dropdown_id}'")
                return True
            except Exception as e:
                if attempt == max_retries - 1:
                    logging.error(f"Error selecting '{option_text}' from PrimeFaces dropdown '{dropdown_id}': {str(e)}")
                    return False
                logging.warning(f"Retry {attempt + 1} for dropdown '{dropdown_id}'")
                time.sleep(2)

    def initialize_filters(self):
        """Initialize all dropdown filters"""
        try:
            # Set X-axis to "Month Wise"
            if not self.select_primefaces_dropdown('xaxisVar', 'Month Wise'):
                raise Exception("Failed to set X-axis to Month Wise")
            time.sleep(2)

            # Set Y-axis to "Maker"
            if not self.select_primefaces_dropdown('yaxisVar', 'Maker'):
                raise Exception("Failed to set Y-axis to Maker")
            time.sleep(2)

            # Set year to 2024
            if not self.select_primefaces_dropdown('selectedYear', '2024'):
                raise Exception("Failed to set Year to 2024")
            time.sleep(2)

            return True
        except Exception as e:
            logging.error(f"Error initializing filters: {str(e)}")
            return False

    def sanitize_filename(self, filename):
        """Sanitize filename by removing/replacing invalid characters"""
        # Remove or replace invalid characters
        invalid_chars = '<>:"/\\|?*'
        for char in invalid_chars:
            filename = filename.replace(char, '_')
        
        # Remove parenthetical numbers (e.g., "(123)")
        filename = re.sub(r'\s*\([^)]*\)', '', filename)
        
        # Remove extra spaces and trim
        filename = ' '.join(filename.split())
        return filename.strip()

    def wait_for_download_complete(self, timeout=30):
        """Wait for the download to complete by checking if the file is no longer being written"""
        start_time = time.time()
        while True:
            # Check if any .crdownload files exist (Chrome's temporary download files)
            if not any(f.endswith('.crdownload') for f in os.listdir(self.date_folder)):
                break
            if time.time() - start_time > timeout:
                raise Exception("Download timed out")
            time.sleep(1)

    def move_file_to_state_folder(self, rto_name, state):
        """Move the downloaded file to the state folder and rename it"""
        try:
            self.wait_for_download_complete()

            # Get the most recent Excel file
            files = [f for f in os.listdir(self.date_folder) if f.endswith('.xlsx')]
            if not files:
                raise FileNotFoundError("No Excel files found in download directory")

            latest_file = max(
                [os.path.join(self.date_folder, f) for f in files],
                key=os.path.getmtime
            )

            # Create state folder with sanitized name
            sanitized_state = self.sanitize_filename(state)
            state_folder = os.path.join(self.date_folder, sanitized_state)
            os.makedirs(state_folder, exist_ok=True)

            # Create sanitized RTO filename
            sanitized_rto = self.sanitize_filename(rto_name)
            new_filename = f"{sanitized_rto}.xlsx"
            new_filepath = os.path.join(state_folder, new_filename)

            # Handle duplicate filenames
            counter = 1
            while os.path.exists(new_filepath):
                new_filename = f"{sanitized_rto}_{counter}.xlsx"
                new_filepath = os.path.join(state_folder, new_filename)
                counter += 1

            # Move and rename file
            os.rename(latest_file, new_filepath)
            logging.info(f"Successfully moved file to: {new_filepath}")
            return True

        except Exception as e:
            logging.error(f"Error in move_file_to_state_folder: {str(e)}")
            return False

    def process_state(self, state):
        """Process a single state and its RTOs"""
        success = False
        try:
            # Select the state
            if not self.select_primefaces_dropdown('j_idt40', state):
                raise Exception(f"Failed to select state: {state}")
            time.sleep(4)  # Reduced delay

            # Open the RTO dropdown
            rto_dropdown_id = 'selectedRto'
            trigger = self.wait.until(EC.element_to_be_clickable(
                (By.CSS_SELECTOR, f"#{rto_dropdown_id} .ui-selectonemenu-trigger")
            ))
            self.driver.execute_script("arguments[0].click();", trigger)
            time.sleep(1)

            # Get all RTO options
            rto_options = self.driver.find_elements(By.CSS_SELECTOR, f"#{rto_dropdown_id}_items .ui-selectonemenu-item")

            # Loop through each RTO option starting from the current RTO index
            for i in range(self.current_rto_index, len(rto_options)):
                rto_option = rto_options[i]
                rto_text = rto_option.text

                if "All Vahan4 Running Office" in rto_text:
                    logging.info(f"Skipping RTO: {rto_text}")
                    continue

                try:
                    # Select the RTO
                    self.driver.execute_script("arguments[0].click();", rto_option)
                    time.sleep(2)

                    # Refresh the data
                    refresh_button = self.wait.until(EC.presence_of_element_located((By.ID, 'j_idt70')))
                    self.driver.execute_script("arguments[0].click();", refresh_button)
                    time.sleep(4)

                    # Download the Excel file
                    download_button = self.wait.until(EC.presence_of_element_located(
                        (By.ID, 'groupingTable:j_idt85')
                    ))
                    self.driver.execute_script("arguments[0].click();", download_button)
                    time.sleep(4)

                    # Move and rename the downloaded file
                    if not self.move_file_to_state_folder(rto_text, state):
                        raise Exception("Failed to move downloaded file")

                    # Update progress
                    self.current_rto_index = i + 1
                    self.save_progress()
                    logging.info(f"Successfully processed RTO: {rto_text} in state: {state}")

                except Exception as e:
                    logging.error(f"Error processing RTO {rto_text}: {str(e)}")
                    continue

            # Successfully processed all RTOs
            success = True
            return success

        except Exception as e:
            logging.error(f"Error processing state {state}: {str(e)}")
            return success

    def scrape_data(self):
        """Main scraping method with recovery mechanism"""
        states_ut = [
            'Andaman & Nicobar Island(3)',
            'Andhra Pradesh(83)',
            'Arunachal Pradesh(27)',
            'Assam(33)',
            'Bihar(48)',
            'Chhattisgarh(30)',
            'Chandigarh(1)',
            'UT of DNH and DD(3)',
            'Delhi(16)',
            'Goa(13)',
            'Gujarat(37)',
            'Himachal Pradesh(96)',
            'Haryana(98)',
            'Jharkhand(25)',
            'Jammu and Kashmir(21)',
            'Karnataka(68)',
            'Kerala(87)',
            'Ladakh(3)',
            'Lakshadweep(4)',
            'Maharashtra(56)',
            'Meghalaya(13)',
            'Manipur(12)',
            'Madhya Pradesh(53)',
            'Mizoram(10)',
            'Nagaland(9)',
            'Odisha(39)',
            'Punjab(96)',
            'Puducherry(8)',
            'Rajasthan(59)',
            'Sikkim(9)',
            'Tamil Nadu(148)',
            'Tripura(9)',
            'Uttarakhand(21)',
            'Uttar Pradesh(77)',
            'West Bengal(57)'
        ]

        max_retries = 3
        retry_delay = 60  # seconds

        while self.current_state_index < len(states_ut):
            try:
                # Start new session
                self.setup_driver()
                self.driver.get('https://vahan.parivahan.gov.in/vahan4dashboard/vahan/view/reportview.xhtml')
                time.sleep(4)

                # Initialize filters
                if not self.initialize_filters():
                    raise Exception("Failed to initialize filters")

                # Process the current state
                state = states_ut[self.current_state_index]
                if self.process_state(state):
                    # Update progress only after successful completion
                    self.progress['completed_states'][state] = True
                    self.current_state_index += 1
                    self.current_rto_index = 0  # Reset RTO index for next state
                    self.save_progress()
                    logging.info(f"Successfully completed state: {state}")
                else:
                    raise Exception(f"Failed to process state: {state}")

            except Exception as e:
                logging.error(f"Session error: {str(e)}")
                
                retry_count = self.progress.get(f'retry_count_{self.current_state_index}', 0) + 1
                self.progress[f'retry_count_{self.current_state_index}'] = retry_count
                
                if retry_count >= max_retries:
                    logging.error(f"Skipping state {states_ut[self.current_state_index]} after {max_retries} failures")
                    self.current_state_index += 1
                    self.current_rto_index = 0
                
                self.save_progress()
                
                logging.info(f"Waiting {retry_delay} seconds before retrying...")
                time.sleep(retry_delay)

            finally:
                if self.driver:
                    try:
                        self.driver.quit()
                    except:
                        pass

        logging.info("Scraping completed!")

if __name__ == "__main__":
    try:
        chrome_path = r"C:/Program Files (x86)/chrome-win64/chrome.exe"
        if not os.path.exists(chrome_path):
            raise FileNotFoundError(f"Chrome binary not found at: {chrome_path}")
        
        scraper = VahanScraper(chrome_path)
        scraper.scrape_data()
    except Exception as e:
        logging.critical(f"Fatal error: {str(e)}")
        sys.exit(1)