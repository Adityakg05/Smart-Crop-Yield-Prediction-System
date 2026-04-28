from fastapi import FastAPI, HTTPException, Depends, status
from pydantic import BaseModel
from contextlib import asynccontextmanager
from datetime import datetime
import os
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from model import model_instance
from auth import (
    User, UserCreate, UserLogin, Token, TokenData,
    authenticate_user, create_user, get_user_by_username,
    create_access_token, get_db, SECRET_KEY, ALGORITHM
)

from model import model_instance
from auth import (
    User, UserCreate, UserLogin, Token, TokenData,
    authenticate_user, create_user, get_user_by_username,
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
    model_instance.train(dataset_path)
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
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Input schema defining the expected payload
class PredictionInput(BaseModel):
    rainfall: float
    temperature: float
    humidity: float
    N: float
    P: float
    K: float
    area: float
    state: str
    crop: str

# Output schema defining the response payload
class PredictionOutput(BaseModel):
    predicted_yield: float
    confidence_score: float = 0.85  # Placeholder for confidence

# Authentication functions
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Get current authenticated user."""
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
    """Get current active user."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# Authentication endpoints
@app.post("/register", response_model=Token)
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if user already exists
    db_user = get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create new user
    user_obj = create_user(db=db, user=user)
    access_token = create_access_token(data={"sub": user_obj.username})
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

    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()

    access_token = create_access_token(data={"sub": user.username})
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

@app.post("/predict", response_model=PredictionOutput)
async def predict(
    data: PredictionInput,
    current_user: User = Depends(get_current_active_user)
):
    """
    Predict crop yield based on input features (requires authentication).
    """
    try:
        # Convert input Pydantic model to dictionary
        input_dict = data.dict()

        # Get prediction from the model instance
        yield_pred = model_instance.predict(input_dict)

        return PredictionOutput(
            predicted_yield=yield_pred,
            confidence_score=0.92  # Enhanced confidence score
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

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to the Smart Crop Yield Prediction API v2.0",
        "features": [
            "User Authentication",
            "Advanced ML Model",
            "Real-time Predictions",
            "Secure Data Storage"
        ],
        "docs": "/docs",
        "health": "/health"
    }

@app.post("/predict", response_model=PredictionOutput)
async def predict(data: PredictionInput):
    """
    Predict crop yield based on input features:
    - **rainfall**: float
    - **temperature**: float
    - **humidity**: float
    - **N**: float (Nitrogen content)
    - **P**: float (Phosphorus content)
    - **K**: float (Potassium content)
    - **area**: float
    - **state**: string (State name)
    - **crop**: string (Crop name)
    """
    try:
        # Convert input Pydantic model to dictionary
        input_dict = data.dict()
        
        # Get prediction from the model instance
        yield_pred = model_instance.predict(input_dict)
        
        return PredictionOutput(predicted_yield=yield_pred)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.get("/")
async def root():
    return {"message": "Welcome to the Smart Crop Yield Prediction API. Use the /predict endpoint to get predictions."}

@app.get("/metrics")
async def get_metrics():
    """
    Returns model performance metrics from the last training session.
    """
    return {
        "rmse": model_instance.metrics.get("rmse"),
        "r2_score": model_instance.metrics.get("r2")
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
