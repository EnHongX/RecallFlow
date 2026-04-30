from fastapi import APIRouter, Depends, Response
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.deps import get_current_user
from app.errors import api_error
from app.models import User
from app.schemas import ErrorResponse, LoginRequest, RegisterRequest, SuccessResponse, UserResponse
from app.utils import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
me_router = APIRouter(prefix="/api/v1", tags=["auth"])

settings = get_settings()


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
        raise api_error("AUTH_003")
    
    hashed_password = hash_password(request.password)
    new_user = User(
        phone=request.phone,
        password_hash=hashed_password
    )
    
    try:
        db.add(new_user)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise api_error("AUTH_003") from None
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
        raise api_error("AUTH_004")
    
    access_token = create_access_token(subject=user.id)
    
    response.set_cookie(
        key=settings.cookie_name,
        value=access_token,
        httponly=True,
        secure=settings.cookie_secure,
        max_age=settings.jwt_expires_days * 24 * 60 * 60,
        expires=settings.jwt_expires_days * 24 * 60 * 60,
        samesite="lax",
    )
    
    return user


@me_router.get(
    "/me",
    response_model=UserResponse,
    responses={
        401: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post(
    "/logout",
    response_model=SuccessResponse,
    responses={
        500: {"model": ErrorResponse},
    }
)
def logout(response: Response):
    response.delete_cookie(
        key=settings.cookie_name,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
    )
    
    return SuccessResponse(message="退出登录成功")
