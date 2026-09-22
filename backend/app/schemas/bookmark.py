from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class BookmarkBase(BaseModel):
    url: str = Field(min_length=1, max_length=500)
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    category: str = "default"
    favicon: Optional[str] = None
    tags: List[str] = []


class BookmarkCreate(BookmarkBase):
    pass


class BookmarkUpdate(BaseModel):
    url: Optional[str] = Field(default=None, min_length=1, max_length=500)
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = None
    category: Optional[str] = None
    favicon: Optional[str] = None
    tags: Optional[List[str]] = None


class BookmarkResponse(BookmarkBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    visit_count: int
    created_at: datetime
    updated_at: datetime
