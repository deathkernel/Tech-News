import asyncio
from datetime import datetime, timezone
import html
import re

import feedparser
import httpx

from .config import PUBLIC_APIS, RSS_SOURCES

USER_AGENT = "JARVIS-Tech-News/1.0"


def extract_image_url(entry) -> str | None:
    for media in entry.get("media_content", []):
        url = media.get("url")
        if url and str(media.get("type", "")).startswith("image/"):
            return url
    for media in entry.get("media_thumbnail", []):
        url = media.get("url")
        if url:
            return url
    for enclosure in entry.get("enclosures", []):
        url = enclosure.get("href") or enclosure.get("url")
        if url and str(enclosure.get("type", "")).startswith("image/"):
            return url
    image = entry.get("image")
    if isinstance(image, dict):
        return image.get("href") or image.get("url")
    return None


def parse_date(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None


async def fetch_feed(source_name: str, feed_url: str, client: httpx.AsyncClient) -> list[dict]:
    try:
        response = await client.get(feed_url)
        response.raise_for_status()
        parsed = feedparser.parse(response.text)
        items = []
        for entry in parsed.entries[:30]:
            published = None
            if getattr(entry, "published_parsed", None):
                published = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
            elif getattr(entry, "updated_parsed", None):
                published = datetime(*entry.updated_parsed[:6], tzinfo=timezone.utc)
            title = entry.get("title", "").strip()
            if title:
                items.append({
                    "title": title, "url": entry.get("link", ""), "source": source_name,
                    "published_at": published, "summary": entry.get("summary", "").strip(),
                    "image_url": extract_image_url(entry), "image_alt": title,
                })
        return items
    except Exception:
        return []


async def fetch_hacker_news(client: httpx.AsyncClient) -> list[dict]:
    try:
        response = await client.get(PUBLIC_APIS["Hacker News"] + "topstories.json")
        response.raise_for_status()
        ids = response.json()[:25]
        async def one(item_id):
            r = await client.get(PUBLIC_APIS["Hacker News"] + f"item/{item_id}.json")
            return r.json() if r.is_success else None
        stories = await asyncio.gather(*(one(i) for i in ids))
        result = []
        for story in stories:
            if not story or story.get("type") != "story" or not story.get("title") or not story.get("url"):
                continue
            result.append({
                "title": html.unescape(story["title"]), "url": story["url"], "source": "Hacker News",
                "published_at": datetime.fromtimestamp(story.get("time", 0), tz=timezone.utc),
                "summary": f"Hacker News discussion: {story.get('score', 0)} points, {story.get('descendants', 0)} comments.",
                "image_url": None, "image_alt": story["title"],
            })
        return result
    except Exception:
        return []


async def fetch_github(client: httpx.AsyncClient) -> list[dict]:
    try:
        params = {"q": "stars:>1000 pushed:>2026-01-01", "sort": "updated", "order": "desc", "per_page": 20}
        response = await client.get(PUBLIC_APIS["GitHub"] + "search/repositories", params=params)
        response.raise_for_status()
        result = []
        for repo in response.json().get("items", []):
            result.append({
                "title": f"GitHub project update: {repo['full_name']}",
                "url": repo["html_url"], "source": "GitHub",
                "published_at": parse_date(repo.get("pushed_at")),
                "summary": repo.get("description") or "A popular open-source repository received an update.",
                "image_url": repo.get("owner", {}).get("avatar_url"), "image_alt": repo["full_name"],
            })
        return result
    except Exception:
        return []


async def fetch_nvd(client: httpx.AsyncClient) -> list[dict]:
    try:
        response = await client.get(PUBLIC_APIS["NVD"], params={"pubStartDate": "2026-09-15T00:00:00.000", "resultsPerPage": 20})
        response.raise_for_status()
        result = []
        for vuln in response.json().get("vulnerabilities", []):
            cve = vuln.get("cve", {})
            cve_id = cve.get("id")
            descriptions = cve.get("descriptions", [])
            description = next((x.get("value") for x in descriptions if x.get("lang") == "en"), "")
            if not cve_id:
                continue
            result.append({
                "title": f"Security advisory: {cve_id}",
                "url": f"https://nvd.nist.gov/vuln/detail/{cve_id}", "source": "NVD",
                "published_at": parse_date(cve.get("published")), "summary": description,
                "image_url": None, "image_alt": cve_id,
            })
        return result
    except Exception:
        return []


async def fetch_arxiv(client: httpx.AsyncClient) -> list[dict]:
    try:
        response = await client.get(PUBLIC_APIS["arXiv"], params={"search_query": "cat:cs.AI OR cat:cs.LG OR cat:cs.SE", "start": 0, "max_results": 20, "sortBy": "submittedDate", "sortOrder": "descending"})
        response.raise_for_status()
        parsed = feedparser.parse(response.text)
        result = []
        for entry in parsed.entries:
            result.append({
                "title": entry.get("title", "").replace("\n", " ").strip(),
                "url": entry.get("link", ""), "source": "arXiv",
                "published_at": parse_date(entry.get("published")),
                "summary": re.sub(r"\s+", " ", entry.get("summary", "")).strip(),
                "image_url": None, "image_alt": entry.get("title", ""),
            })
        return [x for x in result if x["title"] and x["url"]]
    except Exception:
        return []


async def fetch_gdelt(client: httpx.AsyncClient) -> list[dict]:
    try:
        response = await client.get(PUBLIC_APIS["GDELT"], params={"query": "(OpenAI OR Anthropic OR NVIDIA OR cybersecurity OR developer tools)", "mode": "artlist", "format": "json", "maxrecords": 25, "sort": "datedesc"})
        response.raise_for_status()
        result = []
        for article in response.json().get("articles", []):
            result.append({
                "title": html.unescape(article.get("title", "")).strip(), "url": article.get("url", ""),
                "source": article.get("domain", "GDELT"), "published_at": parse_date(article.get("seendate")),
                "summary": article.get("title", ""), "image_url": article.get("socialimage"),
                "image_alt": article.get("title", ""),
            })
        return [x for x in result if x["title"] and x["url"]]
    except Exception:
        return []


async def fetch_devto(client: httpx.AsyncClient) -> list[dict]:
    try:
        response = await client.get(PUBLIC_APIS["DEV Community"], params={"top": 7, "per_page": 20})
        response.raise_for_status()
        result = []
        for article in response.json():
            result.append({
                "title": article.get("title", ""), "url": article.get("url", ""), "source": "DEV Community",
                "published_at": parse_date(article.get("published_at")),
                "summary": article.get("description", ""), "image_url": article.get("cover_image"),
                "image_alt": article.get("title", ""),
            })
        return [x for x in result if x["title"] and x["url"]]
    except Exception:
        return []


async def fetch_all() -> list[dict]:
    async with httpx.AsyncClient(timeout=15, follow_redirects=True, headers={"User-Agent": USER_AGENT}) as client:
        tasks = [fetch_feed(name, url, client) for name, url in RSS_SOURCES.items()]
        tasks += [fetch_hacker_news(client), fetch_github(client), fetch_nvd(client), fetch_arxiv(client), fetch_gdelt(client), fetch_devto(client)]
        batches = await asyncio.gather(*tasks, return_exceptions=True)
    results = []
    for batch in batches:
        if isinstance(batch, list):
            results.extend(batch)
    return results
