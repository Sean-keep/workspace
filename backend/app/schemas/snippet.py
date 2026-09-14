from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class SnippetBase(BaseModel):
    title: str
    description: Optional[str] = None
    language: str = "plaintext"
    code: str
    tags: List[str] = []
    is_public: bool = False


class SnippetCreate(SnippetBase):
    pass


class SnippetUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    language: Optional[str] = None
    code: Optional[str] = None
    tags: Optional[List[str]] = None
    is_public: Optional[bool] = None


class SnippetResponse(SnippetBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
