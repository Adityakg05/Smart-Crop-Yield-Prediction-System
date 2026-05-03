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

# Train model at startup so requests hit a ready model
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Train model at startup so requests hit a ready model."""
    dataset_path = os.path.join(
        os.path.dirname(__file__), '..', 'data', 'dataset.csv'
    )
    print("Starting up - training crop yield model...")
    try:
        model_instance.train(dataset_path)
    except Exception as exc:
        print(f"Warning: model training failed - {exc}")
    yield
    print("Shutting down.")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

app = FastAPI(
    title="Smart Crop Yield Prediction System",
    description="Predicts crop yield from soil and weather inputs. Requires JWT authentication.",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

frontend_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'frontend')
app.mount("/frontend", StaticFiles(directory=frontend_dir, html=True), name="frontend")


@app.get("/dashboard", include_in_schema=False)
async def redirect_to_dashboard():
    """Convenience redirect to dashboard."""
    return RedirectResponse(url="/frontend/pages/dashboard.html", status_code=302)

class CropPredictionInput(BaseModel):
    """Input data for crop yield prediction."""
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
    """Prediction response data."""
    predicted_yield:  float
    yield_min:        float
    yield_max:        float
    confidence_score: float
    warnings:         List[str] = []
    is_valid_combo:   bool = True

async def get_authenticated_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Decode JWT and validate user."""
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
    """Block deactivated accounts."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")
    return current_user

@app.post("/register", response_model=Token)
async def register_new_user(new_user: UserCreate, db: Session = Depends(get_db)):
    """Create new user account."""
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
    """User login - accepts email as username."""
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
    """Get current user profile."""
    return {
        "username":   current_user.username,
        "email":      current_user.email,
        "full_name":  current_user.full_name,
        "created_at": current_user.created_at,
        "last_login": current_user.last_login,
    }

@app.post("/predict", response_model=CropPredictionResult)
async def predict_crop_yield(
    crop_input: CropPredictionInput,
    current_user: User = Depends(require_active_user),
):
    """Predict crop yield from input data."""
    try:
        input_dict = crop_input.dict()
        prediction_result = model_instance.predict(input_dict)

        def sanitize_float(val: float) -> float:
            """Handle NaN/Inf values for JSON serialization."""
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

@app.get("/metrics")
async def get_model_metrics():
    """Get model performance metrics."""
    return {
        "rmse":     model_instance.metrics.get("rmse"),
        "r2_score": model_instance.metrics.get("r2"),
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status":        "healthy",
        "model_trained": model_instance.is_trained,
        "timestamp":     datetime.utcnow(),
    }


@app.get("/")
async def root():
    """API root endpoint."""
    return {
        "message": "Smart Crop Yield Prediction API v2.0",
        "docs":    "/docs",
    }
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
