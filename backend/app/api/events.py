from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from .deps import get_current_user
from ..database import get_db
from ..models.event import Event
from ..models.user import User
from ..schemas.event import EventCreate, EventResponse, EventUpdate
from ..utils.crud import apply_update, get_owned_or_404
from ..utils.response import paginated_response, success_response

router = APIRouter()


def _to_dict(event: Event) -> dict:
    return EventResponse.model_validate(event).model_dump(mode="json")


def _parse_dt(value: str) -> Optional[datetime]:
    try:
        if len(value) == 10:  # YYYY-MM-DD
            return datetime.strptime(value, "%Y-%m-%d")
        return datetime.fromisoformat(value)
    except ValueError:
        return None


@router.get("", response_model=dict)
async def get_events(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Event).filter(Event.user_id == current_user.id)

    if start_date:
        start_dt = _parse_dt(start_date)
        if start_dt:
            query = query.filter(Event.end_time >= start_dt)

    if end_date:
        end_dt = _parse_dt(end_date)
        if end_dt:
            query = query.filter(Event.start_time <= end_dt)

    query = query.order_by(Event.start_time)
    total = query.count()
    events = query.offset(skip).limit(limit).all()
    return paginated_response([_to_dict(e) for e in events], total, skip, limit)


@router.post("", response_model=dict)
async def create_event(
    event_data: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = Event(user_id=current_user.id, **event_data.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return success_response(data=_to_dict(event))


@router.get("/{event_id}", response_model=dict)
async def get_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = get_owned_or_404(db, Event, event_id, current_user)
    return success_response(data=_to_dict(event))


@router.put("/{event_id}", response_model=dict)
async def update_event(
    event_id: int,
    event_data: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = get_owned_or_404(db, Event, event_id, current_user)
    data = event_data.model_dump(exclude_unset=True)
    apply_update(event, data)

    # keep the range sane when only one side is updated
    if event.end_time < event.start_time:
        if "end_time" in data:
            event.start_time = event.end_time
        else:
            event.end_time = event.start_time

    db.commit()
    db.refresh(event)
    return success_response(data=_to_dict(event))


@router.delete("/{event_id}", response_model=dict)
async def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = get_owned_or_404(db, Event, event_id, current_user)
    db.delete(event)
    db.commit()
    return success_response(message="Event deleted")
