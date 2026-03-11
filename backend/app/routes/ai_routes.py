from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.db import SessionLocal
from app.models.user import User
from app.models.project import Project
from app.services.ranking_service import calculate_score

router = APIRouter(prefix="/ai", tags=["AI"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/rank/{project_id}")
def rank_users(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    users = db.query(User).all()

    ranked = []

    for user in users:
        score = calculate_score(user, project)
        ranked.append({
            "user_id": user.id,
            "user_name": user.name,
            "score": score
        })

    ranked.sort(key=lambda x: x["score"], reverse=True)

    return ranked