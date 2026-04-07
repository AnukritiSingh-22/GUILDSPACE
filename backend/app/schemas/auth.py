# app/schemas/auth.py
from pydantic import BaseModel, EmailStr, field_validator
import re


class SignupRequest(BaseModel):
    email:     EmailStr
    password:  str
    full_name: str
    role:      str | None = None
    city:      str | None = None
    college:   str | None = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("full_name")
    @classmethod
    def name_not_empty(cls, v):
        if not v.strip():
            raise ValueError("full_name cannot be blank")
        return v.strip()


class LoginRequest(BaseModel):
    email:    EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user_id:      str
    email:        str
    full_name:    str