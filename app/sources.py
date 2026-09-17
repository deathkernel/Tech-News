from datetime import datetime, timezone
import feedparser
import httpx

from .config import RSS_SOURCES
from .models import NewsItem


async def fetch_feed(source_name: str, feed_url: str) -> list[dict]:
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            response = await client.get(feed_url, headers={"User-Agent": "JARVIS-Tech-News/1.0"})
            response.raise_for_status()
        parsed = feedparser.parse(response.text)
        items = []
        for entry in parsed.entries[:30]:
            published = None
            if getattr(entry, "published_parsed", None):
                published = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
            elif getattr(entry, "updated_parsed", None):
                published = datetime(*entry.updated_parsed[:6], tzinfo=timezone.utc)
            items.append({
                "title": entry.get("title", "").strip(),
                "url": entry.get("link", ""),
                "source": source_name,
                "published_at": published,
                "summary": entry.get("summary", "").strip(),
            })
        return items
    except Exception:
        return []


async def fetch_all() -> list[dict]:
    results = []
    for name, url in RSS_SOURCES.items():
        results.extend(await fetch_feed(name, url))
    return results
