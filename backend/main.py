from fastapi import FastAPI, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import List
from contextlib import asynccontextmanager
from datetime import datetime
import os
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from .model import model_instance
from .auth import (
    User, UserCreate, UserLogin, Token, TokenData,
    authenticate_user, create_user, get_user_by_username, get_user_by_email,
    create_access_token, get_db, SECRET_KEY, ALGORITHM
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager to handle application startup and shutdown events.
    Trains the machine learning model on startup.
    """
    print("Application startup: Initializing and training the model...")
    # Determine the path to dataset.csv relative to backend directory
    dataset_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'dataset.csv')
    try:
        model_instance.train(dataset_path)
    except Exception as e:
        print(f"Error training model on startup: {e}")
    yield
    print("Application shutdown.")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

app = FastAPI(
    title="Smart Crop Yield Prediction System",
    description="API for predicting crop yield based on environmental and soil parameters with user authentication.",
    version="2.0.0",
    lifespan=lifespan
)

# Add CORS middleware to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve frontend static files
frontend_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend')
app.mount("/frontend", StaticFiles(directory=frontend_dir, html=True), name="frontend")


@app.get("/dashboard")
async def dashboard_route():
    """Crop prediction UI (same as /frontend/dashboard.html)."""
    return RedirectResponse(url="/frontend/dashboard.html", status_code=302)

# Input schema defining the expected payload
class PredictionInput(BaseModel):
    rainfall: float = Field(..., ge=0, le=500)
    temperature: float = Field(..., ge=0, le=50)
    humidity: float = Field(..., ge=10, le=100)
    N: float = Field(..., ge=0, le=150)
    P: float = Field(..., ge=0, le=150)
    K: float = Field(..., ge=0, le=200)
    area: float = Field(..., ge=0.1, le=100)
    state: str
    crop: str

# Output schema defining the response payload
class PredictionOutput(BaseModel):
    predicted_yield: float
    yield_min: float
    yield_max: float
    confidence_score: float
    warnings: List[str] = []
    is_valid_combo: bool = True

# Authentication functions
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Dependency to validate the JWT token and return the current user.
    
    Args:
        token: JWT access token from the Authorization header
        db: Database session dependency
        
    Returns:
        User: The authenticated User object
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception

    user = get_user_by_username(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    """
    Dependency to ensure the authenticated user is active.
    
    Args:
        current_user: User object from get_current_user dependency
        
    Returns:
        User: The active User object
        
    Raises:
        HTTPException: If user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# Authentication endpoints
@app.post("/register", response_model=Token)
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    if get_user_by_username(db, username=user.username):
        raise HTTPException(status_code=400, detail="Username already registered")
    if get_user_by_email(db, email=user.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    user_obj = create_user(db=db, user=user)
    access_token = create_access_token(data={"sub": str(user_obj.username)})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login endpoint."""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user.last_login = datetime.utcnow()
    db.commit()
    access_token = create_access_token(data={"sub": str(user.username)})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me")
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """Get current user information."""
    return {
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "created_at": current_user.created_at,
        "last_login": current_user.last_login
    }

# Core endpoints
@app.post("/predict", response_model=PredictionOutput)
async def predict(
    data: PredictionInput,
    current_user: User = Depends(get_current_active_user)
):
    """
    Predict crop yield based on input features (requires authentication).
    """
    print(f"DEBUG: Received prediction request: {data}")
    try:
        input_dict = data.dict()
        result = model_instance.predict(input_dict)
        
        # Helper to handle NaN/Inf values which are not JSON serializable
        def sanitize(val):
            import math
            if isinstance(val, float) and (math.isnan(val) or math.isinf(val)):
                return 0.0
            return val

        return PredictionOutput(
            predicted_yield=sanitize(result["yield"]),
            yield_min=sanitize(result["yield_min"]),
            yield_max=sanitize(result["yield_max"]),
            confidence_score=sanitize(result["confidence"]),
            warnings=result["warnings"],
            is_valid_combo=result.get("is_valid_combo", True)
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "model_trained": model_instance.is_trained,
        "timestamp": datetime.utcnow()
    }

@app.get("/metrics")
async def get_metrics():
    """Returns model performance metrics from the last training session."""
    return {
        "rmse": model_instance.metrics.get("rmse"),
        "r2_score": model_instance.metrics.get("r2")
    }

@app.get("/")
async def root():
    """Root welcome message and overview."""
    return {
        "message": "Welcome to the Smart Crop Yield Prediction API v2.0",
        "features": [
            "User Authentication (JWT)",
            "Advanced RandomForest ML Model",
            "Real-time Crop Yield Predictions",
            "Secure SQLite Data Storage"
        ],
        "endpoints": {
            "prediction": "/predict (POST, Auth Required)",
            "auth_token": "/token (POST)",
            "registration": "/register (POST)",
            "documentation": "/docs",
            "health_check": "/health"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
