from ..models.bookmark import Bookmark
from ..schemas.bookmark import BookmarkCreate, BookmarkResponse, BookmarkUpdate
from ..utils.crud import create_crud_router

router = create_crud_router(
    model=Bookmark,
    create_schema=BookmarkCreate,
    update_schema=BookmarkUpdate,
    response_schema=BookmarkResponse,
    name="Bookmark",
    search_fields=("title", "url"),
    filter_fields=("category",),
    order_by=(Bookmark.visit_count.desc(), Bookmark.created_at.desc()),
)
