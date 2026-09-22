from ..models.project import Project
from ..schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate, compute_progress
from ..utils.crud import create_crud_router


def _sync_progress(item: Project, data: dict) -> None:
    """Recompute progress from subtasks whenever they change.

    Writes through to `data` as well so a later `apply_update` cannot
    clobber the derived value with a stale client-supplied `progress`.
    """
    if "subtasks" in data:
        progress = compute_progress(data["subtasks"])
        data["progress"] = progress
        item.progress = progress


router = create_crud_router(
    model=Project,
    create_schema=ProjectCreate,
    update_schema=ProjectUpdate,
    response_schema=ProjectResponse,
    name="Project",
    search_fields=("name", "description"),
    filter_fields=("status",),
    order_by=(Project.created_at.desc(),),
    on_create=lambda db, item, data, user: _sync_progress(item, data),
    on_update=lambda db, item, data, user: _sync_progress(item, data),
)
