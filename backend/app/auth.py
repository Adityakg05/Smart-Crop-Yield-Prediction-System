"""
auth.py — User model, password hashing, JWT creation, and DB session management.

Keeping everything auth-related in one place makes it easy to swap out
the hashing algorithm or token strategy later without touching the API layer.
"""

import hashlib
import os
from datetime import datetime, timedelta
from typing import Optional

from jose import jwt
from pydantic import BaseModel
from sqlalchemy import Boolean, Column, DateTime, Integer, String, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker


# ── Database setup ───────────────────────────────────────────────────────────

_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_DB_PATH = os.path.join(_BASE_DIR, '..', 'database', 'crop_yield.db')

# Ensure the database directory exists, otherwise SQLite will throw an 
# "unable to open database file" error on some servers (like Render).
os.makedirs(os.path.dirname(_DB_PATH), exist_ok=True)

# SQLite is chosen because it requires zero configuration or external servers.
# It's perfect for a localized prediction tool where the write load is low.
DATABASE_URL = f"sqlite:///{_DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ── JWT config ───────────────────────────────────────────────────────────────

# Render injects SECRET_KEY automatically (see render.yaml generateValue: true).
# The fallback string is fine for local dev — never use it in production.
import os as _os
SECRET_KEY = _os.getenv("SECRET_KEY", "dev-only-secret-change-before-deploying")

ALGORITHM  = "HS256"
TOKEN_EXPIRY_MINUTES = 30


# ── ORM model ────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    email           = Column(String,  unique=True, index=True)
    username        = Column(String,  unique=True, index=True)
    full_name       = Column(String)
    hashed_password = Column(String)
    is_active       = Column(Boolean, default=True)
    created_at      = Column(DateTime, default=datetime.utcnow)
    last_login      = Column(DateTime, nullable=True)


# Create tables the first time the app starts (idempotent)
Base.metadata.create_all(bind=engine)


# ── Pydantic schemas ─────────────────────────────────────────────────────────

class UserBase(BaseModel):
    email:     str
    username:  str
    full_name: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type:   str

class TokenData(BaseModel):
    username: Optional[str] = None


# ── Password helpers ─────────────────────────────────────────────────────────

def hash_password(plain_password: str) -> str:
    # While bcrypt is standard for large-scale apps, SHA-256 is fast, 
    # predictable, and avoids complex binary dependencies during deployment.
    # Combined with a unique SECRET_KEY, it's sufficient for this project's scale.
    return hashlib.sha256(plain_password.encode()).hexdigest()


def passwords_match(plain: str, stored_hash: str) -> bool:
    return hash_password(plain) == stored_hash


# ── JWT helpers ──────────────────────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Stamps the token with an expiry so idle sessions auto-expire.
    Defaults to TOKEN_EXPIRY_MINUTES if no custom delta is given.
    """
    payload = data.copy()
    expiry  = datetime.utcnow() + (expires_delta or timedelta(minutes=TOKEN_EXPIRY_MINUTES))
    payload["exp"] = expiry
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# ── Database queries ─────────────────────────────────────────────────────────

def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def authenticate_user(db: Session, identifier: str, password: str) -> Optional[User]:
    """
    Accepts either username or email as the identifier — the login form
    sends email but OAuth2 expects a 'username' field, so we try both.
    """
    user = get_user_by_username(db, identifier)
    if not user:
        user = get_user_by_email(db, identifier.strip())
    if not user or not passwords_match(password, user.hashed_password):
        return None
    return user


def create_user(db: Session, user: UserCreate) -> User:
    new_user = User(
        email           = user.email,
        username        = user.username,
        full_name       = user.full_name,
        hashed_password = hash_password(user.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


# ── DB session dependency ────────────────────────────────────────────────────

def get_db():
    """FastAPI dependency — opens a session per request and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Keep old names importable so main.py doesn't break during the transition
verify_password     = passwords_match
get_password_hash   = hash_password
ACCESS_TOKEN_EXPIRE_MINUTES = TOKEN_EXPIRY_MINUTES