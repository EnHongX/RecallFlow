from typing import Sequence, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import PracticeRecord, User, Student, Card
from app.schemas import (
    ErrorResponse,
    PracticeRecordResponse,
)

router = APIRouter(prefix="/api/v1/practice-records", tags=["practice-records"])


@router.get(
    "",
    response_model=list[PracticeRecordResponse],
    responses={
        401: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)
def get_practice_records(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    student_id: Optional[int] = Query(None),
    limit: int = Query(100, ge=1, le=500),
) -> Sequence[PracticeRecord]:
    query = (
        select(PracticeRecord)
        .join(Student)
        .where(Student.user_id == current_user.id)
    )
    
    if student_id is not None:
        query = query.where(PracticeRecord.student_id == student_id)
    
    query = query.order_by(PracticeRecord.submitted_at.desc()).limit(limit)
    
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
    
    return records
