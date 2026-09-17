const feed = document.getElementById('feed');
const status = document.getElementById('status');
const search = document.getElementById('search');
const category = document.getElementById('category');
const importance = document.getElementById('importance');

let items = [];

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
  status.textContent = 'Collecting and filtering technology news...';
  const params = new URLSearchParams({minimum_importance: importance.value});
  const response = await fetch(`/news?${params}`);
  items = await response.json();
  render();
}

function render() {
  const query = search.value.toLowerCase().trim();
  const selected = category.value.toLowerCase();
  const filtered = items.filter(item => {
    const matchesText = !query || `${item.title} ${item.summary} ${item.companies.join(' ')}`.toLowerCase().includes(query);
    const matchesCategory = !selected || item.category.toLowerCase() === selected;
    return matchesText && matchesCategory;
  });

  status.textContent = `${filtered.length} future-useful technology updates`;
  feed.innerHTML = filtered.map(item => `
    <article class="card">
      <div class="meta"><span>${escapeHtml(item.category)}</span><span>•</span><span class="score">Importance ${item.importance}/10</span></div>
      <h2>${escapeHtml(item.title)}</h2>
      <p>${escapeHtml(stripHtml(item.summary).slice(0, 280))}</p>
      <div class="tags">${escapeHtml(item.source)}${item.companies.length ? ' · ' + escapeHtml(item.companies.join(', ')) : ''}</div>
      <p><a href="${item.url}" target="_blank" rel="noopener">Read source →</a></p>
    </article>`).join('');
}

function stripHtml(value) { return value.replace(/<[^>]*>/g, ''); }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c])); }

search.addEventListener('input', render);
category.addEventListener('change', render);
importance.addEventListener('change', loadNews);
document.getElementById('refresh').addEventListener('click', loadNews);

(async () => { await loadCategories(); await loadNews(); })();
