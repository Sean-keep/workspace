from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..models.bookmark import Bookmark
from ..schemas.bookmark import BookmarkCreate, BookmarkUpdate, BookmarkResponse
from ..utils.response import success_response
from .deps import get_current_user
from ..models.user import User

router = APIRouter()


@router.get("", response_model=dict)
async def get_bookmarks(
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Bookmark).filter(Bookmark.user_id == current_user.id)

    if category:
        query = query.filter(Bookmark.category == category)
    if search:
        query = query.filter(
            (Bookmark.title.contains(search)) | (Bookmark.url.contains(search))
        )

    bookmarks = query.order_by(Bookmark.visit_count.desc()).all()

    return success_response(data=[BookmarkResponse.from_orm(b).dict() for b in bookmarks])


@router.post("", response_model=dict)
async def create_bookmark(
    bookmark_data: BookmarkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bookmark = Bookmark(
        user_id=current_user.id,
        **bookmark_data.dict()
    )
    db.add(bookmark)
    db.commit()
    db.refresh(bookmark)

    return success_response(data=BookmarkResponse.from_orm(bookmark).dict())


@router.put("/{bookmark_id}", response_model=dict)
async def update_bookmark(
    bookmark_id: int,
    bookmark_data: BookmarkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bookmark = db.query(Bookmark).filter(Bookmark.id == bookmark_id, Bookmark.user_id == current_user.id).first()
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")

    for field, value in bookmark_data.dict(exclude_unset=True).items():
        setattr(bookmark, field, value)

    db.commit()
    db.refresh(bookmark)

    return success_response(data=BookmarkResponse.from_orm(bookmark).dict())


@router.delete("/{bookmark_id}", response_model=dict)
async def delete_bookmark(
    bookmark_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bookmark = db.query(Bookmark).filter(Bookmark.id == bookmark_id, Bookmark.user_id == current_user.id).first()
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")

    db.delete(bookmark)
    db.commit()

    return success_response(message="Bookmark deleted")
