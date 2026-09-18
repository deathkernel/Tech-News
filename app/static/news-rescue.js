(() => {
  const run = async () => {
    const feed = document.getElementById('feed');
    if (!feed || feed.children.length) return;
    try {
      const response = await fetch('/news?minimum_importance=0', { cache: 'no-store' });
      if (!response.ok) return;
      const items = await response.json();
      if (!items.length) return;
      feed.innerHTML = items.map(item => `<article class="post"><header class="post-header"><strong>THE TECH EXPRESS</strong><span class="post-date">${new Date(item.published_at || Date.now()).toLocaleDateString()}</span></header><div class="post-topic"><span>${item.category || 'Technology'}</span><i></i><span>${item.source || 'News'}</span></div><h2>${String(item.title || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}</h2><p class="post-summary">${String(item.summary || 'Technology update worth tracking.').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}</p><footer class="post-footer"><span class="source">${String(item.source || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}</span><a class="post-link" href="${item.url}" target="_blank" rel="noopener noreferrer">READ STORY →</a></footer></article>`).join('');
      const status = document.getElementById('status');
      if (status) status.textContent = `${items.length} stories`;
    } catch {}
  };
  setTimeout(run, 2500);
  setTimeout(run, 6000);
})();
