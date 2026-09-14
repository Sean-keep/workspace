from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from ..database import get_db
from ..models.task import Task
from ..models.event import Event
from ..models.note import Note
from ..models.bookmark import Bookmark
from ..models.snippet import Snippet
from ..utils.response import success_response
from .deps import get_current_user
from ..models.user import User

router = APIRouter()


@router.get("/stats", response_model=dict)
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Task stats
    total_tasks = db.query(Task).filter(Task.user_id == current_user.id).count()
    completed_tasks = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.status == "done"
    ).count()
    pending_tasks = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.status.in_(["todo", "in_progress"])
    ).count()

    # Today's events
    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today + timedelta(days=1), datetime.min.time())
    today_events = db.query(Event).filter(
        Event.user_id == current_user.id,
        Event.start_time >= today_start,
        Event.start_time < today_end
    ).count()

    # Upcoming events (next 7 days)
    week_end = today_start + timedelta(days=7)
    upcoming_events = db.query(Event).filter(
        Event.user_id == current_user.id,
        Event.start_time >= today_start,
        Event.start_time < week_end
    ).count()

    # Notes count
    total_notes = db.query(Note).filter(Note.user_id == current_user.id).count()

    # Bookmarks count
    total_bookmarks = db.query(Bookmark).filter(Bookmark.user_id == current_user.id).count()

    # Snippets count
    total_snippets = db.query(Snippet).filter(Snippet.user_id == current_user.id).count()

    # Task completion trend (last 7 days)
    task_trend = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_start = datetime.combine(day, datetime.min.time())
        day_end = datetime.combine(day + timedelta(days=1), datetime.min.time())
        count = db.query(Task).filter(
            Task.user_id == current_user.id,
            Task.status == "done",
            Task.completed_at >= day_start,
            Task.completed_at < day_end
        ).count()
        task_trend.append({
            "date": day.strftime("%m-%d"),
            "count": count
        })

    return success_response(data={
        "tasks": {
            "total": total_tasks,
            "completed": completed_tasks,
            "pending": pending_tasks,
            "completion_rate": round(completed_tasks / total_tasks * 100, 1) if total_tasks > 0 else 0
        },
        "events": {
            "today": today_events,
            "upcoming": upcoming_events
        },
        "notes": total_notes,
        "bookmarks": total_bookmarks,
        "snippets": total_snippets,
        "task_trend": task_trend
    })


@router.get("/recent-tasks", response_model=dict)
async def get_recent_tasks(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tasks = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.status.in_(["todo", "in_progress"])
    ).order_by(
        Task.is_pinned.desc(),
        Task.due_date.is_(None),
        Task.due_date.asc(),
        Task.created_at.desc()
    ).limit(limit).all()

    return success_response(data=[{
        "id": t.id,
        "title": t.title,
        "status": t.status,
        "priority": t.priority.value,
        "due_date": t.due_date.isoformat() if t.due_date else None
    } for t in tasks])


@router.get("/upcoming-events", response_model=dict)
async def get_upcoming_events(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.utcnow()
    events = db.query(Event).filter(
        Event.user_id == current_user.id,
        Event.start_time >= now
    ).order_by(Event.start_time).limit(limit).all()

    return success_response(data=[{
        "id": e.id,
        "title": e.title,
        "start_time": e.start_time.isoformat(),
        "end_time": e.end_time.isoformat(),
        "color": e.color
    } for e in events])
