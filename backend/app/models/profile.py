# app/models/profile.py
# ─────────────────────────────────────────────────────────────────────────────
# TABLE: profiles
# One-to-one with users. Stores all display/bio/trust info.
# Separated from users so auth stays clean.
# ─────────────────────────────────────────────────────────────────────────────

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Numeric, SmallInteger, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.db import Base


class Profile(Base):
    __tablename__ = "profiles"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id       = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    # Display info
    full_name     = Column(String(100), nullable=False)
    initials      = Column(String(4),   nullable=False)   # e.g. "AR"
    role          = Column(String(100))                   # e.g. "ML Engineer"
    city          = Column(String(100))
    college       = Column(String(150))
    bio           = Column(Text)
    interests     = Column(Text)
    avatar_url    = Column(String(500))

    # Links
    github_url    = Column(String(255))
    arxiv_url     = Column(String(255))
    portfolio_url = Column(String(255))

    # Trust
    trust_score   = Column(Numeric(4, 2), default=1.0)    # 1.00 – 10.00
    trust_level   = Column(SmallInteger,  default=1)      # 1–10

    created_at    = Column(DateTime, default=datetime.utcnow)
    updated_at    = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="profile")

    def __repr__(self):
        return f"<Profile user_id={self.user_id} name={self.full_name}>"