# app/models/project.py
# ─────────────────────────────────────────────────────────────────────────────
# TABLE: projects          — a collaboration post
# TABLE: project_questions — custom apply questions set by the creator
# ─────────────────────────────────────────────────────────────────────────────

import uuid
from datetime import datetime
from sqlalchemy import (Column, String, Text, SmallInteger, Numeric,
                        DateTime, ForeignKey, Enum as SAEnum)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from app.database.db import Base


class DomainEnum(str, enum.Enum):
    research   = "Research"
    tech       = "Tech / Dev"
    design     = "Design"
    science    = "Science"
    social     = "Social / NGO"


class ApplyTypeEnum(str, enum.Enum):
    oneclick  = "oneclick"
    questions = "questions"


class ProjectStatusEnum(str, enum.Enum):
    open        = "open"
    in_progress = "in_progress"
    completed   = "completed"
    closed      = "closed"
    hidden      = "hidden"


class Project(Base):
    __tablename__ = "projects"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    creator_id  = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    title       = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    domain      = Column(SAEnum(DomainEnum,      name="domain_enum"),       default=DomainEnum.research)
    apply_type  = Column(SAEnum(ApplyTypeEnum,   name="apply_type_enum"),   default=ApplyTypeEnum.questions)
    status      = Column(SAEnum(ProjectStatusEnum, name="project_status_enum"), default=ProjectStatusEnum.open)

    difficulty  = Column(SmallInteger, nullable=False, default=5)   # 1–10
    min_trust   = Column(Numeric(4, 2), default=1.0)

    created_at  = Column(DateTime, default=datetime.utcnow)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    creator      = relationship("User",            back_populates="projects")
    skills       = relationship("ProjectSkill",    back_populates="project", cascade="all, delete-orphan")
    questions    = relationship("ProjectQuestion", back_populates="project", cascade="all, delete-orphan",
                                order_by="ProjectQuestion.order_index")
    applications = relationship("Application",     back_populates="project", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Project id={self.id} title={self.title[:30]}>"


class ProjectQuestion(Base):
    """Custom questions the project creator wants applicants to answer."""
    __tablename__ = "project_questions"

    id          = Column(Integer if False else SmallInteger, primary_key=True, autoincrement=True)
    project_id  = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    question    = Column(Text, nullable=False)
    order_index = Column(SmallInteger, default=0)

    project = relationship("Project", back_populates="questions")

    # Fix: use Integer for autoincrement PK
    from sqlalchemy import Integer
    id = Column(Integer, primary_key=True, autoincrement=True)