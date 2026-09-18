(() => {
  const originalFetch = window.fetch.bind(window);
  let resolveAuth;
  let authenticated = false;
  window.JarvisAuthReady = new Promise(resolve => { resolveAuth = resolve; });

  const css = `.jarvis-auth{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;background:#090b10;padding:24px;font-family:inherit}.jarvis-auth-box{width:min(430px,100%);border:1px solid rgba(255,255,255,.12);background:#10141c;padding:34px;box-shadow:0 24px 80px rgba(0,0,0,.45)}.jarvis-auth-brand{font-size:12px;letter-spacing:.18em;color:#9ca3af;margin-bottom:28px}.jarvis-auth-box h1{margin:0 0 8px;font-size:34px}.jarvis-auth-box p{color:#9ca3af;margin:0 0 24px;line-height:1.5}.jarvis-auth-box label{display:block;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#9ca3af;margin:15px 0 7px}.jarvis-auth-box input{width:100%;box-sizing:border-box;padding:13px 14px;border:1px solid #2b3442;background:#0b0f15;color:#fff;font:inherit;outline:none}.jarvis-auth-box input:focus{border-color:#8b95a7}.jarvis-auth-submit{width:100%;margin-top:20px;padding:13px;border:0;background:#fff;color:#090b10;font-weight:700;cursor:pointer}.jarvis-auth-switch{margin-top:18px;text-align:center;color:#9ca3af;font-size:13px}.jarvis-auth-switch button{background:none;border:0;color:#fff;text-decoration:underline;cursor:pointer}.jarvis-auth-error{min-height:20px;margin-top:12px;color:#fca5a5;font-size:13px}.jarvis-auth-loading{opacity:.65;pointer-events:none}`;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  function csrf() { const m = document.cookie.match(/(?:^|; )jarvis_csrf=([^;]+)/); return m ? decodeURIComponent(m[1]) : ''; }
  function showAuth(mode = 'login', message = '') {
    let root = document.getElementById('jarvisAuth');
    if (!root) { root = document.createElement('div'); root.id = 'jarvisAuth'; document.body.appendChild(root); }
    const signup = mode === 'signup';
    root.innerHTML = `<div class="jarvis-auth"><form class="jarvis-auth-box" id="jarvisAuthForm"><div class="jarvis-auth-brand">JARVIS / TECHNOLOGY INTELLIGENCE</div><h1>${signup ? 'Create account' : 'Welcome back'}</h1><p>${signup ? 'Create your private JARVIS account to access the intelligence feed.' : 'Sign in to continue to JARVIS.'}</p>${signup ? '<label>Username</label><input name="username" autocomplete="username" minlength="3" maxlength="64" required>' : ''}<label>${signup ? 'Email' : 'Username or email'}</label><input name="identifier" type="${signup ? 'email' : 'text'}" autocomplete="${signup ? 'email' : 'username'}" maxlength="254" required><label>Password</label><input name="password" type="password" autocomplete="${signup ? 'new-password' : 'current-password'}" minlength="8" maxlength="128" required><div class="jarvis-auth-error">${escapeHtml(message)}</div><button class="jarvis-auth-submit" type="submit">${signup ? 'CREATE ACCOUNT' : 'SIGN IN'}</button><div class="jarvis-auth-switch">${signup ? 'Already have an account?' : 'New to JARVIS?'} <button type="button" data-auth-switch>${signup ? 'Sign in' : 'Create account'}</button></div></form></div>`;
    root.querySelector('[data-auth-switch]').onclick = () => showAuth(signup ? 'login' : 'signup');
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
