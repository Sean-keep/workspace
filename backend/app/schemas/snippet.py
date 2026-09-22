from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class SnippetBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    language: str = "plaintext"
    code: str
    tags: List[str] = []
    is_public: bool = False


class SnippetCreate(SnippetBase):
    pass


class SnippetUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = None
    language: Optional[str] = None
    code: Optional[str] = None
    tags: Optional[List[str]] = None
    is_public: Optional[bool] = None


class SnippetResponse(SnippetBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
