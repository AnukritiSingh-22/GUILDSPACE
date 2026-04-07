# app/routes/project_routes.py
# ─────────────────────────────────────────────────────────────────────────────
#   POST   /api/projects          — create a project (authenticated)
#   GET    /api/projects          — list/filter all open projects
#   GET    /api/projects/mine     — projects created by the logged-in user
#   GET    /api/projects/{id}     — single project detail
#   PUT    /api/projects/{id}     — update project (creator only)
#   DELETE /api/projects/{id}     — delete project (creator only)
# ─────────────────────────────────────────────────────────────────────────────

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.database.db import get_db
from app.models.user import User
from app.models.project import Project, ProjectQuestion
from app.models.skill import Skill, ProjectSkill, UserSkill
from app.models.application import Application
from app.schemas.project import ProjectCreate, ProjectOut, ProjectListItem
from app.middleware.auth_middleware import get_current_user
from app.utils.helpers import time_ago

router = APIRouter(prefix="/api/projects", tags=["projects"])


def _build_project_out(project: Project, db: Session) -> dict:
    """Helper — assemble the full ProjectOut dict from an ORM object."""
    skill_names = [ps.skill.name for ps in project.skills]
    count       = db.query(Application).filter(Application.project_id == project.id).count()
    poster      = project.creator.profile

    return {
        "id":              project.id,
        "creator_id":      project.creator_id,
        "title":           project.title,
        "description":     project.description,
        "domain":          project.domain.value if hasattr(project.domain, "value") else project.domain,
        "difficulty":      project.difficulty,
        "min_trust":       float(project.min_trust),
        "apply_type":      project.apply_type.value if hasattr(project.apply_type, "value") else project.apply_type,
        "status":          project.status.value if hasattr(project.status, "value") else project.status,
        "skills":          skill_names,
        "questions":       project.questions,
        "applicant_count": count,
        "time_ago":        time_ago(project.created_at),
        "created_at":      project.created_at,
        "poster_name":     poster.full_name if poster else "",
        "poster_initials": poster.initials  if poster else "",
    }


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/projects
# ─────────────────────────────────────────────────────────────────────────────
@router.post("", response_model=ProjectOut, status_code=201)
def create_project(
    payload:      ProjectCreate,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db),
):
    # 1. Create project row
    project = Project(
        creator_id  = current_user.id,
        title       = payload.title,
        description = payload.description,
        domain      = payload.domain,
        difficulty  = max(1, min(10, payload.difficulty)),
        min_trust   = payload.min_trust,
        apply_type  = payload.apply_type,
    )
    db.add(project)
    db.flush()

    # 2. Attach required skills (upsert into master skills table)
    for name in payload.skill_names:
        name = name.strip()
        if not name:
            continue
        skill = db.query(Skill).filter(Skill.name == name).first()
        if not skill:
            skill = Skill(name=name)
            db.add(skill)
            db.flush()
        db.add(ProjectSkill(project_id=project.id, skill_id=skill.id))

    # 3. Attach questions in order
    for i, q_text in enumerate(payload.questions):
        if q_text.strip():
            db.add(ProjectQuestion(
                project_id  = project.id,
                question    = q_text.strip(),
                order_index = i,
            ))

    db.commit()
    db.refresh(project)
    return _build_project_out(project, db)


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/projects  — paginated list with optional filters
# ─────────────────────────────────────────────────────────────────────────────
@router.get("", response_model=List[ProjectOut])
def list_projects(
    domain:     Optional[str] = Query(None),
    max_diff:   Optional[int] = Query(None, ge=1, le=10),
    skill:      Optional[str] = Query(None),
    page:       int           = Query(1, ge=1),
    page_size:  int           = Query(20, ge=1, le=100),
    db:         Session       = Depends(get_db),
    current_user: User        = Depends(get_current_user),
):
    q = db.query(Project).filter(Project.status == "open")

    if domain:
        q = q.filter(Project.domain == domain)
    if max_diff:
        q = q.filter(Project.difficulty <= max_diff)
    if skill:
        q = (q
             .join(ProjectSkill, Project.id == ProjectSkill.project_id)
             .join(Skill, ProjectSkill.skill_id == Skill.id)
             .filter(Skill.name.ilike(f"%{skill}%")))

    projects = (q
                .order_by(Project.created_at.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
                .all())

    return [_build_project_out(p, db) for p in projects]


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/projects/mine
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/mine", response_model=List[ProjectOut])
def my_projects(
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db),
):
    projects = (db.query(Project)
                .filter(Project.creator_id == current_user.id)
                .order_by(Project.created_at.desc())
                .all())
    return [_build_project_out(p, db) for p in projects]


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/projects/{project_id}
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id:   UUID,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return _build_project_out(project, db)


# ─────────────────────────────────────────────────────────────────────────────
# PUT /api/projects/{project_id}  (creator only)
# ─────────────────────────────────────────────────────────────────────────────
@router.put("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id:   UUID,
    payload:      ProjectCreate,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if str(project.creator_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not your project")

    project.title       = payload.title
    project.description = payload.description
    project.domain      = payload.domain
    project.difficulty  = payload.difficulty
    project.min_trust   = payload.min_trust
    project.apply_type  = payload.apply_type

    # Replace skills
    db.query(ProjectSkill).filter(ProjectSkill.project_id == project.id).delete()
    for name in payload.skill_names:
        name = name.strip()
        skill = db.query(Skill).filter(Skill.name == name).first()
        if not skill:
            skill = Skill(name=name)
            db.add(skill)
            db.flush()
        db.add(ProjectSkill(project_id=project.id, skill_id=skill.id))

    # Replace questions
    db.query(ProjectQuestion).filter(ProjectQuestion.project_id == project.id).delete()
    for i, q_text in enumerate(payload.questions):
        if q_text.strip():
            db.add(ProjectQuestion(project_id=project.id, question=q_text.strip(), order_index=i))

    db.commit()
    db.refresh(project)
    return _build_project_out(project, db)


# ─────────────────────────────────────────────────────────────────────────────
# DELETE /api/projects/{project_id}  (creator only)
# ─────────────────────────────────────────────────────────────────────────────
@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id:   UUID,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if str(project.creator_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not your project")
    db.delete(project)
    db.commit()