from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, date
from ..database import get_db
from ..models.event import Event
from ..schemas.event import EventCreate, EventUpdate, EventResponse
from ..utils.response import success_response
from .deps import get_current_user
from ..models.user import User

router = APIRouter()


@router.get("", response_model=dict)
async def get_events(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Event).filter(Event.user_id == current_user.id)

    if start_date:
        try:
            # Try parsing as date first, then datetime
            if len(start_date) == 10:  # YYYY-MM-DD
                start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            else:
                start_dt = datetime.fromisoformat(start_date)
            query = query.filter(Event.end_time >= start_dt)
        except ValueError:
            pass

    if end_date:
        try:
            if len(end_date) == 10:  # YYYY-MM-DD
                end_dt = datetime.strptime(end_date, "%Y-%m-%d")
            else:
                end_dt = datetime.fromisoformat(end_date)
            query = query.filter(Event.start_time <= end_dt)
        except ValueError:
            pass

    events = query.order_by(Event.start_time).all()

    return success_response(data=[EventResponse.from_orm(e).dict() for e in events])


@router.post("", response_model=dict)
async def create_event(
    event_data: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = Event(
        user_id=current_user.id,
        **event_data.dict()
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    return success_response(data=EventResponse.from_orm(event).dict())


@router.get("/{event_id}", response_model=dict)
async def get_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    return success_response(data=EventResponse.from_orm(event).dict())


@router.put("/{event_id}", response_model=dict)
async def update_event(
    event_id: int,
    event_data: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    for field, value in event_data.dict(exclude_unset=True).items():
        setattr(event, field, value)

    db.commit()
    db.refresh(event)

    return success_response(data=EventResponse.from_orm(event).dict())


@router.delete("/{event_id}", response_model=dict)
async def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    db.delete(event)
    db.commit()

    return success_response(message="Event deleted")
