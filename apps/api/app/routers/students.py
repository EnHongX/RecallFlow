from typing import Sequence

from fastapi import APIRouter, Depends
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Student, User
from app.schemas import (
    ErrorResponse,
    StudentCreate,
    StudentResponse,
    StudentUpdate,
    SuccessResponse,
)

router = APIRouter(prefix="/api/v1/students", tags=["students"])


@router.get(
    "",
    response_model=list[StudentResponse],
    responses={
        401: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)
def get_students(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Sequence[Student]:
    students = db.execute(
        select(Student)
        .where(Student.user_id == current_user.id)
        .order_by(Student.created_at.asc())
    ).scalars().all()
    return students


@router.get(
    "/current",
    response_model=StudentResponse | None,
    responses={
        401: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)
def get_current_student(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Student | None:
    student = db.execute(
        select(Student)
        .where(Student.user_id == current_user.id, Student.is_current == True)
    ).scalar_one_or_none()
    return student


@router.post(
    "",
    response_model=StudentResponse,
    responses={
        400: {"model": ErrorResponse},
        401: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)
def create_student(
    request: StudentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Student:
    existing_count = db.execute(
        select(Student).where(Student.user_id == current_user.id)
    ).scalars().all()
    
    is_first_student = len(existing_count) == 0
    
    new_student = Student(
        user_id=current_user.id,
        name=request.name,
        grade=request.grade,
        is_current=is_first_student,
    )
    
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    
    return new_student


@router.put(
    "/{student_id}",
    response_model=StudentResponse,
    responses={
        401: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)
def update_student(
    student_id: int,
    request: StudentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Student:
    student = db.execute(
        select(Student).where(
            Student.id == student_id,
            Student.user_id == current_user.id
        )
    ).scalar_one_or_none()
    
    if not student:
        from app.errors import api_error
        raise api_error("COMMON_002")
    
    student.name = request.name
    student.grade = request.grade
    db.commit()
    db.refresh(student)
    
    return student


@router.post(
    "/{student_id}/set-current",
    response_model=SuccessResponse,
    responses={
        401: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)
def set_current_student(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SuccessResponse:
    student = db.execute(
        select(Student).where(
            Student.id == student_id,
            Student.user_id == current_user.id
        )
    ).scalar_one_or_none()
    
    if not student:
        from app.errors import api_error
        raise api_error("COMMON_002")
    
    db.execute(
        update(Student)
        .where(Student.user_id == current_user.id)
        .values(is_current=False)
    )
    
    student.is_current = True
    db.commit()
    
    return SuccessResponse(message="已切换当前孩子")
