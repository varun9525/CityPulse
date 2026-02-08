from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import shutil
import os
import uuid

app = FastAPI()

# Mount uploads for static access (only for temp usage if needed, but mostly we use Supabase Storage now)
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# CORS Setup
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load YOLO Model
MODEL_FILENAME = os.getenv("MODEL_PATH", "best.pt")
possible_paths = [MODEL_FILENAME, os.path.join("backend", MODEL_FILENAME), os.path.join(os.getcwd(), MODEL_FILENAME)]
FINAL_MODEL_PATH = next((p for p in possible_paths if os.path.exists(p)), MODEL_FILENAME)
try:
    model = YOLO(FINAL_MODEL_PATH)
    print(f"Loaded model from {FINAL_MODEL_PATH}")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not model:
         return {"error": "Model not loaded"}

    try:
        # Save temp file
        file_id = str(uuid.uuid4())
        image_path = f"{UPLOAD_DIR}/temp_{file_id}.jpg"
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        results = model(image_path, conf=0.15)
        detections = []
        for r in results:
            for box in r.boxes:
                class_name = model.names[int(box.cls)]
                detections.append({
                    "class": class_name,
                    "confidence": float(box.conf),
                    "bbox": box.xyxy[0].tolist()
                })
        
        # Cleanup temp
        if os.path.exists(image_path):
            os.remove(image_path)
            
        return {"detections": detections}
    except Exception as e:
        return {"error": str(e)}

@app.get("/")
def health():
    return {"status": "CityPulse AI backend running (Prediction Only)"}