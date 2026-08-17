/* ============================================================
   Satyawati Trading & Paints Suppliers
   Shared: user accounts (register / login / logout)
   Exposes window.Auth  — loaded BEFORE cart.js on every page.
============================================================ */

(function () {
  const AUTH_KEY = 'paintsAuth';

  const read = () => {
    try {
      return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
    } catch (e) {
      return null;
    }
  };

  const Auth = {
    get: read,
    token: () => (read() || {}).token || null,
    user: () => (read() || {}).user || null,

    set(data) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(data));
      renderNav();
    },

    clear() {
      localStorage.removeItem(AUTH_KEY);
      renderNav();
    },

    async apiFetch(path, options = {}) {
      const token = this.token();
      const res = await fetch(path, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: 'Bearer ' + token } : {}),
          ...(options.headers || {}),
        },
      });
      return res;
    },

    /* runs callback once logged in; opens the login modal if needed */
    requireLogin(cb) {
      if (this.user()) return cb();
      pendingLogin = cb;
      openModal('login');
    },
  };

  let pendingLogin = null;
  let modal = null;

  /* ============================================================
     NAV ACCOUNT BUTTON
  ============================================================ */
  function renderNav() {
    const cartBtn = document.querySelector('.cart-btn');
    const nav = document.querySelector('.nav');
    if (!nav) return;

    let btn = document.getElementById('accountBtn');
    if (!btn) {
      btn = document.createElement('button');
      btn.className = 'account-btn';
      btn.id = 'accountBtn';
      btn.innerHTML = '<span class="cart-icon">&#128100;</span><span class="account-label" id="accountLabel">Login</span>';
      nav.insertBefore(btn, cartBtn || null);
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown();
      });
    }

    const user = Auth.user();
    const label = btn.querySelector('#accountLabel');
    if (label) label.textContent = user ? user.name.split(' ')[0] : 'Login';
    btn.classList.toggle('logged-in', !!user);

    let dd = document.getElementById('accountDropdown');
    if (!dd) {
      dd = document.createElement('div');
      dd.className = 'account-dropdown';
      dd.id = 'accountDropdown';
      dd.innerHTML =
        '<a href="account.html">My Orders</a>' +
        '<button id="accountLogoutBtn">Logout</button>';
      nav.appendChild(dd);
      dd.querySelector('#accountLogoutBtn').addEventListener('click', logout);
    }
    if (user) nav.appendChild(dd);

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#accountBtn') && dd) dd.classList.remove('open');
    });
  }

  function toggleDropdown() {
    const dd = document.getElementById('accountDropdown');
    if (!dd) return;
    dd.classList.toggle('open');
  }

  async function logout() {
    try {
      await Auth.apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      /* ignore */
    }
    Auth.clear();
    closeModal();
    showToast('Logged out');
  }

  /* ============================================================
     AUTH MODAL (built once)
  ============================================================ */
  function ensureModal() {
    if (modal) return modal;

    modal = document.createElement('div');
    modal.className = 'auth-wrap';
    modal.id = 'authWrap';
    modal.innerHTML = `
      <div class="auth-overlay" id="authOverlay"></div>
      <div class="auth-modal" id="authModal">
        <div class="auth-tabs">
          <button class="auth-tab active" data-tab="login">Login</button>
          <button class="auth-tab" data-tab="register">Create Account</button>
        </div>

        <div class="auth-pane" id="authPaneLogin">
          <h3>Welcome Back</h3>
          <p class="auth-sub">Login to place your order.</p>
          <input id="authPhone" type="tel" placeholder="Phone Number" autocomplete="tel" />
          <input id="authPass" type="password" placeholder="Password" autocomplete="current-password" />
          <button class="btn btn-primary auth-submit" id="authLoginBtn">Login</button>
          <p class="auth-msg" id="authMsg"></p>
        </div>

        <div class="auth-pane hidden" id="authPaneRegister">
          <h3>Create Account</h3>
          <p class="auth-sub">Create a free account to order paints &amp; tools.</p>
          <input id="regName" type="text" placeholder="Full Name" />
          <input id="regPhone" type="tel" placeholder="Phone Number" />
          <input id="regPass" type="password" placeholder="Password (min 4 characters)" autocomplete="new-password" />
          <button class="btn btn-primary auth-submit" id="authRegBtn">Create Account</button>
          <p class="auth-msg" id="regMsg"></p>
        </div>
      </div>`;
    document.body.appendChild(modal);

    modal.querySelector('#authOverlay').addEventListener('click', closeModal);

    modal.querySelectorAll('.auth-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    modal.querySelector('#authLoginBtn').addEventListener('click', doLogin);
    modal.querySelector('#authRegBtn').addEventListener('click', doRegister);
    modal.querySelector('#authPhone').addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });
    modal.querySelector('#authPass').addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });
    modal.querySelector('#regPass').addEventListener('keydown', (e) => { if (e.key === 'Enter') doRegister(); });

    return modal;
  }

  function switchTab(tab) {
    const m = ensureModal();
    m.querySelectorAll('.auth-tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === tab));
    m.querySelector('#authPaneLogin').classList.toggle('hidden', tab !== 'login');
    m.querySelector('#authPaneRegister').classList.toggle('hidden', tab !== 'register');
    setMsg('', false);
  }

  function openModal(tab) {
    const m = ensureModal();
    switchTab(tab || 'login');
    m.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  function setMsg(text, isError) {
    if (!modal) return;
    modal.querySelector('#authMsg').textContent = text;
    modal.querySelector('#authMsg').style.color = isError ? '#b3001f' : '#2b8a3e';
  }

  function clearRegMsg() {
    if (modal) modal.querySelector('#regMsg').textContent = '';
  }

  async function doLogin() {
    const m = ensureModal();
    const phone = m.querySelector('#authPhone').value.trim();
    const password = m.querySelector('#authPass').value;
    setMsg('', false);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      const data = await parseJSON(res);
      if (!res.ok) throw new Error(data.error || 'Login failed');
      Auth.set(data);
      closeModal();
      showToast('Welcome, ' + data.user.name.split(' ')[0] + '!');
      m.querySelector('#authPhone').value = '';
      m.querySelector('#authPass').value = '';
      if (pendingLogin) {
        const cb = pendingLogin;
        pendingLogin = null;
        cb();
      }
    } catch (err) {
      setMsg(err.message, true);
    }
  }

  async function doRegister() {
    const m = ensureModal();
    const name = m.querySelector('#regName').value.trim();
    const phone = m.querySelector('#regPhone').value.trim();
    const password = m.querySelector('#regPass').value;
    clearRegMsg();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, password }),
      });
      const data = await parseJSON(res);
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      Auth.set(data);
      closeModal();
      showToast('Account created. Welcome, ' + data.user.name.split(' ')[0] + '!');
      m.querySelector('#regName').value = '';
      m.querySelector('#regPhone').value = '';
      m.querySelector('#regPass').value = '';
      if (pendingLogin) {
        const cb = pendingLogin;
        pendingLogin = null;
        cb();
      }
    } catch (err) {
      m.querySelector('#regMsg').textContent = err.message;
      m.querySelector('#regMsg').style.color = '#b3001f';
    }
  }

  /* lightweight toast (shared with cart.js behaviour) */
  function showToast(msg) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), 2400);
  }

  /* safe JSON read — shows a friendly message if the server answers HTML */
  async function parseJSON(res) {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (err) {
      throw new Error(
        'The server did not respond. Please open the website at http://localhost:3000 and try again.'
      );
    }
  }

  window.Auth = Auth;

  document.addEventListener('DOMContentLoaded', renderNav);
})();