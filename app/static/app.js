const feed = document.getElementById('feed');
const status = document.getElementById('status');
const search = document.getElementById('search');
const category = document.getElementById('category');
const importance = document.getElementById('importance');
const refresh = document.getElementById('refresh');
const top10List = document.getElementById('top10List');
const top10Date = document.getElementById('top10Date');
let items = [];

const categoryIcons = {
  AI:'🤖', LLMs:'🧠', Programming:'💻', 'Cyber Security':'🔐', Cloud:'☁️', Linux:'🐧', Windows:'🪟', Apple:'🍎', Android:'📱', Web:'🌐', Databases:'🗄️', DevOps:'⚙️', 'Open Source':'📦', Research:'🧪', Hardware:'🖥️', 'GPU/CPU':'⚡', 'Developer Tools':'🛠️',
  Space:'🚀', Marine:'🌊', 'Defense Technology':'🛡️', Aviation:'✈️', Automotive:'🚗', Energy:'⚛️', Quantum:'🔬', Biotech:'🧬'
};

async function loadCategories(){
  try{
    const r=await fetch('/categories');
    if(!r.ok) throw 0;
    const d=await r.json();
    category.innerHTML='<option value="">All topics</option>';
    for(const name of d.categories){
      const o=document.createElement('option');o.value=name;o.textContent=name;category.appendChild(o)
    }
  }catch{category.innerHTML='<option value="">All topics</option>'}
}

async function loadNews(){
  setLoading(true);status.textContent='Finding high-signal technology stories...';
  try{
    const params=new URLSearchParams({minimum_importance:importance.value});
    const r=await fetch(`/news?${params}`);
    if(!r.ok) throw 0;
    items=await r.json();
    render();renderTop10();loadIntelligence();
  }catch{
    status.textContent='Could not load news';
    feed.innerHTML='<div class="empty">JARVIS could not reach the news sources right now. Try refresh.</div>';
    top10List.innerHTML='<div class="empty">Daily Top 10 is temporarily unavailable.</div>';
  }finally{setLoading(false)}
}

function renderTop10(){
  const top=items.slice(0,10);
  top10Date.textContent=`${new Date().toLocaleDateString([], {month:'short',day:'numeric',year:'numeric'})} · ${top.length} signals`;
  if(!top.length){top10List.innerHTML='<div class="empty">No high-signal stories found today.</div>';return}
  top10List.innerHTML=top.map((item,i)=>`<article class="top10-item"><div class="top10-rank">${String(i+1).padStart(2,'0')}</div><div><strong>${escapeHtml(item.title)}</strong><span class="top10-meta">${categoryIcons[item.category]||'⚡'} ${escapeHtml(item.category)} · ${escapeHtml(item.source)} · ${item.importance}/10</span><p>${escapeHtml(cleanText(item.summary).slice(0,180) || 'Technology signal worth tracking.')}</p><a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">READ SIGNAL ↗</a></div></article>`).join('')
}

async function loadIntelligence(){
  try{
    const r=await fetch(`/intelligence?minimum_importance=${importance.value}`);if(!r.ok)return;
    const d=await r.json();
    document.getElementById('intelTotal').textContent=d.total??'0';
    document.getElementById('intelMajor').textContent=d.major??'0';
    document.getElementById('intelImportant').textContent=d.important??'0';
    document.getElementById('intelTop').textContent=d.top_stories?.[0]?.category||'NO SIGNAL'
  }catch{document.getElementById('intelTop').textContent='OFFLINE'}
}

function render(){
  const query=search.value.toLowerCase().trim(),selected=category.value.toLowerCase();
  const filtered=items.filter(item=>{
    const searchable=[item.title,item.summary,item.source,item.content_type,...(item.companies||[]),...(item.tags||[])].join(' ').toLowerCase();
    return(!query||searchable.includes(query))&&(!selected||item.category.toLowerCase()===selected)
  });
  status.textContent=`${filtered.length} ${filtered.length===1?'story':'stories'}`;
  if(!filtered.length){feed.innerHTML='<div class="empty">No stories match these filters.</div>';return}
  feed.innerHTML=filtered.map((item,index)=>renderPost(item,index)).join('')
}

function renderPost(item,index){
  const summary=cleanText(item.summary)||'A new technology update worth knowing about.';
  const shortSummary=summary.length>230?`${summary.slice(0,227).trim()}...`:summary;
  const companies=item.companies?.length?item.companies.join(' · '):'';
  const icon=categoryIcons[item.category]||'⚡';
  const date=item.published_at?formatDate(item.published_at):'Today';
  const signal=item.importance>=8?'MAJOR SIGNAL':item.importance>=6?'HIGH IMPACT':'TECH UPDATE';
  const imageSource=item.image_url||`/image?url=${encodeURIComponent(item.url)}`;
  const fallback=`<div class="post-image image-fallback" aria-label="${escapeHtml(item.category)} technology visual"><span>${icon}</span><small>${escapeHtml(item.category)}</small></div>`;
  const image=`<img class="post-image" src="${escapeHtml(imageSource)}" alt="${escapeHtml(item.image_alt||item.title)}" loading="lazy" onerror='this.onerror=null;this.parentElement.innerHTML=${JSON.stringify(fallback)}'>`;
  const contentType=item.content_type==='github'?'CURATED GITHUB':signal;
  return `<article class="post" id="post-${index}"><div class="post-media">${image}</div><div class="post-content"><header class="post-header"><div class="post-topic"><span class="topic-icon">${icon}</span><span>${escapeHtml(item.category)}</span><i></i><span>${contentType}</span></div><span class="post-date">${escapeHtml(date)}</span></header><h2>${escapeHtml(item.title)}</h2><p class="post-summary">${escapeHtml(shortSummary)}</p><div class="post-signal"><span>${signal}</span><strong>${escapeHtml(buildTakeaway(item))}</strong></div><footer class="post-footer"><div><span class="source">${escapeHtml(item.source)}</span>${companies?`<span class="companies">${escapeHtml(companies)}</span>`:''}</div><div class="post-link"><a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">READ SIGNAL ↗</a></div></footer></div></article>`
}

function buildWhy(item){
  const category=item.category,companies=item.companies?.length?item.companies.join(', '):'the technology ecosystem';
  if(item.content_type==='github')return'This repository comes from a curated high-signal technology creator or organization. JARVIS only surfaces selected repositories when their activity is relevant enough to track.';
  const reasons={
    AI:`AI is changing quickly, and this update from ${companies} could influence the tools developers use next.`,
    LLMs:'Model changes can affect capabilities, cost, speed and how AI applications are built.',
    Programming:'Language and developer-tool changes can directly affect how software is built and maintained.',
    'Cyber Security':'Security updates can affect real systems immediately, especially when vulnerabilities or patches are involved.',
    Cloud:'Cloud platform changes can introduce new capabilities, infrastructure choices and development workflows.',
    'Open Source':'Open-source releases can become useful building blocks for future projects and developer workflows.',
    Research:'Research developments can become the foundation for future products, models and engineering techniques.',
    Hardware:'Hardware changes can affect performance, AI workloads, local development and computing costs.',
    Space:'Launches, spacecraft and space-system developments can shape future exploration, communications and Earth observation.',
    Marine:'Ocean robotics, autonomous vessels and marine systems can change how the oceans are explored and operated.',
    'Defense Technology':'Defense technology developments can affect sensing, autonomy, communications and electronic systems.',
    Aviation:'Aircraft, propulsion and aviation-system advances can influence the future of flight.',
    Automotive:'Vehicle software, autonomy, batteries and manufacturing changes can reshape transportation technology.',
    Energy:'Energy technology affects computing infrastructure, mobility, storage and the transition to new power systems.',
    Quantum:'Quantum computing and communications research may create new capabilities beyond classical systems.',
    Biotech:'Biotechnology advances can translate computing, engineering and biological research into new tools and products.'
  };
  return reasons[category]||'This is a technology change worth tracking because it may affect future products, tools or engineering workflows.'
}

function buildTakeaway(item){
  if(item.content_type==='github')return'Curated because the owner and project activity meet JARVIS high-signal criteria.';
  const t={AI:'Track this one — it could shape what developers build with AI next.',LLMs:'Watch the model capability, speed and cost changes before choosing your next stack.',Programming:'A small developer-tool change can become a big workflow change over time.','Cyber Security':'If you use the affected technology, check for patches and security guidance.',Cloud:'Keep an eye on how this changes cloud architecture, tooling or costs.','Open Source':'Worth watching if you build with open-source software or developer infrastructure.',Research:'Today’s research can become tomorrow’s developer or product capability.',Hardware:'Hardware changes can directly influence performance and the cost of computing.',Space:'Watch the mission, vehicle or space-system capability and what it enables next.',Marine:'Watch the autonomy, robotics or ocean-system capability and its real-world applications.','Defense Technology':'Track the underlying sensing, autonomy, communications or electronic-system capability.',Aviation:'Watch the propulsion, aircraft, autonomy or flight-system technology behind the update.',Automotive:'Track the software, autonomy, battery or manufacturing technology involved.',Energy:'Watch the efficiency, storage, generation or infrastructure technology behind the change.',Quantum:'Track whether the research moves from laboratory capability toward practical systems.',Biotech:'Watch the underlying platform or engineering capability and where it can be applied.'};
  return t[item.category]||'Worth tracking for its potential impact on future technology and engineering workflows.'
}

function cleanText(value){return String(value||'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/gi,' ').replace(/\s+/g,' ').trim()}
function formatDate(value){const d=new Date(value);return Number.isNaN(d.getTime())?'Today':d.toLocaleDateString([],{month:'short',day:'numeric',year:'numeric'})}
function escapeHtml(value){return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function setLoading(loading){refresh.disabled=loading;refresh.innerHTML=loading?'Updating...':'<span>↻</span> Refresh'}

search.addEventListener('input',render);
category.addEventListener('change',render);
importance.addEventListener('change',loadNews);
refresh.addEventListener('click',loadNews);

const brief=document.getElementById('brief'),briefPanel=document.getElementById('briefPanel'),closeBrief=document.getElementById('closeBrief');
brief.addEventListener('click',async()=>{
  brief.disabled=true;brief.innerHTML='<span>✦</span> Building...';
  try{
    const r=await fetch(`/brief?minimum_importance=${importance.value}`);if(!r.ok)throw 0;
    const d=await r.json();
    document.getElementById('briefHeadline').textContent=d.headline;
    document.getElementById('briefSummary').textContent=d.summary;
    document.getElementById('briefStories').innerHTML=d.stories.map(s=>`<article class="brief-story"><strong>${escapeHtml(s.title)}</strong><span>${escapeHtml(s.category)}</span><p>${escapeHtml(s.opportunity)}</p></article>`).join('');
    briefPanel.hidden=false;briefPanel.scrollIntoView({behavior:'smooth',block:'center'})
  }catch{
    document.getElementById('briefHeadline').textContent='Brief unavailable';
    document.getElementById('briefSummary').textContent='JARVIS could not build the intelligence brief right now.';
    briefPanel.hidden=false
  }finally{brief.disabled=false;brief.innerHTML='<span>✦</span> Brief'}
});
closeBrief.addEventListener('click',()=>{briefPanel.hidden=true});

(async()=>{await loadCategories();await loadNews()})();
