# app/models/user.py
# ─────────────────────────────────────────────────────────────────────────────
# TABLE: users
# Core authentication record — email + hashed password only.
# All display info is in the profiles table (one-to-one).
# ─────────────────────────────────────────────────────────────────────────────

import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.db import Base


class User(Base):
    __tablename__ = "users"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email      = Column(String(255), unique=True, nullable=False, index=True)
    password   = Column(String(255), nullable=False)   # bcrypt hash
    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    profile      = relationship("Profile",     back_populates="user",      uselist=False, cascade="all, delete-orphan")
    projects     = relationship("Project",     back_populates="creator",   cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="applicant", cascade="all, delete-orphan")
    skills       = relationship("UserSkill",   back_populates="user",      cascade="all, delete-orphan")
    trust_events = relationship("TrustEvent",  back_populates="user",      cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User id={self.id} email={self.email}>"