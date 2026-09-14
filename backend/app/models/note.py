from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Text, Boolean, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from ..database import Base


class NoteType(str, enum.Enum):
    NOTE = "note"  # 普通笔记
    CHECKLIST = "checklist"  # 清单


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False, default="Untitled")
    content = Column(Text, nullable=True)
    note_type = Column(Enum(NoteType), default=NoteType.NOTE)
    checklist_items = Column(JSON, nullable=True)  # [{text: "...", checked: false}, ...]
    parent_id = Column(Integer, ForeignKey("notes.id"), nullable=True)
    tags = Column(JSON, default=list)
    is_pinned = Column(Boolean, default=False)
    is_favorite = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", backref="notes")
    children = relationship("Note", backref="parent", remote_side=[id])
