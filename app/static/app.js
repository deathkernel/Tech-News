const feed = document.getElementById('feed');
const status = document.getElementById('status');
const search = document.getElementById('search');
const category = document.getElementById('category');
const importance = document.getElementById('importance');

let items = [];

const categoryInfo = {
  AI: {
    icon: '🤖',
    why: 'AI capabilities are moving quickly. Track releases and model changes that can affect what developers build next.',
    code: 'from openai import OpenAI\n\nclient = OpenAI()\nresponse = client.responses.create(\n    model="latest-model",\n    input="Explain the new capability in 3 bullets."\n)'
  },
  LLMs: {
    icon: '🧠',
    why: 'Model updates can change cost, latency, context limits and the way AI applications are designed.',
    code: 'response = client.responses.create(\n    model="latest-model",\n    input="Summarize this technology update."\n)'
  },
  Programming: {
    icon: '💻',
    why: 'Language, framework and compiler changes can directly affect your next project and development workflow.',
    code: 'def use_new_feature(data):\n    result = transform(data)\n    return result'
  },
  'Cyber Security': {
    icon: '🔐',
    why: 'Security changes can require immediate patches, dependency updates or changes to how systems are deployed.',
    code: '# Check dependencies regularly\npip list --outdated\npip-audit'
  },
  Cloud: {
    icon: '☁️',
    why: 'Cloud platform changes can introduce new infrastructure options, performance gains or migration decisions.',
    code: 'resource "cloud_service" "app" {\n  name = "jarvis-tech-news"\n}'
  },
  DevOps: {
    icon: '⚙️',
    why: 'DevOps updates can improve deployment speed, reliability and developer experience.',
    code: 'docker build -t jarvis-news .\ndocker run -p 8000:8000 jarvis-news'
  },
  'Open Source': {
    icon: '📦',
    why: 'Open-source releases can become useful building blocks for future projects and workflows.',
    code: 'git clone https://github.com/example/project.git\ncd project\npython -m pip install -r requirements.txt'
  },
  Hardware: {
    icon: '🖥️',
    why: 'Hardware changes affect compute cost, AI workloads, local development and system performance.',
    code: 'import platform\nprint(platform.processor())\nprint(platform.machine())'
  },
  'Developer Tools': {
    icon: '🛠️',
    why: 'Developer-tool releases can remove repetitive work and change how software is built and tested.',
    code: 'npm install new-developer-tool\nnpx new-developer-tool init'
  }
};

const fallbackInfo = {
  icon: '⚡',
  why: 'This update was selected because it contains technology information that may be useful for future projects.',
  code: '# Start investigating the new technology\nprint("Explore the new capability")'
};

async function loadCategories() {
  const response = await fetch('/categories');
  const data = await response.json();
  for (const name of data.categories) {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    category.appendChild(option);
  }
}

async function loadNews() {
  status.textContent = 'Scanning technology sources...';
  try {
    const params = new URLSearchParams({ minimum_importance: importance.value });
    const response = await fetch(`/news?${params}`);
    if (!response.ok) throw new Error('News request failed');
    items = await response.json();
    render();
  } catch (error) {
    status.textContent = 'Could not load the feed. Try refresh again.';
    feed.innerHTML = '<div class="empty">JARVIS could not reach the news sources right now.</div>';
  }
}

function render() {
  const query = search.value.toLowerCase().trim();
  const selected = category.value.toLowerCase();
  const filtered = items.filter(item => {
    const matchesText = !query || `${item.title} ${item.summary} ${item.companies.join(' ')}`.toLowerCase().includes(query);
    const matchesCategory = !selected || item.category.toLowerCase() === selected;
    return matchesText && matchesCategory;
  });

  status.textContent = `${filtered.length} future-useful updates`;
  feed.innerHTML = filtered.map((item, index) => renderCard(item, index)).join('');
  document.querySelectorAll('.copy-code').forEach(button => {
    button.addEventListener('click', async () => {
      const code = button.closest('.card').querySelector('code').textContent;
      await navigator.clipboard.writeText(code);
      button.textContent = '✓ Copied';
      setTimeout(() => { button.textContent = 'Copy code'; }, 1200);
    });
  });
}

function renderCard(item, index) {
  const info = categoryInfo[item.category] || fallbackInfo;
  const summary = stripHtml(item.summary).replace(/\s+/g, ' ').trim();
  const companies = item.companies.length ? item.companies.join(' · ') : 'Technology Radar';
  const published = item.published_at ? formatDate(item.published_at) : 'Just now';
  const level = item.importance >= 8 ? 'HIGH IMPACT' : item.importance >= 6 ? 'IMPORTANT' : 'WATCH';

  return `
    <article class="card" id="story-${index}">
      <div class="card-top">
        <div class="category-badge">${info.icon} ${escapeHtml(item.category)}</div>
        <div class="impact-badge impact-${level.toLowerCase().replace(' ', '-')}">${level}</div>
      </div>

      <div class="source-line">
        <span>${escapeHtml(item.source)}</span>
        <span>•</span>
        <span>${escapeHtml(published)}</span>
      </div>

      <h2>${escapeHtml(item.title)}</h2>
      <p class="summary">${escapeHtml(summary || 'A new technology update worth tracking.')}</p>

      <div class="section-label">WHY IT MATTERS</div>
      <p class="why">${escapeHtml(info.why)}</p>

      <div class="section-label code-label-row">
        <span>DEVELOPER EXAMPLE</span>
        <button class="copy-code" type="button">Copy code</button>
      </div>
      <pre><code>${escapeHtml(info.code)}</code></pre>

      <div class="card-footer">
        <div class="company-tags">${escapeHtml(companies)}</div>
        <div class="score">${item.importance}/10 relevance</div>
      </div>
      <div class="source-note">Source: ${escapeHtml(item.source)} · JARVIS Technology Intelligence</div>
    </article>`;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function stripHtml(value) { return value.replace(/<[^>]*>/g, ''); }
function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));
}

search.addEventListener('input', render);
category.addEventListener('change', render);
importance.addEventListener('change', loadNews);
document.getElementById('refresh').addEventListener('click', loadNews);

(async () => { await loadCategories(); await loadNews(); })();
