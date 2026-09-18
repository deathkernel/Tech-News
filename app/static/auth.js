(() => {
  const originalFetch = window.fetch.bind(window);
  let resolveAuth;
  let authenticated = false;
  window.TechNewsAuthReady = new Promise(resolve => { resolveAuth = resolve; });

  const css = `
    .tech-news-auth{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:24px;background:radial-gradient(circle at 72% 0%,rgba(101,126,255,.18),transparent 31rem),radial-gradient(circle at 8% 22%,rgba(202,255,53,.07),transparent 25rem),linear-gradient(180deg,#07090c 0%,#050608 55%,#080a0d 100%);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overflow:auto}
    .tech-news-auth:before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.13;background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px);background-size:72px 72px;mask-image:linear-gradient(to bottom,#000 0%,transparent 80%)}
    .tech-news-auth:after{content:"";position:absolute;inset:0;pointer-events:none;opacity:.025;background:repeating-linear-gradient(0deg,transparent 0,transparent 3px,#fff 4px)}
    .tech-news-auth-box{position:relative;width:min(940px,100%);min-height:560px;display:grid;grid-template-columns:1fr 1fr;overflow:hidden;border:1px solid rgba(255,255,255,.1);border-radius:24px;background:rgba(10,13,18,.96);box-shadow:0 38px 95px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.035);isolation:isolate}
    .tech-news-auth-box:before{content:"JARVIS / ACCESS";position:absolute;right:-48px;top:44%;z-index:0;color:rgba(255,255,255,.025);font-size:42px;font-weight:950;letter-spacing:.08em;transform:rotate(90deg);pointer-events:none}
    .tech-news-auth-brand-panel{position:relative;z-index:1;padding:46px;display:flex;flex-direction:column;justify-content:space-between;border-right:1px solid rgba(255,255,255,.08);background:linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.012))}
    .tech-news-auth-brand-panel:before{content:"";position:absolute;right:16%;bottom:-42px;width:250px;height:250px;border:1px solid rgba(202,255,53,.08);border-radius:50%;box-shadow:0 0 0 55px rgba(202,255,53,.014),0 0 0 110px rgba(202,255,53,.008);pointer-events:none}
    .tech-news-auth-mark{display:flex;align-items:center;gap:10px;color:#f5f7fb;font-size:10px;font-weight:950;letter-spacing:.19em}.tech-news-auth-mark i{position:relative;width:36px;height:36px;display:grid;place-items:center;border:1px solid rgba(202,255,53,.48);border-radius:50%;box-shadow:0 0 28px rgba(202,255,53,.12),inset 0 0 16px rgba(202,255,53,.05)}.tech-news-auth-mark i:before,.tech-news-auth-mark i:after{content:"";position:absolute;width:47px;height:13px;border:1px solid rgba(202,255,53,.23);border-radius:50%}.tech-news-auth-mark i:before{transform:rotate(32deg)}.tech-news-auth-mark i:after{transform:rotate(-32deg)}.tech-news-auth-mark i{background:radial-gradient(circle at center,#caff35 0 3px,transparent 4px)}
    .tech-news-auth-brand-panel h2{position:relative;z-index:1;max-width:390px;margin:0;font-size:clamp(50px,6vw,78px);line-height:.82;letter-spacing:-.085em;color:#f5f7fb;font-weight:950}.tech-news-auth-brand-panel h2 em{color:#caff35;font-family:Georgia,"Times New Roman",serif;font-weight:400;font-style:italic;letter-spacing:-.07em}.tech-news-auth-brand-panel .brand-sub{position:relative;z-index:1;margin-top:-72px;color:#656c77;font-size:7px;font-weight:850;letter-spacing:.22em}.tech-news-auth-status{position:relative;z-index:1;display:flex;align-items:center;gap:7px;color:#8d95a1;font-size:8px;font-weight:900;letter-spacing:.15em;text-transform:uppercase}.tech-news-auth-status b{width:6px;height:6px;border-radius:50%;background:#caff35;box-shadow:0 0 12px #caff35}
    .tech-news-auth-form-panel{position:relative;z-index:1;padding:52px 50px;display:flex;align-items:center;background:rgba(5,6,8,.22)}.tech-news-auth-form{width:100%;max-width:370px;margin:auto}.tech-news-auth-eyebrow{display:flex;align-items:center;gap:10px;margin-bottom:18px;color:#caff35;font-size:9px;font-weight:950;letter-spacing:.2em}.tech-news-auth-eyebrow:after{content:"";width:55px;height:1px;background:linear-gradient(90deg,#caff35,transparent)}.tech-news-auth-form h1{margin:0 0 9px;color:#f5f7fb;font-size:32px;line-height:1.05;letter-spacing:-.045em}.tech-news-auth-form .sub{margin:0 0 27px;color:#858d99;font-size:11px;line-height:1.75}
    .tech-news-auth-field{margin-top:17px}.tech-news-auth-field label{display:block;margin:0 0 8px;color:#7d8490;font-size:8px;font-weight:950;letter-spacing:.15em;text-transform:uppercase}.tech-news-auth-box input{display:block;width:100%;height:48px;box-sizing:border-box;padding:0 13px;border:1px solid rgba(255,255,255,.075);border-radius:12px;background:rgba(0,0,0,.24);color:#e7ebf0;font:inherit;font-size:11px;outline:none;transition:border-color .2s,box-shadow .2s,background .2s}.tech-news-auth-box input::placeholder{color:#59616c}.tech-news-auth-box input:focus{border-color:rgba(202,255,53,.36);background:rgba(0,0,0,.3);box-shadow:0 0 0 3px rgba(202,255,53,.045)}
    .tech-news-auth-submit{width:100%;height:49px;margin-top:24px;border:1px solid rgba(202,255,53,.32);border-radius:12px;background:#caff35;color:#090b0e;font-size:9px;font-weight:950;letter-spacing:.15em;cursor:pointer;box-shadow:0 12px 35px rgba(202,255,53,.08);transition:transform .2s ease,background .2s ease,box-shadow .2s ease}.tech-news-auth-submit:hover{background:#d5ff59;transform:translateY(-2px);box-shadow:0 16px 42px rgba(202,255,53,.14)}.tech-news-auth-submit:active{transform:translateY(0)}
    .tech-news-auth-error{min-height:18px;margin-top:10px;color:#ff8f8f;font-size:10px;line-height:1.45}.tech-news-auth-switch{margin-top:22px;text-align:center;color:#69717c;font-size:10px}.tech-news-auth-switch button{padding:0;border:0;background:none;color:#f5f7fb;font:inherit;font-weight:900;text-decoration:underline;text-decoration-color:rgba(202,255,53,.65);text-underline-offset:3px;cursor:pointer}.tech-news-auth-loading{opacity:.65;pointer-events:none}
    @media(max-width:760px){.tech-news-auth{padding:14px}.tech-news-auth-box{display:block;min-height:0;max-width:500px;border-radius:18px}.tech-news-auth-brand-panel{min-height:205px;padding:28px 25px;border-right:0;border-bottom:1px solid rgba(255,255,255,.08)}.tech-news-auth-brand-panel h2{font-size:42px}.tech-news-auth-brand-panel .brand-sub{margin-top:-42px}.tech-news-auth-status{display:none}.tech-news-auth-form-panel{padding:30px 25px 32px}.tech-news-auth-form h1{font-size:28px}}
    @media(max-width:390px){.tech-news-auth-brand-panel{min-height:185px}.tech-news-auth-brand-panel h2{font-size:36px}.tech-news-auth-form-panel{padding:26px 20px 28px}}
  `;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  function csrf() { const m = document.cookie.match(/(?:^|; )jarvis_csrf=([^;]+)/); return m ? decodeURIComponent(m[1]) : ''; }

  function showAuth(mode = 'login', message = '') {
    let root = document.getElementById('techNewsAuth');
    if (!root) { root = document.createElement('div'); root.id = 'techNewsAuth'; document.body.appendChild(root); }
    const signup = mode === 'signup';
    root.innerHTML = `<div class="tech-news-auth"><div class="tech-news-auth-box">
      <section class="tech-news-auth-brand-panel">
        <div class="tech-news-auth-mark"><i></i><span>THE TECH EXPRESS</span></div>
        <div><h2>The Tech<br><em>Express.</em></h2><div class="brand-sub">TECHNOLOGY / INTELLIGENCE / SIGNAL</div></div>
        <div class="tech-news-auth-status"><b></b> News system online</div>
      </section>
      <section class="tech-news-auth-form-panel">
        <form class="tech-news-auth-form" id="techNewsAuthForm">
          <div class="tech-news-auth-eyebrow">SECURE ACCESS</div>
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

  function escapeHtml(v){return String(v).replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));}

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
