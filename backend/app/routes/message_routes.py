from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from uuid import UUID
from pydantic import BaseModel
from typing import List, Dict, Any

from app.database.db import get_db
from app.models.user import User
from app.models.message import Message
from app.models.notification import Notification
from app.models.follow import Follow
from app.models.application import Application
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/api/messages", tags=["messages"])

class MessageCreate(BaseModel):
    recipient_id: UUID
    content: str

def _can_message(sender_id, recipient_id, db: Session) -> bool:
    """Allow messaging only if mutual follow OR collaborators (accepted application)."""
    # Check mutual follow
    sender_follows   = db.query(Follow).filter(Follow.follower_id == sender_id,   Follow.following_id == recipient_id).first()
    recipient_follows = db.query(Follow).filter(Follow.follower_id == recipient_id, Follow.following_id == sender_id).first()
    if sender_follows and recipient_follows:
        return True

    # Check accepted collaboration (either direction)
    collab = db.query(Application).filter(
        Application.status == "accepted",
        or_(
            and_(Application.applicant_id == sender_id),
            and_(Application.applicant_id == recipient_id)
        )
    ).join(
        # project must belong to the other person
        __import__('app.models.project', fromlist=['Project']).Project,
        Application.project_id == __import__('app.models.project', fromlist=['Project']).Project.id
    ).filter(
        or_(
            __import__('app.models.project', fromlist=['Project']).Project.creator_id == recipient_id,
            __import__('app.models.project', fromlist=['Project']).Project.creator_id == sender_id
        )
    ).first()
    if collab:
        return True

    return False

@router.post("", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def create_message(
    payload: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    recipient = db.query(User).filter(User.id == payload.recipient_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")

    if not _can_message(current_user.id, payload.recipient_id, db):
        raise HTTPException(
            status_code=403,
            detail="You can't message this user as you are not a collaborator or mutual follower."
        )

    sender_id = current_user.id
    msg = Message(
        sender_id=sender_id,
        recipient_id=payload.recipient_id,
        content=payload.content
    )
    db.add(msg)
    db.flush()

    sender_name = current_user.profile.full_name if current_user.profile else "Someone"
    conv_id = "_".join(sorted([str(sender_id), str(payload.recipient_id)]))

    notif = Notification(
        user_id=payload.recipient_id,
        type="new_message",
        title=f"{sender_name} sent you a message",
        link=f"/messages/{conv_id}",
        actor_id=sender_id
    )
    db.add(notif)
    db.commit()
    db.refresh(msg)

    return {
        "id": str(msg.id),
        "sender_id": str(msg.sender_id),
        "recipient_id": str(msg.recipient_id),
        "content": msg.content,
        "is_read": msg.is_read,
        "created_at": msg.created_at.isoformat() if msg.created_at else None
    }

@router.get("/conversations", response_model=List[Dict[str, Any]])
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    messages = db.query(Message).filter(
        or_(
            Message.sender_id == current_user.id,
            Message.recipient_id == current_user.id
        )
    ).order_by(Message.created_at.desc()).all()

    convos = {}
    for msg in messages:
        other_user = msg.recipient if msg.sender_id == current_user.id else msg.sender
        if not other_user:
            continue

        conv_id = "_".join(sorted([str(current_user.id), str(other_user.id)]))

        if conv_id not in convos:
            profile = getattr(other_user, "profile", None)
            full_name = getattr(profile, "full_name", None) or str(other_user.email)
            avatar_url = getattr(profile, "avatar_url", None)

            convos[conv_id] = {
                "id": conv_id,
                "other_user": {
                    "id": str(other_user.id),
                    "full_name": full_name,
                    "avatar_url": avatar_url
                },
                "last_message": {
                    "id": str(msg.id),
                    "content": msg.content,
                    "created_at": msg.created_at.isoformat() if msg.created_at else None
                },
                "unread_count": 0
            }

        if msg.recipient_id == current_user.id and not msg.is_read:
            convos[conv_id]["unread_count"] += 1

    return list(convos.values())

@router.get("/{conversation_id}", response_model=List[Dict[str, Any]])
def get_conversation_messages(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    uuids = conversation_id.split("_")
    if len(uuids) != 2:
        raise HTTPException(status_code=400, detail="Invalid conversation ID format")

    u1, u2 = uuids
    if str(current_user.id) not in (u1, u2):
        raise HTTPException(status_code=403, detail="Not authorized to view this conversation")

    messages = db.query(Message).filter(
        or_(
            and_(Message.sender_id == u1, Message.recipient_id == u2),
            and_(Message.sender_id == u2, Message.recipient_id == u1)
        )
    ).order_by(Message.created_at.asc()).all()

    for m in messages:
        if str(m.recipient_id) == str(current_user.id) and not m.is_read:
            m.is_read = True
    db.commit()

    return [
        {
            "id": str(m.id),
            "sender_id": str(m.sender_id),
            "recipient_id": str(m.recipient_id),
            "content": m.content,
            "is_read": m.is_read,
            "created_at": m.created_at.isoformat() if m.created_at else None
        } for m in messages
    ]
