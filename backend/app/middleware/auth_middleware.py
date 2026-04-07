# app/middleware/auth_middleware.py
# ─────────────────────────────────────────────────────────────────────────────
# FastAPI dependency that extracts + validates the JWT from the
# Authorization header and returns the current User ORM object.
#
# Usage in any protected route:
#   current_user: User = Depends(get_current_user)
# ─────────────────────────────────────────────────────────────────────────────

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError

from app.database.db import get_db
from app.models.user import User
from app.utils.auth import decode_token

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    1. Extract the Bearer token from the Authorization header.
    2. Decode + verify the JWT signature and expiry.
    3. Look up the user in the database.
    4. Return the User ORM object (or raise 401).
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        token   = credentials.credentials
        payload = decode_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None or not user.is_active:
        raise credentials_exception

    return user