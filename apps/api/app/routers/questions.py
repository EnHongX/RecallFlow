from typing import Sequence, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, update, or_
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.deps import get_current_user
from app.models import Question, User, Subject, Student
from app.schemas import (
    ErrorResponse,
    QuestionCreate,
    QuestionResponse,
    QuestionUpdate,
    SuccessResponse,
)

router = APIRouter(prefix="/api/v1/questions", tags=["questions"])


@router.get(
    "",
    response_model=list[QuestionResponse],
    responses={
        401: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)
def get_questions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    subject_id: Optional[int] = Query(None),
    type: Optional[str] = Query(None),
    grading_method: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    student_id: Optional[int] = Query(None),
    keyword: Optional[str] = Query(None),
) -> Sequence[Question]:
    query = select(Question).where(Question.user_id == current_user.id)
    
    if subject_id is not None:
        query = query.where(Question.subject_id == subject_id)
    if type is not None:
        query = query.where(Question.type == type)
    if grading_method is not None:
        query = query.where(Question.grading_method == grading_method)
    if status is not None:
        query = query.where(Question.status == status)
    if student_id is not None:
        query = query.where(Question.student_id == student_id)
    
    if keyword is not None and keyword.strip():
        keyword = keyword.strip()
        query = query.where(
            or_(
                Question.prompt.contains(keyword),
                Question.answer.contains(keyword),
                Question.tags.contains(keyword),
            )
        )
    
    query = query.order_by(Question.created_at.desc())
    
    questions = db.execute(query).scalars().all()
    
    for question in questions:
        if question.subject_id:
            subject = db.execute(
                select(Subject).where(Subject.id == question.subject_id)
            ).scalar_one_or_none()
            if subject:
                question.subject_name = subject.name
        
        if question.student_id:
            student = db.execute(
                select(Student).where(Student.id == question.student_id)
            ).scalar_one_or_none()
            if student:
                question.student_name = student.name
    
    return questions


@router.get(
    "/{question_id}",
    response_model=QuestionResponse,
    responses={
        401: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)
def get_question(
    question_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Question:
    question = db.execute(
        select(Question).where(
            Question.id == question_id,
            Question.user_id == current_user.id
        )
    ).scalar_one_or_none()
    
    if not question:
        from app.errors import api_error
        raise api_error("COMMON_002")
    
    if question.subject_id:
        subject = db.execute(
            select(Subject).where(Subject.id == question.subject_id)
        ).scalar_one_or_none()
        if subject:
            question.subject_name = subject.name
    
    if question.student_id:
        student = db.execute(
            select(Student).where(Student.id == question.student_id)
        ).scalar_one_or_none()
        if student:
            question.student_name = student.name
    
    return question


@router.post(
    "",
    response_model=QuestionResponse,
    responses={
        400: {"model": ErrorResponse},
        401: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)
def create_question(
    request: QuestionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Question:
    if request.student_id is not None:
        student = db.execute(
            select(Student).where(
                Student.id == request.student_id,
                Student.user_id == current_user.id
            )
        ).scalar_one_or_none()
        if not student:
            from app.errors import api_error
            raise api_error("COMMON_002")
    
    new_question = Question(
        user_id=current_user.id,
        subject_id=request.subject_id,
        type=request.type,
        prompt=request.prompt,
        answer=request.answer,
        explanation=request.explanation,
        child_explanation=request.child_explanation,
        fun_hint=request.fun_hint,
        difficulty=request.difficulty,
        tags=request.tags,
        source=request.source,
        grading_method=request.grading_method,
        student_id=request.student_id,
        status="active",
    )
    
    db.add(new_question)
    db.commit()
    db.refresh(new_question)
    
    if new_question.subject_id:
        subject = db.execute(
            select(Subject).where(Subject.id == new_question.subject_id)
        ).scalar_one_or_none()
        if subject:
            new_question.subject_name = subject.name
    
    if new_question.student_id:
        student = db.execute(
            select(Student).where(Student.id == new_question.student_id)
        ).scalar_one_or_none()
        if student:
            new_question.student_name = student.name
    
    return new_question


@router.put(
    "/{question_id}",
    response_model=QuestionResponse,
    responses={
        401: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)
def update_question(
    question_id: int,
    request: QuestionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Question:
    question = db.execute(
        select(Question).where(
            Question.id == question_id,
            Question.user_id == current_user.id
        )
    ).scalar_one_or_none()
    
    if not question:
        from app.errors import api_error
        raise api_error("COMMON_002")
    
    if request.student_id is not None:
        student = db.execute(
            select(Student).where(
                Student.id == request.student_id,
                Student.user_id == current_user.id
            )
        ).scalar_one_or_none()
        if not student:
            from app.errors import api_error
            raise api_error("COMMON_002")
    
    update_data = request.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(question, key, value)
    
    db.commit()
    db.refresh(question)
    
    if question.subject_id:
        subject = db.execute(
            select(Subject).where(Subject.id == question.subject_id)
        ).scalar_one_or_none()
        if subject:
            question.subject_name = subject.name
    
    if question.student_id:
        student = db.execute(
            select(Student).where(Student.id == question.student_id)
        ).scalar_one_or_none()
        if student:
            question.student_name = student.name
    
    return question


@router.delete(
    "/{question_id}",
    response_model=SuccessResponse,
    responses={
        401: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)
def delete_question(
    question_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SuccessResponse:
    question = db.execute(
        select(Question).where(
            Question.id == question_id,
            Question.user_id == current_user.id
        )
    ).scalar_one_or_none()
    
    if not question:
        from app.errors import api_error
        raise api_error("COMMON_002")
    
    question.status = "archived"
    question.archived_at = datetime.now()
    db.commit()
    
    return SuccessResponse(message="题目已删除")


@router.post(
    "/{question_id}/restore",
    response_model=SuccessResponse,
    responses={
        401: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)
def restore_question(
    question_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SuccessResponse:
    question = db.execute(
        select(Question).where(
            Question.id == question_id,
            Question.user_id == current_user.id
        )
    ).scalar_one_or_none()
    
    if not question:
        from app.errors import api_error
        raise api_error("COMMON_002")
    
    question.status = "active"
    question.archived_at = None
    db.commit()
    
    return SuccessResponse(message="题目已恢复")
