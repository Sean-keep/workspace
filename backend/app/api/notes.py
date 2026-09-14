from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.note import Note
from ..schemas.note import NoteCreate, NoteUpdate, NoteResponse
from ..utils.response import success_response
from .deps import get_current_user
from ..models.user import User

router = APIRouter()


@router.get("", response_model=dict)
async def get_notes(
    parent_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Note).filter(Note.user_id == current_user.id)

    if parent_id is not None:
        query = query.filter(Note.parent_id == parent_id)
    else:
        query = query.filter(Note.parent_id.is_(None))

    if search:
        query = query.filter(
            (Note.title.contains(search)) | (Note.content.contains(search))
        )

    notes = query.order_by(Note.is_pinned.desc(), Note.updated_at.desc()).all()

    return success_response(data=[NoteResponse.from_orm(n).dict() for n in notes])


@router.post("", response_model=dict)
async def create_note(
    note_data: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    note = Note(
        user_id=current_user.id,
        **note_data.dict()
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    return success_response(data=NoteResponse.from_orm(note).dict())


@router.get("/{note_id}", response_model=dict)
async def get_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    return success_response(data=NoteResponse.from_orm(note).dict())


@router.put("/{note_id}", response_model=dict)
async def update_note(
    note_id: int,
    note_data: NoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    for field, value in note_data.dict(exclude_unset=True).items():
        setattr(note, field, value)

    db.commit()
    db.refresh(note)

    return success_response(data=NoteResponse.from_orm(note).dict())


@router.delete("/{note_id}", response_model=dict)
async def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    db.delete(note)
    db.commit()

    return success_response(message="Note deleted")
