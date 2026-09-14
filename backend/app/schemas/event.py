from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    is_all_day: bool = False
    reminder_minutes: int = 15
    color: str = "#409EFF"
    recurrence: Optional[Dict[str, Any]] = None


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    is_all_day: Optional[bool] = None
    reminder_minutes: Optional[int] = None
    color: Optional[str] = None
    recurrence: Optional[Dict[str, Any]] = None


class EventResponse(EventBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
