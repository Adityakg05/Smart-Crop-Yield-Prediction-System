# 🌾 Smart Crop Yield Prediction System

**AI-powered forecasting and agricultural insights for Indian farmers.**

[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Scikit-Learn](https://img.shields.io/badge/scikit--learn-1.0+-F7931E?style=flat&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?style=flat&logo=vercel)](https://vercel.com)
[![Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat&logo=render)](https://render.com)

---

## 📌 Project Overview

This full-stack system provides Indian farmers with instant, localized crop yield estimates. By combining historical district-level agricultural data with precise soil and environmental inputs (NPK, Rainfall, Temperature, Humidity), the system helps stakeholders make data-driven decisions about crop selection, maximizing farm efficiency and yield.

## ✨ Key Features

- **Predictive Yield Modeling** — Estimates yield in Tonnes/Hectare based on real-world agricultural parameters utilizing a trained Random Forest Regressor.
- **JWT-Protected Dashboard** — Secure, authenticated access to prediction tools ensuring data privacy.
- **Agronomic Validation** — Strict frontend and backend validation ensures inputs fall within physically possible and agronomically sensible ranges.
- **Modern, Responsive UI** — High-contrast emerald theme with interactive Chart.js visualizations, glassmorphism design, and smooth micro-animations.
- **Dynamic Risk Assessment** — Flags suspicious environmental predictions and provides tailored agricultural warnings (e.g., heat stress, drought risks).

---

## 📂 Project Architecture

This is a decoupled mono-repo, separating the vanilla frontend from the Python backend for independent scaling and distinct deployment pipelines.

```text
crop-yield-pro/
│
├── backend/                  # FastAPI Python Backend
│   ├── app/
│   │   ├── main.py           # Core FastAPI application & routes
│   │   ├── model.py          # RandomForest ML pipeline & training
│   │   ├── auth.py           # JWT Authentication & User management
│   │   ├── data_processing.py# Dataset cleanup & normalizations
│   │   ├── prediction_utils.py # Model I/O & range constraints
│   │   └── preprocessing.py  # Outlier removal & robust imputation
│   │
│   ├── database/             # SQLite persistent storage
│   ├── data/                 # Historical ML stats (dataset)
│   └── requirements.txt      # Python dependencies
│
├── frontend/                 # Vanilla JS / HTML / CSS Frontend
│   ├── assets/               # Design system (CSS/JS/Images)
│   └── pages/                # index, dashboard, login
│
├── render.yaml               # Backend Render deployment config
├── vercel.json               # Frontend Vercel deployment config
├── README.md                 # Project documentation
├── .gitignore                # Git ignore rules
└── LICENSE                   # Open Source License
```

---

## 🚀 Deployment Guide

This repository is pre-configured for automated, zero-downtime deployment on **Render** (Backend) and **Vercel** (Frontend).

### 1. Backend (Render)
Render automatically detects the `render.yaml` Blueprint file at the root.
1. Push this repository to GitHub.
2. Go to your [Render Dashboard](https://dashboard.render.com/) and create a **New Blueprint Instance**.
3. Connect your GitHub repository.
4. Render will automatically provision the FastAPI Web Service.
5. *Note: Ensure your Render instance is fully deployed and note the live URL.*

### 2. Frontend (Vercel)
Vercel automatically reads the `vercel.json` routing rules.
1. Before deploying, open `frontend/pages/index.html`, `login.html`, and `dashboard.html`.
2. Locate the `<script>window.APP_CONFIG = { apiUrl: '...' };</script>` tag in the `<head>`.
3. Update `apiUrl` to point to your live Render backend URL.
4. Go to your [Vercel Dashboard](https://vercel.com/new) and Import the GitHub repository.
5. Deploy. Vercel will automatically serve the `frontend/` directory.

---

## 💻 Local Development Setup

To run the application locally, you will need to start both the Python backend and a local server for the frontend.

### Prerequisites
- Python 3.9+
- A local web server extension (e.g., VS Code "Live Server")

### 1. Start the Backend API

```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Mac/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server (runs on http://127.0.0.1:8000)
uvicorn app.main:app --reload
```

### 2. Start the Frontend
1. Open the project folder in your IDE (like VS Code).
2. Right-click on `frontend/pages/index.html` and select **"Open with Live Server"**.
3. Ensure the browser is accessing the site via `127.0.0.1` (e.g., `http://127.0.0.1:5500`), which avoids cross-origin credential issues.

---

## 🧠 Machine Learning Logic

We chose **RandomForestRegressor** over simpler linear models because agricultural data is inherently non-linear. The relationship between yield and temperature, for instance, isn't a straight line — there are optimal thresholds and tipping points. Random Forest effectively handles these interactions, outliers, and threshold phenomena without requiring manual polynomial feature engineering.

*Developed and Maintained by [Aditya](https://github.com/Adityakg05).*
