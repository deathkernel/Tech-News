(() => {
  const run = async () => {
    try {
      const response = await fetch('/news?minimum_importance=0', { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      if (!Array.isArray(data)) return;
      if (typeof items === 'undefined' || typeof render !== 'function') return;
      items = data;
      render();
      if (typeof updateIntelligence === 'function') updateIntelligence();
      const status = document.getElementById('status');
      if (status) status.textContent = `${data.length} ${data.length === 1 ? 'story' : 'stories'}`;
      try {
        const topResponse = await fetch('/top10?minimum_importance=0', { cache: 'no-store' });
        if (topResponse.ok) {
          const topData = await topResponse.json();
          if (typeof topStories !== 'undefined') topStories = topData.stories || [];
          if (typeof renderTop10 === 'function') renderTop10(topData);
        }
      } catch {}
    } catch {}
  };
  setTimeout(run, 2500);
})();
