import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator


EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


def validate_email_str(value: str) -> str:
    cleaned = value.strip().lower()
    if not EMAIL_REGEX.match(cleaned):
        raise ValueError("Invalid email format")
    return cleaned


class UserRegisterRequest(BaseModel):
    email: str = Field(..., description="User email address")
    full_name: str = Field(..., min_length=1, max_length=100, description="User full name")
    password: str = Field(..., min_length=6, max_length=128, description="User password (min 6 characters)")

    @field_validator("email")
    @classmethod
    def clean_email(cls, v: str) -> str:
        return validate_email_str(v)

    @field_validator("full_name")
    @classmethod
    def clean_full_name(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Full name cannot be empty or whitespace only")
        return trimmed


class UserLoginRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., min_length=1, max_length=128, description="User password")

    @field_validator("email")
    @classmethod
    def clean_email(cls, v: str) -> str:
        return validate_email_str(v)


class ForgotPasswordRequest(BaseModel):
    email: str = Field(..., description="Registered email address")

    @field_validator("email")
    @classmethod
    def clean_email(cls, v: str) -> str:
        return validate_email_str(v)


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=1, description="Password reset token")
    new_password: str = Field(..., min_length=6, max_length=128, description="New password (min 6 characters)")


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    avatar_url: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    created_at: datetime
    last_login_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AuthResponse(BaseModel):
    token: str
    token_type: str = "Bearer"
    user: UserResponse


class ForgotPasswordResponse(BaseModel):
    message: str
    email_sent: bool
    reset_token: Optional[str] = None  # Included in development when SMTP is unconfigured for testing
