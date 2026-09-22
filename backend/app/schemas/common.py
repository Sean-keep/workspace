from typing import Generic, List, Optional, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class MessageResponse(BaseModel):
    code: int = 200
    msg: str = "success"


class Page(BaseModel, Generic[T]):
    items: List[T] = []
    total: int = 0
    skip: int = 0
    limit: int = 50
