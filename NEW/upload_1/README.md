# CityPulse

## Training a new model

Use the provided training script to fine-tune a YOLO model on a new dataset. The dataset should be in YOLO format with a `data.yaml` file (see `dataset/citypulse/data.yaml` for the current structure).

```bash
python backend/train.py \
  --data dataset/citypulse/data.yaml \
  --model yolov8n.pt \
  --epochs 100 \
  --imgsz 640 \
  --batch 16
```

The best checkpoint will be written under `runs/train/<name>/weights/best.pt`. Update `MODEL_PATH` (or replace `yolov8n.pt`) to use the new weights in the backend.
