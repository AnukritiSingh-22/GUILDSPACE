# app/routes/application_routes.py
# ─────────────────────────────────────────────────────────────────────────────
#   POST /api/applications                     — apply to a project
#   GET  /api/applications/mine                — my submitted applications
#   GET  /api/applications/project/{id}        — all applicants for a project (creator only)
#   PUT  /api/applications/{id}/status         — update applicant status (creator only)
#   DELETE /api/applications/{id}              — withdraw application (applicant only)
# ─────────────────────────────────────────────────────────────────────────────

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database.db import get_db
from app.models.user import User
from app.models.project import Project, ProjectQuestion
from app.models.application import Application, ApplicationAnswer
from app.models.skill import Skill, UserSkill
from app.models.trust import TrustEvent
from app.models.profile import Profile
from app.schemas.application import (
    ApplicationCreate, ApplicantOut,
    ApplicationStatusUpdate, MyApplicationOut,
)
from app.middleware.auth_middleware import get_current_user
from app.services.ranking_service import compute_fit_score
from app.utils.helpers import compute_trust_level

router = APIRouter(prefix="/api/applications", tags=["applications"])


def _get_user_skill_names(user_id, db: Session):
    return [
        s.name for s in
        db.query(Skill)
          .join(UserSkill, Skill.id == UserSkill.skill_id)
          .filter(UserSkill.user_id == user_id)
          .all()
    ]


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/applications
# ─────────────────────────────────────────────────────────────────────────────
@router.post("", status_code=201)
def apply_to_project(
    payload:      ApplicationCreate,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Cannot apply to own project
    if str(project.creator_id) == str(current_user.id):
        raise HTTPException(status_code=400, detail="You cannot apply to your own project")

    # Check trust gate
    user_trust = float(current_user.profile.trust_score)
    if user_trust < float(project.min_trust):
        raise HTTPException(
            status_code=403,
            detail=f"Trust score {user_trust} is below required {project.min_trust}",
        )

    # Check not already applied
    existing = (db.query(Application)
                .filter(Application.project_id == payload.project_id,
                        Application.applicant_id == current_user.id)
                .first())
    if existing:
        raise HTTPException(status_code=400, detail="Already applied to this project")

    # Compute AI fit score
    user_skills   = _get_user_skill_names(current_user.id, db)
    project_skills = [ps.skill.name for ps in project.skills]
    fit_score = compute_fit_score(
        user_skills    = user_skills,
        project_skills = project_skills,
        user_trust     = user_trust,
        min_trust      = float(project.min_trust),
    )

    # Create application
    application = Application(
        project_id   = payload.project_id,
        applicant_id = current_user.id,
        ai_fit_score = fit_score,
        link         = payload.link,
    )
    db.add(application)
    db.flush()

    # Save answers
    for ans in payload.answers:
        question = db.query(ProjectQuestion).filter(
            ProjectQuestion.id         == ans.question_id,
            ProjectQuestion.project_id == payload.project_id,
        ).first()
        if not question:
            continue
        db.add(ApplicationAnswer(
            application_id = application.id,
            question_id    = ans.question_id,
            answer         = ans.answer,
        ))

    db.commit()
    db.refresh(application)
    return {"success": True, "application_id": str(application.id), "ai_fit_score": fit_score}


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/applications/mine
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/mine", response_model=List[MyApplicationOut])
def my_applications(
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db),
):
    apps = (db.query(Application)
            .filter(Application.applicant_id == current_user.id)
            .order_by(Application.created_at.desc())
            .all())

    result = []
    for app in apps:
        result.append({
            "application_id": app.id,
            "project_id":     app.project_id,
            "project_title":  app.project.title,
            "project_domain": (app.project.domain.value
                               if hasattr(app.project.domain, "value")
                               else app.project.domain),
            "status":         app.status.value if hasattr(app.status, "value") else app.status,
            "applied_at":     app.created_at,
        })
    return result


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/applications/project/{project_id}
# Returns all applicants — only the project creator can call this
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/project/{project_id}", response_model=List[ApplicantOut])
def get_applicants(
    project_id:   UUID,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if str(project.creator_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Only the project creator can view applicants")

    apps = (db.query(Application)
            .filter(Application.project_id == project_id)
            .order_by(Application.ai_fit_score.desc().nullslast())
            .all())

    result = []
    for app in apps:
        profile     = app.applicant.profile
        user_skills = _get_user_skill_names(app.applicant_id, db)

        # Count completed projects for this user
        from app.models.project import ProjectStatusEnum
        projects_done = (db.query(Project)
                         .join(Application, Project.id == Application.project_id)
                         .filter(Application.applicant_id == app.applicant_id,
                                 Application.status == "accepted")
                         .count())

        # Build Q&A pairs
        answers_out = []
        for ans in app.answers:
            answers_out.append({
                "question": ans.question.question if ans.question else "",
                "answer":   ans.answer,
            })

        result.append({
            "application_id": app.id,
            "applicant_id":   app.applicant_id,
            "full_name":      profile.full_name if profile else "",
            "initials":       profile.initials  if profile else "?",
            "role":           profile.role       if profile else None,
            "city":           profile.city       if profile else None,
            "trust_score":    float(profile.trust_score) if profile else 0,
            "projects_done":  projects_done,
            "skills":         user_skills,
            "answers":        answers_out,
            "ai_fit_score":   app.ai_fit_score,
            "status":         app.status.value if hasattr(app.status, "value") else app.status,
            "link":           app.link,
            "applied_at":     app.created_at,
        })
    return result


# ─────────────────────────────────────────────────────────────────────────────
# PUT /api/applications/{application_id}/status
# Creator accepts / shortlists / rejects an applicant
# ─────────────────────────────────────────────────────────────────────────────
@router.put("/{application_id}/status")
def update_application_status(
    application_id: UUID,
    payload:        ApplicationStatusUpdate,
    current_user:   User    = Depends(get_current_user),
    db:             Session = Depends(get_db),
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    project = app.project
    if str(project.creator_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Only the project creator can update status")

    allowed = {"shortlisted", "accepted", "rejected", "pending"}
    if payload.status not in allowed:
        raise HTTPException(status_code=400, detail=f"Status must be one of {allowed}")

    old_status  = app.status.value if hasattr(app.status, "value") else app.status
    app.status  = payload.status
    db.flush()

    # Award trust when accepted
    if payload.status == "accepted" and old_status != "accepted":
        profile = app.applicant.profile
        if profile:
            trust_delta        = 1.0
            profile.trust_score = min(10.0, float(profile.trust_score) + trust_delta)
            profile.trust_level = compute_trust_level(float(profile.trust_score))
            db.add(TrustEvent(
                user_id    = app.applicant_id,
                project_id = project.id,
                event_type = "project_accepted",
                delta      = trust_delta,
                reason     = f"Accepted for: {project.title[:60]}",
            ))

    db.commit()
    return {"success": True, "status": payload.status}


# ─────────────────────────────────────────────────────────────────────────────
# DELETE /api/applications/{application_id}  — applicant withdraws
# ─────────────────────────────────────────────────────────────────────────────
@router.delete("/{application_id}", status_code=204)
def withdraw_application(
    application_id: UUID,
    current_user:   User    = Depends(get_current_user),
    db:             Session = Depends(get_db),
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if str(app.applicant_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not your application")
    db.delete(app)
    db.commit()