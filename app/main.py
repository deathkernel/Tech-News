import html
import re
from pathlib import Path
from urllib.parse import unquote, urlparse

import httpx
from fastapi import FastAPI, Query
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from .config import CATEGORIES, RSS_SOURCES
from .models import NewsItem
from .services import collect_news

app = FastAPI(
    title="JARVIS Command Center API",
    version="1.1.0",
    description="Technology intelligence and future-useful news collection API.",
)

STATIC_DIR = Path(__file__).parent / "static"
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/", include_in_schema=False)
async def dashboard():
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/health")
async def health():
    return {"name": "JARVIS Tech-News", "status": "online"}


@app.get("/categories")
async def categories():
    return {"categories": list(CATEGORIES.keys())}


@app.get("/sources")
async def sources():
    return {"sources": RSS_SOURCES}


@app.get("/image")
async def article_image(url: str = Query(..., min_length=8)):
    """Find an article's social/OG image and redirect the browser to it."""
    target = unquote(url).strip()
    parsed = urlparse(target)

    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return {"image_url": None}

    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            response = await client.get(
                target,
                headers={"User-Agent": "JARVIS-Tech-News/1.0"},
            )
            response.raise_for_status()

        content_type = response.headers.get("content-type", "")
        if "text/html" not in content_type:
            return {"image_url": None}

        html_text = response.text[:1_500_000]
        patterns = [
            r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)',
            r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)',
            r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',
            r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']twitter:image["\']',
        ]

        for pattern in patterns:
            match = re.search(pattern, html_text, re.IGNORECASE)
            if not match:
                continue

            image_url = html.unescape(match.group(1)).strip()
            if image_url.startswith("//"):
                image_url = f"{parsed.scheme}:{image_url}"
            elif image_url.startswith("/"):
                image_url = f"{parsed.scheme}://{parsed.netloc}{image_url}"

            image_parsed = urlparse(image_url)
            if image_parsed.scheme in {"http", "https"} and image_parsed.netloc:
                return RedirectResponse(image_url, status_code=307)
    except Exception:
        pass

    return {"image_url": None}


@app.get("/news", response_model=list[NewsItem])
async def news(
    category: str | None = Query(default=None),
    company: str | None = Query(default=None),
    minimum_importance: int = Query(default=4, ge=0, le=10),
):
    items = await collect_news(minimum_importance)
    if category:
        items = [item for item in items if item.category.lower() == category.lower()]
    if company:
        items = [item for item in items if any(company.lower() in name.lower() for name in item.companies)]
    return items


@app.post("/news/refresh", response_model=list[NewsItem])
async def refresh(minimum_importance: int = Query(default=4, ge=0, le=10)):
    return await collect_news(minimum_importance)
