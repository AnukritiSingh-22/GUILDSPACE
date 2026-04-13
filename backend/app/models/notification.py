from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.db import Base
import uuid

class Notification(Base):
    __tablename__ = "notifications"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id     = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type        = Column(String(50), nullable=False)
    # Types: "new_application", "application_accepted", "application_rejected",
    #        "new_follower", "new_message", "project_update"
    title       = Column(String(200), nullable=False)
    body        = Column(Text)
    link        = Column(String(255))   # frontend route to navigate to on click
    is_read     = Column(Boolean, default=False)
    actor_id    = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at  = Column(DateTime, default=datetime.utcnow)

    user  = relationship("User", foreign_keys=[user_id],  backref="notifications")
    actor = relationship("User", foreign_keys=[actor_id])
