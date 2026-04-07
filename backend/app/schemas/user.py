# app/schemas/user.py
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime


class SkillOut(BaseModel):
    id:   int
    name: str
    model_config = {"from_attributes": True}


class ProfileOut(BaseModel):
    id:            UUID
    user_id:       UUID
    full_name:     str
    initials:      str
    role:          Optional[str]
    city:          Optional[str]
    college:       Optional[str]
    bio:           Optional[str]
    interests:     Optional[str]
    github_url:    Optional[str]
    arxiv_url:     Optional[str]
    portfolio_url: Optional[str]
    trust_score:   float
    trust_level:   int
    model_config = {"from_attributes": True}


class ProfileUpdate(BaseModel):
    full_name:     Optional[str] = None
    role:          Optional[str] = None
    city:          Optional[str] = None
    college:       Optional[str] = None
    bio:           Optional[str] = None
    interests:     Optional[str] = None
    github_url:    Optional[str] = None
    arxiv_url:     Optional[str] = None
    portfolio_url: Optional[str] = None


class MeResponse(BaseModel):
    id:         UUID
    email:      str
    profile:    ProfileOut
    skills:     List[SkillOut] = []
    created_at: datetime
    model_config = {"from_attributes": True}