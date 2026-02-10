from ultralytics import YOLO
import sys
import os

def validate_model(model_path="runs/detect/train/weights/best.pt", data_path="dataset/citypulse/data.yaml"):
    """
    Validates a trained YOLO model on the validation dataset.
    """
    if not os.path.exists(model_path):
        print(f"Model not found at {model_path}. Trying default 'yolov8m.pt'...")
        model_path = "yolov8m.pt"
    
    print(f"Loading model from: {model_path}")
    try:
        model = YOLO(model_path)
        
        print("Starting validation...")
        # Validate the model
        metrics = model.val(data=data_path)
        
        print("\n" + "="*50)
        print("VALIDATION RESULTS")
        print("="*50)
        print(f"mAP50-95: {metrics.box.map:.4f}")
        print(f"mAP50:    {metrics.box.map50:.4f}")
        print(f"Precision: {metrics.box.mp:.4f}")
        print(f"Recall:    {metrics.box.mr:.4f}")
        print("="*50)
        
        with open("validation_results.txt", "w", encoding="utf-8") as f:
            f.write(f"mAP50-95: {metrics.box.map:.4f}\n")
            f.write(f"mAP50:    {metrics.box.map50:.4f}\n")
            f.write(f"Precision: {metrics.box.mp:.4f}\n")
            f.write(f"Recall:    {metrics.box.mr:.4f}\n")
        
        return metrics
    except Exception as e:
        print(f"Validation failed: {e}")
        return None

if __name__ == "__main__":
    # Allow passing model path as argument
    # Default to 'backend/best.pt' if it exists, otherwise try the training run path
    default_path = "backend/best.pt" if os.path.exists("backend/best.pt") else "runs/detect/train/weights/best.pt"
    
    model_arg = sys.argv[1] if len(sys.argv) > 1 else default_path
    validate_model(model_path=model_arg)
