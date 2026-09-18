import html
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import unquote, urlparse

import httpx
from fastapi import FastAPI, File, Query, UploadFile
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from .config import CATEGORIES, RSS_SOURCES
from .models import NewsItem
from .screenshot import analyze_screenshot
from .services import collect_news, daily_brief, daily_top10, intelligence_snapshot

app = FastAPI(title="JARVIS Command Center API", version="1.5.0", description="Technology intelligence and future-useful news collection API.")
STATIC_DIR = Path(__file__).parent / "static"
COMPANY_DATA = STATIC_DIR.parent / "data" / "companies.json"
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/", include_in_schema=False)
async def dashboard(): return FileResponse(STATIC_DIR / "index.html")

@app.get("/health")
async def health(): return {"name":"JARVIS Tech-News","status":"online"}

@app.get("/categories")
async def categories(): return {"categories":list(CATEGORIES.keys())}

@app.get("/sources")
async def sources(): return {"sources":RSS_SOURCES}

@app.get("/companies")
async def companies():
    try: return {"companies":json.loads(COMPANY_DATA.read_text(encoding="utf-8"))}
    except Exception: return {"companies":[]}

@app.get("/company")
async def company(name:str=Query(...,min_length=1)):
    try:
        dataset=json.loads(COMPANY_DATA.read_text(encoding="utf-8"))
    except Exception:
        dataset=[]
    match=next((item for item in dataset if item.get("name","").lower()==name.strip().lower() or name.strip().lower() in [a.lower() for a in item.get("aliases",[])]),None)
    if not match: return {"company":None,"stories":[]}
    items=await collect_news(4)
    stories=[item for item in items if any(match["name"].lower()==c.lower() or any(alias.lower()==c.lower() for alias in match.get("aliases",[])) for c in item.companies)]
    if not stories:
        needle=[match["name"].lower(),*[a.lower() for a in match.get("aliases",[])]]
        stories=[item for item in items if any(term in f"{item.title} {item.summary}".lower() for term in needle)]
    return {"company":match,"stories":stories[:12],"generated_at":datetime.now(timezone.utc)}

@app.get("/intelligence")
async def intelligence(minimum_importance:int=Query(default=4,ge=0,le=10)): return await intelligence_snapshot(minimum_importance)

@app.get("/top10")
async def top10(minimum_importance:int=Query(default=4,ge=0,le=10)): return await daily_top10(minimum_importance)

@app.get("/morning")
async def morning(minimum_importance:int=Query(default=4,ge=0,le=10)):
    items=await collect_news(minimum_importance)
    major=[x for x in items if x.importance>=8][:3]
    watch=items[:5]
    return {"generated_at":datetime.now(timezone.utc),"headline":f"{len(items)} signals scanned for your morning brief","summary":"JARVIS filtered technology updates across AI, space, cyber, defense, hardware, energy, research and other technology sectors.","major":[{"title":x.title,"category":x.category,"source":x.source,"importance":x.importance,"summary":x.summary[:240]} for x in major],"watch":[{"title":x.title,"category":x.category,"source":x.source,"importance":x.importance} for x in watch]}

@app.get("/brief")
async def brief(minimum_importance:int=Query(default=4,ge=0,le=10)): return await daily_brief(minimum_importance)

@app.post("/screenshot/analyze")
async def screenshot_analyze(file:UploadFile=File(...),minimum_importance:int=Query(default=4,ge=0,le=10)):
    if not file.content_type or not file.content_type.startswith("image/"): return {"error":"Only image uploads are supported."}
    data=await file.read()
    if not data: return {"error":"The uploaded image is empty."}
    if len(data)>10*1024*1024: return {"error":"Image is too large. Maximum size is 10 MB."}
    return await analyze_screenshot(data,file.filename or "screenshot",minimum_importance)

@app.get("/image")
async def article_image(url:str=Query(...,min_length=8)):
    target=unquote(url).strip(); parsed=urlparse(target)
    if parsed.scheme not in {"http","https"} or not parsed.netloc: return {"image_url":None}
    try:
        async with httpx.AsyncClient(timeout=10,follow_redirects=True) as client:
            response=await client.get(target,headers={"User-Agent":"JARVIS-Tech-News/1.0"}); response.raise_for_status()
        if "text/html" not in response.headers.get("content-type",""): return {"image_url":None}
        html_text=response.text[:1500000]
        patterns=[r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)',r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)',r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']twitter:image["\']']
        for pattern in patterns:
            match=re.search(pattern,html_text,re.IGNORECASE)
            if not match: continue
            image_url=html.unescape(match.group(1)).strip()
            if image_url.startswith("//"): image_url=f"{parsed.scheme}:{image_url}"
            elif image_url.startswith("/"): image_url=f"{parsed.scheme}://{parsed.netloc}{image_url}"
            p=urlparse(image_url)
            if p.scheme in {"http","https"} and p.netloc: return RedirectResponse(image_url,status_code=307)
    except Exception: pass
    return {"image_url":None}

@app.get("/news",response_model=list[NewsItem])
async def news(category:str|None=Query(default=None),company:str|None=Query(default=None),minimum_importance:int=Query(default=4,ge=0,le=10)):
    items=await collect_news(minimum_importance)
    if category: items=[item for item in items if item.category.lower()==category.lower()]
    if company: items=[item for item in items if any(company.lower() in name.lower() for name in item.companies)]
    return items

@app.post("/news/refresh",response_model=list[NewsItem])
async def refresh(minimum_importance:int=Query(default=4,ge=0,le=10)): return await collect_news(minimum_importance)
