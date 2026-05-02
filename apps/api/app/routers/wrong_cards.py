from datetime import datetime
from typing import Sequence, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import WrongCard, User, Student, Card
from app.schemas import (
    ErrorResponse,
    WrongCardResponse,
    SuccessResponse,
)

router = APIRouter(prefix="/api/v1/wrong-cards", tags=["wrong-cards"])


@router.get(
    "",
    response_model=list[WrongCardResponse],
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
) -> Sequence[WrongCard]:
    query = (
        select(WrongCard)
        .join(Student)
        .where(Student.user_id == current_user.id)
    )
    
    if student_id is not None:
        query = query.where(WrongCard.student_id == student_id)
    
    if is_mastered is not None:
        query = query.where(WrongCard.is_mastered == is_mastered)
    else:
        query = query.where(WrongCard.is_mastered == False)
    
    query = query.order_by(WrongCard.created_at.desc())
    
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
    
    return wrong_cards


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
