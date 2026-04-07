# app/database/db.py
# ─────────────────────────────────────────────────────────────────────────────
# SQLAlchemy engine, session factory, and the Base class all models inherit.
# FastAPI routes get a DB session via the get_db() dependency.
# ─────────────────────────────────────────────────────────────────────────────

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.database.config import settings

# Create the engine — pool_pre_ping checks dead connections automatically
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    echo=settings.DEBUG,          # logs SQL when DEBUG=True
)

# Session factory — each request gets its own session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# All ORM models inherit from this
Base = declarative_base()


def get_db():
    """
    FastAPI dependency. Yields a DB session and closes it after the request.

    Usage in any route:
        db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()