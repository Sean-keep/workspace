from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

PROGRESS_STATUSES = {"done", "completed"}


def compute_progress(subtasks: Optional[List[Any]]) -> int:
    """Project progress = share of completed subtasks (0-100)."""
    if not subtasks:
        return 0
    completed = sum(
        1 for t in subtasks if isinstance(t, dict) and t.get("status") in PROGRESS_STATUSES
    )
    return round(completed / len(subtasks) * 100)


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    status: Optional[str] = "planning"
    priority: Optional[str] = "medium"
    progress: Optional[int] = 0
    deadline: Optional[datetime] = None
    color: Optional[str] = "#409eff"
    tags: Optional[List[str]] = []
    members: Optional[int] = 1
    subtasks: Optional[List[Any]] = []

    @field_validator("progress", mode="before")
    @classmethod
    def _derive_progress(cls, v, info):
        if v is not None:
            return v
        return 0


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
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
    model_config = ConfigDict(from_attributes=True)

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
