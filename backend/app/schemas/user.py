from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(min_length=6, max_length=128)


class UserUpdate(BaseModel):
    username: Optional[str] = Field(default=None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    avatar: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None


class PasswordChange(BaseModel):
    old_password: str
    new_password: str = Field(min_length=6, max_length=128)


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    avatar: Optional[str] = None
    settings: Dict[str, Any] = {}
    is_active: bool
    created_at: datetime
    updated_at: datetime


class UserLogin(BaseModel):
    username: str
    password: str
