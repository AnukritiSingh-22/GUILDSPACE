# app/routes/ai_routes.py
# ─────────────────────────────────────────────────────────────────────────────
#   GET /api/ai/feed        — AI-ranked project list for the logged-in user
#   GET /api/ai/skills      — all skills in the system (for autocomplete)
# ─────────────────────────────────────────────────────────────────────────────

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.db import get_db
from app.models.user import User
from app.models.project import Project
from app.models.skill import Skill, UserSkill, ProjectSkill
from app.models.application import Application
from app.middleware.auth_middleware import get_current_user
from app.services.ranking_service import rank_projects_for_user
from app.utils.helpers import time_ago

router = APIRouter(prefix="/api/ai", tags=["ai"])


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/ai/feed
# Returns projects ranked by AI relevance for the current user
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/feed")
def ai_feed(
    domain:       Optional[str] = Query(None),
    max_diff:     Optional[int] = Query(None),
    current_user: User          = Depends(get_current_user),
    db:           Session       = Depends(get_db),
):
    # 1. Get user skills
    user_skills = [
        s.name for s in
        db.query(Skill)
          .join(UserSkill, Skill.id == UserSkill.skill_id)
          .filter(UserSkill.user_id == current_user.id)
          .all()
    ]
    user_trust = float(current_user.profile.trust_score)

    # 2. Query open projects (exclude user's own + already applied)
    applied_ids = [
        str(a.project_id) for a in
        db.query(Application.project_id)
          .filter(Application.applicant_id == current_user.id)
          .all()
    ]

    q = (db.query(Project)
         .filter(Project.status == "open")
         .filter(Project.creator_id != current_user.id))

    if domain:
        q = q.filter(Project.domain == domain)
    if max_diff:
        q = q.filter(Project.difficulty <= max_diff)

    projects = q.order_by(Project.created_at.desc()).limit(50).all()

    # 3. Rank using ranking service
    ranked = rank_projects_for_user(
        projects    = projects,
        user_skills = user_skills,
        user_trust  = user_trust,
        applied_ids = applied_ids,
        db          = db,
    )

    # 4. Shape response
    result = []
    for item in ranked:
        p         = item["project"]
        skills    = [ps.skill.name for ps in p.skills]
        count     = db.query(Application).filter(Application.project_id == p.id).count()
        poster    = p.creator.profile

        result.append({
            "id":               str(p.id),
            "title":            p.title,
            "description":      p.description,
            "domain":           p.domain.value if hasattr(p.domain, "value") else p.domain,
            "difficulty":       p.difficulty,
            "min_trust":        float(p.min_trust),
            "apply_type":       p.apply_type.value if hasattr(p.apply_type, "value") else p.apply_type,
            "skills":           skills,
            "questions":        [{"id": q.id, "question": q.question} for q in p.questions],
            "applicant_count":  count,
            "time_ago":         time_ago(p.created_at),
            "poster_name":      poster.full_name if poster else "",
            "poster_initials":  poster.initials  if poster else "",
            "ai_match":         item["score"],          # 0–100
            "already_applied":  item["already_applied"],
            "can_apply":        user_trust >= float(p.min_trust),
        })

    return {"projects": result, "total": len(result)}


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/ai/skills  — all skill names for frontend autocomplete
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/skills")
def all_skills(db: Session = Depends(get_db)):
    skills = db.query(Skill).order_by(Skill.name).all()
    return [{"id": s.id, "name": s.name} for s in skills]