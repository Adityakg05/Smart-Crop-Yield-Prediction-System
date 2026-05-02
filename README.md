# 🌾 Smart Crop Yield Prediction System

**AI-powered forecasting for Indian agriculture.**

[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?style=flat&logo=vercel)](https://vercel.com)
[![Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat&logo=render)](https://render.com)

---

## Project Overview

This system provides Indian farmers with instant, localized crop yield estimates. By combining historical district-level agricultural data with soil and environmental inputs (NPK, Rainfall, Temperature), the system helps stakeholders make data-driven decisions about crop selection and farm management.

## Key Features

- **Predictive Yield Modeling** — Estimates yield in Tonnes/Hectare based on real-world agricultural parameters.
- **JWT-Protected Dashboard** — Secure access to prediction tools and historical logs.
- **Agronomic Validation** — Ensures inputs fall within physically possible and agronomically sensible ranges.
- **Modern UI** — High-contrast emerald theme with interactive Chart.js visualizations.
- **Dynamic Risk Assessment** — Flags suspicious predictions and provides environmental warnings (e.g., heat stress).

---

## Design Decisions & Logic

### 🧠 Model Choice: Random Forest
We chose **RandomForestRegressor** over simpler linear models because agricultural data is inherently non-linear. The relationship between yield and temperature, for instance, isn't a straight line — there are optimal thresholds and tipping points. RandomForest handles these interactions and outliers robustly without requiring complex feature engineering.

### 📊 Dataset Limitations
The primary dataset consists of ~32,000 district-level records from 1997–2020. Since environmental data (Rainfall/Temp) wasn't available in the same source, we use **synthetic priors** based on crop-type averages. While accurate for demonstration, a production version would integrate real-time sensor or satellite weather data.

### 🌾 Crop Factor Logic
A 'good' yield for Wheat (high volume) is mathematically different from a 'good' yield for Cotton (low volume). Our **Crop Influence Factors** normalize the model's bias, ensuring that predictions remain sensitive to environmental shifts even for low-yield crops.

---

## Project Structure

```text
crop-yield-pro/
│
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI entry point & routes
│   │   ├── model.py           # RandomForest pipeline & training
│   │   ├── auth.py            # JWT Auth & User logic
│   │   ├── data_processing.py # CSV cleanup & stats (formerly helpers)
│   │   ├── prediction_utils.py# Model IO & range validation (formerly utils)
│   │   └── preprocessing.py   # Outlier removal & imputation
│   │
│   ├── database/
│   │   └── crop_yield.db      # SQLite persistent storage
│   ├── data/
│   │   └── dataset.csv        # Historical stats (gitignored)
│   ├── requirements.txt       # Backend dependencies
│   └── render.yaml            # Render Blueprint config
│
├── frontend/
│   ├── assets/                # Design system (CSS/JS/Images)
│   ├── pages/                 # index, dashboard, login
│   └── vercel.json            # Vercel deployment config
│
├── README.md
├── .gitignore
└── LICENSE
```

---

## Deployment

### Backend (Render)
1. Push to GitHub.
2. Connect repo to Render as a **Web Service**.
3. Set `SECRET_KEY` environment variable.
4. Render will auto-detect the `backend/render.yaml` blueprint.

### Frontend (Vercel)
1. Edit the `apiUrl` in your HTML files to point to your Render instance.
2. Push to GitHub.
3. Vercel will deploy the `frontend/` directory automatically.

---

## Local Setup

```bash
# 1. Install dependencies
pip install -r backend/requirements.txt

# 2. Start the API
uvicorn backend.app.main:app --reload

# 3. Access the dashboard
# Open frontend/pages/index.html in your browser
```

---

*Developed by [Aditya](https://github.com/Adityakg05).*
