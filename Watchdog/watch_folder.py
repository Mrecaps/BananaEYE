from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import time
import requests
from pathlib import Path

API_URL = "http://127.0.0.1:8000/predict_folder"
BASE_PATH = Path(r"C:\Users\Recap\OneDrive\Documents\Banana_Project\Geotag_images\Geotagged")

class FolderHandler(FileSystemEventHandler):
    def on_created(self, event):
        if event.is_directory:
            folder_name = Path(event.src_path).name
            
            # Only process B1-B20 folders
            if folder_name.startswith('B') and folder_name[1:].isdigit():
                folder_num = int(folder_name[1:])
                if 1 <= folder_num <= 20:
                    print(f"📁 New folder detected: {folder_name}")
                    print(f"   📍 Extracted Plantation ID: {folder_name[1:]}")
                    self.process_folder(folder_name)

    def process_folder(self, folder_name):
        """Send folder to AI and update MongoDB"""
        payload = {"folder_name": folder_name}
        try:
            response = requests.post(API_URL, json=payload)
            result = response.json()
            
            if "status" in result:
                status_emoji = "🔴" if result['status'] == 'infected' else "🟢"
                print(f"✅ {status_emoji} AI Result for {folder_name}: {result['status'].upper()}")
                print(f"   🆔 Plantation ID: {result.get('plantation_id', 'N/A')}")
                print(f"   📛 Plantation Name: {result.get('plantation_name', 'N/A')}")
                print(f"   📊 Images processed: {result['total_images']}")
                print(f"   🔍 Infection found: {'YES' if result['status'] == 'infected' else 'NO'}")
                print(f"   💾 MongoDB updated: {result.get('mongodb_updated', False)}")
                print(f"   📍 Plantation found: {result.get('plantation_found', False)}")
                print("   " + "="*40)
            else:
                print(f"❌ API Error for {folder_name}: {result}")
                
        except Exception as e:
            print(f"❌ Error processing {folder_name}: {e}")

if __name__ == "__main__":
    event_handler = FolderHandler()
    observer = Observer()
    observer.schedule(event_handler, str(BASE_PATH), recursive=False)
    observer.start()
    
    print("👀 Watching for new plantation folders B1-B20...")
    print("📍 Monitoring:", BASE_PATH)
    print("🌐 API Endpoint:", API_URL)
    print("🗄️  MongoDB Plantation IDs: 1-20")
    print("=" * 50)

    try:
        while True:
            time.sleep(2)
    except KeyboardInterrupt:
        observer.stop()
        print("\n🛑 Watchdog stopped")
    observer.join()