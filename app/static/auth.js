(() => {
  const originalFetch = window.fetch.bind(window);
  let resolveAuth;
  let authenticated = false;
  window.JarvisAuthReady = new Promise(resolve => { resolveAuth = resolve; });

  const css = `
    .jarvis-auth{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:28px;background:radial-gradient(circle at 18% 15%,rgba(255,255,255,.07),transparent 28%),radial-gradient(circle at 85% 85%,rgba(120,140,255,.08),transparent 30%),#07090d;font-family:inherit;overflow:auto}
    .jarvis-auth::before{content:"";position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);background-size:36px 36px;mask-image:linear-gradient(to bottom,rgba(0,0,0,.8),transparent)}
    .jarvis-auth-box{position:relative;width:min(900px,100%);min-height:540px;display:grid;grid-template-columns:1.02fr .98fr;overflow:hidden;border:1px solid rgba(255,255,255,.12);background:rgba(15,18,24,.96);box-shadow:0 35px 100px rgba(0,0,0,.6);border-radius:18px}
    .jarvis-auth-brand-panel{position:relative;padding:48px;display:flex;flex-direction:column;justify-content:space-between;border-right:1px solid rgba(255,255,255,.08);background:linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.012))}
    .jarvis-auth-mark{display:flex;align-items:center;gap:11px;font-size:12px;letter-spacing:.2em;font-weight:800;color:#fff}.jarvis-auth-mark i{width:9px;height:9px;border-radius:50%;background:#fff;box-shadow:0 0 18px rgba(255,255,255,.7)}
    .jarvis-auth-brand-panel h2{max-width:360px;margin:0;font-size:clamp(38px,5vw,64px);line-height:.94;letter-spacing:-.045em;font-weight:750;color:#fff}.jarvis-auth-brand-panel h2 span{color:#858d9d}
    .jarvis-auth-status{display:flex;align-items:center;gap:9px;color:#8f98a8;font-size:11px;letter-spacing:.14em;text-transform:uppercase}.jarvis-auth-status b{width:6px;height:6px;border-radius:50%;background:#72e6a0;box-shadow:0 0 12px rgba(114,230,160,.7)}
    .jarvis-auth-form-panel{padding:52px 50px;display:flex;align-items:center}.jarvis-auth-form{width:100%;max-width:370px;margin:auto}
    .jarvis-auth-eyebrow{margin-bottom:10px;color:#8f98a8;font-size:10px;font-weight:700;letter-spacing:.18em;text-transform:uppercase}.jarvis-auth-form h1{margin:0 0 9px;color:#fff;font-size:30px;line-height:1.1;letter-spacing:-.025em}.jarvis-auth-form .sub{margin:0 0 28px;color:#8f98a8;font-size:13px;line-height:1.55}
    .jarvis-auth-field{margin-top:17px}.jarvis-auth-field label{display:block;margin:0 0 8px;color:#a8afbc;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.jarvis-auth-box input{display:block;width:100%;height:48px;box-sizing:border-box;padding:0 14px;border:1px solid #29303b;border-radius:9px;background:#0a0d12;color:#fff;font:inherit;font-size:14px;outline:none;transition:border-color .18s,box-shadow .18s,background .18s}.jarvis-auth-box input::placeholder{color:#555e6d}.jarvis-auth-box input:focus{border-color:#7d8798;background:#0c1016;box-shadow:0 0 0 3px rgba(255,255,255,.055)}
    .jarvis-auth-submit{width:100%;height:49px;margin-top:24px;border:0;border-radius:9px;background:#f5f6f8;color:#080a0e;font-size:12px;font-weight:850;letter-spacing:.1em;cursor:pointer;transition:transform .15s,background .15s}.jarvis-auth-submit:hover{background:#fff;transform:translateY(-1px)}.jarvis-auth-submit:active{transform:translateY(0)}
    .jarvis-auth-error{min-height:18px;margin-top:10px;color:#ff9e9e;font-size:12px;line-height:1.45}.jarvis-auth-switch{margin-top:22px;text-align:center;color:#737d8d;font-size:12px}.jarvis-auth-switch button{padding:0;border:0;background:none;color:#fff;font:inherit;font-weight:700;text-decoration:underline;text-underline-offset:3px;cursor:pointer}.jarvis-auth-loading{opacity:.65;pointer-events:none}
    @media(max-width:720px){.jarvis-auth{padding:14px}.jarvis-auth-box{display:block;min-height:0;max-width:460px;border-radius:14px}.jarvis-auth-brand-panel{min-height:175px;padding:27px 25px;border-right:0;border-bottom:1px solid rgba(255,255,255,.08)}.jarvis-auth-brand-panel h2{font-size:34px;max-width:280px}.jarvis-auth-status{display:none}.jarvis-auth-form-panel{padding:30px 25px 32px}.jarvis-auth-form h1{font-size:27px}}
    @media(max-width:390px){.jarvis-auth-brand-panel{min-height:155px}.jarvis-auth-brand-panel h2{font-size:30px}.jarvis-auth-form-panel{padding:26px 20px 28px}}
  `;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  function csrf() { const m = document.cookie.match(/(?:^|; )jarvis_csrf=([^;]+)/); return m ? decodeURIComponent(m[1]) : ''; }

  function showAuth(mode = 'login', message = '') {
    let root = document.getElementById('jarvisAuth');
    if (!root) { root = document.createElement('div'); root.id = 'jarvisAuth'; document.body.appendChild(root); }
    const signup = mode === 'signup';
    root.innerHTML = `<div class="jarvis-auth"><div class="jarvis-auth-box">
      <section class="jarvis-auth-brand-panel">
        <div class="jarvis-auth-mark"><i></i> JARVIS</div>
        <h2>Technology.<br><span>Intelligence.</span></h2>
        <div class="jarvis-auth-status"><b></b> Intelligence system online</div>
      </section>
      <section class="jarvis-auth-form-panel">
        <form class="jarvis-auth-form" id="jarvisAuthForm">
          <div class="jarvis-auth-eyebrow">Secure access</div>
          <h1>${signup ? 'Create your account' : 'Welcome back'}</h1>
          <p class="sub">${signup ? 'Set up your private access to the JARVIS technology intelligence feed.' : 'Sign in to continue to your technology intelligence feed.'}</p>
          ${signup ? '<div class="jarvis-auth-field"><label for="jarvisUsername">Username</label><input id="jarvisUsername" name="username" autocomplete="username" minlength="3" maxlength="64" placeholder="your username" required></div>' : ''}
          <div class="jarvis-auth-field"><label for="jarvisIdentifier">${signup ? 'Email address' : 'Username or email'}</label><input id="jarvisIdentifier" name="identifier" type="${signup ? 'email' : 'text'}" autocomplete="${signup ? 'email' : 'username'}" maxlength="254" placeholder="${signup ? 'you@example.com' : 'Enter your username or email'}" required></div>
          <div class="jarvis-auth-field"><label for="jarvisPassword">Password</label><input id="jarvisPassword" name="password" type="password" autocomplete="${signup ? 'new-password' : 'current-password'}" minlength="8" maxlength="128" placeholder="Enter your password" required></div>
          <div class="jarvis-auth-error" role="alert">${escapeHtml(message)}</div>
          <button class="jarvis-auth-submit" type="submit">${signup ? 'CREATE ACCOUNT' : 'SIGN IN'}</button>
          <div class="jarvis-auth-switch">${signup ? 'Already have an account?' : 'New to JARVIS?'} <button type="button" data-auth-switch>${signup ? 'Sign in' : 'Create account'}</button></div>
        </form>
      </section>
    </div></div>`;
    root.querySelector('[data-auth-switch]').onclick = () => showAuth(signup ? 'login' : 'signup');
    const first = root.querySelector('input'); if (first) setTimeout(() => first.focus(), 0);
    root.querySelector('form').onsubmit = async e => {
      e.preventDefault(); const form = new FormData(e.currentTarget); const payload = signup ? {username:String(form.get('username')),email:String(form.get('identifier')),password:String(form.get('password'))} : {identifier:String(form.get('identifier')),password:String(form.get('password'))};
      root.classList.add('jarvis-auth-loading');
      try {
        const r = await originalFetch(signup ? '/auth/register' : '/auth/login', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),credentials:'same-origin'});
        const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.detail || 'Authentication failed');
        authenticated = true; root.remove(); resolveAuth(true);
      } catch (err) { root.classList.remove('jarvis-auth-loading'); showAuth(mode, err.message); }
    };
  }

  function escapeHtml(v){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    const path = new URL(url, location.origin).pathname;
    if (!path.startsWith('/auth/')) await window.JarvisAuthReady;
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
