from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from pydantic import BaseModel
from typing import List, Optional

from app.database.db import get_db
from app.models.user import User
from app.models.project import Project
from app.models.application import Application
from app.models.rating import Rating
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/api/ratings", tags=["ratings"])

class RatingCreate(BaseModel):
    project_id: UUID
    ratee_id: UUID
    stars: int
    comment: Optional[str] = None

@router.post("", response_model=dict)
def create_rating(
    payload: RatingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not (1 <= payload.stars <= 5):
        raise HTTPException(status_code=400, detail="Stars must be between 1 and 5")

    project = db.query(Project).filter(Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if str(project.creator_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Only project creator can rate")

    application = db.query(Application).filter(
        Application.project_id == payload.project_id,
        Application.applicant_id == payload.ratee_id,
        Application.status == "accepted"
    ).first()
    
    if not application:
        raise HTTPException(status_code=403, detail="Ratee is not an accepted applicant on this project")

    existing = db.query(Rating).filter(
        Rating.project_id == payload.project_id,
        Rating.ratee_id == payload.ratee_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Rating already exists for this user on this project")

    rating = Rating(
        project_id=payload.project_id,
        rater_id=current_user.id,
        ratee_id=payload.ratee_id,
        stars=payload.stars,
        comment=payload.comment
    )
    db.add(rating)
    db.commit()

    return {"success": True}

@router.get("/user/{user_id}")
def get_user_ratings(
    user_id: UUID,
    db: Session = Depends(get_db)
):
    # Fetch all accepted applications to act as "collaborations"
    apps = db.query(Application).filter(
        Application.applicant_id == user_id,
        Application.status == "accepted"
    ).all()

    result = []
    for app in apps:
        rating = db.query(Rating).filter(
            Rating.project_id == app.project_id,
            Rating.ratee_id == user_id
        ).first()

        result.append({
            "project_id": str(app.project_id),
            "project_title": app.project.title,
            "creator_id": str(app.project.creator_id),
            "rater_name": app.project.creator.profile.full_name if app.project.creator and app.project.creator.profile else "Creator",
            "stars": rating.stars if rating else None,
            "comment": rating.comment if rating else None,
            "created_at": rating.created_at.isoformat() if rating else app.updated_at.isoformat() if app.updated_at else ""
        })

    result.sort(key=lambda x: x.get("created_at") or "", reverse=True)
    return result
