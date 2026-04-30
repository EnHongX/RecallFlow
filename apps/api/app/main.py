from fastapi import FastAPI, HTTPException, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.config import get_settings
from app.database import engine
from app.errors import build_error
from app.routers import auth_router, me_router, students_router, subjects_router, questions_router

settings = get_settings()

app = FastAPI(title="RecallFlow API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(me_router)
app.include_router(students_router)
app.include_router(subjects_router)
app.include_router(questions_router)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    if isinstance(exc.detail, dict):
        return JSONResponse(
            status_code=exc.status_code,
            content=exc.detail,
        )
    content, status_code = build_error("COMMON_001", {"message": str(exc.detail)})
    return JSONResponse(
        status_code=exc.status_code,
        content=content
        if exc.status_code == status_code
        else {
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": str(exc.detail),
                "details": {},
            }
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    error_key = "COMMON_001"
    for error in exc.errors():
        field = error.get("loc", [])[-1]
        error_type = error.get("type")
        if field == "phone" and error_type == "value_error":
            error_key = "AUTH_001"
            break
        if field == "password" and error_type == "value_error":
            error_key = "AUTH_002"
            break

    content, status_code = build_error(error_key, {"errors": jsonable_encoder(exc.errors())})
    return JSONResponse(status_code=status_code, content=content)


@app.get("/api/v1/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "recallflow-api"}


@app.get("/api/v1/db/health")
def database_health() -> dict[str, str]:
    with engine.connect() as connection:
        connection.execute(text("select 1"))
    return {"status": "ok", "database": "connected"}
