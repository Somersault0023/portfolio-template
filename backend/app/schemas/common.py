from typing import Any, Literal

from pydantic import BaseModel, EmailStr, Field


class RoleSchema(BaseModel):
    id: int
    name: str
    permissions: list[str]


class UserProfile(BaseModel):
    id: int
    displayName: str
    email: EmailStr
    defaultLanguage: str
    roles: list[str]


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    accessToken: str
    tokenType: str = "bearer"
    user: UserProfile


class TranslationPayload(BaseModel):
    language: str
    fields: dict[str, str]


class ContentItemPayload(BaseModel):
    contentType: Literal["biography", "work", "blog", "press", "event", "contact"]
    slug: str
    status: Literal["draft", "published", "hidden"] = "published"
    coverImagePath: str | None = None
    sortOrder: int = 0
    publishedAt: str | None = None
    translations: dict[str, dict[str, str]] = Field(default_factory=dict)
    metadata: dict[str, Any] = Field(default_factory=dict)


class ContentItemResponse(ContentItemPayload):
    id: int
    createdAt: str
    updatedAt: str


class CommentPayload(BaseModel):
    authorName: str
    message: str


class CommentModerationPayload(BaseModel):
    status: Literal["visible", "hidden", "deleted"]


class CommentResponse(BaseModel):
    id: int
    workId: int
    authorName: str
    message: str
    status: str
    createdAt: str
