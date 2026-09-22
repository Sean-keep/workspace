from sqlalchemy import JSON, Column, DateTime, ForeignKey, Index, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..database import Base


class Bookmark(Base):
    __tablename__ = "bookmarks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    url = Column(String(500), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(String(500), nullable=True)
    category = Column(String(50), default="default")
    favicon = Column(String(500), nullable=True)
    tags = Column(JSON, default=list)
    visit_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="bookmarks")

    __table_args__ = (
        Index("ix_bookmarks_user_category", "user_id", "category"),
        Index("ix_bookmarks_user_visits", "user_id", "visit_count"),
    )
