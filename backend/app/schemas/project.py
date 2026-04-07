# app/schemas/project.py
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime


class QuestionOut(BaseModel):
    id:          int
    question:    str
    order_index: int
    model_config = {"from_attributes": True}


class ProjectCreate(BaseModel):
    title:       str
    description: str
    domain:      str = "Research"
    difficulty:  int = 5
    min_trust:   float = 1.0
    apply_type:  str = "questions"
    skill_names: List[str] = []        # e.g. ["Python", "ML"]
    questions:   List[str] = []        # question strings in order


class ProjectOut(BaseModel):
    id:          UUID
    creator_id:  UUID
    title:       str
    description: str
    domain:      str
    difficulty:  int
    min_trust:   float
    apply_type:  str
    status:      str
    skills:      List[str] = []
    questions:   List[QuestionOut] = []
    applicant_count: int = 0
    time_ago:    str = ""
    created_at:  datetime
    model_config = {"from_attributes": True}


class ProjectListItem(BaseModel):
    id:          UUID
    title:       str
    description: str
    domain:      str
    difficulty:  int
    min_trust:   float
    apply_type:  str
    skills:      List[str] = []
    applicant_count: int = 0
    time_ago:    str = ""
    poster_name: str = ""
    poster_initials: str = ""
    model_config = {"from_attributes": True}