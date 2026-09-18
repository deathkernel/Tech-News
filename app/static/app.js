const feed = document.getElementById('feed');
const status = document.getElementById('status');
const search = document.getElementById('search');
const category = document.getElementById('category');
const importance = document.getElementById('importance');
const refresh = document.getElementById('refresh');

let items = [];

const categoryIcons = {
  AI: '🤖', LLMs: '🧠', Programming: '💻', 'Cyber Security': '🔐', Cloud: '☁️', Linux: '🐧', Windows: '🪟', Apple: '🍎', Android: '📱',
  'Web technologies': '🌐', Databases: '🗄️', DevOps: '⚙️', 'Open Source': '📦', Research: '🧪', Hardware: '🖥️', 'GPU/CPU': '⚡', 'Developer tools': '🛠️'
};

async function loadCategories() {
  try {
    const response = await fetch('/categories');
    if (!response.ok) throw new Error('Category request failed');
    const data = await response.json();
    category.innerHTML = '<option value="">All topics</option>';
    for (const name of data.categories) {
      const option = document.createElement('option'); option.value = name; option.textContent = name; category.appendChild(option);
    }
  } catch { category.innerHTML = '<option value="">All topics</option>'; }
}

async function loadNews() {
  setLoading(true); status.textContent = 'Finding stories + podcasts...';
  try {
    const params = new URLSearchParams({ minimum_importance: importance.value });
    const response = await fetch(`/news?${params}`); if (!response.ok) throw new Error('News request failed');
    items = await response.json(); render(); loadIntelligence();
  } catch {
    status.textContent = 'Could not load news';
    feed.innerHTML = '<div class="empty">JARVIS could not reach the news sources right now. Try refresh.</div>';
  } finally { setLoading(false); }
}

async function loadIntelligence() {
  try {
    const response = await fetch(`/intelligence?minimum_importance=${importance.value}`); if (!response.ok) return;
    const data = await response.json();
    document.getElementById('intelTotal').textContent = data.total ?? '0';
    document.getElementById('intelMajor').textContent = data.major ?? '0';
    document.getElementById('intelImportant').textContent = data.important ?? '0';
    document.getElementById('intelTop').textContent = data.top_stories?.[0]?.category || 'NO SIGNAL';
  } catch { document.getElementById('intelTop').textContent = 'OFFLINE'; }
}

function render() {
  const query = search.value.toLowerCase().trim(); const selected = category.value.toLowerCase();
  const filtered = items.filter(item => {
    const searchable = [item.title, item.summary, item.source, item.content_type, ...(item.companies || []), ...(item.tags || [])].join(' ').toLowerCase();
    return (!query || searchable.includes(query)) && (!selected || item.category.toLowerCase() === selected);
  });
  status.textContent = `${filtered.length} ${filtered.length === 1 ? 'story' : 'stories'}`;
  if (!filtered.length) { feed.innerHTML = '<div class="empty">No stories match these filters.</div>'; return; }
  feed.innerHTML = filtered.map((item, index) => renderPost(item, index)).join('');
}

function renderPodcastHighlights(item) {
  if (item.content_type !== 'podcast' || !item.highlights?.length) return '';
  return `<section class="podcast-intel"><div class="podcast-kicker">🎙️ JARVIS PODCAST INTELLIGENCE</div><strong>Most interesting moments</strong>${item.highlights.map((h, i) => `<div class="podcast-highlight"><span>${i === 0 ? '🔥' : '💡'}</span><div><p>${escapeHtml(h.text)}</p><small>${escapeHtml(h.reason || 'High-signal technology point')}${h.timestamp ? ` · ${escapeHtml(h.timestamp)}` : ''}</small></div></div>`).join('')}</section>`;
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
  const image = `<img class="post-image" src="${escapeHtml(imageSource)}" alt="${escapeHtml(item.image_alt || item.title)}" loading="lazy" onerror='this.onerror=null; this.parentElement.innerHTML=${JSON.stringify(fallback)}'>`;
  const contentType = item.content_type === 'podcast' ? '🎙️ PODCAST / INTERVIEW' : signal;
  return `
    <article class="post" id="post-${index}">
      <div class="post-glow"></div>
      <header class="post-header"><div class="post-brand"><span class="post-mark">J</span><div><strong>JARVIS</strong><span>TECH NEWS</span></div></div><span class="post-date">${escapeHtml(date)}</span></header>
      <div class="post-topic"><span class="topic-icon">${icon}</span><span>${escapeHtml(item.category)}</span><i></i><span>${contentType}</span></div>
      <div class="media-frame">${image}</div>
      <h2>${escapeHtml(item.title)}</h2>
      ${renderPodcastHighlights(item)}
      <section class="story"><span class="label">WHAT HAPPENED</span><p>${escapeHtml(shortSummary)}</p></section>
      <section class="story why-story"><span class="label">WHY IT MATTERS</span><p>${escapeHtml(buildWhy(item))}</p></section>
      <div class="takeaway"><span class="label">KEY TAKEAWAY</span><strong>${escapeHtml(buildTakeaway(item))}</strong></div>
      <div class="post-actions"><button class="post-action" type="button" data-copy-post>COPY POST</button><a class="post-action" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${item.content_type === 'podcast' ? 'WATCH / LISTEN ↗' : 'OPEN SOURCE ↗'}</a></div>
      <footer class="post-footer"><div><span class="source">${escapeHtml(item.source)}</span>${companies ? `<span class="companies">${escapeHtml(companies)}</span>` : ''}</div><span class="handle">@JARVIS</span></footer>
    </article>`;
}

function buildWhy(item) {
  const category = item.category; const companies = item.companies?.length ? item.companies.join(', ') : 'the technology ecosystem';
  if (item.content_type === 'podcast') return `This conversation can surface ideas, plans and technical insights that may not appear in a standard news headline. JARVIS highlighted the strongest available technology points.`;
  const reasons = { AI:`AI is changing quickly, and this update from ${companies} could influence the tools developers use next.`, LLMs:'Model changes can affect capabilities, cost, speed and how AI applications are built.', Programming:'Language and developer-tool changes can directly affect how software is built and maintained.', 'Cyber Security':'Security updates can affect real systems immediately, especially when vulnerabilities or patches are involved.', Cloud:'Cloud platform changes can introduce new capabilities, infrastructure choices and development workflows.', 'Open Source':'Open-source releases can become useful building blocks for future projects and developer workflows.', Research:'Research developments can become the foundation for future products, models and engineering techniques.', Hardware:'Hardware changes can affect performance, AI workloads, local development and computing costs.' };
  return reasons[category] || 'This is a technology change worth tracking because it may affect future products, tools or developer workflows.';
}

function buildTakeaway(item) {
  if (item.content_type === 'podcast') return 'You do not need to watch the whole episode first — start with these JARVIS-picked moments.';
  const takeaways = { AI:'Track this one — it could shape what developers build with AI next.', LLMs:'Watch the model capability, speed and cost changes before choosing your next stack.', Programming:'A small developer-tool change can become a big workflow change over time.', 'Cyber Security':'If you use the affected technology, check for patches and security guidance.', Cloud:'Keep an eye on how this changes cloud architecture, tooling or costs.', 'Open Source':'Worth watching if you build with open-source software or developer infrastructure.', Research:'Today’s research can become tomorrow’s developer or product capability.', Hardware:'Hardware changes can directly influence performance and the cost of computing.' };
  return takeaways[item.category] || 'Worth tracking for its potential impact on future technology and developer workflows.';
}

function cleanText(value) { return String(value || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim(); }
function formatDate(value) { const date = new Date(value); if (Number.isNaN(date.getTime())) return 'Today'; return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }); }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]); }
function setLoading(loading) { refresh.disabled = loading; refresh.innerHTML = loading ? 'Updating...' : '<span>↻</span> Refresh'; }

search.addEventListener('input', render); category.addEventListener('change', render); importance.addEventListener('change', loadNews); refresh.addEventListener('click', loadNews);

const brief = document.getElementById('brief'); const briefPanel = document.getElementById('briefPanel'); const closeBrief = document.getElementById('closeBrief'); const upload = document.getElementById('upload'); const screenshotInput = document.getElementById('screenshotInput'); const screenshotPanel = document.getElementById('screenshotPanel'); const screenshotPreview = document.getElementById('screenshotPreview'); const clearScreenshot = document.getElementById('clearScreenshot');
const analyzeScreenshot = document.createElement('button'); analyzeScreenshot.type = 'button'; analyzeScreenshot.textContent = 'Analyze'; analyzeScreenshot.style.display = 'none'; screenshotPanel.appendChild(analyzeScreenshot);
const screenshotResult = document.createElement('div'); screenshotResult.className = 'screenshot-result'; screenshotResult.style.gridColumn = '1 / -1'; screenshotPanel.appendChild(screenshotResult);

brief.addEventListener('click', async () => {
  brief.disabled = true; brief.innerHTML = '<span>✦</span> Building...';
  try { const response = await fetch(`/brief?minimum_importance=${importance.value}`); if (!response.ok) throw new Error('Brief failed'); const data = await response.json(); document.getElementById('briefHeadline').textContent = data.headline; document.getElementById('briefSummary').textContent = data.summary; document.getElementById('briefStories').innerHTML = data.stories.map(story => `<article class="brief-story"><strong>${escapeHtml(story.title)}</strong><span>${escapeHtml(story.category)}</span><p>${escapeHtml(story.opportunity)}</p></article>`).join(''); briefPanel.hidden = false; briefPanel.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  catch { document.getElementById('briefHeadline').textContent = 'Brief unavailable'; document.getElementById('briefSummary').textContent = 'JARVIS could not build the intelligence brief right now.'; briefPanel.hidden = false; }
  finally { brief.disabled = false; brief.innerHTML = '<span>✦</span> Brief'; }
});
closeBrief.addEventListener('click', () => { briefPanel.hidden = true; }); upload.addEventListener('click', () => screenshotInput.click());
screenshotInput.addEventListener('change', event => { const file = event.target.files?.[0]; if (!file || !file.type.startsWith('image/')) return; screenshotPreview.src = URL.createObjectURL(file); screenshotPanel.hidden = false; analyzeScreenshot.style.display = 'inline-block'; screenshotResult.innerHTML = '<span>Screenshot ready. Press Analyze to send it through JARVIS.</span>'; screenshotPanel.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
analyzeScreenshot.addEventListener('click', async () => { const file = screenshotInput.files?.[0]; if (!file) return; analyzeScreenshot.disabled = true; analyzeScreenshot.textContent = 'Analyzing...'; screenshotResult.textContent = 'JARVIS is extracting text and checking the signal feed...'; try { const body = new FormData(); body.append('file', file); const response = await fetch(`/screenshot/analyze?minimum_importance=${importance.value}`, { method: 'POST', body }); const data = await response.json(); if (!response.ok || data.error) throw new Error(data.error || 'Analysis failed'); const matches = data.matches || []; screenshotResult.innerHTML = `<strong>${data.verified ? '✓ Signal verified' : '○ No matching signal yet'}</strong><p>Record: ${escapeHtml(data.record_id)} · OCR: ${escapeHtml(data.ocr?.status || 'unknown')}</p>${data.extracted_text ? `<pre>${escapeHtml(data.extracted_text.slice(0, 1800))}</pre>` : '<p>No readable text was extracted. Install Tesseract on the host to enable OCR.</p>'}${matches.length ? `<div>${matches.map(match => `<article class="brief-story"><strong>${escapeHtml(match.title)}</strong><span>${escapeHtml(match.category)} · ${match.importance}/10</span><p>Matched: ${escapeHtml(match.matched_terms.join(', '))}</p></article>`).join('')}</div>` : ''}`; } catch (error) { screenshotResult.textContent = error.message || 'Screenshot analysis failed.'; } finally { analyzeScreenshot.disabled = false; analyzeScreenshot.textContent = 'Analyze'; } });
clearScreenshot.addEventListener('click', () => { screenshotPreview.removeAttribute('src'); screenshotInput.value = ''; screenshotResult.innerHTML = ''; analyzeScreenshot.style.display = 'none'; screenshotPanel.hidden = true; });

(async () => { await loadCategories(); await loadNews(); })();
