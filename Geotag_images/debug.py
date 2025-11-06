import os
import datetime
import pandas as pd
import piexif
from PIL import Image

CSV_FOLDER = r"C:\Users\Recap\OneDrive\Documents\Banana_Project\LogsToCsv\CSV_Logs"
IMAGE_FOLDER = r"D:\DCIM\102MEDIA"

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

def find_nearest_time(df, target_time):
    diffs = (df['timestamp'] - target_time).abs()
    return df.loc[diffs.idxmin()]

# Pick one image to debug
filename = "DJI_0044.JPG"
img_path = os.path.join(IMAGE_FOLDER, filename)
img_time = extract_datetime_from_exif(img_path)
if img_time is None:
    print(f"No EXIF time in {filename}")
    exit()

# Adjust to UTC (DJI camera is local time)
img_time_utc = img_time - datetime.timedelta(hours=8)
print(f"🕐 Photo time (local): {img_time}")
print(f"🌍 Photo time (UTC):   {img_time_utc}")

# Load first CSV file
csv_files = [f for f in os.listdir(CSV_FOLDER) if f.endswith(".csv")]
if not csv_files:
    print("No CSV files found.")
    exit()

csv_path = os.path.join(CSV_FOLDER, csv_files[0])
df = pd.read_csv(csv_path)

# Show what columns exist
print("📄 Columns in CSV:", list(df.columns))

# Convert CSV timestamps (make them timezone-naive UTC)
if 'CUSTOM.dateTime' in df.columns:
    df['timestamp'] = pd.to_datetime(df['CUSTOM.dateTime'], errors='coerce')

# If timestamps still have timezone info, strip it
if pd.api.types.is_datetime64tz_dtype(df['timestamp']):
    df['timestamp'] = df['timestamp'].dt.tz_localize(None)

else:
    print("❌ No CUSTOM.dateTime column found.")
    exit()

# Keep only rows with valid GPS
valid_df = df[(df['OSD.latitude'] != 0) & (df['OSD.longitude'] != 0)]
if valid_df.empty:
    print("❌ No valid GPS points found in CSV.")
    exit()

row = find_nearest_time(valid_df, img_time_utc)

print(f"\n🔍 Nearest GPS row:")
print(f"CSV timestamp (UTC): {row['timestamp']}")
print(f"Latitude: {row['OSD.latitude']}")
print(f"Longitude: {row['OSD.longitude']}")
print(f"Δ seconds: {(row['timestamp'] - img_time_utc).total_seconds():.2f}")
