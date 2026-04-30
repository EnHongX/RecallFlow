from app.routers.auth import me_router, router as auth_router
from app.routers.students import router as students_router
from app.routers.subjects import router as subjects_router
from app.routers.questions import router as questions_router

__all__ = ["auth_router", "me_router", "students_router", "subjects_router", "questions_router"]
