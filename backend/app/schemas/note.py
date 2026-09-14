from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime
from ..models.note import NoteType


class NoteBase(BaseModel):
    title: str = "Untitled"
    content: Optional[str] = None
    note_type: NoteType = NoteType.NOTE
    checklist_items: Optional[List[dict]] = None
    parent_id: Optional[int] = None
    tags: List[str] = []
    is_pinned: bool = False
    is_favorite: bool = False


class NoteCreate(NoteBase):
    pass


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    note_type: Optional[NoteType] = None
    checklist_items: Optional[List[dict]] = None
    parent_id: Optional[int] = None
    tags: Optional[List[str]] = None
    is_pinned: Optional[bool] = None
    is_favorite: Optional[bool] = None


class NoteResponse(NoteBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
