from __future__ import annotations

from .models import NewsItem


def classify_alert(item: NewsItem) -> str:
    text = f"{item.title} {item.summary}".lower()
    critical = ("critical" in text or "zero-day" in text or "actively exploited" in text)
    security = item.category.lower() == "cyber security" or "vulnerability" in text or "cve" in text

    if critical:
        return "critical"
    if security:
        return "security"
    if item.importance >= 8:
        return "important"
    return "normal"


def alert_items(items: list[NewsItem]) -> list[dict]:
    return [
        {
            "title": item.title,
            "category": item.category,
            "importance": item.importance,
            "level": classify_alert(item),
            "url": str(item.url),
        }
        for item in items
        if classify_alert(item) != "normal"
    ]
