from datetime import datetime
from pydantic import BaseModel, HttpUrl


class NewsItem(BaseModel):
    title: str
    url: HttpUrl
    source: str
    published_at: datetime | None = None
    category: str
    companies: list[str] = []
    summary: str = ""
    importance: int = 0
    tags: list[str] = []
