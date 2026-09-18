from datetime import datetime

from pydantic import BaseModel, Field, HttpUrl


class PodcastHighlight(BaseModel):
    text: str
    reason: str = ""
    timestamp: str | None = None


class NewsItem(BaseModel):
    title: str
    url: HttpUrl
    source: str
    published_at: datetime | None = None
    category: str
    companies: list[str] = Field(default_factory=list)
    summary: str = ""
    importance: int = 0
    tags: list[str] = Field(default_factory=list)
    image_url: HttpUrl | None = None
    image_alt: str = ""
    content_type: str = "news"
    highlights: list[PodcastHighlight] = Field(default_factory=list)
