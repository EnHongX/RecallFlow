from datetime import date, datetime, time, timedelta
from typing import Sequence, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, update, func, and_, case
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Student, User, PracticeRecord
from app.schemas import (
    ErrorResponse,
    StudentCreate,
    StudentResponse,
    StudentUpdate,
    SuccessResponse,
    DailyProgressSummary,
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
    
    update_data = request.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        if value is not None:
            setattr(student, key, value)
    
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


@router.get(
    "/daily-progress",
    response_model=list[DailyProgressSummary],
    responses={
        401: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)
def get_daily_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    student_id: Optional[int] = Query(None),
) -> list[DailyProgressSummary]:
    today = date.today()
    start_of_day = datetime.combine(today, time.min)
    end_of_day = datetime.combine(today, time.max)
    
    students_query = select(Student).where(Student.user_id == current_user.id)
    if student_id is not None:
        students_query = students_query.where(Student.id == student_id)
    students = db.execute(students_query).scalars().all()
    
    result = []
    for student in students:
        stats_query = (
            select(
                func.count(PracticeRecord.id).label("total_count"),
                func.count(case((PracticeRecord.result == "gotit", 1))).label("correct_count"),
                func.count(case((PracticeRecord.result == "again", 1))).label("incorrect_count"),
                func.coalesce(func.sum(PracticeRecord.time_spent_seconds), 0).label("total_seconds"),
            )
            .where(
                PracticeRecord.student_id == student.id,
                PracticeRecord.submitted_at >= start_of_day,
                PracticeRecord.submitted_at <= end_of_day,
            )
        )
        stats = db.execute(stats_query).fetchone()
        
        completed_questions = stats.total_count or 0
        correct_questions = stats.correct_count or 0
        incorrect_questions = stats.incorrect_count or 0
        total_seconds = stats.total_seconds or 0
        
        goal_questions = student.daily_goal_questions
        goal_minutes = student.daily_goal_minutes
        
        questions_progress = (
            min(100.0, (completed_questions / goal_questions) * 100)
            if goal_questions > 0
            else 100.0
        )
        
        goal_seconds = goal_minutes * 60
        minutes_progress = (
            min(100.0, (total_seconds / goal_seconds) * 100)
            if goal_seconds > 0
            else 100.0
        )
        
        result.append(DailyProgressSummary(
            student_id=student.id,
            student_name=student.name,
            completed_questions=completed_questions,
            correct_questions=correct_questions,
            incorrect_questions=incorrect_questions,
            total_seconds=total_seconds,
            goal_questions=goal_questions,
            goal_minutes=goal_minutes,
            questions_progress=questions_progress,
            minutes_progress=minutes_progress,
        ))
    
    return result
