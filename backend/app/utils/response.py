from typing import Any, Optional


def success_response(data: Any = None, message: str = "success") -> dict:
    return {
        "code": 200,
        "msg": message,
        "data": data
    }


def error_response(message: str = "error", code: int = 400, data: Any = None) -> dict:
    return {
        "code": code,
        "msg": message,
        "data": data
    }
