import os
import time
import datetime
import traceback
import subprocess

# === LOGGING FUNCTION ===
def log(message):
    with open(r"C:\Users\Recap\OneDrive\Documents\Banana_Project\LogsToCsv\LogsToCsv.log", "a", encoding="utf-8") as f:
        f.write(f"[{datetime.datetime.now():%Y-%m-%d %H:%M:%S}] {message}\n")

log("🟢 Auto-convert service started successfully.")

# === PATH SETTINGS ===
watch_folder = r"C:\Users\Recap\My Drive (recaplaza40@gmail.com)\DJI_Flightlogs"
output_folder = r"C:\Users\Recap\OneDrive\Documents\Banana_Project\LogsToCsv\CSV_Logs"
parser_exe = r"C:\Users\Recap\OneDrive\Documents\Banana_Project\dji-log-parser\target\release\dji-log.exe"

# === INITIAL SETUP ===
os.makedirs(output_folder, exist_ok=True)
seen = set()

# === MAIN LOOP ===
while True:
    try:
        for f in os.listdir(watch_folder):
            if f.endswith(".txt") and f not in seen:
                txt_path = os.path.join(watch_folder, f)
                csv_path = os.path.join(output_folder, os.path.splitext(f)[0] + ".csv")

                log(f"📄 New flight log detected: {f}")

                # Run the Rust-based DJI Log Parser CLI
                result = subprocess.run(
                    [parser_exe, txt_path, "-c", csv_path],
                    capture_output=True,
                    text=True
                )

                if result.returncode == 0 and os.path.exists(csv_path):
                    log(f"✅ Successfully converted: {f} → {os.path.basename(csv_path)}")
                else:
                    log(f"❌ Conversion failed for {f}\n{result.stderr}")

                seen.add(f)

        time.sleep(5)

    except Exception:
        log(f"🚨 Unexpected error:\n{traceback.format_exc()}")
        time.sleep(10)
