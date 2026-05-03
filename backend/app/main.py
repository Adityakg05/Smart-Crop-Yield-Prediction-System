import math
import os
from contextlib import asynccontextmanager
from datetime import datetime
from typing import List

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from jose import JWTError, jwt
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from .auth import (
    ALGORITHM, SECRET_KEY, Token, TokenData, User, UserCreate, UserLogin,
    authenticate_user, create_access_token, create_user,
    get_db, get_user_by_email, get_user_by_username,
)
from .model import model_instance


# ── Startup / Shutdown ──────────────────────────────────────────────────────

# Lifespan events are cleaner than the deprecated @app.on_event("startup") 
# because they handle the full context (startup/shutdown) in one readable block.
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Train the ML model once at startup so every request hits a ready model."""
    # Path walks up from backend/app → backend → data/
    dataset_path = os.path.join(
        os.path.dirname(__file__), '..', 'data', 'dataset.csv'
    )
    print("Starting up - training crop yield model...")
    try:
        model_instance.train(dataset_path)
    except Exception as exc:
        # Don't crash the whole server over a training failure;
        # the dummy fallback inside train() keeps the API alive.
        print(f"Warning: model training failed - {exc}")
    yield
    print("Shutting down.")


# ── App setup ───────────────────────────────────────────────────────────────

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

app = FastAPI(
    title="Smart Crop Yield Prediction System",
    description=(
        "Predicts crop yield from soil and weather inputs. "
        "Requires JWT authentication for prediction endpoints."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

# During development, allow_origins=["*"] prevents the classic CORS block 
# when opening index.html directly from the file system. 
# Production builds should obviously specify the exact frontend domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve the frontend folder so /frontend/pages/dashboard.html works directly
frontend_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'frontend')
app.mount("/frontend", StaticFiles(directory=frontend_dir, html=True), name="frontend")


@app.get("/dashboard", include_in_schema=False)
async def redirect_to_dashboard():
    """Convenience redirect — /dashboard is easier to remember than the full path."""
    return RedirectResponse(url="/frontend/pages/dashboard.html", status_code=302)


# ── Request / Response schemas ───────────────────────────────────────────────

class CropPredictionInput(BaseModel):
    """Everything the model needs to make a yield estimate."""
    rainfall:    float = Field(..., ge=0,   le=500,  description="mm of rainfall")
    temperature: float = Field(..., ge=0,   le=50,   description="°C")
    humidity:    float = Field(..., ge=10,  le=100,  description="%")
    N:           float = Field(..., ge=0,   le=150,  description="Nitrogen kg/ha")
    P:           float = Field(..., ge=0,   le=150,  description="Phosphorus kg/ha")
    K:           float = Field(..., ge=0,   le=200,  description="Potassium kg/ha")
    area:        float = Field(..., ge=0.1, le=100,  description="Farm area in hectares")
    state:       str
    crop:        str


class CropPredictionResult(BaseModel):
    """What we send back to the frontend after a successful prediction."""
    predicted_yield:  float
    yield_min:        float
    yield_max:        float
    confidence_score: float
    warnings:         List[str] = []
    is_valid_combo:   bool = True


# ── Auth helpers (used as FastAPI dependencies) ──────────────────────────────

async def get_authenticated_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Decode the JWT and look up the user.  Raises 401 if anything smells off —
    expired token, tampered signature, unknown username, etc.
    """
    bad_credentials = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Session expired or invalid — please log in again",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if not username:
            raise bad_credentials
        token_data = TokenData(username=username)
    except JWTError:
        raise bad_credentials

    user = get_user_by_username(db, username=token_data.username)
    if not user:
        raise bad_credentials
    return user


async def require_active_user(
    current_user: User = Depends(get_authenticated_user),
) -> User:
    """Blocks deactivated accounts from using protected endpoints."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")
    return current_user


# ── Auth endpoints ───────────────────────────────────────────────────────────

@app.post("/register", response_model=Token)
async def register_new_user(new_user: UserCreate, db: Session = Depends(get_db)):
    """Sign up a new farmer account and return a ready-to-use access token."""
    if get_user_by_username(db, username=new_user.username):
        raise HTTPException(status_code=400, detail="Username already taken")
    if get_user_by_email(db, email=new_user.email):
        raise HTTPException(status_code=400, detail="An account with that email already exists")

    created_user = create_user(db=db, user=new_user)
    access_token = create_access_token(data={"sub": str(created_user.username)})
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/token", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """
    Standard OAuth2 password flow.  The frontend sends email as `username`
    because that's what farmers remember, so authenticate_user handles both.
    """
    verified_user = authenticate_user(db, form_data.username, form_data.password)
    if not verified_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Wrong email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    verified_user.last_login = datetime.utcnow()
    db.commit()

    access_token = create_access_token(data={"sub": str(verified_user.username)})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/users/me")
async def get_my_profile(current_user: User = Depends(require_active_user)):
    """Returns just enough profile info for the navbar greeting."""
    return {
        "username":   current_user.username,
        "email":      current_user.email,
        "full_name":  current_user.full_name,
        "created_at": current_user.created_at,
        "last_login": current_user.last_login,
    }


# ── Prediction endpoint ──────────────────────────────────────────────────────

@app.post("/predict", response_model=CropPredictionResult)
async def predict_crop_yield(
    crop_input: CropPredictionInput,
    current_user: User = Depends(require_active_user),
):
    """
    Core endpoint.  The model works in kg/ha internally; the frontend converts
    to t/ha for display, so we return raw kg/ha here.
    """
    try:
        input_dict = crop_input.dict()
        prediction_result = model_instance.predict(input_dict)

        # JSON can't serialize NaN or Inf — clamp those to 0 rather than crash
        def sanitize_float(val: float) -> float:
            if isinstance(val, float) and (math.isnan(val) or math.isinf(val)):
                return 0.0
            return val

        return CropPredictionResult(
            predicted_yield  = sanitize_float(prediction_result["yield"]),
            yield_min        = sanitize_float(prediction_result["yield_min"]),
            yield_max        = sanitize_float(prediction_result["yield_max"]),
            confidence_score = sanitize_float(prediction_result["confidence"]),
            warnings         = prediction_result["warnings"],
            is_valid_combo   = prediction_result.get("is_valid_combo", True),
        )

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}")


# ── Utility endpoints ────────────────────────────────────────────────────────

@app.get("/metrics")
async def get_model_metrics():
    """
    Lets the landing page show real accuracy figures instead of hardcoded ones.
    Only available after the model has been trained at startup.
    """
    return {
        "rmse":     model_instance.metrics.get("rmse"),
        "r2_score": model_instance.metrics.get("r2"),
    }


@app.get("/health")
async def health_check():
    return {
        "status":        "healthy",
        "model_trained": model_instance.is_trained,
        "timestamp":     datetime.utcnow(),
    }


@app.get("/")
async def root():
    return {
        "message": "Smart Crop Yield Prediction API v2.0",
        "docs":    "/docs",
    }


# Allow running directly with `python main.py` during local dev
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
