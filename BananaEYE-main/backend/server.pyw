from fastapi import FastAPI, File, UploadFile, APIRouter, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from ultralytics import YOLO
from typing import List, Optional, Dict, Any
from datetime import datetime
from pathlib import Path
from passlib.context import CryptContext
from bson import ObjectId
import os
import logging
import uuid
import uvicorn
import shutil

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

# ----------------- ADMIN -----------------
router_admin = APIRouter(prefix="/api/admin")
pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")
plantation_collection = db["plantations"]
status_collection = db["status"]
admin_collection = db["admins"]

# ----------------- YOLO MODEL -----------------
model_path = os.path.join(os.getcwd(), "best.pt")
model = YOLO(model_path)
print(model.names)  # class names{0:, 'black_sigatoka'}

# ----------------- UPLOAD DIRECTORY -----------------
UPLOAD_DIR = Path("uploads/tree_images")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ----------------- PYDANTIC MODELS -----------------
class AdminLogin(BaseModel):
    username: str
    password: str

class AdminCreate(BaseModel):
    username: str
    password: str

def serialize_admin(admin):
    return {
        "id": str(admin["_id"]),
        "username": admin["username"]
    }

class Position(BaseModel):
    lat: float
    lon: float

class ImageRecord(BaseModel):
    filename: str
    url: str

class DetectionRecord(BaseModel):
    date: datetime
    status: str
    Yield: int
    images: Optional[List[ImageRecord]] = []

class Plantation(BaseModel):
    id: str
    name: str
    datePlanted: str
    blackSigatokaInfection: str
    date: datetime
    yieldPrediction: int
    position: Position
    detectionHistory: List[DetectionRecord] = []
    images: Optional[List[ImageRecord]] = []

class PlantationUpdate(BaseModel):
    date: datetime = Field(default_factory=lambda: datetime.utcnow())
    blackSigatokaInfection: Optional[str] = None
    yieldPrediction: Optional[int] = None
    detectionRecord: Optional[DetectionRecord] = None

# ----------------- ADMIN ROUTES -----------------
@router_admin.post("/login")
async def login_admin(data: AdminLogin):
    admin = await admin_collection.find_one({"username": data.username})
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    if not pwd_context.verify(data.password, admin["password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return {
        "success": True,
        "admin": {
            "id": str(admin["_id"]),
            "username": admin["username"]
        }
    }

@router_admin.post("/create")
async def create_admin(data: AdminCreate):
    existing = await admin_collection.find_one({"username": data.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    hashed_pw = pwd_context.hash(data.password)
    new_admin = {
        "username": data.username,
        "password": hashed_pw
    }
    result = await admin_collection.insert_one(new_admin)
    return {
        "success": True,
        "admin": {
            "id": str(result.inserted_id),
            "username": data.username
        }
    }

@router_admin.get("/")
async def get_admins():
    admins_cursor = admin_collection.find()
    admins = []
    async for a in admins_cursor:
        admins.append({
            "id": str(a["_id"]),
            "username": a["username"]
        })
    return admins

@router_admin.post("/plantations", response_model=Plantation)
async def create_plantation_admin(plantation: Plantation):
    existing = await plantation_collection.find_one({"id": plantation.id})
    if existing:
        raise HTTPException(status_code=400, detail="Plantation ID already exists")
    plantation_dict = plantation.dict()
    if "detectionHistory" not in plantation_dict:
        plantation_dict["detectionHistory"] = []
    result = await plantation_collection.insert_one(plantation_dict)
    plantation_dict["_id"] = str(result.inserted_id)
    return plantation_dict

@router_admin.delete("/plantations/{plantation_id}")
async def delete_plantation_admin(plantation_id: str):
    result = await plantation_collection.delete_one({"id": plantation_id})
    if result.deleted_count == 1:
        return {"success": True, "message": f"Plantation {plantation_id} deleted"}
    raise HTTPException(status_code=404, detail="Plantation not found")

@router_admin.put("/plantations/{plantation_id}")
async def update_plantation_admin(plantation_id: str, update_data: Dict[str, Any]):
    update_data = {k: v for k, v in update_data.items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data provided for update")
    result = await plantation_collection.update_one(
        {"id": plantation_id},
        {"$set": update_data}
    )
    if result.modified_count == 1:
        updated = await plantation_collection.find_one({"id": plantation_id})
        updated["_id"] = str(updated["_id"])
        return {"success": True, "plantation": updated}
    raise HTTPException(status_code=404, detail="Plantation not found")

# ----------------- PREDICTION ROUTES -----------------
@app.post("/predict")
async def predict(files: List[UploadFile] = File(...)):
    all_predictions = []
    for file in files:
        file_path = f"temp_{file.filename}"
        try:
            with open(file_path, "wb") as f:
                f.write(await file.read())
            results = model(file_path)
            cls_indices = []
            try:
                cls_indices = list(results[0].boxes.cls)
            except Exception:
                cls_indices = []
            labels = []
            for c in cls_indices:
                try:
                    labels.append(results[0].names[int(c)])
                except Exception:
                    labels.append(str(c))
            is_infected = any("black_sigatoka" == lab or "black_sigatoka" in lab for lab in labels)
            infection_status = "infected" if is_infected else "healthy"
            all_predictions.append({
                "filename": file.filename,
                "result": infection_status,
                "labels": labels
            })
        finally:
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception:
                    pass
    infected_count = sum(1 for p in all_predictions if p["result"] == "infected")
    final_status = "infected" if infected_count > 0 else "healthy"
    return {
        "overall_status": final_status,
        "infected_count": infected_count,
        "predictions": all_predictions
    }

BASE_PLANTATION_DIR = Path(r"C:\Users\Recap\OneDrive\Documents\Banana_Project\Geotag_images\Geotagged")

@app.post("/predict_folder")
async def predict_folder(folder_name: str = Body(..., embed=True)):
    folder = BASE_PLANTATION_DIR / folder_name
    if not folder.exists() or not folder.is_dir():
        raise HTTPException(status_code=404, detail=f"Folder not found: {folder}")
    image_files = list(folder.glob("*.jpg")) + list(folder.glob("*.png")) + list(folder.glob("*.jpeg"))
    if not image_files:
        raise HTTPException(status_code=400, detail="No images found in folder")

    results_summary = []
    infected_flag = False
    saved_images = []

    # Extract plantation ID from folder name
    plantation_id = folder_name[1:]
    
    # --- DELETE OLD IMAGES FROM DATABASE AND FILESYSTEM ---
    plantation_data = await db.plantations.find_one({"id": plantation_id})
    if plantation_data:
        old_images = plantation_data.get("images", [])
        for img in old_images:
            img_path = UPLOAD_DIR / img["filename"]
            if img_path.exists():
                try:
                    os.remove(img_path)
                    print(f"🗑️ Deleted old image: {img['filename']}")
                except Exception as e:
                    print(f"❌ Failed to delete {img['filename']}: {e}")
        # Remove image references from DB
        await db.plantations.update_one({"id": plantation_id}, {"$set": {"images": []}})
    
    # --- PROCESS NEW IMAGES ---
    for img_file in image_files:
        try:
            results = model(str(img_file))
            cls_indices = []
            try:
                cls_indices = list(results[0].boxes.cls)
            except Exception:
                cls_indices = []
            labels = []
            for c in cls_indices:
                try:
                    labels.append(results[0].names[int(c)])
                except Exception:
                    labels.append(str(c))
            is_infected = any("black_sigatoka" == lab or "black_sigatoka" in lab for lab in labels)
            status = "infected" if is_infected else "healthy"
            results_summary.append({"image": img_file.name, "status": status})
            if is_infected:
                infected_flag = True
            # SAVE IMAGE
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")[:-3]
            new_filename = f"{plantation_id}_{timestamp}_{img_file.name}"
            dest_path = UPLOAD_DIR / new_filename
            shutil.copy2(str(img_file), str(dest_path))
            saved_images.append({
                "filename": new_filename,
                "path": str(dest_path),
                "originalName": img_file.name,
                "status": status,
                "uploadDate": datetime.utcnow()
            })
        except Exception as e:
            results_summary.append({"image": img_file.name, "error": str(e)})

    final_status = "infected" if infected_flag else "healthy"

    # --- UPDATE DATABASE WITH NEW IMAGES ---
    if plantation_data:
        current_yield = plantation_data.get("yieldPrediction", 0)
        detection_record = {
            "date": datetime.utcnow(),
            "status": final_status,
            "Yield": current_yield,
            "images": saved_images
        }
        image_documents = [{
            "filename": img["filename"],
            "path": img["path"],
            "uploadDate": img["uploadDate"],
            "status": img["status"],
            "yieldPrediction": current_yield,
            "originalName": img["originalName"]
        } for img in saved_images]
        await db.plantations.update_one(
            {"id": plantation_id},
            {
                "$set": {
                    "blackSigatokaInfection": final_status,
                    "date": datetime.utcnow(),
                    "images": image_documents
                },
                "$push": {"detectionHistory": detection_record}
            }
        )

    return {
        "folder": folder.name,
        "plantation_id": plantation_id,
        "plantation_name": plantation_data.get("name", "Unknown") if plantation_data else "Unknown",
        "total_images": len(image_files),
        "images_saved": len(saved_images),
        "status": final_status,
        "details": results_summary
    }

# ----------------- IMAGE ROUTES -----------------
@app.get("/api/plantations/{plantation_id}/images")
async def get_plantation_images(plantation_id: str):
    plantation = await db.plantations.find_one({"id": plantation_id})
    if not plantation:
        raise HTTPException(status_code=404, detail="Plantation not found")
    images = plantation.get("images", [])
    for img in images:
        img['url'] = f"/uploads/tree_images/{img['filename']}"
        if isinstance(img.get('uploadDate'), datetime):
            img['uploadDate'] = img['uploadDate'].isoformat()
    return {"images": images}

@app.get("/api/images/{filename}")
async def get_image(filename: str):
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(file_path)

@app.get("/api/plantations/{plantation_id}/detection/{detection_index}/images")
async def get_detection_images(plantation_id: str, detection_index: int):
    plantation = await db.plantations.find_one({"id": plantation_id})
    if not plantation:
        raise HTTPException(status_code=404, detail="Plantation not found")
    detection_history = plantation.get("detectionHistory", [])
    if detection_index >= len(detection_history):
        raise HTTPException(status_code=404, detail="Detection record not found")
    detection = detection_history[detection_index]
    images = detection.get("images", [])
    for img in images:
        img['url'] = f"/uploads/tree_images/{img['filename']}"
    return {
        "detection_date": detection.get("date"),
        "status": detection.get("status"),
        "images": images
    }

# ----------------- OTHER ROUTES -----------------
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

@app.post("/api/plantations")
async def create_plantation(plantation: Plantation):
    plantation_dict = plantation.dict()
    if "detectionHistory" not in plantation_dict:
        plantation_dict["detectionHistory"] = []
    result = await db.plantations.insert_one(plantation_dict)
    plantation_dict["_id"] = str(result.inserted_id)
    return {"message": "Plantation saved", "data": plantation_dict}

# ----------------- STATUS ROUTES -----------------
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

# ----------------- INCLUDE ROUTERS -----------------
app.include_router(api_router)
app.include_router(router_admin)

# ----------------- SHUTDOWN -----------------
@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# ----------------- LOGGING -----------------
logging.basicConfig(
    filename= r"C:\Users\Recap\OneDrive\Documents\Banana_Project\#Console_Logs\Server.log",  # Save logs here
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# ----------------- RUN -----------------
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
