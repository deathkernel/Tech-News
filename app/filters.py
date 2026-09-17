import re
from collections import Counter

from .config import CATEGORIES, COMPANIES


NOISE = {
    "opinion", "celebrity", "giveaway", "sponsored", "coupon", "entertainment",
}

HIGH_VALUE = {
    "release", "launch", "announces", "announcement", "update", "api", "sdk",
    "security", "vulnerability", "cve", "breach", "open source", "research",
    "chip", "gpu", "cpu", "framework", "developer", "github", "model",
}


def classify(title: str, summary: str = "") -> tuple[str, list[str]]:
    text = f" {title.lower()} {summary.lower()} "
    scores = Counter()
    for category, keywords in CATEGORIES.items():
        for keyword in keywords:
            if keyword in text:
                scores[category] += 1
    category = scores.most_common(1)[0][0] if scores else "Technology"
    companies = [company for company in COMPANIES if company.lower() in text]
    return category, companies


def importance(title: str, summary: str = "", category: str = "Technology", companies: list[str] | None = None) -> int:
    text = f"{title} {summary}".lower()
    score = 0
    for word in HIGH_VALUE:
        if word in text:
            score += 2
    if companies:
        score += min(4, len(companies))
    if category in {"Cyber Security", "AI", "LLMs", "Programming", "Open Source", "Research", "Hardware"}:
        score += 1
    if any(word in text for word in NOISE):
        score -= 5
    return max(0, min(10, score))


def normalize_title(title: str) -> str:
    return re.sub(r"[^a-z0-9 ]", "", title.lower()).strip()
