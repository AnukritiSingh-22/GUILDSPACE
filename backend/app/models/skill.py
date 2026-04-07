# app/models/skill.py
# ─────────────────────────────────────────────────────────────────────────────
# TABLE: skills         — master list of skill names
# TABLE: user_skills    — junction (users  <-> skills)
# TABLE: project_skills — junction (projects <-> skills)
# ─────────────────────────────────────────────────────────────────────────────

from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.db import Base


class Skill(Base):
    __tablename__ = "skills"

    id   = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(80), unique=True, nullable=False)   # e.g. "Python"

    user_skills    = relationship("UserSkill",    back_populates="skill")
    project_skills = relationship("ProjectSkill", back_populates="skill")

    def __repr__(self):
        return f"<Skill {self.name}>"


class UserSkill(Base):
    """Junction table: which skills a user has."""
    __tablename__ = "user_skills"
    __table_args__ = (UniqueConstraint("user_id", "skill_id"),)

    user_id  = Column(UUID(as_uuid=True), ForeignKey("users.id",  ondelete="CASCADE"), primary_key=True)
    skill_id = Column(Integer,            ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True)

    user  = relationship("User",  back_populates="skills")
    skill = relationship("Skill", back_populates="user_skills")


class ProjectSkill(Base):
    """Junction table: which skills a project requires."""
    __tablename__ = "project_skills"
    __table_args__ = (UniqueConstraint("project_id", "skill_id"),)

    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True)
    skill_id   = Column(Integer,            ForeignKey("skills.id",   ondelete="CASCADE"), primary_key=True)

    project = relationship("Project", back_populates="skills")
    skill   = relationship("Skill",   back_populates="project_skills")