from typing import Any, Literal

from pydantic import BaseModel, Field


class TranslationFields(BaseModel):
    """Localized string fields for a content item."""

    title: str | None = None
    subtitle: str | None = None
    body: str | None = None
    excerpt: str | None = None
    synopsis: str | None = None
    description: str | None = None
    genre: str | None = None
    location: str | None = None


class MediaInfo(BaseModel):
    """Information about a media file."""

    url: str = Field(..., description="Relative URL to the stored media file")
    altText: str | None = None


class ContentItemBase(BaseModel):
    contentType: Literal["biography", "work", "blog", "press", "event", "contact"]
    slug: str = Field(..., description="Unique identifier used in URLs")
    status: Literal["draft", "published", "hidden"] = "published"
    coverImage: MediaInfo | None = None
    sortOrder: int = Field(0, description="Ordering index for lists")
    publishedAt: str | None = Field(None, description="ISO timestamp when the item became public")
    translations: dict[str, TranslationFields] = Field(default_factory=dict)
    metadata: dict[str, Any] = Field(default_factory=dict)


class WorkItem(ContentItemBase):
    contentType: Literal["work"] = "work"


class EventItem(ContentItemBase):
    contentType: Literal["event"] = "event"


class PressItem(ContentItemBase):
    contentType: Literal["press"] = "press"


class BlogPost(ContentItemBase):
    contentType: Literal["blog"] = "blog"


class Biography(ContentItemBase):
    contentType: Literal["biography"] = "biography"


class Contact(ContentItemBase):
    contentType: Literal["contact"] = "contact"
