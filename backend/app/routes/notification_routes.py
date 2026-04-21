from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime

from app.database.db import get_db
from app.middleware.auth_middleware import get_current_user
from app.models.user import User
from app.models.notification import Notification

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

def format_time_ago(d: datetime) -> str:
    if not d:
        return ""
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

@router.get("")
def get_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notifs = db.query(Notification).filter(Notification.user_id == current_user.id)\
               .order_by(desc(Notification.created_at)).limit(50).all()
               
    results = []
    for n in notifs:
        actor_name = ""
        actor_initials = ""
        if n.actor and n.actor.profile:
            actor_name = n.actor.profile.full_name
            actor_initials = n.actor.profile.initials
            
        results.append({
            "id": str(n.id),
            "type": n.type,
            "title": n.title,
            "body": n.body,
            "link": n.link,
            "is_read": n.is_read,
            "actor_name": actor_name,
            "actor_initials": actor_initials,
            "created_at_ago": format_time_ago(n.created_at)
        })
    return results

@router.put("/{notification_id}/read")
def mark_read(notification_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if notification_id == "read-all":
        # Handled by the other endpoint if routing matches correctly, 
        # but just in case, FastAPI reads parameters top-down. 
        # The /read-all is actually routed below due to overlapping paths if not ordered correctly.
        pass

    notif = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == current_user.id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notif.is_read = True
    db.commit()
    return {"success": True}

@router.put("/read-all")
def mark_all_read(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(Notification).filter(Notification.user_id == current_user.id, Notification.is_read == False)\
      .update({"is_read": True})
    db.commit()
    return {"success": True}

@router.get("/unread-count")
def get_unread_count(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    count = db.query(Notification).filter(Notification.user_id == current_user.id, Notification.is_read == False).count()
    return {"count": count}

