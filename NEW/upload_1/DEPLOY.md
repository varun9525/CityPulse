# Deployment Guide — Vercel (Frontend) + Render (Backend)

## 1. Backend Deployment (Render)
**Method: Native Python (No Docker)** - Faster and lighter.

1.  **Push your code to GitHub**.
2.  Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Web Service**.
3.  Connect your GitHub repository.
4.  Render should automatically detect the `render.yaml` file in your repository.
    *   If it asks, confirm the settings:
    *   **Runtime**: Python 3
    *   **Build Command**: `pip install -r backend/requirements.txt`
    *   **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
5.  **Environment Variables**:
    *   Render will read them from `render.yaml` (`PYTHON_VERSION`, `MODEL_PATH`).
    *   You can add `CORS_ALLOWED_ORIGINS` if you want to restrict access later (defaults to allowing all).
6.  **Deploy**.
    *   Render will install dependencies (CPU version of PyTorch) and start the server.
    *   Once live, copy your backend URL (e.g., `https://citypulse-backend.onrender.com`).

> **Note on Model File**: The app expects `best.pt` to be in the `backend/` folder. Ensure it is committed to your repo. If it's too large for GitHub (>100MB), you will need to use Git LFS or download it at runtime.

## 2. Frontend Deployment (Vercel)

1.  Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** -> **Project**.
2.  Import your GitHub repository.
3.  **Project Settings**:
    *   **Framework Preset**: Vite (should be detected automatically).
    *   **Root Directory**: Click "Edit" and select `frontend`.
4.  **Build and Output Settings** (Vite defaults are usually correct):
    *   Build Command: `npm run build`
    *   Output Directory: `dist`
5.  **Environment Variables**:
    *   Add `VITE_BACKEND_URL` and paste your Render Backend URL (e.g., `https://citypulse-backend.onrender.com`).
    *   *Important*: Do not add a trailing slash.
6.  **Deploy**.
    *   Vercel will build your site and deploy it.
    *   The `vercel.json` file we added helps handle page routing (SPA support).

## Troubleshooting

-   **Backend 'Disk Full' or Timeout**: This usually happens if the GPU version of PyTorch is installed. We have configured `backend/requirements.txt` to use the CPU version to avoid this.
-   **Frontend API Errors**: Check the Network tab in your browser. Ensure the request URL starts with your Render backend URL, not `localhost`.
-   **Model Not Found**: Check the Render logs. The logs will say where it's looking for `best.pt`.
