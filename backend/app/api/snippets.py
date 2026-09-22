from ..models.snippet import Snippet
from ..schemas.snippet import SnippetCreate, SnippetResponse, SnippetUpdate
from ..utils.crud import create_crud_router

router = create_crud_router(
    model=Snippet,
    create_schema=SnippetCreate,
    update_schema=SnippetUpdate,
    response_schema=SnippetResponse,
    name="Snippet",
    search_fields=("title", "code"),
    filter_fields=("language",),
    order_by=(Snippet.updated_at.desc(),),
)
