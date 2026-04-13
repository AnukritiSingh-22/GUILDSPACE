from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.db import Base
import uuid

class Message(Base):
    __tablename__ = "messages"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sender_id    = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    recipient_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content      = Column(Text, nullable=False)
    is_read      = Column(Boolean, default=False)
    created_at   = Column(DateTime, default=datetime.utcnow)

    sender    = relationship("User", foreign_keys=[sender_id],    backref="sent_messages")
    recipient = relationship("User", foreign_keys=[recipient_id], backref="received_messages")
