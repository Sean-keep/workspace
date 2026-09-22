from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from ..models.note import NoteType


class NoteBase(BaseModel):
    title: str = Field(default="Untitled", max_length=200)
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
    title: Optional[str] = Field(default=None, max_length=200)
    content: Optional[str] = None
    note_type: Optional[NoteType] = None
    checklist_items: Optional[List[dict]] = None
    parent_id: Optional[int] = None
    tags: Optional[List[str]] = None
    is_pinned: Optional[bool] = None
    is_favorite: Optional[bool] = None


class NoteResponse(NoteBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime


class NoteListItem(BaseModel):
    """List row without the (potentially large) note body."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    note_type: NoteType
    parent_id: Optional[int] = None
    tags: List[str] = []
    is_pinned: bool = False
    is_favorite: bool = False
    excerpt: Optional[str] = None
    checklist_items: Optional[List[dict]] = None
    created_at: datetime
    updated_at: datetime
