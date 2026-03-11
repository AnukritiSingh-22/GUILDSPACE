from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.db import SessionLocal
from app.models.project import Project

router = APIRouter(prefix="/projects", tags=["Projects"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/")
def create_project(title: str, description: str, required_skills: str,
                   difficulty: int, min_trust: int, owner_id: int,
                   db: Session = Depends(get_db)):
    project = Project(
        title=title,
        description=description,
        required_skills=required_skills,
        difficulty=difficulty,
        min_trust=min_trust,
        owner_id=owner_id
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.get("/")
def get_projects(db: Session = Depends(get_db)):
    return db.query(Project).all()