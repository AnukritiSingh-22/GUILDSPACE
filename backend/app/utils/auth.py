# app/utils/auth.py
# ─────────────────────────────────────────────────────────────────────────────
# Password hashing with bcrypt and JWT token creation/verification.
# ─────────────────────────────────────────────────────────────────────────────

from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from app.database.config import settings

# bcrypt context — automatically salts + hashes
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    """Hash a plain-text password. Store the result in DB."""
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Return True if plain matches the stored hash."""
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict) -> str:
    """
    Create a signed JWT containing `data`.
    Automatically adds an `exp` (expiry) claim.
    """
    payload = data.copy()
    expire  = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload.update({"exp": expire})
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    """
    Decode and verify a JWT.
    Raises JWTError if invalid or expired.
    """
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])