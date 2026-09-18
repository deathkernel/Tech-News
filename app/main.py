import html
import json
import os
import re
import socket
import ipaddress
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import unquote, urlparse

import httpx
from fastapi import Cookie, Depends, FastAPI, File, Header, HTTPException, Query, Response, UploadFile
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from .auth import AUTH_COOKIE, CSRF_COOKIE, authenticate, create_token, create_user, csrf_token, current_user, init_db, public_user
from .config import CATEGORIES, RSS_SOURCES
from .models import NewsItem
from .screenshot import analyze_screenshot
from .services import collect_news, daily_brief, daily_top10, intelligence_snapshot


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Tech-News API", version="1.6.0", description="Technology news and future-useful information collection API.", lifespan=lifespan)
STATIC_DIR = Path(__file__).parent / "static"
COMPANY_DATA = STATIC_DIR.parent / "data" / "companies.json"
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

class AuthPayload(BaseModel):
    identifier: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=8, max_length=128)

class RegisterPayload(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=8, max_length=128)


def require_user(jarvis_session: str | None = Cookie(default=None), jarvis_csrf: str | None = Cookie(default=None), x_csrf_token: str | None = Header(default=None)):
    return current_user(jarvis_session, jarvis_csrf, x_csrf_token, require_csrf=False)


def require_user_with_csrf(jarvis_session: str | None = Cookie(default=None), jarvis_csrf: str | None = Cookie(default=None), x_csrf_token: str | None = Header(default=None)):
    return current_user(jarvis_session, jarvis_csrf, x_csrf_token, require_csrf=True)


def set_auth_cookies(response: Response, user_id: int):
    token = create_token(user_id)
    csrf = csrf_token()
    secure = os.getenv("RENDER", "").lower() == "true" or os.getenv("JARVIS_COOKIE_SECURE", "").lower() == "true"
    response.set_cookie(AUTH_COOKIE, token, httponly=True, secure=secure, samesite="lax", max_age=60 * 60, path="/")
    response.set_cookie(CSRF_COOKIE, csrf, httponly=False, secure=secure, samesite="lax", max_age=60 * 60, path="/")

@app.get("/", include_in_schema=False)
async def dashboard(): return FileResponse(STATIC_DIR / "index.html")

@app.get("/health")
async def health(): return {"name":"Tech-News","status":"online"}

@app.post("/auth/register")
async def register(payload: RegisterPayload, response: Response):
    try:
        user = create_user(payload.username, payload.email, payload.password)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    set_auth_cookies(response, user["id"])
    return {"user": public_user(user)}

@app.post("/auth/login")
async def login(payload: AuthPayload, response: Response):
    user = authenticate(payload.identifier, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username/email or password")
    set_auth_cookies(response, user["id"])
    return {"user": public_user(user)}

@app.post("/auth/logout")
async def logout(response: Response, user=Depends(require_user_with_csrf)):
    response.delete_cookie(AUTH_COOKIE, path="/")
    response.delete_cookie(CSRF_COOKIE, path="/")
    return {"ok": True}

@app.get("/auth/me")
async def me(user=Depends(require_user)):
    return {"user": public_user(user)}

@app.get("/auth/csrf")
async def csrf(response: Response):
    token = csrf_token()
    secure = os.getenv("RENDER", "").lower() == "true" or os.getenv("JARVIS_COOKIE_SECURE", "").lower() == "true"
    response.set_cookie(CSRF_COOKIE, token, httponly=False, secure=secure, samesite="lax", max_age=60 * 60, path="/")
    return {"csrf_token": token}

@app.get("/categories")
async def categories(user=Depends(require_user)): return {"categories":list(CATEGORIES.keys())}

@app.get("/sources")
async def sources(user=Depends(require_user)): return {"sources":RSS_SOURCES}

@app.get("/companies")
async def companies(user=Depends(require_user)):
    try: return {"companies":json.loads(COMPANY_DATA.read_text(encoding="utf-8"))}
    except Exception: return {"companies":[]}

@app.get("/company")
async def company(name:str=Query(...,min_length=1), user=Depends(require_user)):
    try: dataset=json.loads(COMPANY_DATA.read_text(encoding="utf-8"))
    except Exception: dataset=[]
    match=next((item for item in dataset if item.get("name","").lower()==name.strip().lower() or name.strip().lower() in [a.lower() for a in item.get("aliases",[])]),None)
    if not match: return {"company":None,"stories":[]}
    items=await collect_news(4)
    stories=[item for item in items if any(match["name"].lower()==c.lower() or any(alias.lower()==c.lower() for alias in match.get("aliases",[])) for c in item.companies)]
    if not stories:
        needle=[match["name"].lower(),*[a.lower() for a in match.get("aliases",[])]]
        stories=[item for item in items if any(term in f"{item.title} {item.summary}".lower() for term in needle)]
    return {"company":match,"stories":stories[:12],"generated_at":datetime.now(timezone.utc)}

@app.get("/intelligence")
async def intelligence(minimum_importance:int=Query(default=4,ge=0,le=10), user=Depends(require_user)): return await intelligence_snapshot(minimum_importance)

@app.get("/top10")
async def top10(minimum_importance:int=Query(default=4,ge=0,le=10), user=Depends(require_user)): return await daily_top10(minimum_importance)

@app.get("/morning")
async def morning(minimum_importance:int=Query(default=4,ge=0,le=10), user=Depends(require_user)):
    items=await collect_news(minimum_importance)
    major=[x for x in items if x.importance>=8][:3]
    watch=items[:5]
    return {"generated_at":datetime.now(timezone.utc),"headline":f"{len(items)} signals scanned for your morning brief","summary":"Tech-News filtered technology updates across AI, space, cyber, defense, hardware, energy, research and other technology sectors.","major":[{"title":x.title,"category":x.category,"source":x.source,"importance":x.importance,"summary":x.summary[:240]} for x in major],"watch":[{"title":x.title,"category":x.category,"source":x.source,"importance":x.importance} for x in watch]}

@app.get("/brief")
async def brief(minimum_importance:int=Query(default=4,ge=0,le=10), user=Depends(require_user)): return await daily_brief(minimum_importance)

@app.post("/screenshot/analyze")
async def screenshot_analyze(file:UploadFile=File(...),minimum_importance:int=Query(default=4,ge=0,le=10), user=Depends(require_user)):
    if not file.content_type or not file.content_type.startswith("image/"): return {"error":"Only image uploads are supported."}
    data=await file.read()
    if not data: return {"error":"The uploaded image is empty."}
    if len(data)>10*1024*1024: return {"error":"Image is too large. Maximum size is 10 MB."}
    return await analyze_screenshot(data,file.filename or "screenshot",minimum_importance)


def is_safe_remote_url(target: str) -> bool:
    """Allow public HTTP(S) hosts only; reject local/private/reserved destinations."""
    parsed = urlparse(target)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        return False
    if parsed.port not in (None, 80, 443):
        return False
    hostname = parsed.hostname.strip().rstrip(".")
    if hostname.lower() == "localhost":
        return False
    try:
        addresses = {info[4][0] for info in socket.getaddrinfo(hostname, parsed.port or (443 if parsed.scheme == "https" else 80), type=socket.SOCK_STREAM)}
    except (OSError, socket.gaierror, ValueError):
        return False
    for address in addresses:
        ip = ipaddress.ip_address(address)
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast or ip.is_unspecified:
            return False
    return True


@app.get("/image")
async def article_image(url:str=Query(...,min_length=8)):
    target=unquote(url).strip(); parsed=urlparse(target)
    if not is_safe_remote_url(target): return {"image_url":None}
    try:
        async with httpx.AsyncClient(timeout=10,follow_redirects=False) as client:
            response=await client.get(target,headers={"User-Agent":"Tech-News/1.0"}); response.raise_for_status()
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
async def news(category:str|None=Query(default=None),company:str|None=Query(default=None),minimum_importance:int=Query(default=4,ge=0,le=10), user=Depends(require_user)):
    items=await collect_news(minimum_importance)
    if category: items=[item for item in items if item.category.lower()==category.lower()]
    if company: items=[item for item in items if any(company.lower() in name.lower() for name in item.companies)]
    return items

@app.post("/news/refresh",response_model=list[NewsItem])
async def refresh(minimum_importance:int=Query(default=4,ge=0,le=10), user=Depends(require_user)): return await collect_news(minimum_importance)
