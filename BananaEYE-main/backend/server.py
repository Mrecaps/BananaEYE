from fastapi import FastAPI, File, UploadFile, APIRouter, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from ultralytics import YOLO
from typing import List, Optional
from datetime import datetime
from pathlib import Path
import os
import logging
import uuid
import uvicorn



# ----------------- APP INIT -----------------
app = FastAPI()

# ----------------- CORS -----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # adjust for deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- LOAD ENV -----------------
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# ----------------- DATABASE -----------------
mongo_url = os.environ.get("MONGO_URL")
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get("DB_NAME", "bananaeye")]

# ----------------- YOLO MODEL -----------------
model_path = os.path.join(os.getcwd(), "best.pt")
model = YOLO(model_path)
print(model.names)  # shows class names mapping, e.g. {0: 'healthy', 1: 'infected'}



# ----------------- PYDANTIC MODELS -----------------
class Position(BaseModel):
    row: int
    col: int


class DetectionRecord(BaseModel):
    date: datetime
    status: str
    Yield: int


class Plantation(BaseModel):
    id: str
    name: str
    datePlanted: str
    blackSigatokaInfection: str
    date: datetime
    yieldPrediction: int
    position: Position
    detectionHistory: List[DetectionRecord] = []


class PlantationUpdate(BaseModel):
    date: datetime = Field(default_factory=lambda: datetime.utcnow())
    blackSigatokaInfection: Optional[str] = None
    yieldPrediction: Optional[int] = None
    detectionRecord: Optional[DetectionRecord] = None


# ----------------- ROUTES ----------------
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        # Save uploaded image temporarily
        file_path = f"temp_{file.filename}"
        with open(file_path, "wb") as f:
            f.write(await file.read())

        results = model(file_path)

        labels = [results[0].names[int(c)] for c in results[0].boxes.cls]

        # Determine infection status
        infection_status = "infected" if "black_sigatoka" in labels else "healthy"

        # Clean up
        os.remove(file_path)

        return {"status": infection_status}

    except Exception as e:
        return {"error": str(e)}

# YOU STOP HERE SELF!!! /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

# 🔧 Base directory where all 20 folders (B1–B20) are located
BASE_PLANTATION_DIR = Path(r"C:\Users\Recap\OneDrive\Documents\Banana_Project\Geotag_images\Geotagged")

@app.post("/predict_folder")
async def predict_folder(folder_name: str = Body(..., embed=True)):
    """
    Runs prediction on all images in a plantation folder (e.g. B1–B20).
    Applies OR logic: if any leaf is infected → plantation is infected.
    """
    # Combine base dir + plantation folder
    folder = BASE_PLANTATION_DIR / folder_name

    if not folder.exists() or not folder.is_dir():
        raise HTTPException(status_code=404, detail=f"Folder not found: {folder}")

    # Gather all images (JPG, PNG)
    image_files = list(folder.glob("*.jpg")) + list(folder.glob("*.png"))
    if not image_files:
        raise HTTPException(status_code=400, detail="No images found in folder")

    results_summary = []
    infected_flag = False

    for img_file in image_files:
        try:
            results = model(str(img_file))
            infected = any(r.boxes.cls[0] == 0 for r in results)
            results_summary.append({
                "image": img_file.name,
                "status": "infected" if infected else "healthy"
            })
            if infected:
                infected_flag = True
        except Exception as e:
            results_summary.append({"image": img_file.name, "error": str(e)})

    final_status = "infected" if infected_flag else "healthy"

    return {
        "folder": folder.name,
        "total_images": len(image_files),
        "status": final_status,
        "details": results_summary
    }



@app.post("/api/plantations")
async def create_plantation(plantation: Plantation):
    plantation_dict = plantation.dict()
    if "detectionHistory" not in plantation_dict:
        plantation_dict["detectionHistory"] = []
    result = await db.plantations.insert_one(plantation_dict)
    plantation_dict["_id"] = str(result.inserted_id)
    print("Inserted:", plantation_dict)
    return {"message": "Plantation saved", "data": plantation_dict}


@app.post("/api/plantations/{plantation_id}/history")
async def add_detection_record(plantation_id: str, record: DetectionRecord):
    result = await db.plantations.update_one(
        {"id": plantation_id},
        {"$push": {"detectionHistory": record.dict()}},
    )
    if result.modified_count == 1:
        return {"message": "Detection record added", "record": record}
    raise HTTPException(status_code=404, detail="Plantation not found")


@app.get("/api/plantations")
async def get_plantations():
    plantations = await db.plantations.find().to_list(100)
    for p in plantations:
        p["_id"] = str(p["_id"])
    return plantations


@app.get("/api/plantations/{plantation_id}")
async def get_plantation(plantation_id: str):
    plantation = await db.plantations.find_one({"id": plantation_id})
    if not plantation:
        raise HTTPException(status_code=404, detail="Plantation not found")
    plantation["_id"] = str(plantation["_id"])
    return plantation


@app.put("/api/plantations/{plantation_id}", response_model=Plantation)
async def update_plantation(plantation_id: str, update: PlantationUpdate):
    plantation = await db.plantations.find_one({"id": plantation_id})
    if not plantation:
        raise HTTPException(status_code=404, detail="Plantation not found")

    current_date = datetime.utcnow()
    update_data = {"date": current_date}

    if update.blackSigatokaInfection is not None:
        update_data["blackSigatokaInfection"] = update.blackSigatokaInfection
    if update.yieldPrediction is not None:
        update_data["yieldPrediction"] = update.yieldPrediction

    old_record = DetectionRecord(
        date=str(plantation.get("date", "")),
        status=plantation.get("blackSigatokaInfection", "Unknown"),
        Yield=plantation.get("yieldPrediction", 0),
    )

    await db.plantations.update_one(
        {"id": plantation_id},
        {"$set": update_data, "$push": {"detectionHistory": old_record.dict()}},
    )

    updated = await db.plantations.find_one({"id": plantation_id})
    updated["_id"] = str(updated["_id"])
    return updated


# ----------------- STATUS CHECK ROUTER -----------------
api_router = APIRouter(prefix="/api")


class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class StatusCheckCreate(BaseModel):
    client_name: str


@api_router.get("/")
async def root():
    return {"message": "Hello World"}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]


app.include_router(api_router)

# ----------------- SHUTDOWN -----------------
@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


# ----------------- LOGGING -----------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


# ----------------- RUN -----------------
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
