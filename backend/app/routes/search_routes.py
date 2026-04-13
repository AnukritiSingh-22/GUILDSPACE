from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from datetime import datetime

from app.database.db import get_db
from app.middleware.auth_middleware import get_current_user
from app.models.user import User
from app.models.profile import Profile
from app.models.skill import Skill, UserSkill, ProjectSkill
from app.models.project import Project

router = APIRouter(prefix="/api/search", tags=["search"])

@router.get("/users")
def search_users(q: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    q_term = f"%{q}%"
    
    # Base query for profiles
    query = db.query(Profile).outerjoin(UserSkill, Profile.user_id == UserSkill.user_id)\
                             .outerjoin(Skill, UserSkill.skill_id == Skill.id)\
                             .filter(
                                 or_(
                                     Profile.full_name.ilike(q_term),
                                     Profile.role.ilike(q_term),
                                     Profile.city.ilike(q_term),
                                     Profile.college.ilike(q_term),
                                     Skill.name.ilike(q_term)
                                 )
                             ).distinct().limit(20)
    
    profiles = query.all()
    
    results = []
    for p in profiles:
        skills = db.query(Skill.name).join(UserSkill).filter(UserSkill.user_id == p.user_id).all()
        results.append({
            "user_id": p.user_id,
            "full_name": p.full_name,
            "initials": p.initials,
            "role": p.role,
            "city": p.city,
            "trust_score": p.trust_score,
            "skills": [s[0] for s in skills]
        })
        
    return results

def format_time_ago(d: datetime) -> str:
    if not d:
        return "Unknown"
    delta = datetime.utcnow() - d
    if delta.days > 0:
        return f"{delta.days}d ago"
    hours = delta.seconds // 3600
    if hours > 0:
        return f"{hours}h ago"
    minutes = delta.seconds // 60
    if minutes > 0:
        return f"{minutes}m ago"
    return "Just now"

@router.get("/projects")
def search_projects(q: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    q_term = f"%{q}%"
    
    query = db.query(Project).outerjoin(ProjectSkill, Project.id == ProjectSkill.project_id)\
                             .outerjoin(Skill, ProjectSkill.skill_id == Skill.id)\
                             .filter(
                                 Project.status == "open",
                                 or_(
                                     Project.title.ilike(q_term),
                                     Project.description.ilike(q_term),
                                     Project.domain.ilike(q_term),
                                     Skill.name.ilike(q_term)
                                 )
                             ).distinct().order_by(desc(Project.created_at)).limit(20)
    
    projects = query.all()
    
    results = []
    for p in projects:
        skills = db.query(Skill.name).join(ProjectSkill).filter(ProjectSkill.project_id == p.id).all()
        poster = db.query(Profile).filter(Profile.user_id == p.creator_id).first()
        
        results.append({
            "id": p.id,
            "title": p.title,
            "domain": p.domain,
            "difficulty": p.difficulty,
            "min_trust": p.min_trust,
            "skills": [s[0] for s in skills],
            "poster_name": poster.full_name if poster else "Unknown",
            "poster_initials": poster.initials if poster else "?",
            "time_ago": format_time_ago(p.created_at)
        })
        
    return results
