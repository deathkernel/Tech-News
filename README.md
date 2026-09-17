# JARVIS Tech-News

JARVIS is a technology intelligence feed that collects technology news, removes duplicates/noise, categorizes stories, and surfaces updates likely to remain useful in the future.

## Scope

- AI and LLMs
- Programming and developer tools
- Cybersecurity
- Cloud and DevOps
- Linux and Windows
- Apple and Android
- Web technologies
- Databases
- Open source
- Research
- Hardware, GPUs and CPUs
- Major technology companies and platforms

## Run

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000/docs` for the API.

## API

- `GET /` health check
- `GET /news` collected and filtered news
- `POST /news/refresh` fetch fresh stories
- `GET /categories` supported categories
- `GET /sources` configured sources

## Design

The system is intentionally modular. Sources can be added without changing filtering or API code. The first implementation uses RSS feeds so the project can start without paid API keys.
