from __future__ import annotations

import io
import re
from datetime import datetime, timezone

from .services import collect_news


async def analyze_screenshot(file_bytes: bytes, filename: str, minimum_importance: int = 4) -> dict:
    """Run lightweight local OCR and verify extracted signals against JARVIS news."""
    extracted_text = ""
    ocr_status = "unavailable"

    try:
        from PIL import Image
        import pytesseract

        image = Image.open(io.BytesIO(file_bytes))
        extracted_text = pytesseract.image_to_string(image).strip()
        ocr_status = "complete"
    except Exception as exc:
        ocr_status = "unavailable"
        extracted_text = ""
        ocr_error = type(exc).__name__
    else:
        ocr_error = None

    items = await collect_news(minimum_importance)
    normalized = re.sub(r"[^a-z0-9 ]+", " ", extracted_text.lower())
    tokens = {token for token in normalized.split() if len(token) >= 4}

    matches = []
    for item in items:
        haystack = f"{item.title} {item.summary} {' '.join(item.companies)}".lower()
        hay_tokens = {token for token in re.sub(r"[^a-z0-9 ]+", " ", haystack).split() if len(token) >= 4}
        overlap = tokens & hay_tokens
        if len(overlap) >= 2:
            matches.append({
                "title": item.title,
                "category": item.category,
                "importance": item.importance,
                "source": item.source,
                "url": item.url,
                "matched_terms": sorted(overlap)[:8],
            })

    matches.sort(key=lambda item: item["importance"], reverse=True)
    record_id = f"shot-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}"

    return {
        "record_id": record_id,
        "filename": filename,
        "created_at": datetime.now(timezone.utc),
        "ocr": {"status": ocr_status, "error": ocr_error},
        "extracted_text": extracted_text[:6000],
        "verified": bool(matches),
        "matches": matches[:8],
        "intelligence_record": {
            "type": "screenshot_signal",
            "confidence": "matched" if matches else ("unverified" if extracted_text else "no_text"),
            "matched_story_count": len(matches),
        },
    }
