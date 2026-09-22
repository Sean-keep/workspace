"""Recurring task reset.

A recurring task that was completed on a previous cycle becomes 'todo' again
once the next occurrence is due. This is driven by a periodic job (see
`main.lifespan`) instead of a read endpoint, so every row gets reset exactly
once per cycle regardless of pagination.
"""
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from ..models.task import RecurrenceType, Task


def _utc_today():
    return datetime.now(timezone.utc).date()


def should_reset_recurring_task(task: Task, today=None) -> bool:
    if not task.is_recurring or task.recurrence_type == RecurrenceType.NONE:
        return False

    today = today or _utc_today()
    last_completed = task.last_completed

    if not last_completed:
        return task.status == "done"

    if last_completed.tzinfo is not None:
        last_completed_date = last_completed.astimezone(timezone.utc).date()
    else:
        last_completed_date = last_completed.date()

    if last_completed_date == today:
        return False

    if task.recurrence_type == RecurrenceType.DAILY:
        return True

    if task.recurrence_type == RecurrenceType.WEEKDAYS:
        return today.weekday() < 5  # Monday=0 .. Friday=4

    if task.recurrence_type == RecurrenceType.WEEKLY:
        return today.weekday() == last_completed_date.weekday()

    if task.recurrence_type == RecurrenceType.MONTHLY:
        return today.day == last_completed_date.day

    if task.recurrence_type == RecurrenceType.CUSTOM and task.recurrence_days:
        return today.weekday() in task.recurrence_days

    return False


def reset_recurring_tasks(db: Session, user_id: Optional[int] = None) -> int:
    """Reset every due recurring task. Returns how many rows were reset."""
    query = db.query(Task).filter(Task.is_recurring.is_(True))
    if user_id is not None:
        query = query.filter(Task.user_id == user_id)

    today = _utc_today()
    updated = 0
    for task in query.all():
        if should_reset_recurring_task(task, today=today):
            task.status = "todo"
            task.completed_at = None
            updated += 1

    if updated:
        db.commit()
    return updated
