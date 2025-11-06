import os
import time
import datetime
import pandas as pd
import traceback
import piexif
import shutil
from PIL import Image
from pandas.api.types import DatetimeTZDtype

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
    print(message)

log("🟢 Geotag service started successfully")

# === HELPER FUNCTIONS ===
def deg_to_dms_rational(deg):
    d = int(abs(deg))
    m = int((abs(deg) - d) * 60)
    s = (abs(deg) - d - m / 60) * 3600
    return [(d, 1), (m, 1), (int(s * 100), 100)]

def find_nearest_time(df, target_time):
    diffs = (df['timestamp'] - target_time).abs()
    return df.loc[diffs.idxmin()]

def extract_datetime_from_exif(img_path):
    try:
        exif_dict = piexif.load(img_path)
        dt_bytes = exif_dict["0th"].get(piexif.ImageIFD.DateTime)
        if not dt_bytes:
            return None
        dt_str = dt_bytes.decode("utf-8")
        return datetime.datetime.strptime(dt_str, "%Y:%m:%d %H:%M:%S")
    except Exception:
        return None

# === INITIAL STATE ===
seen = set()
drive_present = None  

# Wait loop / main loop
while True:
    try:
        if os.path.exists(IMAGE_FOLDER):
            if drive_present is not True:
                log(f"📂 Detected drive and folder: {IMAGE_FOLDER}")
                drive_present = True
        else:
            if drive_present is not False:
                log(f"⏳ Waiting for drive/folder to appear: {IMAGE_FOLDER}")
                drive_present = False
                # Clear seen set when drive is missing so files will be reprocessed after re-plug
                seen.clear()
            time.sleep(5)
            continue

        # Try to list files; if drive disconnects during os.listdir, handle it
        try:
            filenames = os.listdir(IMAGE_FOLDER)
        except FileNotFoundError:
            log(f"⚠️ Drive {IMAGE_FOLDER.split(':')[0]} disconnected. Waiting...")
            drive_present = False
            seen.clear()
            time.sleep(5)
            continue

        # Scan folder
        log(f"🔍 Scanning {IMAGE_FOLDER} for new images...")
        for filename in filenames:
            if not filename.lower().endswith((".jpg", ".jpeg")) or filename in seen:
                continue

            img_path = os.path.join(IMAGE_FOLDER, filename)
            seen.add(filename)

            try:
                img_time = extract_datetime_from_exif(img_path)
                if not img_time:
                    log(f"⚠️ No EXIF timestamp found in {filename}")
                    continue
            
                img_time_utc = img_time - datetime.timedelta(hours=8)
            
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

                        if {'CUSTOM.dateTime', 'OSD.latitude', 'OSD.longitude'}.issubset(df.columns):
                            df['timestamp'] = pd.to_datetime(df['CUSTOM.dateTime'], errors='coerce')
                    
                            if isinstance(df['timestamp'].dtype, DatetimeTZDtype):
                                df['timestamp'] = df['timestamp'].dt.tz_localize(None)

                            valid_df = df.dropna(subset=['timestamp', 'OSD.latitude', 'OSD.longitude'])
                            valid_df = valid_df[(valid_df['OSD.latitude'] != 0) & (valid_df['OSD.longitude'] != 0)]
                            if valid_df.empty:
                                continue

                            row = find_nearest_time(valid_df, img_time_utc)
                            diff = abs(row['timestamp'] - img_time_utc)
                            if diff < best_diff:
                                best_diff = diff
                                best_lat, best_lon = row['OSD.latitude'], row['OSD.longitude']
                                best_match = csv_file
                    except Exception:
                        continue

                if best_lat is not None and best_lon is not None:
                    exif_dict = piexif.load(img_path)
                    gps_ifd = {
                        piexif.GPSIFD.GPSLatitudeRef: b'N' if best_lat >= 0 else b'S',
                        piexif.GPSIFD.GPSLatitude: deg_to_dms_rational(best_lat),
                        piexif.GPSIFD.GPSLongitudeRef: b'E' if best_lon >= 0 else b'W',
                        piexif.GPSIFD.GPSLongitude: deg_to_dms_rational(best_lon),
                    }
                    exif_dict["GPS"] = gps_ifd
                    exif_bytes = piexif.dump(exif_dict)
                    piexif.insert(exif_bytes, img_path)

                    new_path = os.path.join(OUTPUT_FOLDER, filename)

                    try:
                        os.replace(img_path, new_path)
                    except OSError:
                        shutil.copy2(img_path, new_path)
                        try:
                            os.remove(img_path)
                        except Exception:
                            log(f"⚠️ Could not remove original {img_path} after copying.")

                    log(f"✅ Geotagged {filename} using {best_match} (Δ {best_diff.total_seconds():.1f}s)")
                else:
                    log(f"❌ No GPS match found for {filename}")

            except FileNotFoundError:
                log(f"⚠️ File {filename} disappeared during processing — drive likely unplugged.")
                drive_present = False
                seen.clear()
                break
            except Exception:
                log(f"⚠️ Error processing {filename}: {traceback.format_exc()}")

        time.sleep(5)

    except Exception:
        log(f"🚨 Fatal loop error: {traceback.format_exc()}")
        time.sleep(10)
