from typing import Sequence

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Subject, User
from app.schemas import ErrorResponse, SubjectResponse

router = APIRouter(prefix="/api/v1/subjects", tags=["subjects"])


@router.get(
    "",
    response_model=list[SubjectResponse],
    responses={
        401: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)
def get_subjects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Sequence[Subject]:
    subjects = db.execute(
        select(Subject).order_by(Subject.id.asc())
    ).scalars().all()
    return subjects
