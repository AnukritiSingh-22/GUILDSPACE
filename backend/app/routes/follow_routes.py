from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.db import get_db
from app.middleware.auth_middleware import get_current_user
from app.models.follow import Follow
from app.models.notification import Notification
from app.models.profile import Profile
from app.models.user import User
from app.models.skill import Skill, UserSkill
from app.models.project import Project
from app.models.application import Application
from app.utils.auth import decode_token

router = APIRouter(prefix="/api")

def get_optional_user(request: Request, db: Session = Depends(get_db)):
    auth = request.headers.get("Authorization")
    if auth and auth.startswith("Bearer "):
        token = auth.split(" ")[1]
        try:
            payload = decode_token(token)
            user_id = payload.get("sub")
            if user_id:
                return db.query(User).filter(User.id == user_id).first()
        except Exception:
            pass
    return None

@router.post("/users/{user_id}/follow")
def follow_user(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if str(current_user.id) == str(user_id):
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
        
    existing = db.query(Follow).filter(Follow.follower_id == current_user.id, Follow.following_id == user_id).first()
    if existing:
        return {"detail": "Already following"}
        
    # Create Follow row
    new_follow = Follow(follower_id=current_user.id, following_id=user_id)
    db.add(new_follow)
    
    # Create Notification
    follower_profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    follower_name = follower_profile.full_name if follower_profile else current_user.email.split('@')[0]
    
    notif = Notification(
        user_id=user_id,
        type="new_follower",
        title=f"{follower_name} started following you",
        link=f"/user/{current_user.id}",
        actor_id=current_user.id
    )
    db.add(notif)
    
    db.commit()
    return {"detail": "Followed successfully"}

@router.delete("/users/{user_id}/follow")
def unfollow_user(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    follow_row = db.query(Follow).filter(Follow.follower_id == current_user.id, Follow.following_id == user_id).first()
    if follow_row:
        db.delete(follow_row)
        db.commit()
    return {"detail": "Unfollowed successfully"}

@router.get("/users/{user_id}/is-following")
def check_is_following(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    follow_row = db.query(Follow).filter(Follow.follower_id == current_user.id, Follow.following_id == user_id).first()
    return {"is_following": follow_row is not None}

@router.get("/users/{user_id}/followers")
def list_followers(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    follows = db.query(Follow).filter(Follow.following_id == user_id).all()
    follower_ids = [f.follower_id for f in follows]
    if not follower_ids:
        return []
        
    profiles = db.query(Profile).filter(Profile.user_id.in_(follower_ids)).all()
    results = []
    for p in profiles:
        results.append({
            "id": p.user_id,
            "full_name": p.full_name,
            "initials": p.initials,
            "role": p.role,
            "city": p.city
        })
    return results

@router.get("/users/{user_id}/following")
def list_following(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    follows = db.query(Follow).filter(Follow.follower_id == user_id).all()
    following_ids = [f.following_id for f in follows]
    if not following_ids:
        return []
        
    profiles = db.query(Profile).filter(Profile.user_id.in_(following_ids)).all()
    results = []
    for p in profiles:
        results.append({
            "id": p.user_id,
            "full_name": p.full_name,
            "initials": p.initials,
            "role": p.role,
            "city": p.city
        })
    return results

@router.get("/users/{user_id}/public")
def public_profile(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_optional_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    skills = db.query(Skill.name).join(UserSkill).filter(UserSkill.user_id == user_id).all()
    skill_names = [s[0] for s in skills]
    
    follower_count = db.query(Follow).filter(Follow.following_id == user_id).count()
    following_count = db.query(Follow).filter(Follow.follower_id == user_id).count()
    project_count = db.query(Project).filter(Project.creator_id == user_id).count()
    
    is_following = False
    if current_user:
        existing = db.query(Follow).filter(Follow.follower_id == current_user.id, Follow.following_id == user_id).first()
        if existing:
            is_following = True

    # Gather contributed projects (accepted applications)
    contributed_apps = db.query(Application).filter(Application.applicant_id == user_id, Application.status == "accepted").all()
    contributions = []
    for app in contributed_apps:
        proj = app.project
        poster_profile = proj.creator.profile if proj and proj.creator else None
        poster_name = poster_profile.full_name if poster_profile else "Unknown"
        contributions.append({
            "project_id": str(proj.id) if proj else "",
            "title": proj.title if proj else "Deleted Project",
            "rating": app.rating,
            "poster_name": poster_name
        })

    return {
        "id": str(user.id),
        "full_name": profile.full_name,
        "initials": profile.initials,
        "role": profile.role,
        "city": profile.city,
        "college": profile.college,
        "bio": profile.bio,
        "interests": profile.interests,
        "github_url": profile.github_url,
        "arxiv_url": profile.arxiv_url,
        "portfolio_url": profile.portfolio_url,
        "trust_score": profile.trust_score,
        "trust_level": profile.trust_level,
        "skills": skill_names,
        "follower_count": follower_count,
        "following_count": following_count,
        "project_count": project_count,
        "is_following": is_following,
        "contributions": contributions
    }
