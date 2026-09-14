from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..models.snippet import Snippet
from ..schemas.snippet import SnippetCreate, SnippetUpdate, SnippetResponse
from ..utils.response import success_response
from .deps import get_current_user
from ..models.user import User

router = APIRouter()


@router.get("", response_model=dict)
async def get_snippets(
    language: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Snippet).filter(Snippet.user_id == current_user.id)

    if language:
        query = query.filter(Snippet.language == language)
    if search:
        query = query.filter(
            (Snippet.title.contains(search)) | (Snippet.code.contains(search))
        )

    snippets = query.order_by(Snippet.updated_at.desc()).all()

    return success_response(data=[SnippetResponse.from_orm(s).dict() for s in snippets])


@router.post("", response_model=dict)
async def create_snippet(
    snippet_data: SnippetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    snippet = Snippet(
        user_id=current_user.id,
        **snippet_data.dict()
    )
    db.add(snippet)
    db.commit()
    db.refresh(snippet)

    return success_response(data=SnippetResponse.from_orm(snippet).dict())


@router.put("/{snippet_id}", response_model=dict)
async def update_snippet(
    snippet_id: int,
    snippet_data: SnippetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    snippet = db.query(Snippet).filter(Snippet.id == snippet_id, Snippet.user_id == current_user.id).first()
    if not snippet:
        raise HTTPException(status_code=404, detail="Snippet not found")

    for field, value in snippet_data.dict(exclude_unset=True).items():
        setattr(snippet, field, value)

    db.commit()
    db.refresh(snippet)

    return success_response(data=SnippetResponse.from_orm(snippet).dict())


@router.delete("/{snippet_id}", response_model=dict)
async def delete_snippet(
    snippet_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    snippet = db.query(Snippet).filter(Snippet.id == snippet_id, Snippet.user_id == current_user.id).first()
    if not snippet:
        raise HTTPException(status_code=404, detail="Snippet not found")

    db.delete(snippet)
    db.commit()

    return success_response(message="Snippet deleted")
