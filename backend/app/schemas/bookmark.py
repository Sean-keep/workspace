from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class BookmarkBase(BaseModel):
    url: str
    title: str
    description: Optional[str] = None
    category: str = "default"
    favicon: Optional[str] = None
    tags: List[str] = []


class BookmarkCreate(BookmarkBase):
    pass


class BookmarkUpdate(BaseModel):
    url: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    favicon: Optional[str] = None
    tags: Optional[List[str]] = None


class BookmarkResponse(BookmarkBase):
    id: int
    user_id: int
    visit_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
