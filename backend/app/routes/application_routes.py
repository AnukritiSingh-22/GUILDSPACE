from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.db import SessionLocal
from app.models.application import Application

router = APIRouter(prefix="/applications", tags=["Applications"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/")
def apply(user_id: int, project_id: int, statement: str,
          db: Session = Depends(get_db)):
    application = Application(
        user_id=user_id,
        project_id=project_id,
        statement=statement
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application

@router.get("/")
def get_applications(db: Session = Depends(get_db)):
    return db.query(Application).all()