from fastapi import APIRouter

from .auth import router as auth_router
from .bookmarks import router as bookmarks_router
from .dashboard import router as dashboard_router
from .events import router as events_router
from .notes import router as notes_router
from .projects import router as projects_router
from .snippets import router as snippets_router
from .tasks import router as tasks_router

api_router = APIRouter(prefix="/api")

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(tasks_router, prefix="/tasks", tags=["Tasks"])
api_router.include_router(events_router, prefix="/events", tags=["Events"])
api_router.include_router(notes_router, prefix="/notes", tags=["Notes"])
api_router.include_router(bookmarks_router, prefix="/bookmarks", tags=["Bookmarks"])
api_router.include_router(snippets_router, prefix="/snippets", tags=["Snippets"])
api_router.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(projects_router, prefix="/projects", tags=["Projects"])
