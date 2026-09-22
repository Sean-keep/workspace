from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .deps import get_current_user
from ..database import get_db
from ..models.user import User
from ..schemas.token import Token, TokenRefresh
from ..schemas.user import PasswordChange, UserCreate, UserLogin, UserResponse, UserUpdate
from ..utils.rate_limit import is_rate_limited, record_failure, reset_rate_limit
from ..utils.response import success_response
from ..utils.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)

router = APIRouter()


def _user_payload(user: User) -> dict:
    return {
        "user": UserResponse.model_validate(user).model_dump(mode="json"),
        "access_token": create_access_token({"user_id": user.id, "username": user.username}),
        "refresh_token": create_refresh_token({"user_id": user.id, "username": user.username}),
        "token_type": "bearer",
    }


@router.post("/register", response_model=dict)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already registered")

    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return success_response(data=_user_payload(user))


@router.post("/login", response_model=dict)
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    rate_key = f"login:fail:{login_data.username}"
    if is_rate_limited(rate_key):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed attempts. Try again later.",
        )

    user = db.query(User).filter(User.username == login_data.username).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        record_failure(rate_key)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive")

    reset_rate_limit(rate_key)
    return success_response(data=_user_payload(user))


@router.post("/refresh", response_model=dict)
async def refresh_tokens(payload: TokenRefresh):
    data = decode_token(payload.refresh_token, expected_type="refresh")
    if data is None or data.get("user_id") is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )
    token_data = {"user_id": data["user_id"], "username": data.get("username")}
    return success_response(data={
        "access_token": create_access_token(token_data),
        "refresh_token": create_refresh_token(token_data),
        "token_type": "bearer",
    })


@router.get("/me", response_model=dict)
async def get_me(current_user: User = Depends(get_current_user)):
    return success_response(data=UserResponse.model_validate(current_user).model_dump(mode="json"))


@router.put("/me", response_model=dict)
async def update_me(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = payload.model_dump(exclude_unset=True)

    if "username" in data and data["username"] != current_user.username:
        clash = db.query(User).filter(User.username == data["username"]).first()
        if clash:
            raise HTTPException(status_code=400, detail="Username already registered")

    if "email" in data and data["email"] != current_user.email:
        clash = db.query(User).filter(User.email == data["email"]).first()
        if clash:
            raise HTTPException(status_code=400, detail="Email already registered")

    for field, value in data.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)
    return success_response(data=UserResponse.model_validate(current_user).model_dump(mode="json"))


@router.put("/password", response_model=dict)
async def change_password(
    payload: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Old password is incorrect")

    current_user.password_hash = get_password_hash(payload.new_password)
    db.commit()
    return success_response(message="Password updated")
