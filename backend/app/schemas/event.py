from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


class EventBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    is_all_day: bool = False
    reminder_minutes: int = 15
    color: str = "#409EFF"
    recurrence: Optional[Dict[str, Any]] = None

    @model_validator(mode="after")
    def _check_range(self):
        if self.end_time < self.start_time:
            raise ValueError("end_time must be after start_time")
        return self


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    is_all_day: Optional[bool] = None
    reminder_minutes: Optional[int] = None
    color: Optional[str] = None
    recurrence: Optional[Dict[str, Any]] = None


class EventResponse(EventBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
