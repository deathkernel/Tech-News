from __future__ import annotations

from collections import Counter


def summarize(items: list[dict]) -> dict:
    categories = Counter(item.get("category", "Unknown") for item in items)
    companies = Counter()
    for item in items:
        for company in str(item.get("companies", "")).split(","):
            company = company.strip()
            if company:
                companies[company] += 1

    return {
        "total": len(items),
        "high_importance": sum(1 for item in items if int(item.get("importance", 0)) >= 8),
        "categories": categories.most_common(),
        "companies": companies.most_common(),
    }
