from ultralytics import YOLO
from ..config import YOLO_MODEL_PATH

model = YOLO(str(YOLO_MODEL_PATH))
print("YOLO Classes:", model.names)

async def predict_image(file_path: str):
    results = model(file_path)
    labels = [results[0].names[int(c)] for c in results[0].boxes.cls]
    infection_status = "infected" if "black_sigatoka" in labels else "healthy"
    return infection_status

async def predict_folder_images(image_paths: list):
    results_summary = []
    infected_flag = False
    for img_file in image_paths:
        try:
            results = model(str(img_file))
            infected = any(r.boxes.cls[0] == 1 for r in results)  # 0 = infected
            results_summary.append({
                "image": img_file.name,
                "status": "infected" if infected else "healthy"
            })
            if infected:
                infected_flag = True
        except Exception as e:
            results_summary.append({"image": img_file.name, "error": str(e)})

    final_status = "infected" if infected_flag else "healthy"
    return final_status, results_summary
