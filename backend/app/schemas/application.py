# app/schemas/application.py
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime


class AnswerIn(BaseModel):
    question_id: int
    answer:      str


class ApplicationCreate(BaseModel):
    project_id: UUID
    answers:    List[AnswerIn] = []
    link:       Optional[str] = None


class ApplicantOut(BaseModel):
    application_id: UUID
    applicant_id:   UUID
    full_name:      str
    initials:       str
    role:           Optional[str]
    city:           Optional[str]
    trust_score:    float
    projects_done:  int
    skills:         List[str] = []
    answers:        List[dict] = []   # [{question, answer}, ...]
    ai_fit_score:   Optional[int]
    status:         str
    link:           Optional[str]
    applied_at:     datetime
    model_config = {"from_attributes": True}


class ApplicationStatusUpdate(BaseModel):
    status: str   # "shortlisted" | "accepted" | "rejected"


class MyApplicationOut(BaseModel):
    application_id: UUID
    project_id:     UUID
    project_title:  str
    project_domain: str
    status:         str
    applied_at:     datetime
    model_config = {"from_attributes": True}