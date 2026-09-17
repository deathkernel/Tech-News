from __future__ import annotations

import sqlite3
from pathlib import Path

from .models import NewsItem

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "jarvis.db"


def _connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _connect() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS news (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                summary TEXT NOT NULL,
                url TEXT NOT NULL UNIQUE,
                source TEXT NOT NULL,
                category TEXT NOT NULL,
                companies TEXT NOT NULL,
                published_at TEXT,
                importance INTEGER NOT NULL,
                collected_at TEXT NOT NULL
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_news_category ON news(category)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_news_importance ON news(importance)")
        conn.commit()


def save_news(items: list[NewsItem]) -> int:
    inserted = 0
    with _connect() as conn:
        for item in items:
            try:
                conn.execute(
                    """INSERT INTO news
                    (title, summary, url, source, category, companies, published_at, importance, collected_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))""",
                    (
                        item.title,
                        item.summary,
                        str(item.url),
                        item.source,
                        item.category,
                        ",".join(item.companies),
                        item.published_at.isoformat() if item.published_at else None,
                        item.importance,
                    ),
                )
                inserted += 1
            except sqlite3.IntegrityError:
                pass
        conn.commit()
    return inserted


def recent_news(limit: int = 100, minimum_importance: int = 0) -> list[dict]:
    with _connect() as conn:
        rows = conn.execute(
            """SELECT * FROM news WHERE importance >= ?
            ORDER BY COALESCE(published_at, collected_at) DESC LIMIT ?""",
            (minimum_importance, limit),
        ).fetchall()
    return [dict(row) for row in rows]
