/* ============================================================
   Admin dashboard logic
============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const $ = (sel) => document.querySelector(sel);

  const loginView = $('#loginView');
  const dashboard = $('#dashboard');
  const loginError = $('#loginError');
  const loginBtn = $('#loginBtn');
  const loginPassword = $('#loginPassword');

  const ordersList = $('#ordersList');
  const messagesList = $('#messagesList');
  const ordersPanel = $('#ordersPanel');
  const messagesPanel = $('#messagesPanel');

  const STATUSES = ['new', 'confirmed', 'completed', 'cancelled'];

  const token = () => sessionStorage.getItem('adminToken');
  const store = (t) => sessionStorage.setItem('adminToken', t);
  const clearToken = () => sessionStorage.removeItem('adminToken');

  /* ---- auth check ---- */
  if (token()) {
    loginView.classList.add('hidden');
    dashboard.classList.remove('hidden');
    loadAll();
  }

  loginBtn.addEventListener('click', doLogin);
  loginPassword.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doLogin();
  });

  async function doLogin() {
    loginError.classList.add('hidden');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: loginPassword.value }),
      });
      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch (err) {
        /* non-JSON response → wrong server */
      }
      if (res.ok && data.token) {
        store(data.token);
        loginView.classList.add('hidden');
        dashboard.classList.remove('hidden');
        loginPassword.value = '';
        loadAll();
      } else if (res.status === 401) {
        loginError.textContent = 'Wrong password. Try again.';
        loginError.classList.remove('hidden');
      } else {
        loginError.textContent = 'Server not reachable — open the admin page at http://localhost:3000/admin.html';
        loginError.classList.remove('hidden');
      }
    } catch (err) {
      loginError.textContent = 'Cannot reach server. Is node server.js running?';
      loginError.classList.remove('hidden');
    }
  }

  $('#logoutBtn').addEventListener('click', () => {
    clearToken();
    dashboard.classList.add('hidden');
    loginView.classList.remove('hidden');
  });

  /* ---- tabs ---- */
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const isOrders = tab.dataset.tab === 'orders';
      ordersPanel.classList.toggle('hidden', !isOrders);
      messagesPanel.classList.toggle('hidden', isOrders);
    });
  });

  /* ---- api helpers ---- */
  async function api(url, options = {}) {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token(),
        ...(options.headers || {}),
      },
    });
    if (res.status === 401) {
      clearToken();
      location.reload();
      throw new Error('Unauthorized');
    }
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  }

  const formatINR = (n) => '\u20B9' + Number(n).toLocaleString('en-IN');
  const badge = (s) => `<span class="badge ${s}">${s}</span>`;

  function itemList(items) {
    return items.map((i) => `${i.name} &times; ${i.qty} ${i.unit === 'pc' ? 'pcs' : 'L'}`).join('<br>');
  }

  function orderCard(o) {
    return `
      <div class="card-order" data-id="${o.id}">
        <div class="head">
          <span class="id">Order #${o.id} ${badge(o.status)}</span>
          <span class="muted">${o.created_at}</span>
        </div>
        <div class="muted">${o.customer_name} &middot; <a href="tel:${o.customer_phone}">${o.customer_phone}</a></div>
        <div class="items">${itemList(o.items)}</div>
        <div class="total">Total: ${formatINR(o.total)}</div>
        <div class="actions">
          <select data-status="${o.id}">
            ${STATUSES.map((s) => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
          <button class="del" data-del="${o.id}">Delete</button>
        </div>
      </div>`;
  }

  function messageCard(m) {
    return `
      <div class="msg-card">
        <div class="head">
          <span class="who">${m.name}${m.phone ? ' &middot; ' + m.phone : ''}</span>
          <span class="muted">${m.created_at}</span>
        </div>
        ${m.subject ? `<div class="sub">${m.subject}</div>` : ''}
        <div class="body">${m.message}</div>
        <div class="actions"><button class="del" data-delmsg="${m.id}">Delete</button></div>
      </div>`;
  }

  async function loadOrders() {
    const orders = await api('/api/admin/orders');
    $('#statOrders').textContent = orders.length;
    $('#statNew').textContent = orders.filter((o) => o.status === 'new').length;
    $('#statRevenue').textContent = formatINR(orders.reduce((s, o) => s + o.total, 0));
    ordersList.innerHTML = orders.length ? orders.map(orderCard).join('') : '<p class="empty">No orders yet.</p>';
  }

  async function loadMessages() {
    const messages = await api('/api/admin/messages');
    $('#statMsgs').textContent = messages.length;
    messagesList.innerHTML = messages.length ? messages.map(messageCard).join('') : '<p class="empty">No enquiries yet.</p>';
  }

  async function loadAll() {
    try {
      await Promise.all([loadOrders(), loadMessages()]);
    } catch (err) {
      /* handled in api() */
    }
  }

  /* ---- delegated actions ---- */
  document.addEventListener('change', async (e) => {
    const sel = e.target.closest('[data-status]');
    if (!sel) return;
    try {
      await api(`/api/admin/orders/${sel.dataset.status}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: sel.value }),
      });
      loadOrders();
    } catch (err) {
      alert('Could not update status');
    }
  });

  document.addEventListener('click', async (e) => {
    const del = e.target.closest('[data-del]');
    if (del) {
      try {
        await api('/api/admin/orders/' + del.dataset.del, { method: 'DELETE' });
        loadOrders();
      } catch (err) {
        alert('Could not delete order');
      }
    }
    const delMsg = e.target.closest('[data-delmsg]');
    if (delMsg) {
      try {
        await api('/api/admin/messages/' + delMsg.dataset.delmsg, { method: 'DELETE' });
        loadMessages();
      } catch (err) {
        alert('Could not delete message');
      }
    }
  });
});