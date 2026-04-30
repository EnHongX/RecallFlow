from typing import Annotated

from fastapi import Cookie, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.errors import api_error
from app.models import User
from app.utils import decode_access_token

settings = get_settings()


def get_current_user(
    recallflow_session: Annotated[str | None, Cookie(alias=settings.cookie_name)] = None,
    db: Session = Depends(get_db),
) -> User:
    if not recallflow_session:
        raise api_error("AUTH_005")

    payload = decode_access_token(recallflow_session)
    if not payload:
        raise api_error("AUTH_006")

    user_id = payload.get("sub")
    if not user_id:
        raise api_error("AUTH_006")

    try:
        user_id_int = int(user_id)
    except ValueError:
        raise api_error("AUTH_006") from None

    user = db.execute(select(User).where(User.id == user_id_int)).scalar_one_or_none()
    if not user:
        raise api_error("AUTH_007")

    return user
