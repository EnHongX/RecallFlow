from datetime import datetime
from typing import Sequence, Optional
from math import ceil

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Card, User, Student, Question, PracticeRecord, WrongCard
from app.schemas import (
    ErrorResponse,
    CardCreate,
    CardResponse,
    CardUpdate,
    PracticeSubmitRequest,
    SuccessResponse,
    PaginatedResponse,
)

router = APIRouter(prefix="/api/v1/cards", tags=["cards"])


@router.get(
    "",
    response_model=PaginatedResponse[CardResponse],
    responses={
        401: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)
def get_cards(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    student_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> PaginatedResponse[CardResponse]:
    count_query = select(func.count(Card.id)).join(Student).where(Student.user_id == current_user.id)
    query = select(Card).join(Student).where(Student.user_id == current_user.id)
    
    if student_id is not None:
        count_query = count_query.where(Card.student_id == student_id)
        query = query.where(Card.student_id == student_id)
    if status is not None:
        count_query = count_query.where(Card.status == status)
        query = query.where(Card.status == status)
    
    total = db.execute(count_query).scalar() or 0
    total_pages = ceil(total / page_size) if total > 0 else 1
    
    query = query.order_by(Card.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    cards = db.execute(query).scalars().all()
    
    for card in cards:
        if card.student_id:
            student = db.execute(
                select(Student).where(Student.id == card.student_id)
            ).scalar_one_or_none()
            if student:
                card.student_name = student.name
        
        if card.question_id:
            question = db.execute(
                select(Question).where(Question.id == card.question_id)
            ).scalar_one_or_none()
            if question:
                card.question_prompt = question.prompt
                card.question_type = question.type
    
    return PaginatedResponse(
        items=cards,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get(
    "/{card_id}",
    response_model=CardResponse,
    responses={
        401: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)
def get_card(
    card_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Card:
    card = db.execute(
        select(Card)
        .join(Student)
        .where(
            Card.id == card_id,
            Student.user_id == current_user.id
        )
    ).scalar_one_or_none()
    
    if not card:
        from app.errors import api_error
        raise api_error("COMMON_002")
    
    if card.student_id:
        student = db.execute(
            select(Student).where(Student.id == card.student_id)
        ).scalar_one_or_none()
        if student:
            card.student_name = student.name
    
    if card.question_id:
        question = db.execute(
            select(Question).where(Question.id == card.question_id)
        ).scalar_one_or_none()
        if question:
            card.question_prompt = question.prompt
            card.question_type = question.type
    
    return card


@router.post(
    "",
    response_model=CardResponse,
    responses={
        400: {"model": ErrorResponse},
        401: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)
def create_card(
    request: CardCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Card:
    student = db.execute(
        select(Student).where(
            Student.id == request.student_id,
            Student.user_id == current_user.id
        )
    ).scalar_one_or_none()
    if not student:
        from app.errors import api_error
        raise api_error("COMMON_002")
    
    question = db.execute(
        select(Question).where(
            Question.id == request.question_id,
            Question.user_id == current_user.id
        )
    ).scalar_one_or_none()
    if not question:
        from app.errors import api_error
        raise api_error("COMMON_002")
    
    existing_card = db.execute(
        select(Card).where(
            Card.student_id == request.student_id,
            Card.question_id == request.question_id
        )
    ).scalar_one_or_none()
    if existing_card:
        from app.errors import api_error
        raise api_error("COMMON_001", {"message": "该题目已经为该孩子生成过练习卡片"})
    
    new_card = Card(
        student_id=request.student_id,
        question_id=request.question_id,
        card_type="practice",
        front=question.prompt,
        back=question.answer,
        child_explanation=question.child_explanation,
        fun_hint=question.fun_hint,
        status="new",
        grading_method=question.grading_method,
    )
    
    db.add(new_card)
    db.commit()
    db.refresh(new_card)
    
    new_card.student_name = student.name
    new_card.question_prompt = question.prompt
    
    return new_card


@router.put(
    "/{card_id}",
    response_model=CardResponse,
    responses={
        401: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)
def update_card(
    card_id: int,
    request: CardUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Card:
    card = db.execute(
        select(Card)
        .join(Student)
        .where(
            Card.id == card_id,
            Student.user_id == current_user.id
        )
    ).scalar_one_or_none()
    
    if not card:
        from app.errors import api_error
        raise api_error("COMMON_002")
    
    update_data = request.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(card, key, value)
    
    db.commit()
    db.refresh(card)
    
    if card.student_id:
        student = db.execute(
            select(Student).where(Student.id == card.student_id)
        ).scalar_one_or_none()
        if student:
            card.student_name = student.name
    
    if card.question_id:
        question = db.execute(
            select(Question).where(Question.id == card.question_id)
        ).scalar_one_or_none()
        if question:
            card.question_prompt = question.prompt
    
    return card


@router.delete(
    "/{card_id}",
    response_model=SuccessResponse,
    responses={
        401: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)
def delete_card(
    card_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SuccessResponse:
    card = db.execute(
        select(Card)
        .join(Student)
        .where(
            Card.id == card_id,
            Student.user_id == current_user.id
        )
    ).scalar_one_or_none()
    
    if not card:
        from app.errors import api_error
        raise api_error("COMMON_002")
    
    db.delete(card)
    db.commit()
    
    return SuccessResponse(message="练习卡片已删除")


@router.post(
    "/{card_id}/submit",
    response_model=CardResponse,
    responses={
        400: {"model": ErrorResponse},
        401: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)
def submit_practice(
    card_id: int,
    request: PracticeSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Card:
    card = db.execute(
        select(Card)
        .join(Student)
        .where(
            Card.id == card_id,
            Student.user_id == current_user.id
        )
    ).scalar_one_or_none()
    
    if not card:
        from app.errors import api_error
        raise api_error("COMMON_002")
    
    result = request.result.lower()
    if result not in ["gotit", "again"]:
        from app.errors import api_error
        raise api_error("COMMON_001", {"message": "无效的提交结果"})
    
    practice_record = PracticeRecord(
        student_id=card.student_id,
        card_id=card.id,
        result=result,
        time_spent_seconds=request.time_spent_seconds,
        student_answer=request.student_answer,
        submitted_at=datetime.now(),
    )
    db.add(practice_record)
    
    if result == "gotit":
        new_status = (
            "learning" if card.status == "new"
            else "review" if card.status == "learning"
            else "mastered"
        )
    else:
        new_status = (
            "review" if card.status == "mastered"
            else "new"
        )
        
        existing_wrong_card = db.execute(
            select(WrongCard).where(
                WrongCard.card_id == card.id,
                WrongCard.is_mastered == False
            )
        ).scalar_one_or_none()
        
        if not existing_wrong_card:
            wrong_card = WrongCard(
                student_id=card.student_id,
                card_id=card.id,
                is_mastered=False,
            )
            db.add(wrong_card)
    
    card.status = new_status
    db.commit()
    db.refresh(card)
    
    if card.student_id:
        student = db.execute(
            select(Student).where(Student.id == card.student_id)
        ).scalar_one_or_none()
        if student:
            card.student_name = student.name
    
    if card.question_id:
        question = db.execute(
            select(Question).where(Question.id == card.question_id)
        ).scalar_one_or_none()
        if question:
            card.question_prompt = question.prompt
    
    return card
