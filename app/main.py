from pathlib import Path

from fastapi import FastAPI, Query
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .config import CATEGORIES, RSS_SOURCES
from .models import NewsItem
from .services import collect_news

app = FastAPI(
    title="JARVIS Command Center API",
    version="1.0.0",
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
