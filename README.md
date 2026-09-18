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
.venv\\Scripts\\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000/docs` for the API.

## API

- `GET /` JARVIS dashboard
- `GET /health` health check
- `GET /news` collected and filtered news
- `POST /news/refresh` fetch fresh stories
- `GET /intelligence` intelligence snapshot
- `GET /brief` daily intelligence brief
- `POST /screenshot/analyze` OCR a screenshot and verify it against the current signal feed
- `GET /categories` supported categories
- `GET /sources` configured sources

## Screenshot intelligence

The dashboard accepts a technology screenshot directly from the browser. JARVIS sends the image to the screenshot analyzer, extracts readable text with local OCR when Tesseract is available, checks the extracted signal against current JARVIS stories, and returns a structured Intelligence Record with a verification state and matched stories.

The upload is processed in memory and is not written to the repository or a persistent file store.

## Design

The system is intentionally modular. Sources can be added without changing filtering or API code. The first implementation uses RSS feeds so the project can start without paid API keys.
