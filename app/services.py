from collections import Counter
from datetime import datetime, timezone
import re

from .filters import classify, importance, normalize_title
from .models import NewsItem, PodcastHighlight
from .sources import fetch_all


def make_tags(title: str, summary: str, category: str, companies: list[str]) -> list[str]:
    text = f"{title} {summary}".lower()
    tags = [category]
    for company in companies[:4]:
        tags.append(company)
    keywords = ["api", "sdk", "open source", "security", "cve", "vulnerability", "model", "agent", "gpu", "cloud", "linux", "github", "developer", "framework", "database", "browser", "research", "podcast", "interview"]
    for keyword in keywords:
        if keyword in text and keyword.title() not in tags:
            tags.append(keyword.upper() if keyword in {"api", "sdk", "gpu"} else keyword.title())
    return tags[:8]


def future_opportunity(item: NewsItem) -> str:
    category = item.category
    if category in {"AI", "LLMs"}:
        return "Potential project: build a small developer tool or automation around this capability."
    if category == "Cyber Security":
        return "Potential project: turn the security signal into a scanner, alert, or patch-tracking workflow."
    if category in {"Programming", "Developer Tools", "Open Source"}:
        return "Potential project: test this in a real developer workflow and measure the productivity impact."
    if category in {"Cloud", "DevOps"}:
        return "Potential project: prototype the feature in a small cloud deployment and compare cost or speed."
    if category == "Hardware":
        return "Potential project: benchmark the hardware for AI, development, or local workloads."
    return "Potential project: track this change and test where it can improve a real technology workflow."


async def collect_news(min_importance: int = 4) -> list[NewsItem]:
    raw = await fetch_all()
    seen: set[str] = set()
    result: list[NewsItem] = []
    for item in raw:
        title, url = item["title"], item["url"]
        if not title or not url:
            continue
        key = normalize_title(title)
        if key in seen:
            continue
        seen.add(key)
        category, companies = classify(title, item.get("summary", ""))
        score = importance(title, item.get("summary", ""), category, companies)
        content_type = item.get("content_type", "news")
        if content_type == "github":
            score = min(10, max(score, 6) + (1 if item.get("github_stars", 0) >= 10000 else 0))
        if content_type == "podcast":
            score = min(10, score + 1)
        if score < min_importance:
            continue
        highlights = [PodcastHighlight(**highlight) for highlight in item.get("highlights", []) if highlight.get("text")]
        result.append(NewsItem(title=title, url=url, source=item["source"], published_at=item.get("published_at"), category=category, companies=companies, summary=item.get("summary", ""), importance=score, tags=make_tags(title, item.get("summary", ""), category, companies), image_url=item.get("image_url"), image_alt=item.get("image_alt", title), content_type=content_type, highlights=highlights))
    result.sort(key=lambda news: (news.importance, news.published_at or datetime.min.replace(tzinfo=timezone.utc)), reverse=True)
    return result


async def daily_top10(min_importance: int = 4) -> dict:
    """Build today's ten highest-signal technology stories from live sources."""
    items = await collect_news(min_importance)
    top = items[:10]
    return {
        "date": datetime.now(timezone.utc).date().isoformat(),
        "title": "JARVIS TOP 10",
        "count": len(top),
        "stories": [{
            "rank": index,
            "title": item.title,
            "url": str(item.url),
            "source": item.source,
            "published_at": item.published_at,
            "category": item.category,
            "companies": item.companies,
            "importance": item.importance,
            "summary": item.summary[:320],
            "content_type": item.content_type,
            "highlights": [highlight.model_dump() for highlight in item.highlights],
            "why_it_matters": future_opportunity(item),
        } for index, item in enumerate(top, start=1)],
    }


async def intelligence_snapshot(min_importance: int = 4) -> dict:
    items = await collect_news(min_importance)
    category_counts = Counter(item.category for item in items)
    company_counts = Counter(company for item in items for company in item.companies)
    source_counts = Counter(item.source for item in items)
    return {"total": len(items), "major": sum(item.importance >= 8 for item in items), "important": sum(item.importance >= 6 for item in items), "podcasts": sum(item.content_type == "podcast" for item in items), "github_signals": sum(item.content_type == "github" for item in items), "categories": dict(category_counts.most_common()), "companies": dict(company_counts.most_common(12)), "sources": dict(source_counts.most_common()), "top_stories": [{"title": item.title, "category": item.category, "importance": item.importance, "source": item.source, "tags": item.tags, "opportunity": future_opportunity(item), "content_type": item.content_type} for item in items[:8]]}


async def daily_brief(min_importance: int = 4) -> dict:
    items = await collect_news(min_importance)
    return {"generated_at": datetime.now(timezone.utc), "headline": f"{len(items)} technology signals worth tracking", "summary": "JARVIS filtered current technology updates for relevance, developer impact, security value, and future usefulness.", "stories": [{"title": item.title, "category": item.category, "why_it_matters": item.summary[:260], "opportunity": future_opportunity(item), "tags": item.tags, "content_type": item.content_type, "highlights": [highlight.model_dump() for highlight in item.highlights]} for item in items[:10]]}
