from datetime import datetime, timezone

from .filters import classify, importance, normalize_title
from .models import NewsItem
from .sources import fetch_all


async def collect_news(min_importance: int = 4) -> list[NewsItem]:
    raw = await fetch_all()
    seen: set[str] = set()
    result: list[NewsItem] = []

    for item in raw:
        title = item["title"]
        url = item["url"]
        if not title or not url:
            continue
        key = normalize_title(title)
        if key in seen:
            continue
        seen.add(key)

        category, companies = classify(title, item.get("summary", ""))
        score = importance(title, item.get("summary", ""), category, companies)
        if score < min_importance:
            continue

        result.append(NewsItem(
            title=title,
            url=url,
            source=item["source"],
            published_at=item.get("published_at"),
            category=category,
            companies=companies,
            summary=item.get("summary", ""),
            importance=score,
        ))

    result.sort(
        key=lambda news: (
            news.importance,
            news.published_at or datetime.min.replace(tzinfo=timezone.utc),
        ),
        reverse=True,
    )
    return result
