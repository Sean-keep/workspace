import enum

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..database import Base
from .types import SafeEnum


class NoteType(str, enum.Enum):
    NOTE = "note"  # 普通笔记
    CHECKLIST = "checklist"  # 清单


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False, default="Untitled")
    content = Column(Text, nullable=True)
    note_type = Column(SafeEnum(NoteType), default=NoteType.NOTE)
    checklist_items = Column(JSON, nullable=True)  # [{text: "...", checked: false}, ...]
    parent_id = Column(Integer, ForeignKey("notes.id", ondelete="SET NULL"), nullable=True)
    tags = Column(JSON, default=list)
    is_pinned = Column(Boolean, default=False)
    is_favorite = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="notes")
    # backref= defines both sides of this self-referential pair (parent/children).
    children = relationship("Note", backref="parent", remote_side=[id])

    __table_args__ = (
        Index("ix_notes_user_parent", "user_id", "parent_id"),
        Index("ix_notes_user_pinned_updated", "user_id", "is_pinned", "updated_at"),
    )
