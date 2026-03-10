const BASE_URL  = (typeof import_meta_env !== 'undefined' && import_meta_env.VITE_API_URL)
  || window.ORYCTO_API_URL
  || 'http://localhost:3001/api';
const AUTH_URL = BASE_URL + '/auth';

// ── Session (localStorage + cookie backend) ───────────────────────────────────
export async function getSession() {
  const token = localStorage.getItem('orycto_token');
  if (!token) return null;
  try {
    const res = await fetch(`${AUTH_URL}/me`, {
      credentials: 'include',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) { localStorage.removeItem('orycto_token'); return null; }
    const { user } = await res.json();
    return user;
  } catch { return null; }
}

export function clearSession() {
  localStorage.removeItem('orycto_token');
  fetch(`${AUTH_URL}/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
}

// ── Login ─────────────────────────────────────────────────────────────────────
export async function login(email, password) {
  const res = await fetch(`${AUTH_URL}/login`, {
    method:      'POST',
    credentials: 'include',
    headers:     { 'Content-Type': 'application/json' },
    body:        JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  if (data.token) localStorage.setItem('orycto_token', data.token);
  return data.user;
}

// ── Register ──────────────────────────────────────────────────────────────────
export async function register(email, password, firstName, lastName, role, termsAccepted = true) {
  const res = await fetch(`${AUTH_URL}/register`, {
    method:      'POST',
    credentials: 'include',
    headers:     { 'Content-Type': 'application/json' },
    body:        JSON.stringify({
      email, password, firstName, lastName,
      termsAccepted, privacyAccepted: termsAccepted,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  // status=pending → pas de token, l'user doit attendre l'approbation
  if (data.status === 'pending') {
    const err = new Error(data.message || 'Compte en attente d\'approbation.');
    err.pending = true;
    throw err;
  }
  if (data.token) localStorage.setItem('orycto_token', data.token);
  return data.user;
}

export function showAuthPage(onSuccess) {
  document.body.innerHTML = '';

  const style = document.createElement('style');
  style.textContent = `
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{min-height:100vh;font-family:'Poppins',sans-serif;background:#0d1510;color:#E0E6E4;overflow:auto}
    .auth-bg{position:fixed;inset:0;z-index:0;overflow:hidden}
    .auth-bg::before{content:'';position:absolute;inset:0;background-image:radial-gradient(circle,#1e2e28 1px,transparent 1px);background-size:32px 32px;opacity:.6}
    .blob{position:absolute;border-radius:50%;filter:blur(80px);opacity:.18;animation:drift linear infinite}
    .blob-1{width:600px;height:600px;background:radial-gradient(circle,#2A6353,transparent 70%);top:-200px;left:-150px;animation-duration:22s}
    .blob-2{width:500px;height:500px;background:radial-gradient(circle,#D4B475,transparent 70%);bottom:-150px;right:-100px;animation-duration:28s;animation-direction:reverse}
    .blob-3{width:300px;height:300px;background:radial-gradient(circle,#3a8a72,transparent 70%);top:40%;right:30%;animation-duration:18s}
    @keyframes drift{0%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-20px) scale(1.05)}66%{transform:translate(-20px,30px) scale(.97)}100%{transform:translate(0,0) scale(1)}}
    .auth-wrap{position:relative;z-index:1;display:grid;grid-template-columns:1fr 1fr;min-height:100vh}
    .left-panel{display:flex;flex-direction:column;justify-content:center;padding:60px 56px;border-right:1px solid #1e2e28}
    .brand{display:flex;align-items:center;gap:14px;margin-bottom:48px}
    .brand-logo{width:48px;border-radius:12px}
    .brand-name{font-family:'Syne',sans-serif;font-size:26px;font-weight:800;color:#E0E6E4;letter-spacing:2px}
    .brand-name span{color:#4ade80}
    .hero-tag{display:inline-block;background:rgba(42,99,83,.25);border:1px solid rgba(42,99,83,.5);color:#4ade80;font-size:11px;font-weight:600;padding:4px 12px;border-radius:20px;margin-bottom:20px;letter-spacing:.8px;text-transform:uppercase}
    .hero-title{font-family:'Syne',sans-serif;font-size:42px;font-weight:800;line-height:1.1;margin-bottom:18px}
    .hero-title .hl{color:#4ade80}
    .hero-desc{font-size:14px;color:#A0A8A5;line-height:1.8;max-width:380px;margin-bottom:32px}
    .hero-stats{display:flex;align-items:center;gap:24px;margin-bottom:32px}
    .h-stat{display:flex;flex-direction:column;gap:3px}
    .h-stat-value{font-family:'Syne',sans-serif;font-size:28px;font-weight:800;color:#E0E6E4}
    .h-stat-label{font-size:11px;color:#A0A8A5}
    .h-stat-sep{width:1px;height:40px;background:#2A6353}
    .features{display:flex;flex-wrap:wrap;gap:8px}
    .feat-pill{background:rgba(42,99,83,.15);border:1px solid rgba(42,99,83,.3);color:#A0A8A5;font-size:11px;padding:5px 12px;border-radius:20px}
    .left-footer{margin-top:auto;padding-top:40px;font-size:11px;color:#2A6353}
    .left-footer a{color:#2A6353;text-decoration:none}
    .right-panel{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 48px;background:rgba(13,21,16,.5);border-left:1px solid #1e2e28}
    .auth-card{width:100%;max-width:420px}
    .auth-tabs{display:flex;background:#121B18;border-radius:10px;padding:3px;margin-bottom:28px}
    .auth-tab{flex:1;padding:9px 0;background:transparent;border:none;color:#A0A8A5;font-family:'Poppins',sans-serif;font-size:13px;font-weight:500;cursor:pointer;border-radius:8px;transition:all .2s}
    .auth-tab.active{background:#1C2A25;color:#E0E6E4;box-shadow:0 2px 8px rgba(0,0,0,.3)}
    .form-head{margin-bottom:24px}
    .form-title{font-family:'Syne',sans-serif;font-size:22px;font-weight:700;color:#E0E6E4;margin-bottom:6px}
    .form-subtitle{font-size:12px;color:#A0A8A5}
    .form-group{display:flex;flex-direction:column;gap:6px;margin-bottom:14px}
    .form-group label{font-size:11px;font-weight:500;color:#A0A8A5;letter-spacing:.3px}
    .form-group label .req{color:#D4B475}
    .name-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .input-wrap{position:relative}
    .input-icon{position:absolute;left:13px;top:50%;transform:translateY(-50%);font-size:14px;pointer-events:none}
    .input-wrap input{width:100%;height:44px;background:#121B18;border:1px solid #2A6353;border-radius:10px;padding:0 44px 0 40px;color:#E0E6E4;font-family:'Poppins',sans-serif;font-size:13px;outline:none;transition:all .2s}
    .input-wrap input::placeholder{color:#5a7265}
    .input-wrap input:focus{border-color:#D4B475;box-shadow:0 0 0 3px rgba(212,180,117,.08)}
    .input-wrap input.error{border-color:#E74C3C;box-shadow:0 0 0 3px rgba(231,76,60,.08)}
    .input-wrap input.valid{border-color:#3a8a72}
    .toggle-pass{position:absolute;right:13px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#A0A8A5;font-size:14px;padding:0;transition:color .2s}
    .toggle-pass:hover{color:#E0E6E4}
    .field-error{font-size:11px;color:#E74C3C;display:none}
    .field-error.show{display:block}
    .pass-strength{display:none;margin-top:6px}
    .pass-strength.show{display:block}
    .strength-bar{display:flex;gap:4px;margin-bottom:4px}
    .strength-seg{flex:1;height:3px;background:#1e2e28;border-radius:2px;transition:background .3s}
    .strength-label{font-size:10px;color:#A0A8A5}
    .terms-wrap{display:flex;align-items:flex-start;gap:10px;margin-bottom:16px;font-size:12px;color:#A0A8A5}
    .terms-wrap input{margin-top:2px;accent-color:#3a8a72}
    .terms-wrap a{color:#4ade80;text-decoration:none}
    .btn-submit{width:100%;height:46px;background:linear-gradient(135deg,#2A6353,#3a8a72);border:none;border-radius:10px;color:#fff;font-family:'Poppins',sans-serif;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;transition:all .2s;margin-top:4px;position:relative;overflow:hidden}
    .btn-submit:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(42,99,83,.35)}
    .btn-submit.loading .btn-text{opacity:0}
    .btn-submit.loading .spinner{display:block}
    .spinner{display:none;width:18px;height:18px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;position:absolute}
    @keyframes spin{to{transform:rotate(360deg)}}
    .error-box{background:rgba(231,76,60,.1);border:1px solid rgba(231,76,60,.3);color:#f08080;font-size:12px;padding:10px 14px;border-radius:8px;margin-bottom:14px;display:none}
    .error-box.show{display:block}
    .success-overlay{display:none;flex-direction:column;align-items:center;text-align:center;gap:16px;padding:20px 0}
    .success-overlay.show{display:flex}
    .success-icon{width:64px;height:64px;border-radius:50%;background:rgba(42,99,83,.2);border:2px solid #3a8a72;display:flex;align-items:center;justify-content:center;font-size:28px;animation:popIn .4s cubic-bezier(.175,.885,.32,1.275)}
    @keyframes popIn{from{transform:scale(.5);opacity:0}to{transform:scale(1);opacity:1}}
    .success-title{font-family:'Syne',sans-serif;font-size:20px;font-weight:700}
    .success-desc{font-size:13px;color:#A0A8A5;line-height:1.6}
    @media(max-width:900px){.auth-wrap{grid-template-columns:1fr}.left-panel{display:none}.right-panel{padding:32px 20px;min-height:100vh}}
  `;
  document.head.appendChild(style);

  document.body.innerHTML = `
    <div class="auth-bg">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
    </div>
    <div class="auth-wrap">
      <div class="left-panel">
        <div class="brand">
          <img src="./assets/img/orycto.png" alt="Orycto" class="brand-logo" onerror="this.style.display='none'">
          <span class="brand-name">ORY<span>CTO</span></span>
        </div>
        <div>
          <div class="hero-tag">Rabbit Farm Management</div>
          <h1 class="hero-title">Your herd,<br><span class="hl">perfectly</span><br>managed.</h1>
          <p class="hero-desc">Track every rabbit, monitor health, manage breeding cycles, and optimise your farm's performance — all in one place.</p>
          <div class="hero-stats">
            <div class="h-stat"><span class="h-stat-value">38</span><span class="h-stat-label">Active rabbits</span></div>
            <div class="h-stat-sep"></div>
            <div class="h-stat"><span class="h-stat-value">85%</span><span class="h-stat-label">Birth rate</span></div>
            <div class="h-stat-sep"></div>
            <div class="h-stat"><span class="h-stat-value">6.2</span><span class="h-stat-label">Avg. litter size</span></div>
          </div>
          <div class="features">
            <span class="feat-pill">🐇 Herd tracking</span>
            <span class="feat-pill">💞 Breeding cycles</span>
            <span class="feat-pill">🏥 Health records</span>
            <span class="feat-pill">🌾 Feed management</span>
            <span class="feat-pill">📊 Analytics</span>
            <span class="feat-pill">🚨 Smart alerts</span>
          </div>
        </div>
        <div class="left-footer">© 2025 Orycto &nbsp;·&nbsp; <a href="#">Privacy</a> &nbsp;·&nbsp; <a href="#">Terms</a></div>
      </div>

      <div class="right-panel">
        <div class="auth-card">
          <div class="auth-tabs">
            <button class="auth-tab active" id="tab-login">Sign In</button>
            <button class="auth-tab" id="tab-register">Create Account</button>
          </div>

          <div id="form-login">
            <div class="form-head">
              <div class="form-title">Welcome back 👋</div>
              <div class="form-subtitle">Sign in to your Orycto account</div>
            </div>
            <div class="error-box" id="login-error"></div>
            <div class="form-group">
              <label>Email address <span class="req">*</span></label>
              <div class="input-wrap">
                <span class="input-icon">✉️</span>
                <input type="email" id="login-email" placeholder="admin@orycto.mg" autocomplete="email">
              </div>
              <span class="field-error" id="err-login-email">Please enter a valid email.</span>
            </div>
            <div class="form-group">
              <label>Password <span class="req">*</span></label>
              <div class="input-wrap">
                <span class="input-icon">🔒</span>
                <input type="password" id="login-pass" placeholder="••••••••" autocomplete="current-password">
                <button class="toggle-pass" id="toggle-login-pass" type="button">👁</button>
              </div>
              <span class="field-error" id="err-login-pass">Password is required.</span>
            </div>
            <button class="btn-submit" id="btn-login">
              <div class="spinner"></div>
              <span class="btn-text">Sign In →</span>
            </button>
            <div class="success-overlay" id="success-login">
              <div class="success-icon">✓</div>
              <div class="success-title">Welcome back!</div>
              <div class="success-desc">Loading your dashboard…</div>
            </div>
          </div>

          <div id="form-register" style="display:none">
            <div class="form-head">
              <div class="form-title">Create account 🐇</div>
              <div class="form-subtitle">Start managing your farm today</div>
            </div>
            <div class="error-box" id="register-error"></div>
            <div class="name-row">
              <div class="form-group">
                <label>First name <span class="req">*</span></label>
                <div class="input-wrap">
                  <span class="input-icon">👤</span>
                  <input type="text" id="reg-first" placeholder="Jean">
                </div>
                <span class="field-error" id="err-reg-first">First name is required.</span>
              </div>
              <div class="form-group">
                <label>Last name</label>
                <div class="input-wrap">
                  <span class="input-icon">👤</span>
                  <input type="text" id="reg-last" placeholder="Dupont">
                </div>
              </div>
            </div>
            <div class="form-group">
              <label>Email address <span class="req">*</span></label>
              <div class="input-wrap">
                <span class="input-icon">✉️</span>
                <input type="email" id="reg-email" placeholder="you@example.com">
              </div>
              <span class="field-error" id="err-reg-email">Please enter a valid email.</span>
            </div>
            <div class="form-group">
              <label>Role</label>
              <div class="input-wrap">
                <span class="input-icon">🏷</span>
                <input type="text" id="reg-role" placeholder="Farm Owner, Veterinarian, Worker…" style="padding-left:40px">
              </div>
            </div>
            <div class="form-group">
              <label>Password <span class="req">*</span></label>
              <div class="input-wrap">
                <span class="input-icon">🔒</span>
                <input type="password" id="reg-pass" placeholder="Min. 8 characters">
                <button class="toggle-pass" id="toggle-reg-pass" type="button">👁</button>
              </div>
              <div class="pass-strength" id="pass-strength">
                <div class="strength-bar">
                  <div class="strength-seg" id="seg1"></div>
                  <div class="strength-seg" id="seg2"></div>
                  <div class="strength-seg" id="seg3"></div>
                  <div class="strength-seg" id="seg4"></div>
                </div>
                <span class="strength-label" id="strength-label">Strength: —</span>
              </div>
              <span class="field-error" id="err-reg-pass">Password must be at least 8 characters.</span>
            </div>
            <div class="form-group">
              <label>Confirm password <span class="req">*</span></label>
              <div class="input-wrap">
                <span class="input-icon">🔒</span>
                <input type="password" id="reg-confirm" placeholder="Repeat password">
                <button class="toggle-pass" id="toggle-reg-confirm" type="button">👁</button>
              </div>
              <span class="field-error" id="err-reg-confirm">Passwords do not match.</span>
            </div>
            <div class="terms-wrap">
              <input type="checkbox" id="accept-terms">
              <label for="accept-terms">I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></label>
            </div>
            <button class="btn-submit" id="btn-register">
              <div class="spinner"></div>
              <span class="btn-text">Create Account →</span>
            </button>
            <div class="success-overlay" id="success-register">
              <div class="success-icon">✓</div>
              <div class="success-title" id="reg-success-title">Account created!</div>
              <div class="success-desc" id="reg-success-desc">Welcome to Orycto. Loading your dashboard…</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  function switchTab(tab) {
    const isLogin = tab === 'login';
    document.getElementById('tab-login').classList.toggle('active', isLogin);
    document.getElementById('tab-register').classList.toggle('active', !isLogin);
    document.getElementById('form-login').style.display    = isLogin ? '' : 'none';
    document.getElementById('form-register').style.display = isLogin ? 'none' : '';
  }

  function togglePass(inputId, btn) {
    const inp = document.getElementById(inputId);
    inp.type = inp.type === 'password' ? 'text' : 'password';
    btn.textContent = inp.type === 'password' ? '👁' : '🙈';
  }

  function checkStrength(val) {
    const el = document.getElementById('pass-strength');
    el.classList.toggle('show', val.length > 0);
    if (!val) return;
    let score = 0;
    if (val.length >= 8)         score++;
    if (/[A-Z]/.test(val))       score++;
    if (/[0-9]/.test(val))       score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    const colors = ['#E74C3C','#E74C3C','#D4B475','#3a8a72','#4ade80'];
    const labels = ['','Weak','Fair','Good','Strong'];
    [1,2,3,4].forEach(i => {
      document.getElementById('seg'+i).style.background = i <= score ? colors[score] : '#1e2e28';
    });
    const lbl = document.getElementById('strength-label');
    lbl.textContent = 'Strength: ' + (labels[score] || '—');
    lbl.style.color = colors[score];
  }

  function showError(id, msg) {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.classList.add('show');
  }

  function hideError(id) {
    document.getElementById(id).classList.remove('show');
  }

  document.getElementById('tab-login').addEventListener('click', () => switchTab('login'));
  document.getElementById('tab-register').addEventListener('click', () => switchTab('register'));

  document.getElementById('toggle-login-pass').addEventListener('click', function() {
    togglePass('login-pass', this);
  });
  document.getElementById('toggle-reg-pass').addEventListener('click', function() {
    togglePass('reg-pass', this);
  });
  document.getElementById('toggle-reg-confirm').addEventListener('click', function() {
    togglePass('reg-confirm', this);
  });

  document.getElementById('reg-pass').addEventListener('input', e => checkStrength(e.target.value));

  document.getElementById('btn-login').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value.trim();
    const pass  = document.getElementById('login-pass').value;
    hideError('login-error');

    let valid = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      document.getElementById('err-login-email').classList.add('show');
      document.getElementById('login-email').classList.add('error');
      valid = false;
    } else {
      document.getElementById('err-login-email').classList.remove('show');
      document.getElementById('login-email').classList.remove('error');
    }
    if (!pass) {
      document.getElementById('err-login-pass').classList.add('show');
      document.getElementById('login-pass').classList.add('error');
      valid = false;
    } else {
      document.getElementById('err-login-pass').classList.remove('show');
      document.getElementById('login-pass').classList.remove('error');
    }
    if (!valid) return;

    const btn = document.getElementById('btn-login');
    btn.classList.add('loading');
    try {
      const user = await login(email, pass);
      btn.style.display = 'none';
      document.getElementById('form-login').querySelector('.form-head').style.display = 'none';
      document.getElementById('success-login').classList.add('show');
      setTimeout(() => onSuccess(user), 1400);
    } catch (err) {
      btn.classList.remove('loading');
      showError('login-error', err.message);
    }
  });

  document.getElementById('btn-register').addEventListener('click', async () => {
    const first   = document.getElementById('reg-first').value.trim();
    const last    = document.getElementById('reg-last').value.trim();
    const email   = document.getElementById('reg-email').value.trim();
    const role    = document.getElementById('reg-role').value.trim();
    const pass    = document.getElementById('reg-pass').value;
    const confirm = document.getElementById('reg-confirm').value;
    const terms   = document.getElementById('accept-terms').checked;
    hideError('register-error');

    let valid = true;
    if (!first) {
      document.getElementById('err-reg-first').classList.add('show');
      valid = false;
    } else {
      document.getElementById('err-reg-first').classList.remove('show');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      document.getElementById('err-reg-email').classList.add('show');
      valid = false;
    } else {
      document.getElementById('err-reg-email').classList.remove('show');
    }
    if (pass.length < 8) {
      document.getElementById('err-reg-pass').classList.add('show');
      valid = false;
    } else {
      document.getElementById('err-reg-pass').classList.remove('show');
    }
    if (pass !== confirm || !confirm) {
      document.getElementById('err-reg-confirm').classList.add('show');
      valid = false;
    } else {
      document.getElementById('err-reg-confirm').classList.remove('show');
    }
    if (!terms) { alert('Please accept the Terms of Service to continue.'); return; }
    if (!valid) return;

    const btn = document.getElementById('btn-register');
    btn.classList.add('loading');
    try {
      const user = await register(email, pass, first, last, role, terms);
      btn.style.display = 'none';
      document.getElementById('form-register').querySelector('.form-head').style.display = 'none';
      document.getElementById('reg-success-title').textContent = 'Account created!';
      document.getElementById('reg-success-desc').textContent  = 'Welcome to Orycto. Loading your dashboard…';
      document.getElementById('success-register').classList.add('show');
      setTimeout(() => onSuccess(user), 1600);
    } catch (err) {
      btn.classList.remove('loading');
      if (err.pending) {
        btn.style.display = 'none';
        document.getElementById('form-register').querySelector('.form-head').style.display = 'none';
        document.getElementById('reg-success-title').textContent = 'Request received!';
        document.getElementById('reg-success-desc').textContent  = 'Your account is pending approval by an administrator. You\'ll be notified once approved.';
        document.getElementById('success-register').classList.add('show');
      } else {
        showError('register-error', err.message);
      }
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const loginVisible = document.getElementById('form-login').style.display !== 'none';
    if (loginVisible) document.getElementById('btn-login').click();
    else document.getElementById('btn-register').click();
  });
}
