import enum

from sqlalchemy import (
    JSON,
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


class ProjectStatus(str, enum.Enum):
    PLANNING = "planning"
    IN_PROGRESS = "in_progress"
    TESTING = "testing"
    COMPLETED = "completed"
    ON_HOLD = "on_hold"


class ProjectPriority(str, enum.Enum):
    URGENT = "urgent"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="planning")
    priority = Column(String(20), default="medium")
    progress = Column(Integer, default=0)
    deadline = Column(DateTime(timezone=True), nullable=True)
    color = Column(String(20), default="#409eff")
    tags = Column(JSON, default=list)
    members = Column(Integer, default=1)
    subtasks = Column(JSON, default=list)  # [{id,title,status,...}]
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="projects")

    __table_args__ = (
        Index("ix_projects_user_status", "user_id", "status"),
        Index("ix_projects_user_created", "user_id", "created_at"),
    )
