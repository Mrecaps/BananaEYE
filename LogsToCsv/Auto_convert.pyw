import os
import time
import datetime
import traceback
import subprocess

# === PATH SETTINGS ===
LOG_FILE = r"C:\Users\Recap\OneDrive\Documents\Banana_Project\#Console_Logs\LogsToCsv.log"
WATCH_FOLDER = r"C:\Users\Recap\My Drive (bananaeyeproject@gmail.com)\Dji_Flightlogs"
OUTPUT_FOLDER = r"C:\Users\Recap\OneDrive\Documents\Banana_Project\LogsToCsv\CSV_Logs"
PARSER_EXE = r"C:\Users\Recap\OneDrive\Documents\Banana_Project\dji-log-parser\target\release\dji-log.exe"

# === LOG SETUP ===
os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
open(LOG_FILE, "w").close()

def log(message: str):
    """Write a timestamped message to the log file."""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(f"[{timestamp}] {message}\n")
    print(message)  # optional: see logs in console if run manually

log("🟢 Auto_convert has started successfully.")

# === INITIAL SETUP ===
os.makedirs(OUTPUT_FOLDER, exist_ok=True)
seen = {}  # track processed files

# === MAIN LOOP ===
last_wait_log = 0  # timestamp of last "waiting" log

while True:
    try:
        now = time.time()
        new_files_found = False

        for f in os.listdir(WATCH_FOLDER):
            if not f.lower().endswith(".txt"):
                continue
            if f.startswith("~$") or f.endswith(".tmp"):
                continue

            txt_path = os.path.join(WATCH_FOLDER, f)
            csv_path = os.path.join(OUTPUT_FOLDER, os.path.splitext(f)[0] + ".csv")

            # skip if file is still being written (cloud sync or incomplete)
            try:
                size_now = os.path.getsize(txt_path)
                time.sleep(0.5)
                if size_now != os.path.getsize(txt_path):
                    continue
            except FileNotFoundError:
                continue

            mtime = os.path.getmtime(txt_path)

            if f not in seen or seen[f] != mtime:
                new_files_found = True
                log(f"📄 New or updated flight log detected: {f}")

                result = subprocess.run(
                    [PARSER_EXE, txt_path, "-c", csv_path],
                    capture_output=True,
                    text=True
                )

                if result.returncode == 0 and os.path.exists(csv_path):
                    log(f"✅ Successfully converted: {f} → {os.path.basename(csv_path)}")
                else:
                    log(f"❌ Conversion failed for {f}\n{result.stderr}")

                seen[f] = mtime

        # --- heartbeat log every 10 seconds ---
        if now - last_wait_log >= 10:
            log("⏳ Waiting for new files...")
            last_wait_log = now

        time.sleep(5)

    except Exception:
        log(f"🚨 Unexpected error:\n{traceback.format_exc()}")
        time.sleep(10)
