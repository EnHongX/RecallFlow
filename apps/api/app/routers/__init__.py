from app.routers.auth import me_router, router as auth_router
from app.routers.students import router as students_router

__all__ = ["auth_router", "me_router", "students_router"]
