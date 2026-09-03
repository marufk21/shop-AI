import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class SignUpRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: str = Field(min_length=5, max_length=320)
    password: str = Field(min_length=8, max_length=128)
    confirm_password: str = Field(min_length=8, max_length=128)

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        normalized = value.strip()
        if len(normalized) != len(value):
            raise ValueError("Username cannot start or end with spaces")
        if not normalized.isalnum() and "_" not in normalized and "-" not in normalized:
            raise ValueError(
                "Username can only contain letters, numbers, underscores, and hyphens"
            )
        return normalized

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        if value.strip() != value:
            raise ValueError("Password cannot start or end with spaces")
        if not any(char.isalpha() for char in value) or not any(
            char.isdigit() for char in value
        ):
            raise ValueError("Password must include at least one letter and one number")
        return value

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if "@" not in normalized or "." not in normalized.rsplit("@", 1)[-1]:
            raise ValueError("Enter a valid email address")
        return normalized


class SignInRequest(BaseModel):
    email: str = Field(min_length=5, max_length=320)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if "@" not in normalized or "." not in normalized.rsplit("@", 1)[-1]:
            raise ValueError("Enter a valid email address")
        return normalized


class AuthUserResponse(BaseModel):
    id: uuid.UUID
    email: str
    username: str | None = None
    role: str
    eligibility: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuthResponse(BaseModel):
    user: AuthUserResponse
