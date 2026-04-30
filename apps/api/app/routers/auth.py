import json
from datetime import timedelta
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import User
from app.schemas import ErrorResponse, LoginRequest, RegisterRequest, SuccessResponse, UserResponse
from app.utils import create_access_token, decode_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

settings = get_settings()

error_codes_path = Path(__file__).parent.parent / "error_codes.json"
with open(error_codes_path, "r", encoding="utf-8") as f:
    ERROR_CODES = json.load(f)


def get_error_response(error_key: str) -> tuple[dict, int]:
    error = ERROR_CODES.get(error_key, ERROR_CODES["COMMON_002"])
    return {
        "success": False,
        "code": error["code"],
        "message": error["message"]
    }, error["http_status"]


@router.post(
    "/register",
    response_model=UserResponse,
    responses={
        400: {"model": ErrorResponse},
        409: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db)
):
    existing_user = db.execute(
        select(User).where(User.phone == request.phone)
    ).scalar_one_or_none()
    
    if existing_user:
        response, status_code = get_error_response("AUTH_003")
        raise HTTPException(status_code=status_code, detail=response)
    
    hashed_password = hash_password(request.password)
    new_user = User(
        phone=request.phone,
        password_hash=hashed_password
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.post(
    "/login",
    response_model=UserResponse,
    responses={
        401: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)
def login(
    request: LoginRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    user = db.execute(
        select(User).where(User.phone == request.phone)
    ).scalar_one_or_none()
    
    if not user or not verify_password(request.password, user.password_hash):
        error_response, status_code = get_error_response("AUTH_004")
        raise HTTPException(status_code=status_code, detail=error_response)
    
    access_token = create_access_token(subject=user.id)
    
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        secure=settings.cookie_secure,
        max_age=settings.jwt_expires_days * 24 * 60 * 60,
        expires=settings.jwt_expires_days * 24 * 60 * 60,
        samesite="lax"
    )
    
    return user


@router.get(
    "/me",
    response_model=UserResponse,
    responses={
        401: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)
def get_current_user(
    access_token: Annotated[str | None, Cookie()] = None,
    db: Session = Depends(get_db)
):
    if not access_token:
        error_response, status_code = get_error_response("AUTH_005")
        raise HTTPException(status_code=status_code, detail=error_response)
    
    try:
        token = access_token.replace("Bearer ", "")
    except AttributeError:
        token = access_token
    
    payload = decode_access_token(token)
    if not payload:
        error_response, status_code = get_error_response("AUTH_006")
        raise HTTPException(status_code=status_code, detail=error_response)
    
    user_id = payload.get("sub")
    if not user_id:
        error_response, status_code = get_error_response("AUTH_006")
        raise HTTPException(status_code=status_code, detail=error_response)
    
    try:
        user_id_int = int(user_id)
    except ValueError:
        error_response, status_code = get_error_response("AUTH_006")
        raise HTTPException(status_code=status_code, detail=error_response)
    
    user = db.execute(
        select(User).where(User.id == user_id_int)
    ).scalar_one_or_none()
    
    if not user:
        error_response, status_code = get_error_response("AUTH_007")
        raise HTTPException(status_code=status_code, detail=error_response)
    
    return user


@router.post(
    "/logout",
    response_model=SuccessResponse,
    responses={
        500: {"model": ErrorResponse},
    }
)
def logout(response: Response):
    response.delete_cookie(
        key="access_token",
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax"
    )
    
    return SuccessResponse(message="退出登录成功")
