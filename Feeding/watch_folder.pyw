import logging
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import time
import requests
from pathlib import Path
import shutil
import os

API_URL = "http://127.0.0.1:8000/predict_folder"
BASE_PATH = Path(r"C:\Users\Recap\OneDrive\Documents\Banana_Project\Geotag_images\Geotagged")
LOG_FILE = Path(r"C:\Users\Recap\OneDrive\Documents\Banana_Project\#Console_Logs\Feeding.log")


def setup_logging():
    """Delete old log file and create a new one."""
    if LOG_FILE.exists():
        LOG_FILE.unlink()
    logging.basicConfig(
        filename=LOG_FILE,
        level=logging.INFO,
        format="%(asctime)s - %(levelname)s - %(message)s",
    )
    logging.info("==== Folder Watcher Started ====")


class FolderHandler(FileSystemEventHandler):
    def on_created(self, event):
        if event.is_directory:
            folder_path = Path(event.src_path)
            folder_name = folder_path.name
            if folder_name.startswith('B') and folder_name[1:].isdigit():
                logging.info(f"Detected new folder: {folder_name}")
                self.process_folder(folder_path)

    def process_folder(self, folder_path: Path):
        folder_name = folder_path.name
        payload = {"folder_name": folder_name}
        try:
            response = requests.post(API_URL, json=payload)
            result = response.json()

            if "status" in result:
                status_emoji = "🔴" if result['status'] == 'infected' else "🟢"
                logging.info(f"AI Result for {folder_name}: {result['status'].upper()} {status_emoji}")
                logging.info(f"Plantation ID: {result.get('plantation_id', 'N/A')}")
                logging.info(f"Plantation Name: {result.get('plantation_name', 'N/A')}")
                logging.info(f"Images processed: {result['total_images']}")
                logging.info(f"Images saved: {result.get('images_saved', 0)}")
                logging.info(f"Infection found: {'YES' if result['status'] == 'infected' else 'NO'}")
                logging.info(f"MongoDB updated: {result.get('mongodb_updated', False)}")
                logging.info(f"Plantation found: {result.get('plantation_found', False)}")
                logging.info("="*40)
            else:
                logging.error(f"API Error for {folder_name}: {result}")

            # Delete folder after processing
            shutil.rmtree(folder_path)
            logging.info(f"Deleted processed folder: {folder_name}")

        except Exception as e:
            logging.error(f"Error processing {folder_name}: {e}")


def process_existing_folders(handler: FolderHandler):
    """Process any existing folders in BASE_PATH at startup."""
    for folder_path in BASE_PATH.iterdir():
        if folder_path.is_dir() and folder_path.name.startswith('B') and folder_path.name[1:].isdigit():
            logging.info(f"Processing existing folder at startup: {folder_path.name}")
            handler.process_folder(folder_path)


if __name__ == "__main__":
    # Ensure BASE_PATH exists
    BASE_PATH.mkdir(parents=True, exist_ok=True)

    setup_logging()

    event_handler = FolderHandler()
    observer = Observer()
    observer.schedule(event_handler, str(BASE_PATH), recursive=False)
    observer.start()

    logging.info(f"Watching for new folders in: {BASE_PATH}")
    logging.info(f"API Endpoint: {API_URL}")

    # Process any pre-existing folders
    process_existing_folders(event_handler)

    try:
        counter = 0
        while True:
            time.sleep(1)
            counter += 1
            if counter >= 10:  # log every 10 seconds
                logging.info("Waiting for new folder to appear...")
                counter = 0
    except KeyboardInterrupt:
        observer.stop()
        logging.info("Watchdog stopped by user")
    observer.join()
