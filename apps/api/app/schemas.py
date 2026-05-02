import re
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class RegisterRequest(BaseModel):
    phone: str
    password: str

    @field_validator("phone")
    def validate_phone(cls, v: str) -> str:
        if not re.match(r"^1[3-9]\d{9}$", v):
            raise ValueError("手机号格式不正确")
        return v

    @field_validator("password")
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("密码长度至少8位")
        return v


class LoginRequest(BaseModel):
    phone: str
    password: str


class UserResponse(BaseModel):
    id: int
    phone: str
    display_name: str | None

    model_config = ConfigDict(from_attributes=True)


class ErrorBody(BaseModel):
    code: str
    message: str
    details: dict = Field(default_factory=dict)


class ErrorResponse(BaseModel):
    error: ErrorBody


class SuccessResponse(BaseModel):
    success: bool = True
    message: str = "操作成功"


class StudentCreate(BaseModel):
    name: str
    grade: str


class StudentUpdate(BaseModel):
    name: str
    grade: str


class StudentResponse(BaseModel):
    id: int
    name: str
    grade: str
    is_current: bool

    model_config = ConfigDict(from_attributes=True)


class SubjectResponse(BaseModel):
    id: int
    name: str
    code: str

    model_config = ConfigDict(from_attributes=True)


class QuestionCreate(BaseModel):
    subject_id: int
    type: str
    prompt: str
    answer: str
    explanation: str | None = None
    child_explanation: str | None = None
    fun_hint: str | None = None
    difficulty: str = "normal"
    tags: str | None = None
    source: str | None = None
    grading_method: str = "manual"
    student_id: int | None = None


class QuestionUpdate(BaseModel):
    subject_id: int | None = None
    type: str | None = None
    prompt: str | None = None
    answer: str | None = None
    explanation: str | None = None
    child_explanation: str | None = None
    fun_hint: str | None = None
    difficulty: str | None = None
    tags: str | None = None
    source: str | None = None
    grading_method: str | None = None
    status: str | None = None
    student_id: int | None = None


class QuestionResponse(BaseModel):
    id: int
    user_id: int
    student_id: int | None
    subject_id: int
    topic_id: int | None
    type: str
    prompt: str
    answer: str
    explanation: str | None
    child_explanation: str | None
    fun_hint: str | None
    difficulty: str
    tags: str | None
    source: str | None
    grading_method: str
    status: str
    subject_name: str | None = None
    student_name: str | None = None

    model_config = ConfigDict(from_attributes=True)


class CardCreate(BaseModel):
    question_id: int
    student_id: int


class CardUpdate(BaseModel):
    front: str | None = None
    back: str | None = None
    child_explanation: str | None = None
    fun_hint: str | None = None
    status: str | None = None


class CardResponse(BaseModel):
    id: int
    student_id: int
    question_id: int
    card_type: str
    front: str
    back: str
    child_explanation: str | None
    fun_hint: str | None
    status: str
    grading_method: str
    next_review_at: datetime | None
    student_name: str | None = None
    question_prompt: str | None = None

    model_config = ConfigDict(from_attributes=True)


class PracticeSubmitRequest(BaseModel):
    result: str


class PracticeRecordResponse(BaseModel):
    id: int
    student_id: int
    card_id: int
    result: str
    submitted_at: datetime
    student_name: str | None = None
    card_front: str | None = None
    card_back: str | None = None

    model_config = ConfigDict(from_attributes=True)


class WrongCardResponse(BaseModel):
    id: int
    student_id: int
    card_id: int
    is_mastered: bool
    mastered_at: datetime | None
    student_name: str | None = None
    card_front: str | None = None
    card_back: str | None = None
    card_status: str | None = None

    model_config = ConfigDict(from_attributes=True)
