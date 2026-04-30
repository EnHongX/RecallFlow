import re

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
