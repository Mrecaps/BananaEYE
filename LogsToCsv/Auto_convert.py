import os
import subprocess
import time
import datetime
import traceback

# === LOGGING FUNCTION ===
def log(message):
    with open(r"C:\Users\Recap\OneDrive\Documents\Banana_Project\LogsToCsv\LogsToCsv.log", "a", encoding="utf-8") as f:
        f.write(f"[{datetime.datetime.now():%Y-%m-%d %H:%M:%S}] {message}\n")

log("🟢 Auto convert service started successfully.")

# === PATH SETTINGS ===
watch_folder = r"C:\Users\Recap\My Drive (recaplaza40@gmail.com)\DJI_Flightlogs"
converter = r"C:\Users\Recap\OneDrive\Documents\Banana_Project\LogsToCsv\TXTlogToCSVTool.exe"
output_folder = r"C:\Users\Recap\OneDrive\Documents\Banana_Project\LogsToCsv\CSV_Logs"

# === INITIAL SETUP ===
os.makedirs(output_folder, exist_ok=True)
seen = set(os.listdir(watch_folder))

# === MAIN LOOP ===
while True:
    try:
        for f in os.listdir(watch_folder):
            if f.endswith(".txt") and f not in seen:
                txt_path = os.path.join(watch_folder, f)
                log(f"📄 New flight log detected: {f}")

                # Run converter silently
                result = subprocess.run(
                    [converter, txt_path],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )

                if result.returncode == 0:
                    csv_name = os.path.splitext(f)[0] + ".csv"
                    csv_path = os.path.join(watch_folder, csv_name)
                    dest_csv = os.path.join(output_folder, csv_name)

                    if os.path.exists(csv_path):
                        os.replace(csv_path, dest_csv)
                        log(f"✅ Converted and moved: {csv_name}")
                    else:
                        log(f"⚠️ Conversion finished but CSV not found: {csv_name}")
                else:
                    log(f"❌ Converter error on {f}: {result.stderr.strip()}")

                seen.add(f)

        time.sleep(5)

    except Exception as e:
        log(f"🚨 Unexpected error: {traceback.format_exc()}")
        time.sleep(10)
