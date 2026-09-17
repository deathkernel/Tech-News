const feed = document.getElementById('feed');
const status = document.getElementById('status');
const search = document.getElementById('search');
const category = document.getElementById('category');
const importance = document.getElementById('importance');
const refresh = document.getElementById('refresh');

let items = [];

const categoryIcons = {
  AI: '🤖',
  LLMs: '🧠',
  Programming: '💻',
  'Cyber Security': '🔐',
  Cloud: '☁️',
  Linux: '🐧',
  Windows: '🪟',
  Apple: '🍎',
  Android: '📱',
  'Web technologies': '🌐',
  Databases: '🗄️',
  DevOps: '⚙️',
  'Open Source': '📦',
  Research: '🧪',
  Hardware: '🖥️',
  'GPU/CPU': '⚡',
  'Developer tools': '🛠️'
};

async function loadCategories() {
  try {
    const response = await fetch('/categories');
    if (!response.ok) throw new Error('Category request failed');

    const data = await response.json();
    category.innerHTML = '<option value="">All topics</option>';

    for (const name of data.categories) {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      category.appendChild(option);
    }
  } catch {
    category.innerHTML = '<option value="">All topics</option>';
  }
}

async function loadNews() {
  setLoading(true);
  status.textContent = 'Finding stories...';

  try {
    const params = new URLSearchParams({
      minimum_importance: importance.value
    });

    const response = await fetch(`/news?${params}`);
    if (!response.ok) throw new Error('News request failed');

    items = await response.json();
    render();
  } catch {
    status.textContent = 'Could not load news';
    feed.innerHTML = '<div class="empty">JARVIS could not reach the news sources right now. Try refresh.</div>';
  } finally {
    setLoading(false);
  }
}

function render() {
  const query = search.value.toLowerCase().trim();
  const selected = category.value.toLowerCase();

  const filtered = items.filter(item => {
    const searchable = [
      item.title,
      item.summary,
      item.source,
      ...(item.companies || [])
    ].join(' ').toLowerCase();

    const matchesText = !query || searchable.includes(query);
    const matchesCategory = !selected || item.category.toLowerCase() === selected;
    return matchesText && matchesCategory;
  });

  status.textContent = `${filtered.length} ${filtered.length === 1 ? 'story' : 'stories'}`;

  if (!filtered.length) {
    feed.innerHTML = '<div class="empty">No stories match these filters.</div>';
    return;
  }

  feed.innerHTML = filtered.map((item, index) => renderPost(item, index)).join('');
}

function renderPost(item, index) {
  const summary = cleanText(item.summary) || 'A new technology update worth knowing about.';
  const shortSummary = summary.length > 270 ? `${summary.slice(0, 267).trim()}...` : summary;
  const companies = item.companies?.length ? item.companies.join(' · ') : '';
  const icon = categoryIcons[item.category] || '⚡';
  const date = item.published_at ? formatDate(item.published_at) : 'Today';
  const signal = item.importance >= 8 ? 'MAJOR UPDATE' : item.importance >= 6 ? 'IMPORTANT' : 'TECH UPDATE';
  const imageSource = item.image_url || `/image?url=${encodeURIComponent(item.url)}`;
  const fallback = `<div class="post-image image-fallback" aria-label="${escapeHtml(item.category)} technology visual"><span>${icon}</span><small>${escapeHtml(item.category)}</small></div>`;
  const image = `<img class="post-image" src="${escapeHtml(imageSource)}" alt="${escapeHtml(item.image_alt || item.title)}" loading="lazy" onerror="this.outerHTML=${JSON.stringify(fallback)}">`;

  return `
    <article class="post" id="post-${index}">
      <div class="post-glow"></div>

      <header class="post-header">
        <div class="post-brand">
          <span class="post-mark">J</span>
          <div>
            <strong>JARVIS</strong>
            <span>TECH NEWS</span>
          </div>
        </div>
        <span class="post-date">${escapeHtml(date)}</span>
      </header>

      <div class="post-topic">
        <span class="topic-icon">${icon}</span>
        <span>${escapeHtml(item.category)}</span>
        <i></i>
        <span>${signal}</span>
      </div>

      <div class="media-frame">
        ${image}
      </div>

      <h2>${escapeHtml(item.title)}</h2>

      <section class="story">
        <span class="label">WHAT HAPPENED</span>
        <p>${escapeHtml(shortSummary)}</p>
      </section>

      <section class="story why-story">
        <span class="label">WHY IT MATTERS</span>
        <p>${escapeHtml(buildWhy(item))}</p>
      </section>

      <div class="takeaway">
        <span class="label">KEY TAKEAWAY</span>
        <strong>${escapeHtml(buildTakeaway(item))}</strong>
      </div>

      <footer class="post-footer">
        <div>
          <span class="source">${escapeHtml(item.source)}</span>
          ${companies ? `<span class="companies">${escapeHtml(companies)}</span>` : ''}
        </div>
        <span class="handle">@JARVIS</span>
      </footer>
    </article>`;
}

function buildWhy(item) {
  const category = item.category;
  const companies = item.companies?.length ? item.companies.join(', ') : 'the technology ecosystem';

  const reasons = {
    AI: `AI is changing quickly, and this update from ${companies} could influence the tools developers use next.`,
    LLMs: 'Model changes can affect capabilities, cost, speed and how AI applications are built.',
    Programming: 'Language and developer-tool changes can directly affect how software is built and maintained.',
    'Cyber Security': 'Security updates can affect real systems immediately, especially when vulnerabilities or patches are involved.',
    Cloud: 'Cloud platform changes can introduce new capabilities, infrastructure choices and development workflows.',
    'Open Source': 'Open-source releases can become useful building blocks for future projects and developer workflows.',
    Research: 'Research developments can become the foundation for future products, models and engineering techniques.',
    Hardware: 'Hardware changes can affect performance, AI workloads, local development and computing costs.'
  };

  return reasons[category] || 'This is a technology change worth tracking because it may affect future products, tools or developer workflows.';
}

function buildTakeaway(item) {
  const takeaways = {
    AI: 'Track this one — it could shape what developers build with AI next.',
    LLMs: 'Watch the model capability, speed and cost changes before choosing your next stack.',
    Programming: 'A small developer-tool change can become a big workflow change over time.',
    'Cyber Security': 'If you use the affected technology, check for patches and security guidance.',
    Cloud: 'Keep an eye on how this changes cloud architecture, tooling or costs.',
    'Open Source': 'Worth watching if you build with open-source software or developer infrastructure.',
    Research: 'Today’s research can become tomorrow’s developer or product capability.',
    Hardware: 'Hardware changes can directly influence performance and the cost of computing.'
  };

  return takeaways[item.category] || 'Worth tracking for its potential impact on future technology and developer workflows.';
}

function cleanText(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Today';

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  })[character]);
}

function setLoading(loading) {
  refresh.disabled = loading;
  refresh.textContent = loading ? 'Updating...' : 'Refresh';
}

search.addEventListener('input', render);
category.addEventListener('change', render);
importance.addEventListener('change', loadNews);
refresh.addEventListener('click', loadNews);

(async () => {
  await loadCategories();
  await loadNews();
})();
