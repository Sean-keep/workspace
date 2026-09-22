from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import case, func
from sqlalchemy.orm import Session

from .deps import get_current_user
from ..database import get_db
from ..models.bookmark import Bookmark
from ..models.event import Event
from ..models.note import Note
from ..models.snippet import Snippet
from ..models.task import Task
from ..models.user import User
from ..utils.response import success_response

router = APIRouter()

TERMINAL_STATUSES = ("done", "completed")
PENDING_STATUSES = ("todo", "in_progress")


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


@router.get("/stats", response_model=dict)
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    uid = current_user.id

    # One pass over tasks instead of several separate count queries.
    total_tasks, completed_tasks, pending_tasks = db.query(
        func.count(Task.id),
        func.coalesce(func.sum(case((Task.status.in_(TERMINAL_STATUSES), 1), else_=0)), 0),
        func.coalesce(func.sum(case((Task.status.in_(PENDING_STATUSES), 1), else_=0)), 0),
    ).filter(Task.user_id == uid).one()
    total_tasks, completed_tasks, pending_tasks = (
        int(total_tasks),
        int(completed_tasks),
        int(pending_tasks),
    )

    now = _utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    week_end = today_start + timedelta(days=7)

    # Today's events vs. the next 7 days, one grouped query.
    today_events, upcoming_events = db.query(
        func.coalesce(func.sum(case(
            (Event.start_time < today_end, 1), else_=0
        )), 0),
        func.count(Event.id),
    ).filter(
        Event.user_id == uid,
        Event.start_time >= today_start,
        Event.start_time < week_end,
    ).one()
    today_events, upcoming_events = int(today_events), int(upcoming_events)

    total_notes = db.query(func.count(Note.id)).filter(Note.user_id == uid).scalar() or 0
    total_bookmarks = db.query(func.count(Bookmark.id)).filter(Bookmark.user_id == uid).scalar() or 0
    total_snippets = db.query(func.count(Snippet.id)).filter(Snippet.user_id == uid).scalar() or 0

    # Task completion trend (last 7 days) in one GROUP BY.
    # func.date() works on MySQL and SQLite (cast(..., Date) does not).
    trend_start = today_start - timedelta(days=6)
    rows = (
        db.query(func.date(Task.completed_at).label("day"), func.count(Task.id))
        .filter(
            Task.user_id == uid,
            Task.status.in_(TERMINAL_STATUSES),
            Task.completed_at >= trend_start,
            Task.completed_at < today_end,
        )
        .group_by("day")
        .all()
    )
    counts_by_day = {str(day): int(count) for day, count in rows}

    task_trend = []
    for i in range(6, -1, -1):
        day = (today_start - timedelta(days=i)).date()
        task_trend.append({
            "date": day.strftime("%m-%d"),
            "count": counts_by_day.get(str(day), 0),
        })

    return success_response(data={
        "tasks": {
            "total": total_tasks,
            "completed": completed_tasks,
            "pending": pending_tasks,
            "completion_rate": round(completed_tasks / total_tasks * 100, 1) if total_tasks else 0,
        },
        "events": {"today": today_events, "upcoming": upcoming_events},
        "notes": total_notes,
        "bookmarks": total_bookmarks,
        "snippets": total_snippets,
        "task_trend": task_trend,
    })


@router.get("/recent-tasks", response_model=dict)
async def get_recent_tasks(
    limit: int = Query(5, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tasks = (
        db.query(Task)
        .filter(Task.user_id == current_user.id, Task.status.in_(PENDING_STATUSES))
        .order_by(
            Task.is_pinned.desc(),
            Task.due_date.is_(None),
            Task.due_date.asc(),
            Task.created_at.desc(),
        )
        .limit(limit)
        .all()
    )
    return success_response(data=[{
        "id": t.id,
        "title": t.title,
        "status": t.status,
        "priority": getattr(t.priority, "value", t.priority),
        "due_date": t.due_date.isoformat() if t.due_date else None,
    } for t in tasks])


@router.get("/upcoming-events", response_model=dict)
async def get_upcoming_events(
    limit: int = Query(5, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = _utcnow()
    events = (
        db.query(Event)
        .filter(Event.user_id == current_user.id, Event.end_time >= now)
        .order_by(Event.start_time)
        .limit(limit)
        .all()
    )
    return success_response(data=[{
        "id": e.id,
        "title": e.title,
        "start_time": e.start_time.isoformat(),
        "end_time": e.end_time.isoformat(),
        "color": e.color,
        "is_all_day": e.is_all_day,
    } for e in events])


@router.get("/notifications", response_model=dict)
async def get_notifications(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Notification items derived from real data (overdue tasks, today's events)."""
    now = _utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow = today_start + timedelta(days=1)
    items = []

    overdue = (
        db.query(Task)
        .filter(
            Task.user_id == current_user.id,
            Task.status.in_(PENDING_STATUSES),
            Task.due_date < now,
        )
        .order_by(Task.due_date.asc())
        .limit(limit)
        .all()
    )
    for task in overdue:
        items.append({
            "id": f"task-overdue-{task.id}",
            "title": f"任务已逾期：{task.title}",
            "time": task.due_date.isoformat(),
            "icon": "WarningFilled",
            "color": "#f56c6c",
            "link": "/tasks",
        })

    todays = (
        db.query(Event)
        .filter(
            Event.user_id == current_user.id,
            Event.start_time >= today_start,
            Event.start_time < tomorrow,
        )
        .order_by(Event.start_time)
        .limit(limit)
        .all()
    )
    for event in todays:
        items.append({
            "id": f"event-today-{event.id}",
            "title": f"今日日程：{event.title}",
            "time": event.start_time.isoformat(),
            "icon": "Calendar",
            "color": event.color or "#409eff",
            "link": "/calendar",
        })

    items.sort(key=lambda x: x["time"])
    return success_response(data=items[:limit])
