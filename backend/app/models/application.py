# app/models/application.py
# ─────────────────────────────────────────────────────────────────────────────
# TABLE: applications        — a user applying to a project
# TABLE: application_answers — answers to project questions
# ─────────────────────────────────────────────────────────────────────────────

import uuid
from datetime import datetime
from sqlalchemy import (Column, Integer, Text, SmallInteger,
                        DateTime, ForeignKey, Enum as SAEnum, UniqueConstraint)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from app.database.db import Base


class ApplicationStatusEnum(str, enum.Enum):
    pending     = "pending"
    accepted    = "accepted"
    rejected    = "rejected"


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (
        # One application per user per project
        UniqueConstraint("project_id", "applicant_id", name="uq_application"),
    )

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id   = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    applicant_id = Column(UUID(as_uuid=True), ForeignKey("users.id",    ondelete="CASCADE"), nullable=False)
    status       = Column(SAEnum(ApplicationStatusEnum, name="app_status_enum"),
                          default=ApplicationStatusEnum.pending, nullable=False)
    ai_fit_score = Column(SmallInteger)        # 0–100, set by AI service
    link         = Column(Text)                # optional portfolio link
    rating       = Column(SmallInteger, nullable=True) # 1-5 user rating

    created_at   = Column(DateTime, default=datetime.utcnow)
    updated_at   = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project   = relationship("Project", back_populates="applications")
    applicant = relationship("User",    back_populates="applications")
    answers   = relationship("ApplicationAnswer", back_populates="application",
                             cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Application project={self.project_id} user={self.applicant_id} status={self.status}>"


class ApplicationAnswer(Base):
    """Stores one answer per question per application."""
    __tablename__ = "application_answers"

    id             = Column(Integer, primary_key=True, autoincrement=True)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    question_id    = Column(Integer, ForeignKey("project_questions.id", ondelete="CASCADE"), nullable=False)
    answer         = Column(Text, nullable=False)

    application = relationship("Application", back_populates="answers")
    question    = relationship("ProjectQuestion")