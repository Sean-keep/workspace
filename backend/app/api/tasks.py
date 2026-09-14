from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from ..database import get_db
from ..models.task import Task, RecurrenceType
from ..schemas.task import TaskCreate, TaskUpdate, TaskResponse
from ..utils.response import success_response
from .deps import get_current_user
from ..models.user import User

router = APIRouter()


def should_reset_recurring_task(task: Task) -> bool:
    """Check if a recurring task should be reset for today"""
    if not task.is_recurring or task.recurrence_type == RecurrenceType.NONE:
        return False

    today = datetime.utcnow().date()
    last_completed = task.last_completed

    # If never completed, it should be active
    if not last_completed:
        return True

    last_completed_date = last_completed.date()

    # If completed today, no reset needed
    if last_completed_date == today:
        return False

    if task.recurrence_type == RecurrenceType.DAILY:
        return True

    if task.recurrence_type == RecurrenceType.WEEKDAYS:
        # Monday=0, Sunday=6
        weekday = today.weekday()
        return weekday < 5  # Monday to Friday

    if task.recurrence_type == RecurrenceType.WEEKLY:
        # Reset if it's the same day of week
        return today.weekday() == last_completed_date.weekday()

    if task.recurrence_type == RecurrenceType.MONTHLY:
        # Reset if it's the same day of month
        return today.day == last_completed_date.day

    if task.recurrence_type == RecurrenceType.CUSTOM:
        if task.recurrence_days:
            weekday = today.weekday()
            return weekday in task.recurrence_days

    return False


@router.get("", response_model=dict)
async def get_tasks(
    task_status: Optional[str] = None,
    show_recurring: bool = True,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Task).filter(Task.user_id == current_user.id)

    if task_status:
        query = query.filter(Task.status == task_status)

    total = query.count()
    tasks = query.order_by(
        Task.is_pinned.desc(),
        Task.created_at.desc()
    ).offset(skip).limit(limit).all()

    # Check and reset recurring tasks
    updated = False
    for task in tasks:
        if should_reset_recurring_task(task):
            task.status = "todo"
            task.completed_at = None
            updated = True

    if updated:
        db.commit()

    return success_response(data={
        "items": [TaskResponse.from_orm(t).dict() for t in tasks],
        "total": total,
        "skip": skip,
        "limit": limit
    })


@router.post("", response_model=dict)
async def create_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = Task(
        user_id=current_user.id,
        **task_data.dict()
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    return success_response(data=TaskResponse.from_orm(task).dict())


@router.get("/{task_id}", response_model=dict)
async def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return success_response(data=TaskResponse.from_orm(task).dict())


@router.put("/{task_id}", response_model=dict)
async def update_task(
    task_id: int,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = task_data.dict(exclude_unset=True)

    # If status changed to done, set completed_at and last_completed for recurring tasks
    if "status" in update_data and update_data["status"] == "done":
        update_data["completed_at"] = datetime.utcnow()
        if task.is_recurring:
            update_data["last_completed"] = datetime.utcnow()

    for field, value in update_data.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)

    return success_response(data=TaskResponse.from_orm(task).dict())


@router.post("/{task_id}/complete", response_model=dict)
async def complete_recurring_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a recurring task as completed for today"""
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if not task.is_recurring:
        raise HTTPException(status_code=400, detail="Task is not recurring")

    task.status = "done"
    task.completed_at = datetime.utcnow()
    task.last_completed = datetime.utcnow()

    db.commit()
    db.refresh(task)

    return success_response(data=TaskResponse.from_orm(task).dict())


@router.delete("/{task_id}", response_model=dict)
async def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()

    return success_response(message="Task deleted")
