from datetime import datetime
from typing import Sequence, Optional
from math import ceil

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import WrongCard, User, Student, Card
from app.schemas import (
    ErrorResponse,
    WrongCardResponse,
    SuccessResponse,
    PaginatedResponse,
)

router = APIRouter(prefix="/api/v1/wrong-cards", tags=["wrong-cards"])


@router.get(
    "",
    response_model=PaginatedResponse[WrongCardResponse],
    responses={
        401: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)
def get_wrong_cards(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    student_id: Optional[int] = Query(None),
    is_mastered: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> PaginatedResponse[WrongCardResponse]:
    count_query = (
        select(func.count(WrongCard.id))
        .join(Student)
        .where(Student.user_id == current_user.id)
    )
    query = (
        select(WrongCard)
        .join(Student)
        .where(Student.user_id == current_user.id)
    )
    
    if student_id is not None:
        count_query = count_query.where(WrongCard.student_id == student_id)
        query = query.where(WrongCard.student_id == student_id)
    
    if is_mastered is not None:
        count_query = count_query.where(WrongCard.is_mastered == is_mastered)
        query = query.where(WrongCard.is_mastered == is_mastered)
    else:
        count_query = count_query.where(WrongCard.is_mastered == False)
        query = query.where(WrongCard.is_mastered == False)
    
    total = db.execute(count_query).scalar() or 0
    total_pages = ceil(total / page_size) if total > 0 else 1
    
    query = query.order_by(WrongCard.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    wrong_cards = db.execute(query).scalars().all()
    
    for wc in wrong_cards:
        if wc.student_id:
            student = db.execute(
                select(Student).where(Student.id == wc.student_id)
            ).scalar_one_or_none()
            if student:
                wc.student_name = student.name
        
        if wc.card_id:
            card = db.execute(
                select(Card).where(Card.id == wc.card_id)
            ).scalar_one_or_none()
            if card:
                wc.card_front = card.front
                wc.card_back = card.back
                wc.card_status = card.status
    
    return PaginatedResponse(
        items=wrong_cards,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post(
    "/{wrong_card_id}/master",
    response_model=SuccessResponse,
    responses={
        401: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)
def mark_wrong_card_as_mastered(
    wrong_card_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SuccessResponse:
    wrong_card = db.execute(
        select(WrongCard)
        .join(Student)
        .where(
            WrongCard.id == wrong_card_id,
            Student.user_id == current_user.id
        )
    ).scalar_one_or_none()
    
    if not wrong_card:
        from app.errors import api_error
        raise api_error("COMMON_002")
    
    wrong_card.is_mastered = True
    wrong_card.mastered_at = datetime.now()
    
    db.commit()
    
    return SuccessResponse(message="错题已标记为已掌握")
