from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .deps import get_current_user
from ..database import get_db
from ..models.note import Note
from ..models.user import User
from ..schemas.note import NoteCreate, NoteListItem, NoteResponse, NoteUpdate
from ..utils.crud import apply_update, get_owned_or_404
from ..utils.response import paginated_response, success_response

router = APIRouter()

EXCERPT_LEN = 160


def _to_dict(note: Note) -> dict:
    return NoteResponse.model_validate(note).model_dump(mode="json")


def _list_dict(note: Note) -> dict:
    data = NoteListItem.model_validate(note).model_dump(mode="json")
    content = note.content or ""
    data["excerpt"] = content[:EXCERPT_LEN] + ("…" if len(content) > EXCERPT_LEN else "")
    return data


@router.get("", response_model=dict)
async def get_notes(
    parent_id: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Note).filter(Note.user_id == current_user.id)

    # parent_id = "null" (or empty) means top-level notes
    if parent_id is None:
        query = query.filter(Note.parent_id.is_(None))
    elif parent_id not in ("", "null", "undefined"):
        try:
            query = query.filter(Note.parent_id == int(parent_id))
        except ValueError:
            raise HTTPException(status_code=422, detail="parent_id must be an integer")

    if search:
        query = query.filter(
            (Note.title.contains(search)) | (Note.content.contains(search))
        )

    query = query.order_by(Note.is_pinned.desc(), Note.updated_at.desc())

    total = query.count()
    notes = query.offset(skip).limit(limit).all()
    return paginated_response([_list_dict(n) for n in notes], total, skip, limit)


@router.post("", response_model=dict)
async def create_note(
    note_data: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = Note(user_id=current_user.id, **note_data.model_dump())
    db.add(note)
    db.commit()
    db.refresh(note)
    return success_response(data=_to_dict(note))


@router.get("/{note_id}", response_model=dict)
async def get_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = get_owned_or_404(db, Note, note_id, current_user)
    return success_response(data=_to_dict(note))


@router.put("/{note_id}", response_model=dict)
async def update_note(
    note_id: int,
    note_data: NoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = get_owned_or_404(db, Note, note_id, current_user)
    apply_update(note, note_data.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(note)
    return success_response(data=_to_dict(note))


@router.delete("/{note_id}", response_model=dict)
async def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = get_owned_or_404(db, Note, note_id, current_user)
    db.delete(note)
    db.commit()
    return success_response(message="Note deleted")
