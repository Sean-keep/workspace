from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from ..models.task import RecurrenceType, TaskPriority


class TaskBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    status: str = "todo"  # Allow custom statuses
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: Optional[datetime] = None
    tags: List[str] = []
    is_pinned: bool = False
    is_recurring: bool = False
    recurrence_type: RecurrenceType = RecurrenceType.NONE
    recurrence_days: Optional[List[int]] = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = None
    status: Optional[str] = None  # Allow custom statuses
    priority: Optional[TaskPriority] = None
    due_date: Optional[datetime] = None
    tags: Optional[List[str]] = None
    is_pinned: Optional[bool] = None
    is_recurring: Optional[bool] = None
    recurrence_type: Optional[RecurrenceType] = None
    recurrence_days: Optional[List[int]] = None


class TaskResponse(TaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    last_completed: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
