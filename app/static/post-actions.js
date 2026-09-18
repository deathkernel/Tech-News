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
