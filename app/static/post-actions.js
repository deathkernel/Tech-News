document.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-copy-post]');
  if (!button) return;
  const card = button.closest('.post');
  if (!card) return;

  const title = card.querySelector('h2')?.textContent?.trim() || '';
  const sections = [...card.querySelectorAll('.story')].map(section => {
    const label = section.querySelector('.label')?.textContent?.trim() || '';
    const text = section.querySelector('p')?.textContent?.trim() || '';
    return label && text ? `${label}: ${text}` : '';
  }).filter(Boolean);
  const takeaway = card.querySelector('.takeaway strong')?.textContent?.trim() || '';
  const source = card.querySelector('.source')?.textContent?.trim() || '';

  const caption = [title, '', ...sections, '', takeaway ? `KEY TAKEAWAY: ${takeaway}` : '', source ? `Source: ${source}` : '', '#TechNews #AI #Technology']
    .filter(Boolean).join('\n');

  try {
    await navigator.clipboard.writeText(caption);
    const old = button.textContent;
    button.textContent = 'COPIED ✓';
    setTimeout(() => { button.textContent = old; }, 1400);
  } catch {
    button.textContent = 'COPY FAILED';
    setTimeout(() => { button.textContent = 'COPY POST'; }, 1400);
  }
});

// Add the original article as a direct source link inside the story view.
(() => {
  const escapeAttr = (value) => String(value || '').replace(/[&<>\"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[char]));
  const sourceMap = new Map();

  const loadSources = async () => {
    try {
      const response = await fetch('/news?minimum_importance=0', { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      if (!Array.isArray(data)) return;
      data.forEach(item => {
        if (item?.title && item?.url) sourceMap.set(item.title.trim(), { url: item.url, source: item.source || 'Original source' });
      });
      inject();
    } catch {}
  };

  const inject = () => {
    const view = document.getElementById('storyView');
    const title = view?.querySelector('.story-article h1')?.textContent?.trim();
    if (!view || !title || view.querySelector('[data-related-sources]')) return;
    const source = sourceMap.get(title);
    if (!source?.url || !/^https?:\/\//i.test(source.url)) return;

    const section = document.createElement('section');
    section.setAttribute('data-related-sources', 'true');
    section.style.cssText = 'margin-top:28px;padding:18px 0;border-top:1px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap';
    section.innerHTML = `<div><label style="display:block;color:#7b7d78;font-size:6px;font-weight:950;letter-spacing:.15em;margin-bottom:7px">RELATED SOURCES</label><span style="color:#777a76;font-size:9px">${escapeAttr(source.source)}</span></div><a href="${escapeAttr(source.url)}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:7px;padding:10px 14px;border:1px solid rgba(202,255,53,.35);border-radius:999px;color:#caff35;background:rgba(202,255,53,.05);font-size:8px;font-weight:900;letter-spacing:.1em;text-decoration:none">OPEN ORIGINAL ↗</a>`;
    view.querySelector('.story-body')?.appendChild(section);
  };

  const view = document.getElementById('storyView');
  if (view) new MutationObserver(inject).observe(view, { childList: true, subtree: true });
  loadSources();
})();
