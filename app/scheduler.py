from __future__ import annotations

import asyncio
import logging

from .database import init_db, save_news
from .services import collect_news

logger = logging.getLogger(__name__)


async def refresh_once(minimum_importance: int = 4) -> int:
    items = await collect_news(minimum_importance)
    return save_news(items)


async def run_scheduler(interval_minutes: int = 30, minimum_importance: int = 4) -> None:
    init_db()
    while True:
        try:
            inserted = await refresh_once(minimum_importance)
            logger.info("JARVIS refresh complete: %s new items", inserted)
        except Exception:
            logger.exception("JARVIS scheduled refresh failed")
        await asyncio.sleep(interval_minutes * 60)
