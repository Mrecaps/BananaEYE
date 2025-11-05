import os
import time
import datetime
import pandas as pd
import pyexiv2
import traceback

# === CONFIGURATION ===
CSV_FOLDER = r"C:\Users\Recap\OneDrive\Documents\Banana_Project\LogsToCsv\CSV_Logs"
IMAGE_FOLDER = r"D:\DCIM\102MEDIA"
OUTPUT_FOLDER = r"C:\Users\Recap\OneDrive\Documents\Banana_Project\Geotag_images\Geotagged"
LOG_FILE = r"C:\Users\Recap\OneDrive\Documents\Banana_Project\Geotag_images\auto_geotag.log"

os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# === LOGGING ===
def log(message):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(f"[{timestamp}] {message}\n")
    print(message)  # For debug only (invisible when .pyw)

log("🟢 Geotag service started successfully.")

# === HELPER FUNCTIONS ===
def find_nearest_time(df, target_time):
    """Finds the row in df['timestamp'] closest to target_time."""
    diffs = (df['timestamp'] - target_time).abs()
    return df.loc[diffs.idxmin()]

def extract_datetime(metadata):
    """Safely extracts datetime from EXIF metadata."""
    try:
        exif_time = metadata["Exif.Image.DateTime"].value
        if isinstance(exif_time, datetime.datetime):
            return exif_time
        else:
            return datetime.datetime.strptime(str(exif_time), "%Y:%m:%d %H:%M:%S")
    except Exception:
        return None

# === INITIAL STATE ===
seen = set(os.listdir(IMAGE_FOLDER))

# === MAIN LOOP ===
while True:
    try:
        for filename in os.listdir(IMAGE_FOLDER):
            if not filename.lower().endswith((".jpg", ".jpeg")) or filename in seen:
                continue

            img_path = os.path.join(IMAGE_FOLDER, filename)
            seen.add(filename)

            try:
                # Read image metadata
                metadata = pyexiv2.ImageMetadata(img_path)
                metadata.read()
                img_time = extract_datetime(metadata)

                if not img_time:
                    log(f"⚠️ No EXIF timestamp found in {filename}")
                    continue

                # Search all CSV files for nearest GPS data
                csv_files = [f for f in os.listdir(CSV_FOLDER) if f.endswith(".csv")]
                if not csv_files:
                    log(f"⚠️ No CSV logs available for {filename}")
                    continue

                best_match, best_diff = None, datetime.timedelta(seconds=9999)
                best_lat, best_lon = None, None

                for csv_file in csv_files:
                    csv_path = os.path.join(CSV_FOLDER, csv_file)
                    try:
                        df = pd.read_csv(csv_path)
                        if {'Latitude', 'Longitude', 'Timestamp'}.issubset(df.columns):
                            df['timestamp'] = pd.to_datetime(df['Timestamp'], errors='coerce')
                            row = find_nearest_time(df.dropna(subset=['timestamp']), img_time)
                            diff = abs(row['timestamp'] - img_time)

                            if diff < best_diff:
                                best_diff = diff
                                best_lat, best_lon = row['Latitude'], row['Longitude']
                                best_match = csv_file
                    except Exception:
                        continue

                # Apply GPS coordinates
                if best_lat is not None and best_lon is not None:
                    metadata["Exif.GPSInfo.GPSLatitude"] = float(best_lat)
                    metadata["Exif.GPSInfo.GPSLongitude"] = float(best_lon)
                    metadata.write()

                    new_path = os.path.join(OUTPUT_FOLDER, filename)
                    os.replace(img_path, new_path)

                    log(f"✅ Geotagged {filename} using {best_match} (Δ {best_diff.total_seconds():.1f}s)")
                else:
                    log(f"❌ No GPS match found for {filename}")

            except Exception as e:
                log(f"⚠️ Error processing {filename}: {traceback.format_exc()}")

        time.sleep(10)

    except Exception as e:
        log(f"🚨 Fatal loop error: {traceback.format_exc()}")
        time.sleep(30)
