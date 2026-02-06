FROM python:3.11-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libgl1 ffmpeg git && rm -rf /var/lib/apt/lists/*

COPY backend/ ./backend
COPY yolov8n.pt ./yolov8n.pt
COPY backend/requirements.txt ./backend/requirements.txt

RUN python -m pip install --upgrade pip
RUN pip install --no-cache-dir -r backend/requirements.txt

ENV MODEL_PATH=/app/yolov8n.pt
EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
