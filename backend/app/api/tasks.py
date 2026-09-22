from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .deps import get_current_user
from ..database import get_db
from ..models.task import Task
from ..models.user import User
from ..schemas.task import TaskCreate, TaskResponse, TaskUpdate
from ..utils.crud import apply_update, get_owned_or_404
from ..utils.recurring import reset_recurring_tasks
from ..utils.response import paginated_response, success_response

router = APIRouter()


def _to_dict(task: Task) -> dict:
    return TaskResponse.model_validate(task).model_dump(mode="json")


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


@router.get("", response_model=dict)
async def get_tasks(
    task_status: Optional[str] = None,
    show_recurring: bool = True,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Reset every due recurring task up front (all rows, not just this page).
    reset_recurring_tasks(db, user_id=current_user.id)

    query = db.query(Task).filter(Task.user_id == current_user.id)

    if task_status:
        query = query.filter(Task.status == task_status)
    if not show_recurring:
        query = query.filter(Task.is_recurring.is_(False))
    if search:
        query = query.filter(Task.title.contains(search))

    total = query.count()
    tasks = (
        query.order_by(Task.is_pinned.desc(), Task.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return paginated_response([_to_dict(t) for t in tasks], total, skip, limit)


@router.post("", response_model=dict)
async def create_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = Task(user_id=current_user.id, **task_data.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return success_response(data=_to_dict(task))


@router.get("/{task_id}", response_model=dict)
async def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = get_owned_or_404(db, Task, task_id, current_user)
    return success_response(data=_to_dict(task))


@router.put("/{task_id}", response_model=dict)
async def update_task(
    task_id: int,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = get_owned_or_404(db, Task, task_id, current_user)
    update_data = task_data.model_dump(exclude_unset=True)

    if update_data.get("status") == "done" and task.status != "done":
        now = _utcnow()
        update_data["completed_at"] = now
        if task.is_recurring:
            update_data["last_completed"] = now

    apply_update(task, update_data)
    db.commit()
    db.refresh(task)
    return success_response(data=_to_dict(task))


@router.post("/{task_id}/complete", response_model=dict)
async def complete_recurring_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a recurring task as completed for today."""
    task = get_owned_or_404(db, Task, task_id, current_user)

    if not task.is_recurring:
        raise HTTPException(status_code=400, detail="Task is not recurring")

    now = _utcnow()
    task.status = "done"
    task.completed_at = now
    task.last_completed = now

    db.commit()
    db.refresh(task)
    return success_response(data=_to_dict(task))


@router.delete("/{task_id}", response_model=dict)
async def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = get_owned_or_404(db, Task, task_id, current_user)
    db.delete(task)
    db.commit()
    return success_response(message="Task deleted")
