from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'bananaeye')]

# ----------------- MODELS -----------------
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
    date: datetime = Field(default_factory=lambda: datetime.utcnow().strftime("%Y-%m-%d"))
    blackSigatokaInfection: Optional[str] = None
    yieldPrediction: Optional[int] = None
    detectionRecord: Optional[DetectionRecord] = None 


# ----------------- APP INIT -----------------
app = FastAPI()


# --- POST (Create) ---
@app.post("/api/plantations")
async def create_plantation(plantation: Plantation):
    plantation_dict = plantation.dict()
    # Ensure detectionHistory exists
    if "detectionHistory" not in plantation_dict:
        plantation_dict["detectionHistory"] = []
    result = await db.plantations.insert_one(plantation_dict)
    plantation_dict["_id"] = str(result.inserted_id)
    print("Inserted:", plantation_dict)
    return {"message": "Plantation saved", "data": plantation_dict}


# --- POST (Add Detection Record) ---
@app.post("/api/plantations/{plantation_id}/history")
async def add_detection_record(plantation_id: str, record: DetectionRecord):
    result = await db.plantations.update_one(
        {"id": plantation_id},
        {"$push": {"detectionHistory": record.dict()}}
    )
    if result.modified_count == 1:
        return {"message": "Detection record added", "record": record}
    raise HTTPException(status_code=404, detail="Plantation not found")


# --- GET (Read All) ---
@app.get("/api/plantations")
async def get_plantations():
    plantations = await db.plantations.find().to_list(100)
    for p in plantations:
        p["_id"] = str(p["_id"])  # convert ObjectId to string
    print("Fetched:", plantations)
    return plantations


# --- GET (Single Plantation with history) ---
@app.get("/api/plantations/{plantation_id}")
async def get_plantation(plantation_id: str):
    plantation = await db.plantations.find_one({"id": plantation_id})
    if not plantation:
        raise HTTPException(status_code=404, detail="Plantation not found")
    plantation["_id"] = str(plantation["_id"])
    return plantation


# --- PUT (Update Plantation + Auto History Snapshot) ---
@app.put("/api/plantations/{plantation_id}", response_model=Plantation)
async def update_plantation(plantation_id: str, update: PlantationUpdate):
    plantation = await db.plantations.find_one({"id": plantation_id})
    if not plantation:
        raise HTTPException(status_code=404, detail="Plantation not found")

    # Always refresh the current date
    current_date = datetime.utcnow()

    update_data = {"date": current_date}  # ensure MongoDB updates this field
    if update.blackSigatokaInfection is not None:
        update_data["blackSigatokaInfection"] = update.blackSigatokaInfection
    if update.yieldPrediction is not None:
        update_data["yieldPrediction"] = update.yieldPrediction

    # Add previous record to detection history
    old_record = DetectionRecord(
        date=str(plantation.get("date", "")),
        status=plantation.get("blackSigatokaInfection", "Unknown"),
        Yield=plantation.get("yieldPrediction", 0)
    )

    await db.plantations.update_one(
        {"id": plantation_id},
        {
            "$set": update_data,
            "$push": {"detectionHistory": old_record.dict()}
        }
    )

    updated = await db.plantations.find_one({"id": plantation_id})
    updated["_id"] = str(updated["_id"])
    return updated




# ----------------- API ROUTER -----------------
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

# Include router in app
app.include_router(api_router)


# ----------------- CORS + LOGGING -----------------
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
