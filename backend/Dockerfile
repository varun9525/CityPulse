FROM python:3.11-slim
WORKDIR /app

# system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libgl1 ffmpeg git && rm -rf /var/lib/apt/lists/*

# copy code and model (ensure yolov8n.pt is in repo root or change path)
COPY backend/ ./backend
COPY yolov8n.pt ./yolov8n.pt

# install python deps
RUN python -m pip install --upgrade pip
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

ENV MODEL_PATH=/app/yolov8n.pt
EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
