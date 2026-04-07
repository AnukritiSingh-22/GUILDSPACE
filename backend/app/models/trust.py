# app/models/trust.py
# ─────────────────────────────────────────────────────────────────────────────
# TABLE: trust_events
# Audit trail of every change to a user's trust score.
# The profile.trust_score is the running total; trust_events records why.
# ─────────────────────────────────────────────────────────────────────────────

from datetime import datetime
from sqlalchemy import Column, Integer, Numeric, Text, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.db import Base


class TrustEvent(Base):
    __tablename__ = "trust_events"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    user_id    = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)

    # e.g. "project_completed", "peer_rating", "signup_bonus"
    event_type = Column(String(50), nullable=False)
    delta      = Column(Numeric(4, 2), nullable=False)   # +1.20 or -0.50
    reason     = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="trust_events")

    def __repr__(self):
        return f"<TrustEvent user={self.user_id} delta={self.delta} type={self.event_type}>"