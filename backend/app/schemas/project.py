from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    status: Optional[str] = "planning"
    priority: Optional[str] = "medium"
    progress: Optional[int] = 0
    deadline: Optional[datetime] = None
    color: Optional[str] = "#409eff"
    tags: Optional[List[str]] = []
    members: Optional[int] = 1
    subtasks: Optional[List[Any]] = []


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    progress: Optional[int] = None
    deadline: Optional[datetime] = None
    color: Optional[str] = None
    tags: Optional[List[str]] = None
    members: Optional[int] = None
    subtasks: Optional[List[Any]] = None


class ProjectResponse(BaseModel):
    id: int
    user_id: int
    name: str
    description: Optional[str] = None
    status: str
    priority: str
    progress: int
    deadline: Optional[datetime] = None
    color: str
    tags: List[str] = []
    members: int
    subtasks: List[Any] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
