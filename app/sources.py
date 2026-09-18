import asyncio
from datetime import datetime, timedelta, timezone
import html
import re

import feedparser
import httpx

from .config import CURATED_GITHUB_OWNERS, PUBLIC_APIS, RSS_SOURCES

USER_AGENT = "JARVIS-Tech-News/1.0"
PODCAST_QUERIES = ['technology podcast "Sam Altman"', 'technology podcast "Jensen Huang"', 'technology podcast "Mark Zuckerberg"', 'technology podcast "Satya Nadella"', 'technology podcast "Demis Hassabis"', 'technology podcast interview technology CEO']


def extract_image_url(entry) -> str | None:
    for media in entry.get("media_content", []):
        url = media.get("url")
        if url and str(media.get("type", "")).startswith("image/"): return url
    for media in entry.get("media_thumbnail", []):
        url = media.get("url")
        if url: return url
    for enclosure in entry.get("enclosures", []):
        url = enclosure.get("href") or enclosure.get("url")
        if url and str(enclosure.get("type", "")).startswith("image/"): return url
    image = entry.get("image")
    return image.get("href") or image.get("url") if isinstance(image, dict) else None


def parse_date(value):
    if not value: return None
    try:
        text = str(value)
        if re.fullmatch(r"\d{8}T\d{6}Z", text): return datetime.strptime(text, "%Y%m%dT%H%M%SZ").replace(tzinfo=timezone.utc)
        return datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError: return None


def podcast_highlights(summary: str, title: str) -> list[dict]:
    text = re.sub(r"\s+", " ", html.unescape(summary or "")).strip()
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if len(s.strip()) >= 45]
    keywords = ("AI", "agent", "model", "future", "computer", "robot", "security", "open source", "GPU", "developer", "AGI", "technology")
    ranked = sorted(sentences, key=lambda s: (sum(k.lower() in s.lower() for k in keywords), min(len(s), 180)), reverse=True)
    return [{"text": s[:220], "reason": "JARVIS picked this as a high-signal technology point from the episode description.", "timestamp": None} for s in ranked[:3]] or ([{"text": text[:220], "reason": "Best available episode summary.", "timestamp": None}] if text else [])


async def fetch_feed(source_name: str, feed_url: str, client: httpx.AsyncClient) -> list[dict]:
    try:
        response = await client.get(feed_url); response.raise_for_status(); parsed = feedparser.parse(response.text); items = []
        for entry in parsed.entries[:20]:
            published = None
            if getattr(entry, "published_parsed", None): published = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
            elif getattr(entry, "updated_parsed", None): published = datetime(*entry.updated_parsed[:6], tzinfo=timezone.utc)
            title = entry.get("title", "").strip()
            if title: items.append({"title": title, "url": entry.get("link", ""), "source": source_name, "published_at": published, "summary": entry.get("summary", "").strip(), "image_url": extract_image_url(entry), "image_alt": title})
        return items
    except Exception: return []


async def fetch_podcasts(client: httpx.AsyncClient) -> list[dict]:
    async def one(query: str):
        try:
            response = await client.get("https://news.google.com/rss/search", params={"q": query, "hl": "en-US", "gl": "US", "ceid": "US:en"}); response.raise_for_status(); parsed = feedparser.parse(response.text); result = []
            for entry in parsed.entries[:5]:
                title, summary, link = html.unescape(entry.get("title", "")).strip(), entry.get("summary", "").strip(), entry.get("link", "")
                if title and link: result.append({"title": f"Podcast / Interview: {title}", "url": link, "source": "Podcast Discovery", "published_at": datetime(*entry.published_parsed[:6], tzinfo=timezone.utc) if getattr(entry, "published_parsed", None) else None, "summary": summary, "image_url": None, "image_alt": title, "content_type": "podcast", "highlights": podcast_highlights(summary, title)})
            return result
        except Exception: return []
    batches = await asyncio.gather(*(one(query) for query in PODCAST_QUERIES)); return [item for batch in batches for item in batch]


async def fetch_hacker_news(client: httpx.AsyncClient) -> list[dict]:
    try:
        response = await client.get(PUBLIC_APIS["Hacker News"] + "topstories.json"); response.raise_for_status(); ids = response.json()[:15]
        async def one(item_id):
            r = await client.get(PUBLIC_APIS["Hacker News"] + f"item/{item_id}.json"); return r.json() if r.is_success else None
        stories = await asyncio.gather(*(one(i) for i in ids)); result = []
        for story in stories:
            if story and story.get("type") == "story" and story.get("title") and story.get("url"):
                result.append({"title": html.unescape(story["title"]), "url": story["url"], "source": "Hacker News", "published_at": datetime.fromtimestamp(story.get("time", 0), tz=timezone.utc), "summary": f"Hacker News discussion: {story.get('score', 0)} points, {story.get('descendants', 0)} comments.", "image_url": None, "image_alt": story["title"]})
        return result
    except Exception: return []


async def fetch_github(client: httpx.AsyncClient) -> list[dict]:
    try:
        response = await client.get(PUBLIC_APIS["GitHub"] + "search/repositories", params={"q": "stars:>1000 pushed:>2026-01-01", "sort": "updated", "order": "desc", "per_page": 50}); response.raise_for_status(); result = []
        allowed = {x.lower() for x in CURATED_GITHUB_OWNERS}
        for repo in response.json().get("items", []):
            owner = (repo.get("owner", {}).get("login") or "").lower()
            if owner not in allowed: continue
            result.append({"title": f"GitHub project update: {repo['full_name']}", "url": repo["html_url"], "source": "GitHub", "published_at": parse_date(repo.get("pushed_at")), "summary": repo.get("description") or "A high-signal technology repository received an update.", "image_url": repo.get("owner", {}).get("avatar_url"), "image_alt": repo["full_name"], "github_owner": repo.get("owner", {}).get("login"), "github_stars": repo.get("stargazers_count", 0), "content_type": "github"})
        return result
    except Exception: return []


async def fetch_nvd(client: httpx.AsyncClient) -> list[dict]:
    try:
        now = datetime.now(timezone.utc)
        start = now - timedelta(days=1)
        response = await client.get(PUBLIC_APIS["NVD"], params={"pubStartDate": start.strftime("%Y-%m-%dT%H:%M:%S.000"), "pubEndDate": now.strftime("%Y-%m-%dT%H:%M:%S.000"), "resultsPerPage": 20}); response.raise_for_status(); result = []
        for vuln in response.json().get("vulnerabilities", []):
            cve = vuln.get("cve", {}); cve_id = cve.get("id"); descriptions = cve.get("descriptions", []); description = next((x.get("value") for x in descriptions if x.get("lang") == "en"), "")
            if cve_id: result.append({"title": f"Security advisory: {cve_id}", "url": f"https://nvd.nist.gov/vuln/detail/{cve_id}", "source": "NVD", "published_at": parse_date(cve.get("published")), "summary": description, "image_url": None, "image_alt": cve_id})
        return result
    except Exception: return []


async def fetch_arxiv(client: httpx.AsyncClient) -> list[dict]:
    try:
        response = await client.get(PUBLIC_APIS["arXiv"], params={"search_query": "cat:cs.AI OR cat:cs.LG OR cat:cs.SE OR cat:cs.CV OR cat:cs.RO OR cat:cs.CR OR cat:cs.NI OR cat:quant-ph OR cat:q-bio", "start": 0, "max_results": 20, "sortBy": "submittedDate", "sortOrder": "descending"}); response.raise_for_status(); parsed = feedparser.parse(response.text)
        return [{"title": e.get("title", "").replace("\n", " ").strip(), "url": e.get("link", ""), "source": "arXiv", "published_at": parse_date(e.get("published")), "summary": re.sub(r"\s+", " ", e.get("summary", "")).strip(), "image_url": None, "image_alt": e.get("title", "")} for e in parsed.entries if e.get("title") and e.get("link")]
    except Exception: return []


async def fetch_gdelt(client: httpx.AsyncClient) -> list[dict]:
    try:
        response = await client.get(PUBLIC_APIS["GDELT"], params={"query": "(OpenAI OR Anthropic OR NVIDIA OR SpaceX OR NASA OR ISRO OR satellite OR rocket OR marine OR ocean technology OR submarine OR drone OR radar OR defense technology OR aviation OR aircraft OR automotive OR electric vehicle OR battery OR nuclear OR fusion OR quantum computing OR biotechnology OR cybersecurity OR semiconductor OR chip)", "mode": "artlist", "format": "json", "maxrecords": 50, "sort": "datedesc"}); response.raise_for_status()
        return [{"title": html.unescape(a.get("title", "")).strip(), "url": a.get("url", ""), "source": a.get("domain", "GDELT"), "published_at": parse_date(a.get("seendate")), "summary": a.get("title", ""), "image_url": a.get("socialimage"), "image_alt": a.get("title", "")} for a in response.json().get("articles", []) if a.get("title") and a.get("url")]
    except Exception: return []


async def fetch_devto(client: httpx.AsyncClient) -> list[dict]:
    try:
        response = await client.get(PUBLIC_APIS["DEV Community"], params={"top": 7, "per_page": 20}); response.raise_for_status()
        return [{"title": a.get("title", ""), "url": a.get("url", ""), "source": "DEV Community", "published_at": parse_date(a.get("published_at")), "summary": a.get("description", ""), "image_url": a.get("cover_image"), "image_alt": a.get("title", "")} for a in response.json() if a.get("title") and a.get("url")]
    except Exception: return []


async def fetch_all() -> list[dict]:
    timeout = httpx.Timeout(7.0, connect=4.0)
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True, headers={"User-Agent": USER_AGENT}) as client:
        tasks = [fetch_feed(name, url, client) for name, url in RSS_SOURCES.items()] + [fetch_podcasts(client), fetch_hacker_news(client), fetch_github(client), fetch_nvd(client), fetch_arxiv(client), fetch_gdelt(client), fetch_devto(client)]
        batches = await asyncio.gather(*tasks, return_exceptions=True)
    return [item for batch in batches if isinstance(batch, list) for item in batch]
