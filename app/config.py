CATEGORIES = {
    "AI": ["artificial intelligence", " ai ", "machine learning", "agentic", "generative ai"],
    "LLMs": ["llm", "large language model", "foundation model", "language model", "transformer"],
    "Programming": ["python", "javascript", "typescript", "programming language", "compiler", "framework"],
    "Cyber Security": ["cybersecurity", "cyber security", "cve", "vulnerability", "malware", "ransomware", "security advisory", "exploit"],
    "Cloud": ["aws", "azure", "google cloud", "cloud computing", "serverless"],
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
}

COMPANIES = [
    "OpenAI", "Google", "Microsoft", "Meta", "Apple", "NVIDIA", "Amazon", "AWS",
    "Anthropic", "GitHub", "Hugging Face", "Cloudflare", "AMD", "Intel", "Docker",
    "Kubernetes", "Vercel", "Mozilla", "Red Hat", "Oracle", "IBM", "Samsung", "Qualcomm",
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
}

# Public APIs used for discovery and verification. These do not require a paid plan.
PUBLIC_APIS = {
    "Hacker News": "https://hacker-news.firebaseio.com/v0/",
    "GitHub": "https://api.github.com/",
    "NVD": "https://services.nvd.nist.gov/rest/json/cves/2.0",
    "arXiv": "https://export.arxiv.org/api/query",
    "GDELT": "https://api.gdeltproject.org/api/v2/doc/doc",
    "DEV Community": "https://dev.to/api/articles",
}
