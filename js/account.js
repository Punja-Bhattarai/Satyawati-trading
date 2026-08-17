/* Satyawati Trading & Paints Suppliers — user order history */
(function () {
  const inr = (n) => 'Rs. ' + Number(n).toLocaleString('en-IN');

  const badge = (status) =>
    '<span class="status-badge ' + (status || 'new') + '">' + (status || 'new') + '</span>';

  document.addEventListener('DOMContentLoaded', async () => {
    const list = document.getElementById('ordersList');
    const meta = document.getElementById('accountMeta');

    if (!window.Auth || !Auth.user()) {
      meta.textContent = 'Please login to view your orders.';
      list.innerHTML =
        '<div class="orders-empty">You are not logged in.' +
        '<br><button class="btn btn-primary" id="goLogin" style="margin-top:16px">Login / Create Account</button></div>';
      const go = document.getElementById('goLogin');
      if (go) go.addEventListener('click', () => Auth.requireLogin(() => location.reload()));
      return;
    }

    const user = Auth.user();
    meta.textContent = 'Welcome, ' + user.name + ' (' + user.phone + '). Below are your orders.';

    try {
      const res = await Auth.apiFetch('/api/my-orders');
      if (res.status === 401) {
        Auth.clear();
        location.reload();
        return;
      }
      const orders = await res.json();
      if (!orders.length) {
        list.innerHTML =
          '<div class="orders-empty">No orders yet.<br><button class="btn btn-primary" onclick="window.location.href=\'buy.html\'" style="margin-top:16px">Start Shopping</button></div>';
        return;
      }
      list.innerHTML = orders
        .map(
          (o) => `
        <div class="acc-order">
          <div class="acc-order-head">
            <strong>Order #${o.id}</strong>
            ${badge(o.status)}
          </div>
          <div class="acc-date">Placed: ${o.created_at}</div>
          ${o.items
            .map(
              (i) =>
                '<div class="acc-order-item"><span>' +
                i.name +
                ' x ' +
                i.qty +
                ' ' +
                (i.unit === 'pc' ? 'pcs' : 'L') +
                '</span><span>' +
                inr(i.price * i.qty) +
                '</span></div>'
            )
            .join('')}
          <div class="acc-total"><span>Total</span><span>${inr(o.total)}</span></div>
        </div>`
        )
        .join('');
    } catch (err) {
      list.innerHTML =
        '<div class="orders-empty">Could not load orders. Check that the server is running.</div>';
    }
  });
})();