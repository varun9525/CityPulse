from fastapi import FastAPI, File, UploadFile, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import models
from .database import get_db, engine
from ultralytics import YOLO
import shutil
import os
import uuid
import traceback
from fastapi.responses import JSONResponse
from .prediction_model import risk_predictor

app = FastAPI()

# Mount uploads for static access
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# CORS Setup
origins = ["*"]
try:
    models.Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: Database connection failed: {e}")

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

def get_priority(class_name: str, confidence: float, bbox: list, img_width: int, img_height: int) -> str:
    cn = class_name.lower()
    
    # Calculate coverage ratio
    if img_width > 0 and img_height > 0:
        x1, y1, x2, y2 = bbox
        box_area = (x2 - x1) * (y2 - y1)
        img_area = img_width * img_height
        ratio = box_area / img_area
        print(f"DEBUG: Class={class_name}, BBox={bbox}, ImgSize={img_width}x{img_height}, Ratio={ratio:.4f}")
    else:
        ratio = 0.0

    # Base priority logic
    priority = "Low" # Default to Low for small issues
    
    if "pothole" in cn or "road" in cn:
        if ratio > 0.30:
            priority = "High"
        elif ratio > 0.10:
            priority = "Moderate"
        else:
            priority = "Low"
            
    elif "dump" in cn or "garbage" in cn:
        if ratio > 0.70:
            priority = "Critical"
        elif ratio > 0.40:
            priority = "High"
        elif ratio > 0.15:
            priority = "Moderate"
        else:
            priority = "Low"
            
    elif "traffic" in cn or "signal" in cn:
        priority = "Critical" # Traffic signals are always critical safety issues
        
    elif "light" in cn:
        priority = "Moderate" if ratio > 0.05 else "Low"
    
    return priority

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
            # Get original image dimensions
            img_h, img_w = r.orig_shape

            for box in r.boxes:
                class_name = model.names[int(box.cls)]
                xyxy = box.xyxy[0].tolist()
                detections.append({
                    "class": class_name,
                    "confidence": float(box.conf),
                    "priority": get_priority(class_name, float(box.conf), xyxy, img_w, img_h),
                    "bbox": xyxy
                })
        
        # Cleanup temp
        if os.path.exists(image_path):
            os.remove(image_path)
            
        return {"detections": detections}
    except Exception as e:
        return {"error": str(e)}

@app.post("/verify-resolution")
async def verify_resolution(file: UploadFile = File(...)):
    if not model:
         return {"error": "Model not loaded"}

    try:
        # Save temp file
        file_id = str(uuid.uuid4())
        image_path = f"{UPLOAD_DIR}/verify_{file_id}.jpg"
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Run model with lower confidence to be strict about cleanliness
        results = model(image_path, conf=0.25)
        
        has_garbage = False
        detected_garbage_classes = []
        
        garbage_classes = ["garbage", "dump", "trash", "rubbish", "plastic", "waste"]

        for r in results:
            for box in r.boxes:
                class_name = model.names[int(box.cls)].lower()
                # Check if any garbage-related class is detected
                if any(g_class in class_name for g_class in garbage_classes):
                    has_garbage = True
                    detected_garbage_classes.append(class_name)
        
        # Cleanup temp
        if os.path.exists(image_path):
            os.remove(image_path)
            
        if has_garbage:
            return {
                "resolved": False, 
                "message": f"Verification failed. Detected: {', '.join(set(detected_garbage_classes))}",
                "detections": list(set(detected_garbage_classes))
            }
        else:
            return {
                "resolved": True,
                "message": "Verification successful. No garbage detected."
            }

    except Exception as e:
        return {"error": str(e)}

@app.get("/analytics/predict")
async def get_predictions(db: Session = Depends(get_db)):
    """
    Returns AI-generated risk predictions and forecasts.
    """
    try:
        print("Analytics endpoint hit")
        # 1. Fetch real issues to augment synthetic data
        real_issues = db.query(models.Issue).all()
        print(f"Fetched {len(real_issues)} real issues")
        
        # 2. Train/Update model
        # (In production, this would be a background job, not on every request)
        risk_predictor.train(real_issues)
        print("Model trained")
        
        # 3. Get Forecast
        forecast = risk_predictor.forecast_trends()
        
        # 4. Get Risk Zones
        risk_zones = risk_predictor.predict_risk_zones()
        
        return {
            "forecast": forecast,
            "risk_zones": risk_zones,
            "total_analyzed": len(risk_predictor.synthetic_data)
        }
    except Exception as e:
        print(f"Error in analytics endpoint: {e}")
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"message": "Internal Server Error", "details": str(e), "trace": traceback.format_exc()})

@app.get("/")
def health():
    return {"status": "CityPulse AI backend running (Prediction + Verification + Analytics)"}