"""Generic user-scoped CRUD router factory.

Most resources in this app share the same shape: owned by a user, created /
read / updated / deleted through the same five endpoints. `create_crud_router`
builds that surface once so each module only declares what is different
(filters, search fields, hooks).
"""
from typing import Callable, Optional, Sequence, Type

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..utils.response import paginated_response, success_response

ItemHook = Callable[[Session, object, dict, User], None]


def get_owned_or_404(db: Session, model, item_id: int, user: User):
    item = db.query(model).filter(model.id == item_id, model.user_id == user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail=f"{model.__name__} not found")
    return item


def apply_update(obj, update_data: dict) -> None:
    for field, value in update_data.items():
        setattr(obj, field, value)


def create_crud_router(
    *,
    model: Type,
    create_schema: Type[BaseModel],
    update_schema: Type[BaseModel],
    response_schema: Type[BaseModel],
    name: str,
    search_fields: Sequence[str] = (),
    filter_fields: Sequence[str] = (),
    order_by: Sequence = (),
    paginated: bool = True,
    default_limit: int = 50,
    max_limit: int = 200,
    serialize: Optional[Callable] = None,
    on_create: Optional[ItemHook] = None,
    on_update: Optional[ItemHook] = None,
    query_modifiers: Optional[Callable] = None,
    list_transform: Optional[Callable] = None,
) -> APIRouter:
    """Build the standard CRUD routes for a user-owned model.

    serialize:       model -> dict (defaults to `response_schema.model_validate`)
    list_transform:  model -> dict for list rows (falls back to serialize)
    query_modifiers: (query, request, user) -> query, for custom list filters
    on_create/on_update: mutate the object / data before commit
    """
    router = APIRouter()
    # Imported here: app.api.deps sits above this module in the package tree.
    from ..api.deps import get_current_user

    to_dict = serialize or (lambda obj: response_schema.model_validate(obj).model_dump(mode="json"))
    row_dict = list_transform or to_dict

    @router.get("")
    async def list_items(
        request: Request,
        search: Optional[str] = None,
        skip: int = Query(0, ge=0),
        limit: int = Query(default_limit, ge=1, le=max_limit),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
    ):
        query = db.query(model).filter(model.user_id == current_user.id)

        if search and search_fields:
            query = query.filter(
                or_(*[getattr(model, f).contains(search) for f in search_fields])
            )

        for field in filter_fields:
            raw = request.query_params.get(field)
            if raw is not None and raw != "":
                query = query.filter(getattr(model, field) == raw)

        if query_modifiers:
            query = query_modifiers(query, request, current_user)

        if order_by:
            query = query.order_by(*order_by)

        if paginated:
            total = query.count()
            items = query.offset(skip).limit(limit).all()
            return paginated_response([row_dict(i) for i in items], total, skip, limit)

        items = query.all()
        return success_response(data=[row_dict(i) for i in items])

    @router.post("")
    async def create_item(
        payload: create_schema,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
    ):
        data = payload.model_dump()
        item = model(user_id=current_user.id, **data)
        if on_create:
            on_create(db, item, data, current_user)
        db.add(item)
        db.commit()
        db.refresh(item)
        return success_response(data=to_dict(item))

    @router.get("/{item_id}")
    async def get_item(
        item_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
    ):
        item = get_owned_or_404(db, model, item_id, current_user)
        return success_response(data=to_dict(item))

    @router.put("/{item_id}")
    async def update_item(
        item_id: int,
        payload: update_schema,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
    ):
        item = get_owned_or_404(db, model, item_id, current_user)
        data = payload.model_dump(exclude_unset=True)
        if on_update:
            on_update(db, item, data, current_user)
        apply_update(item, data)
        db.commit()
        db.refresh(item)
        return success_response(data=to_dict(item))

    @router.delete("/{item_id}")
    async def delete_item(
        item_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
    ):
        item = get_owned_or_404(db, model, item_id, current_user)
        db.delete(item)
        db.commit()
        return success_response(message=f"{name} deleted")

    return router
