from __future__ import annotations

import re

CRITICAL_TERMS = {
    "critical", "zero-day", "actively exploited", "remote code execution",
    "rce", "security advisory", "critical vulnerability", "data breach"
}
FUTURE_TERMS = {
    "launch", "release", "new model", "api", "sdk", "framework", "architecture",
    "open source", "research", "developer", "platform", "update", "breakthrough",
    "deprecation", "migration", "performance", "security", "vulnerability"
}


def score_news(title: str, summary: str, source: str = "") -> tuple[int, str]:
    text = f"{title} {summary}".lower()
    score = 2
    reasons: list[str] = []

    future_hits = sum(1 for term in FUTURE_TERMS if term in text)
    score += min(future_hits, 4)
    if future_hits:
        reasons.append("technology relevance")

    critical_hits = sum(1 for term in CRITICAL_TERMS if term in text)
    if critical_hits:
        score += 4
        reasons.append("security impact")

    if re.search(r"\b(2026|2027|next[- ]generation|major)\b", text):
        score += 1
        reasons.append("forward-looking")

    if source:
        score += 1
        reasons.append("identified source")

    return min(score, 10), ", ".join(dict.fromkeys(reasons)) or "general technology relevance"
