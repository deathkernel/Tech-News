CATEGORIES = {
    "AI": ["artificial intelligence", " ai ", "machine learning", "agentic", "generative ai", "robotics"],
    "LLMs": ["llm", "large language model", "foundation model", "language model", "transformer"],
    "Programming": ["python", "javascript", "typescript", "programming language", "compiler", "framework"],
    "Cyber Security": ["cybersecurity", "cyber security", "cve", "vulnerability", "malware", "ransomware", "security advisory", "exploit"],
    "Cloud": ["aws", "azure", "google cloud", "cloud computing", "serverless", "cloud"],
    "Linux": ["linux", "kernel", "ubuntu", "debian", "red hat"],
    "Windows": ["windows", "powershell", "wsl"],
    "Apple": ["apple", "macos", "ios", "xcode", "swift"],
    "Android": ["android", "android sdk", "kotlin"],
    "Web": ["web development", "browser", "webgpu", "webassembly", "http", "javascript"],
    "Databases": ["postgresql", "mysql", "mongodb", "redis", "database", "sql"],
    "DevOps": ["docker", "kubernetes", "terraform", "ci/cd", "devops", "container"],
    "Open Source": ["open source", "github", "gitlab", "apache", "linux foundation"],
    "Research": ["research paper", "arxiv", "study", "benchmark", "research"],
    "Hardware": ["cpu", "gpu", "processor", "chip", "semiconductor", "hardware"],
    "Developer Tools": ["developer tool", "sdk", "api", "ide", "cli", "developer platform"],
    "Space": ["spacex", "nasa", "isro", "esa", "rocket", "launch vehicle", "satellite", "spacecraft", "moon mission", "mars mission", "orbit", "space technology"],
    "Marine": ["marine technology", "ocean technology", "underwater", "submarine", "naval", "autonomous vessel", "unmanned surface vessel", "deep sea", "ocean robotics"],
    "Defense Technology": ["defense technology", "defence technology", "military technology", "missile", "drone", "uav", "counter-drone", "radar", "electronic warfare", "weapon system", "armored vehicle", "air defense"],
    "Aviation": ["aviation", "aircraft", "airliner", "fighter aircraft", "aerospace", "air mobility", "electric aircraft"],
    "Automotive": ["automotive", "electric vehicle", "ev", "autonomous driving", "self-driving", "vehicle technology", "battery technology"],
    "Energy": ["energy technology", "solar", "nuclear energy", "fusion", "battery", "grid technology", "renewable energy"],
    "Quantum": ["quantum computing", "quantum computer", "qubit", "quantum technology"],
    "Biotech": ["biotechnology", "biotech", "genomics", "gene editing", "medical technology", "health technology"],
}

COMPANIES = [
    "OpenAI", "Google", "Microsoft", "Meta", "Apple", "NVIDIA", "Amazon", "AWS",
    "Anthropic", "GitHub", "Hugging Face", "Cloudflare", "AMD", "Intel", "Docker",
    "Kubernetes", "Vercel", "Mozilla", "Red Hat", "Oracle", "IBM", "Samsung", "Qualcomm",
    "SpaceX", "NASA", "ISRO", "ESA", "Blue Origin", "Rocket Lab", "Boeing", "Airbus",
    "Lockheed Martin", "RTX", "Northrop Grumman", "BAE Systems", "Anduril", "Palantir",
    "Maersk", "Kongsberg", "Rolls-Royce", "Tesla", "Toyota", "Waymo", "BYD",
]

RSS_SOURCES = {
    "OpenAI": "https://openai.com/news/rss.xml",
    "Google AI": "https://blog.google/technology/ai/rss/",
    "Microsoft": "https://blogs.microsoft.com/feed/",
    "Cloudflare": "https://blog.cloudflare.com/rss/",
    "GitHub": "https://github.blog/feed/",
    "Hugging Face": "https://huggingface.co/blog/feed.xml",
    "The Hacker News": "https://feeds.feedburner.com/TheHackersNews",
    "Ars Technica": "https://feeds.arstechnica.com/arstechnica/index",
    "NASA": "https://www.nasa.gov/rss/dyn/breaking_news.rss",
}

PUBLIC_APIS = {
    "Hacker News": "https://hacker-news.firebaseio.com/v0/",
    "GitHub": "https://api.github.com/",
    "NVD": "https://services.nvd.nist.gov/rest/json/cves/2.0",
    "arXiv": "https://export.arxiv.org/api/query",
    "GDELT": "https://api.gdeltproject.org/api/v2/doc/doc",
    "DEV Community": "https://dev.to/api/articles",
}

CURATED_GITHUB_OWNERS = {
    "openai", "google", "google-deepmind", "microsoft", "facebook", "meta-llama",
    "nvidia", "anthropics", "huggingface", "github", "cloudflare", "vercel",
    "docker", "kubernetes", "pytorch", "tensorflow", "apple", "torvalds",
    "karpathy", "Andrej-Karpathy", "karpathy-ai",
}
