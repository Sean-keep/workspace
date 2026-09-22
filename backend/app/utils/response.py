from typing import Any, Optional


def success_response(data: Any = None, message: str = "success") -> dict:
    return {"code": 200, "msg": message, "data": data}


def error_response(message: str = "error", code: int = 400, data: Any = None) -> dict:
    return {"code": code, "msg": message, "data": data}


def paginated_response(
    items: list,
    total: int,
    skip: int = 0,
    limit: int = 50,
    message: str = "success",
) -> dict:
    return success_response(
        data={"items": items, "total": total, "skip": skip, "limit": limit},
        message=message,
    )
