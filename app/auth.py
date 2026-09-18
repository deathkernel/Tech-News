import os
import secrets
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt
from pwdlib import PasswordHash
from fastapi import HTTPException, status

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
SECRET_KEY = os.getenv("JARVIS_SECRET_KEY", "").strip()
if not SECRET_KEY:
    SECRET_KEY = secrets.token_hex(32)
ALGORITHM = "HS256"
ACCESS_TOKEN_MINUTES = 60
CSRF_COOKIE = "jarvis_csrf"
AUTH_COOKIE = "jarvis_session"

password_hash = PasswordHash.recommended()
BASE_DIR = Path(__file__).resolve().parent.parent
SQLITE_PATH = BASE_DIR / "data" / "users.db"
SQLITE_PATH.parent.mkdir(parents=True, exist_ok=True)


def _is_postgres():
    return DATABASE_URL.startswith(("postgres://", "postgresql://"))


def _connect():
    if _is_postgres():
        import psycopg
        return psycopg.connect(DATABASE_URL)
    conn = sqlite3.connect(SQLITE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = _connect()
    try:
        if _is_postgres():
            conn.execute("""CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(64) UNIQUE NOT NULL,
                email VARCHAR(254) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL
            )""")
        else:
            conn.execute("""CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            )""")
        conn.commit()
    finally:
        conn.close()


def _row_to_dict(row):
    if hasattr(row, "keys"):
        return dict(row)
    return {"id": row[0], "username": row[1], "email": row[2], "password_hash": row[3], "created_at": row[4]}


def create_user(username: str, email: str, password: str):
    init_db()
    username = username.strip()
    email = email.strip().lower()
    if not 3 <= len(username) <= 64 or not all(c.isalnum() or c in "._-" for c in username):
        raise ValueError("Username must be 3-64 characters and use letters, numbers, dot, underscore or hyphen.")
    if len(password) < 8 or len(password) > 128:
        raise ValueError("Password must be 8-128 characters.")
    hashed = password_hash.hash(password)
    now = datetime.now(timezone.utc)
    conn = _connect()
    try:
        try:
            if _is_postgres():
                row = conn.execute("INSERT INTO users (username,email,password_hash,created_at) VALUES (%s,%s,%s,%s) RETURNING id,username,email,created_at", (username,email,hashed,now)).fetchone()
            else:
                cur = conn.execute("INSERT INTO users (username,email,password_hash,created_at) VALUES (?,?,?,?)", (username,email,hashed,now.isoformat()))
                row = conn.execute("SELECT id,username,email,created_at FROM users WHERE id=?", (cur.lastrowid,)).fetchone()
            conn.commit()
            return _row_to_dict(row)
        except Exception as exc:
            conn.rollback()
            if "unique" in str(exc).lower() or "duplicate" in str(exc).lower():
                raise ValueError("Username or email is already registered.") from exc
            raise
    finally:
        conn.close()


def find_user(identifier: str):
    init_db()
    identifier = identifier.strip().lower()
    conn = _connect()
    try:
        if _is_postgres():
            row = conn.execute("SELECT id,username,email,password_hash,created_at FROM users WHERE LOWER(username)=LOWER(%s) OR LOWER(email)=LOWER(%s)", (identifier,identifier)).fetchone()
        else:
            row = conn.execute("SELECT id,username,email,password_hash,created_at FROM users WHERE LOWER(username)=? OR LOWER(email)=?", (identifier,identifier)).fetchone()
        return _row_to_dict(row) if row else None
    finally:
        conn.close()


def authenticate(identifier: str, password: str):
    user = find_user(identifier)
    if not user:
        password_hash.verify(password, password_hash.hash("dummy-password-for-timing"))
        return None
    if not password_hash.verify(password, user["password_hash"]):
        return None
    return user


def create_token(user_id: int):
    now = datetime.now(timezone.utc)
    payload = {"sub": str(user_id), "iat": now, "exp": now + timedelta(minutes=ACCESS_TOKEN_MINUTES), "jti": secrets.token_urlsafe(16)}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def csrf_token():
    return secrets.token_urlsafe(32)


def current_user(session: str | None, csrf_cookie: str | None = None, csrf_header: str | None = None, require_csrf: bool = False):
    if not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    try:
        payload = jwt.decode(session, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub", "0"))
    except (jwt.InvalidTokenError, ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session")
    if require_csrf and (not csrf_cookie or not csrf_header or not secrets.compare_digest(csrf_cookie, csrf_header)):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="CSRF validation failed")
    conn = _connect()
    try:
        if _is_postgres():
            row = conn.execute("SELECT id,username,email,created_at FROM users WHERE id=%s", (user_id,)).fetchone()
        else:
            row = conn.execute("SELECT id,username,email,created_at FROM users WHERE id=?", (user_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        return _row_to_dict(row)
    finally:
        conn.close()


def public_user(user):
    return {"id": user["id"], "username": user["username"], "email": user["email"]}
