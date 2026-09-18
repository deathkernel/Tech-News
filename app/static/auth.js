(() => {
  const originalFetch = window.fetch.bind(window);
  let resolveAuth;
  let authenticated = false;
  window.TechNewsAuthReady = new Promise(resolve => { resolveAuth = resolve; });

  const css = `
    .tech-news-auth{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:28px;background:radial-gradient(circle at 18% 15%,rgba(255,255,255,.07),transparent 28%),radial-gradient(circle at 85% 85%,rgba(120,140,255,.08),transparent 30%),#07090d;font-family:inherit;overflow:auto}
    .tech-news-auth::before{content:"";position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);background-size:36px 36px;mask-image:linear-gradient(to bottom,rgba(0,0,0,.8),transparent)}
    .tech-news-auth-box{position:relative;width:min(900px,100%);min-height:540px;display:grid;grid-template-columns:1.02fr .98fr;overflow:hidden;border:1px solid rgba(255,255,255,.12);background:rgba(15,18,24,.96);box-shadow:0 35px 100px rgba(0,0,0,.6);border-radius:18px}
    .tech-news-auth-brand-panel{position:relative;padding:48px;display:flex;flex-direction:column;justify-content:space-between;border-right:1px solid rgba(255,255,255,.08);background:linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.012))}
    .tech-news-auth-mark{display:flex;align-items:center;gap:11px;font-size:12px;letter-spacing:.2em;font-weight:800;color:#fff}.tech-news-auth-mark i{width:9px;height:9px;border-radius:50%;background:#fff;box-shadow:0 0 18px rgba(255,255,255,.7)}
    .tech-news-auth-brand-panel h2{max-width:360px;margin:0;font-size:clamp(38px,5vw,64px);line-height:.94;letter-spacing:-.045em;font-weight:750;color:#fff}.tech-news-auth-brand-panel h2 span{color:#858d9d}
    .tech-news-auth-status{display:flex;align-items:center;gap:9px;color:#8f98a8;font-size:11px;letter-spacing:.14em;text-transform:uppercase}.tech-news-auth-status b{width:6px;height:6px;border-radius:50%;background:#72e6a0;box-shadow:0 0 12px rgba(114,230,160,.7)}
    .tech-news-auth-form-panel{padding:52px 50px;display:flex;align-items:center}.tech-news-auth-form{width:100%;max-width:370px;margin:auto}
    .tech-news-auth-eyebrow{margin-bottom:10px;color:#8f98a8;font-size:10px;font-weight:700;letter-spacing:.18em;text-transform:uppercase}.tech-news-auth-form h1{margin:0 0 9px;color:#fff;font-size:30px;line-height:1.1;letter-spacing:-.025em}.tech-news-auth-form .sub{margin:0 0 28px;color:#8f98a8;font-size:13px;line-height:1.55}
    .tech-news-auth-field{margin-top:17px}.tech-news-auth-field label{display:block;margin:0 0 8px;color:#a8afbc;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.tech-news-auth-box input{display:block;width:100%;height:48px;box-sizing:border-box;padding:0 14px;border:1px solid #29303b;border-radius:9px;background:#0a0d12;color:#fff;font:inherit;font-size:14px;outline:none;transition:border-color .18s,box-shadow .18s,background .18s}.tech-news-auth-box input::placeholder{color:#555e6d}.tech-news-auth-box input:focus{border-color:#7d8798;background:#0c1016;box-shadow:0 0 0 3px rgba(255,255,255,.055)}
    .tech-news-auth-submit{width:100%;height:49px;margin-top:24px;border:0;border-radius:9px;background:#f5f6f8;color:#080a0e;font-size:12px;font-weight:850;letter-spacing:.1em;cursor:pointer;transition:transform .15s,background .15s}.tech-news-auth-submit:hover{background:#fff;transform:translateY(-1px)}.tech-news-auth-submit:active{transform:translateY(0)}
    .tech-news-auth-error{min-height:18px;margin-top:10px;color:#ff9e9e;font-size:12px;line-height:1.45}.tech-news-auth-switch{margin-top:22px;text-align:center;color:#737d8d;font-size:12px}.tech-news-auth-switch button{padding:0;border:0;background:none;color:#fff;font:inherit;font-weight:700;text-decoration:underline;text-underline-offset:3px;cursor:pointer}.tech-news-auth-loading{opacity:.65;pointer-events:none}
    @media(max-width:720px){.tech-news-auth{padding:14px}.tech-news-auth-box{display:block;min-height:0;max-width:460px;border-radius:14px}.tech-news-auth-brand-panel{min-height:175px;padding:27px 25px;border-right:0;border-bottom:1px solid rgba(255,255,255,.08)}.tech-news-auth-brand-panel h2{font-size:34px;max-width:280px}.tech-news-auth-status{display:none}.tech-news-auth-form-panel{padding:30px 25px 32px}.tech-news-auth-form h1{font-size:27px}}
    @media(max-width:390px){.tech-news-auth-brand-panel{min-height:155px}.tech-news-auth-brand-panel h2{font-size:30px}.tech-news-auth-form-panel{padding:26px 20px 28px}}
  `;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  function csrf() { const m = document.cookie.match(/(?:^|; )jarvis_csrf=([^;]+)/); return m ? decodeURIComponent(m[1]) : ''; }

  function showAuth(mode = 'login', message = '') {
    let root = document.getElementById('techNewsAuth');
    if (!root) { root = document.createElement('div'); root.id = 'techNewsAuth'; document.body.appendChild(root); }
    const signup = mode === 'signup';
    root.innerHTML = `<div class="tech-news-auth"><div class="tech-news-auth-box">
      <section class="tech-news-auth-brand-panel">
        <div class="tech-news-auth-mark"><i></i> THE TECH EXPRESS</div>
        <h2>The Tech<br><span>Express.</span></h2>
        <div class="tech-news-auth-status"><b></b> News system online</div>
      </section>
      <section class="tech-news-auth-form-panel">
        <form class="tech-news-auth-form" id="techNewsAuthForm">
          <div class="tech-news-auth-eyebrow">Secure access</div>
          <h1>${signup ? 'Create your account' : 'Welcome back'}</h1>
          <p class="sub">${signup ? 'Set up your private access to The Tech Express news feed.' : 'Sign in to continue to The Tech Express news feed.'}</p>
          ${signup ? '<div class="tech-news-auth-field"><label for="techNewsUsername">Username</label><input id="techNewsUsername" name="username" autocomplete="username" minlength="3" maxlength="64" placeholder="your username" required></div>' : ''}
          <div class="tech-news-auth-field"><label for="techNewsIdentifier">${signup ? 'Email address' : 'Username or email'}</label><input id="techNewsIdentifier" name="identifier" type="${signup ? 'email' : 'text'}" autocomplete="${signup ? 'email' : 'username'}" maxlength="254" placeholder="${signup ? 'you@example.com' : 'Enter your username or email'}" required></div>
          <div class="tech-news-auth-field"><label for="techNewsPassword">Password</label><input id="techNewsPassword" name="password" type="password" autocomplete="${signup ? 'new-password' : 'current-password'}" minlength="8" maxlength="128" placeholder="Enter your password" required></div>
          <div class="tech-news-auth-error" role="alert">${escapeHtml(message)}</div>
          <button class="tech-news-auth-submit" type="submit">${signup ? 'CREATE ACCOUNT' : 'SIGN IN'}</button>
          <div class="tech-news-auth-switch">${signup ? 'Already have an account?' : 'New to The Tech Express?'} <button type="button" data-auth-switch>${signup ? 'Sign in' : 'Create account'}</button></div>
        </form>
      </section>
    </div></div>`;
    root.querySelector('[data-auth-switch]').onclick = () => showAuth(signup ? 'login' : 'signup');
    const first = root.querySelector('input'); if (first) setTimeout(() => first.focus(), 0);
    root.querySelector('form').onsubmit = async e => {
      e.preventDefault(); const form = new FormData(e.currentTarget); const payload = signup ? {username:String(form.get('username')),email:String(form.get('identifier')),password:String(form.get('password'))} : {identifier:String(form.get('identifier')),password:String(form.get('password'))};
      root.classList.add('tech-news-auth-loading');
      try {
        const r = await originalFetch(signup ? '/auth/register' : '/auth/login', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),credentials:'same-origin'});
        const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.detail || 'Authentication failed');
        authenticated = true; root.remove(); resolveAuth(true);
      } catch (err) { root.classList.remove('tech-news-auth-loading'); showAuth(mode, err.message); }
    };
  }

  function escapeHtml(v){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    const path = new URL(url, location.origin).pathname;
    if (!path.startsWith('/auth/')) await window.TechNewsAuthReady;
    const options = {...init, credentials:'same-origin', headers:new Headers(init.headers || (input instanceof Request ? input.headers : undefined))};
    if (!['GET','HEAD','OPTIONS'].includes((options.method || (input instanceof Request ? input.method : 'GET')).toUpperCase()) && path.startsWith('/')) {
      const token = csrf(); if (token) options.headers.set('X-CSRF-Token', token);
    }
    const response = await originalFetch(input, options);
    if (response.status === 401 && !path.startsWith('/auth/')) { authenticated = false; showAuth('login', 'Your session expired. Please sign in again.'); await new Promise(() => {}); }
    return response;
  };

  (async () => {
    try {
      const r = await originalFetch('/auth/me', {credentials:'same-origin'});
      if (r.ok) { authenticated = true; resolveAuth(true); return; }
    } catch {}
    showAuth('login');
  })();
})();
