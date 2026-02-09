from fastapi import FastAPI, File, UploadFile, Depends, Form
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
    priority = "Low" # Default to LoW for small issues
    
    if "pothole" in cn or "road" in cn:
        # Potholes: dangerous mostly if large
        if ratio > 0.30:
            priority = "Critical"
        elif ratio > 0.15:
            priority = "High"
        elif ratio > 0.02:
            priority = "Moderate"
        else:
            priority = "Low"
            
    elif "dump" in cn or "garbage" in cn:
        # Garbage: unsightly but rarely immediate danger unless huge
        if ratio > 0.40:
            priority = "Critical" # Blocking road
        elif ratio > 0.20:
            priority = "High"
        elif ratio > 0.05:
            priority = "Moderate"
        else:
            priority = "Low"
            
    elif "water" in cn or "leak" in cn:
        # Water: waste of resources / flood risk
        if ratio > 0.20:
            priority = "High"
        elif ratio > 0.05:
            priority = "Moderate"
        else:
            priority = "Low"

    elif "traffic" in cn or "signal" in cn:
        priority = "Critical" # Traffic signals are always critical safety issues
        
    elif "light" in cn:
        # Streetlights: safety issue at night
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
async def verify_resolution(file: UploadFile = File(...), issue_type: str = Form(...)): # Added issue_type param
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
        
        has_issue = False
        detected_related_classes = []
        
        # Determine target classes based on issue_type
        target_classes = []
        it = issue_type.lower()
        
        if "pothole" in it or "road" in it:
            target_classes = ["pothole", "road damage"]
        elif "garbage" in it or "dump" in it or "trash" in it:
            target_classes = ["garbage", "dump", "trash", "rubbish", "plastic", "waste"]
        elif "water" in it or "leak" in it:
            target_classes = ["water_leak", "leak", "water"]
        elif "light" in it:
            target_classes = ["streetlight", "light"]
        elif "traffic" in it or "signal" in it:
            target_classes = ["traffic signal", "signal"]
        else:
             # Fallback: check if ANY supported class is present
             target_classes = list(model.names.values())

        for r in results:
            for box in r.boxes:
                class_name = model.names[int(box.cls)].lower()
                # Check if any target class is detected
                if any(t_class in class_name for t_class in target_classes):
                    has_issue = True
                    detected_related_classes.append(class_name)
        
        # Cleanup temp
        if os.path.exists(image_path):
            os.remove(image_path)
            
        if has_issue:
            return {
                "resolved": False, 
                "message": f"Verification failed. Still detected: {', '.join(set(detected_related_classes))}",
                "detections": list(set(detected_related_classes))
            }
        else:
            return {
                "resolved": True, 
                "message": "Verification successful. Issue appears resolved."
            }

    except Exception as e:
        return {"error": str(e)}

@app.get("/analytics/predict")
async def get_predictions(delay_days: int = 0, db: Session = Depends(get_db)):
    """
    Returns AI-generated risk predictions and forecasts.
    Supports ?delay_days=X for What-If analysis.
    """
    try:
        print(f"Analytics endpoint hit (Delay={delay_days} days)")
        # 1. Fetch real issues to augment synthetic data
        real_issues = db.query(models.Issue).all()
        
        # 2. Train/Update model
        # (In production, this would be a background job, not on every request)
        risk_predictor.train(real_issues)
        
        # 3. Get Forecast
        forecast = risk_predictor.forecast_trends()
        
        # 4. Get Risk Zones (with Simulation)
        risk_zones = risk_predictor.predict_risk_zones(delay_days=delay_days)
        
        # 5. Get Issue Trends (Decision Support)
        trends = risk_predictor.get_issue_trends()
        
        return {
            "forecast": forecast,
            "risk_zones": risk_zones,
            "trends": trends,
            "simulation": {"delay_days": delay_days, "active": delay_days > 0},
            "total_analyzed": len(risk_predictor.synthetic_data)
        }
    except Exception as e:
        print(f"Error in analytics endpoint: {e}")
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"message": "Internal Server Error", "details": str(e), "trace": traceback.format_exc()})

@app.get("/")
def health():
    return {"status": "CityPulse AI backend running (Prediction + Verification + Analytics)"}