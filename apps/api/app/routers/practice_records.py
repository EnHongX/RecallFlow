from typing import Sequence, Optional
from math import ceil

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import PracticeRecord, User, Student, Card
from app.schemas import (
    ErrorResponse,
    PracticeRecordResponse,
    PaginatedResponse,
)

router = APIRouter(prefix="/api/v1/practice-records", tags=["practice-records"])


@router.get(
    "",
    response_model=PaginatedResponse[PracticeRecordResponse],
    responses={
        401: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)
def get_practice_records(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    student_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> PaginatedResponse[PracticeRecordResponse]:
    count_query = (
        select(func.count(PracticeRecord.id))
        .join(Student)
        .where(Student.user_id == current_user.id)
    )
    query = (
        select(PracticeRecord)
        .join(Student)
        .where(Student.user_id == current_user.id)
    )
    
    if student_id is not None:
        count_query = count_query.where(PracticeRecord.student_id == student_id)
        query = query.where(PracticeRecord.student_id == student_id)
    
    total = db.execute(count_query).scalar() or 0
    total_pages = ceil(total / page_size) if total > 0 else 1
    
    query = query.order_by(PracticeRecord.submitted_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    records = db.execute(query).scalars().all()
    
    for record in records:
        if record.student_id:
            student = db.execute(
                select(Student).where(Student.id == record.student_id)
            ).scalar_one_or_none()
            if student:
                record.student_name = student.name
        
        if record.card_id:
            card = db.execute(
                select(Card).where(Card.id == record.card_id)
            ).scalar_one_or_none()
            if card:
                record.card_front = card.front
                record.card_back = card.back
    
    return PaginatedResponse(
        items=records,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )
