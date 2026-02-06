from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import shutil
import os
import uuid

app = FastAPI()

# Allow frontend to talk to backend
# Allow frontend to talk to backend
# In production, you might want to restrict this to your specific Vercel domain
origins = [
    "http://localhost:5173",  # Local development
    "http://localhost:3000",  # Local development
    "https://citypulse.vercel.app", # Example Vercel domain
    "*" # Temporarily allow all for easy setup, restrict later if needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load trained model
# Load trained model
# Check if model exists in current directory or backend directory
MODEL_FILENAME = os.getenv("MODEL_PATH", "best.pt")
possible_paths = [
    MODEL_FILENAME,
    os.path.join("backend", MODEL_FILENAME),
    os.path.join(os.getcwd(), MODEL_FILENAME)
]

FINAL_MODEL_PATH = None
for path in possible_paths:
    if os.path.exists(path):
        FINAL_MODEL_PATH = path
        break

if not FINAL_MODEL_PATH:
    # Fallback/Error if not found
    print(f"Warning: Model {MODEL_FILENAME} not found. Checking current dir: {os.getcwd()}")
    FINAL_MODEL_PATH = MODEL_FILENAME # Let Ultralytics try to download or fail

model = YOLO(FINAL_MODEL_PATH)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    file_id = str(uuid.uuid4())
    image_path = f"{UPLOAD_DIR}/{file_id}.jpg"

    with open(image_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    results = model(image_path)

    detections = []
    for r in results:
        for box in r.boxes:
            detections.append({
                "class": model.names[int(box.cls)],
                "confidence": float(box.conf),
                "bbox": box.xyxy[0].tolist()
            })

    return {
        "detections": detections
    }

@app.get("/")
def health():
    return {"status": "CityPulse AI backend running"}