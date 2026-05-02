from app.routers.auth import me_router, router as auth_router
from app.routers.students import router as students_router
from app.routers.subjects import router as subjects_router
from app.routers.questions import router as questions_router
from app.routers.cards import router as cards_router
from app.routers.practice_records import router as practice_records_router
from app.routers.wrong_cards import router as wrong_cards_router

__all__ = [
    "auth_router", 
    "me_router", 
    "students_router", 
    "subjects_router", 
    "questions_router", 
    "cards_router",
    "practice_records_router",
    "wrong_cards_router"
]
