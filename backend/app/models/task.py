import enum

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..database import Base
from .types import SafeEnum


class TaskPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class RecurrenceType(str, enum.Enum):
    NONE = "none"
    DAILY = "daily"
    WEEKDAYS = "weekdays"  # Monday to Friday
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    CUSTOM = "custom"

    @classmethod
    def _missing_(cls, value):
        """Handle case-insensitive lookup"""
        if isinstance(value, str):
            for member in cls:
                if member.value == value.lower():
                    return member
        return None


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="todo")  # Allow custom statuses
    priority = Column(SafeEnum(TaskPriority), default=TaskPriority.MEDIUM)
    due_date = Column(DateTime(timezone=True), nullable=True)
    tags = Column(JSON, default=list)
    is_pinned = Column(Boolean, default=False)
    is_recurring = Column(Boolean, default=False)
    recurrence_type = Column(SafeEnum(RecurrenceType), default=RecurrenceType.NONE)
    recurrence_days = Column(JSON, nullable=True)  # For custom: [0,1,2,3,4] = Mon-Fri
    last_completed = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="tasks")

    __table_args__ = (
        Index("ix_tasks_user_status", "user_id", "status"),
        Index("ix_tasks_user_pinned_created", "user_id", "is_pinned", "created_at"),
        Index("ix_tasks_user_completed", "user_id", "completed_at"),
        Index("ix_tasks_user_due", "user_id", "due_date"),
    )
