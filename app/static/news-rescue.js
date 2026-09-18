(() => {
  const run = async () => {
    try {
      const response = await fetch('/news?minimum_importance=0', { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      if (!Array.isArray(data)) return;
      items = data;
      render();
      updateIntelligence();
      const status = document.getElementById('status');
      if (status) status.textContent = `${data.length} ${data.length === 1 ? 'story' : 'stories'}`;
      try {
        const topResponse = await fetch('/top10?minimum_importance=0', { cache: 'no-store' });
        if (topResponse.ok) {
          const topData = await topResponse.json();
          topStories = topData.stories || [];
          renderTop10(topData);
        }
      } catch {}
    } catch {}
  };
  setTimeout(run, 2500);
  setTimeout(run, 7000);
})();
