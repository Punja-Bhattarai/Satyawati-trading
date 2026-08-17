/* ============================================================
   Satyawati Trading & Paints Suppliers
   Shared: navigation, cart system, buy page
============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const $ = (sel, root = document) => root.querySelector(sel);

  /* ============================================================
     PRODUCT CATALOGUE  (prices in INR)
     unit: 'L'  -> sold per litre
     unit: 'pc' -> sold per piece (brushes / rollers)
  ============================================================ */
  const PRODUCTS = [
    { id: 1,  name: 'Royale Luxury Emulsion',     category: 'interior', price: 450, unit: 'L',  img: 'royale-luxury.png' },
    { id: 2,  name: 'Royale Shyne',               category: 'interior', price: 620, unit: 'L',  img: 'royale-shyne.png' },
    { id: 3,  name: 'Royale Aspira',              category: 'interior', price: 520, unit: 'L',  img: 'royale-aspira.png' },
    { id: 4,  name: 'Royale Blynn',               category: 'interior', price: 470, unit: 'L',  img: 'royale-blynn.png' },
    { id: 5,  name: 'Apcolite Premium Emulsion',  category: 'interior', price: 310, unit: 'L',  img: 'apcolite-premium.png' },
    { id: 6,  name: 'Tractor Shine Emulsion',     category: 'interior', price: 220, unit: 'L',  img: 'tractor-shine.png' },
    { id: 7,  name: 'Tractor Emulsion',           category: 'interior', price: 185, unit: 'L',  img: 'tractor-emulsion.png' },
    { id: 8,  name: 'Apex Ultima',                category: 'exterior', price: 480, unit: 'L',  img: 'apex-ultima.png' },
    { id: 9,  name: 'Apex Ultima Protek Shyne',   category: 'exterior', price: 650, unit: 'L',  img: 'apex-ultima-protek-shyne.png' },
    { id: 10, name: 'Apex Ultima Protek',         category: 'exterior', price: 560, unit: 'L',  img: 'apex-ultima-protek.png' },
    { id: 11, name: 'Apex Weatherproof Emulsion', category: 'exterior', price: 390, unit: 'L',  img: 'apex-weatherproof.png' },
    { id: 12, name: 'Ace',                        category: 'exterior', price: 330, unit: 'L',  img: 'ace.png' },
    { id: 13, name: 'Ace Shyne',                  category: 'exterior', price: 430, unit: 'L',  img: 'ace-shyne.png' },
    { id: 14, name: 'Interior Wall Primer',       category: 'primer',   price: 180, unit: 'L',  kind: 'drum',  color: '#e8e4da' },
    { id: 15, name: 'Exterior Wall Primer',       category: 'primer',   price: 210, unit: 'L',  kind: 'drum',  color: '#d8d2c0' },
    { id: 16, name: 'Paint Brush 1"',             category: 'brush',    price: 60,  unit: 'pc',  kind: 'brush', tag: '1 inch' },
    { id: 17, name: 'Paint Brush 1.5"',           category: 'brush',    price: 80,  unit: 'pc',  kind: 'brush', tag: '1.5 inch' },
    { id: 18, name: 'Paint Brush 2"',             category: 'brush',    price: 100, unit: 'pc',  kind: 'brush', tag: '2 inch' },
    { id: 19, name: 'Paint Brush 2.5"',           category: 'brush',    price: 120, unit: 'pc',  kind: 'brush', tag: '2.5 inch' },
    { id: 20, name: 'Paint Brush 3"',             category: 'brush',    price: 150, unit: 'pc',  kind: 'brush', tag: '3 inch' },
    { id: 21, name: 'Roller 4"',                  category: 'roller',   price: 90,  unit: 'pc',  kind: 'roller', tag: '4 inch' },
    { id: 22, name: 'Roller 7"',                  category: 'roller',   price: 130, unit: 'pc',  kind: 'roller', tag: '7 inch' },
    { id: 23, name: 'Roller 9"',                  category: 'roller',   price: 160, unit: 'pc',  kind: 'roller', tag: '9 inch' },
    { id: 24, name: 'Roller Tray & Set',          category: 'roller',   price: 250, unit: 'pc',  kind: 'roller', tag: 'complete set' },
  ];

  const CATEGORY_INFO = {
    interior: { title: 'Interior Paints', blurb: 'Royale, Apcolite & Tractor emulsions — sold per litre.' },
    exterior: { title: 'Exterior Paints', blurb: 'Apex, Ultima Protek, Ace & Weatherproof — sold per litre.' },
    brush:    { title: 'Painting Brushes', blurb: 'Premium brushes in every size — sold per piece.' },
    roller:   { title: 'Paint Rollers', blurb: 'Rollers and tray sets for fast, even coverage — sold per piece.' },
    primer:   { title: 'Wall Primers', blurb: 'Interior & exterior primers to seal walls before painting — sold per litre.' },
  };

  const productById = (id) => PRODUCTS.find((p) => p.id === Number(id));

  /* ============================================================
     PAINT DRUM / BRUSH / ROLLER GRAPHICS (SVG)
  ============================================================ */
  const adjustHex = (hex, percent) => {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255;
    let g = (n >> 8) & 255;
    let b = n & 255;
    const t = percent < 0 ? 0 : 255;
    const p = Math.abs(percent) / 100;
    r = Math.round((t - r) * p + r);
    g = Math.round((t - g) * p + g);
    b = Math.round((t - b) * p + b);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  const drumSVG = (color) => `
    <svg class="tool-art" viewBox="0 0 220 205" role="img" aria-hidden="true">
      <path class="drum-handle" d="M72 66 C72 36 148 36 148 66" fill="none" stroke-linecap="round"/>
      <path class="drum-body" d="M46 64 L46 172 Q46 180 54 180 L166 180 Q174 180 174 172 L174 64" fill="${adjustHex(color, -18)}" stroke="${adjustHex(color, -38)}" stroke-width="3"/>
      <rect class="drum-lid" x="40" y="56" width="140" height="26" rx="13" fill="${adjustHex(color, -8)}"/>
      <rect class="drum-lid-top" x="52" y="60" width="116" height="18" rx="9" fill="${color}"/>
      <rect class="drum-label" x="62" y="94" width="96" height="72" rx="10" fill="#ffffff" opacity="0.95"/>
      <rect class="drum-stripe" x="72" y="104" width="76" height="16" rx="8" fill="${color}"/>
      <rect class="drum-line" x="72" y="130" width="76" height="7" rx="3.5" fill="#d5d0c9"/>
      <rect class="drum-line" x="72" y="143" width="52" height="7" rx="3.5" fill="#d5d0c9"/>
      <circle class="drum-dot" cx="150" cy="148" r="12" fill="${color}"/>
    </svg>`;

  const brushSVG = () => `
    <svg class="tool-art" viewBox="0 0 220 200" role="img" aria-hidden="true">
      <rect x="92" y="14" width="36" height="86" rx="8" fill="#8b5a2b"/>
      <path d="M98 24 h24 v30 h-24 Z" fill="#a56935"/>
      <rect x="84" y="92" width="52" height="16" rx="5" fill="#5c4033"/>
      <path d="M88 108 h44 v26 c0 22 -10 40 -22 40 c-12 0 -22 -18 -22 -40 Z" fill="#d8d2c0"/>
      <path d="M95 112 h30 v38 c0 8 -6 14 -15 14 c-9 0 -15 -6 -15 -14 Z" fill="#e8e4da"/>
      <rect x="70" y="40" width="80" height="6" rx="3" fill="#e4002b" opacity="0.85"/>
    </svg>`;

  const rollerSVG = (color) => `
    <svg class="tool-art" viewBox="0 0 220 200" role="img" aria-hidden="true">
      <rect x="36" y="70" width="100" height="44" rx="22" fill="${adjustHex(color, -12)}"/>
      <rect x="36" y="70" width="100" height="30" rx="15" fill="${color}"/>
      <rect x="132" y="70" width="10" height="44" rx="4" fill="#5c4033"/>
      <path d="M140 78 h14 c8 0 14 6 14 14 c0 8 -6 14 -14 14 h-14 Z" fill="#e4002b"/>
      <rect x="150" y="92" width="52" height="10" rx="5" fill="#5c4033"/>
      <path d="M168 102 l-44 62 h14 l30 -54 Z" fill="#c28b3e"/>
      <rect x="34" y="120" width="104" height="8" rx="4" fill="#b9b2a8"/>
    </svg>`;

  const toolArt = (p) => {
    if (p.kind === 'brush') return `<div class="swatch tool-swatch">${brushSVG()}</div>`;
    if (p.kind === 'roller') return `<div class="swatch tool-swatch">${rollerSVG(p.color || '#e4002b')}</div>`;
    if (p.kind === 'drum') return `<div class="swatch" style="--c:${p.color}">${drumSVG(p.color)}</div>`;
    if (p.img) return `<div class="swatch product-swatch"><img class="product-img" src="assets/images/${p.img}" alt="${p.name}"></div>`;
    return `<div class="swatch" style="--c:${p.color || '#e4002b'}"></div>`;
  };

  const injectDrums = () => {
    document.querySelectorAll('.swatch').forEach((el) => {
      if (el.querySelector('.tool-art, .product-img')) return;
      const c = (getComputedStyle(el).getPropertyValue('--c').trim() || '#e4002b');
      el.insertAdjacentHTML('beforeend', drumSVG(c));
    });
  };

  /* ============================================================
     NAVIGATION (mobile menu + sticky header)
  ============================================================ */
  const header = $('#header');
  const navToggle = $('#navToggle');
  const navLinks = $('#navLinks');

  if (header) {
    const onScrollHeader = () => header.classList.toggle('scrolled', window.scrollY > 20);
    window.addEventListener('scroll', onScrollHeader);
    onScrollHeader();
  }

  if (navToggle && navLinks) {
    const closeMenu = () => {
      navToggle.classList.remove('open');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    };
    navToggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      navToggle.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    navLinks.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));
  }

  /* ============================================================
     CART STATE (localStorage)
  ============================================================ */
  const CART_KEY = 'paintsCart';
  let cart = [];
  try {
    cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch (err) {
    cart = [];
  }

  const saveCart = () => localStorage.setItem(CART_KEY, JSON.stringify(cart));
  const cartCount = () => cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = () => cart.reduce((s, i) => s + i.qty * (productById(i.id)?.price || 0), 0);

  const updateCartCount = () => {
    const badge = $('#cartCount');
    if (badge) badge.textContent = cartCount();
  };

  const formatINR = (n) => '\u20B9' + n.toLocaleString('en-IN');

  /* ============================================================
     TOAST NOTIFICATIONS
  ============================================================ */
  let toastTimer = null;
  const showToast = (msg) => {
    let toast = $('#toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
  };

  /* ============================================================
     CART DRAWER
  ============================================================ */
  const cartDrawer = $('#cartDrawer');
  const cartOverlay = $('#cartOverlay');
  const cartBtn = $('#cartBtn');
  const cartClose = $('#cartClose');

  const openCart = () => {
    if (!cartDrawer) return;
    cartDrawer.classList.add('open');
    if (cartOverlay) cartOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  };

  const closeCart = () => {
    if (!cartDrawer) return;
    cartDrawer.classList.remove('open');
    if (cartOverlay) cartOverlay.classList.remove('show');
    document.body.style.overflow = '';
  };

  if (cartBtn) cartBtn.addEventListener('click', openCart);
  if (cartClose) cartClose.addEventListener('click', closeCart);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

  /* ---- render cart items list ---- */
  const qtyStepperHTML = (id, qty, small) => `
    <div class="qty-stepper${small ? ' sm' : ''}">
      <button class="qty-btn minus" data-id="${id}" aria-label="Decrease">&#8722;</button>
      <input type="number" class="qty-input" data-id="${id}" value="${qty}" min="1" max="100" />
      <button class="qty-btn plus" data-id="${id}" aria-label="Increase">+</button>
    </div>`;

  const renderCartItems = (listEl) => {
    if (!listEl) return;
    if (cart.length === 0) {
      listEl.innerHTML = `<div class="cart-empty">
        <span>&#128722;</span>
        <p>Your cart is empty.</p>
        <a class="btn btn-outline-dark" href="buy.html">Browse Products</a>
      </div>`;
      return;
    }

    listEl.innerHTML = cart
      .map((item) => {
        const p = productById(item.id);
        if (!p) return '';
        const u = p.unit === 'pc' ? ' / piece' : ' / litre';
        return `
        <div class="cart-item">
          <div class="cart-swatch" style="background:${p.color || '#e4002b'}"></div>
          <div class="cart-info">
            <strong>${p.name}</strong>
            <span>${formatINR(p.price)}${u}</span>
          </div>
          ${qtyStepperHTML(p.id, item.qty, true)}
          <span class="cart-line">${formatINR(p.price * item.qty)}</span>
          <button class="cart-remove" data-id="${p.id}" aria-label="Remove">&#10005;</button>
        </div>`;
      })
      .join('');
  };

  const renderCart = () => {
    renderCartItems($('#cartItems'));
    const totalEl = $('#cartTotal');
    if (totalEl) totalEl.textContent = formatINR(cartTotal());
    const checkoutBtn = $('#checkoutBtn');
    if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;
    updateCartCount();
  };

  /* ============================================================
     CART ACTIONS
  ============================================================ */
  const addToCart = (id, qty) => {
    const p = productById(id);
    if (!p || qty < 1) return;
    const existing = cart.find((i) => i.id === p.id);
    if (existing) existing.qty += qty;
    else cart.push({ id: p.id, qty });
    saveCart();
    renderCart();
    showToast(p.name + ' added to cart');
  };

  const changeQty = (id, delta) => {
    const item = cart.find((i) => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty < 1) cart = cart.filter((i) => i.id !== id);
    saveCart();
    renderCart();
  };

  const setQty = (id, qty) => {
    const item = cart.find((i) => i.id === id);
    if (!item) return;
    item.qty = Math.max(1, Math.min(100, qty));
    saveCart();
    renderCart();
  };

  const removeItem = (id) => {
    cart = cart.filter((i) => i.id !== id);
    saveCart();
    renderCart();
    showToast('Item removed from cart');
  };

  /* ---- delegated events for drawer + checkout summary ---- */
  document.addEventListener('click', (e) => {
    const minus = e.target.closest('.qty-btn.minus');
    if (minus) return changeQty(Number(minus.dataset.id), -1);

    const plus = e.target.closest('.qty-btn.plus');
    if (plus) return changeQty(Number(plus.dataset.id), 1);

    const remove = e.target.closest('.cart-remove');
    if (remove) return removeItem(Number(remove.dataset.id));
  });

  document.addEventListener('input', (e) => {
    const input = e.target.closest('.qty-input');
    if (!input) return;
    setQty(Number(input.dataset.id), Number(input.value) || 1);
  });

  /* ============================================================
     BUY PAGES — product grid (filtered by <body data-category>)
  ============================================================ */
  const buyGrid = $('#buyGrid');
  if (buyGrid) {
    const pageCat = document.body.dataset.category || 'all';
    const items = pageCat === 'all' ? PRODUCTS : PRODUCTS.filter((p) => p.category === pageCat);

    const unitLabel = (unit) => (unit === 'pc' ? ' / piece' : ' / litre');

    buyGrid.innerHTML = items
      .map(
        (p) => `
      <article class="product-card buy-card">
        ${toolArt(p)}
        <h3>${p.name}</h3>
        <p class="buy-cat">${p.tag ? p.tag : (CATEGORY_INFO[p.category]?.title || p.category)}</p>
        <div class="buy-meta">
          <span class="price-per">${formatINR(p.price)} <small>${unitLabel(p.unit)}</small></span>
          ${qtyStepperHTML(p.id, 1, false)}
        </div>
        <button class="btn btn-primary buy-add" data-id="${p.id}">Add to Cart</button>
      </article>`
      )
      .join('');

    buyGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.buy-add');
      if (!btn) return;
      const card = btn.closest('.buy-card');
      const input = card.querySelector('.qty-input');
      addToCart(Number(btn.dataset.id), Number(input.value) || 1);
    });
  }

  /* ============================================================
     CHECKOUT MODAL
  ============================================================ */
  const checkoutModal = $('#checkoutModal');
  const checkoutModalOverlay = $('#checkoutModalOverlay');
  const checkoutBtn = $('#checkoutBtn');
  const modalClose = $('#modalClose');

  const openCheckout = () => {
    if (cart.length === 0) return;
    renderCartItems($('#modalItems'));
    $('#modalTotal').textContent = formatINR(cartTotal());
    $('#modalCount').textContent = cartCount();
    checkoutModal.classList.add('open');
    checkoutModalOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  };

  const closeCheckout = () => {
    checkoutModal.classList.remove('open');
    checkoutModalOverlay.classList.remove('show');
    document.body.style.overflow = '';
  };

  if (checkoutBtn) checkoutBtn.addEventListener('click', openCheckout);
  if (modalClose) modalClose.addEventListener('click', closeCheckout);
  if (checkoutModalOverlay) checkoutModalOverlay.addEventListener('click', closeCheckout);

  /* ---- place order (login required) ---- */
  const orderBtn = $('#orderBtn');
  if (orderBtn) {
    async function placeOrder() {
      if (!window.Auth) return showToast('Accounts not available right now.');
      if (!Auth.user()) {
        Auth.requireLogin(placeOrder);
        return;
      }

      const user = Auth.user();
      const name = user.name || 'Customer';
      const phone = user.phone || '';
      const items = cart.map((i) => {
        const p = productById(i.id);
        return { id: p.id, name: p.name, qty: i.qty, price: p.price, unit: p.unit };
      });
      const total = cartTotal();

      let msg = 'New Paint Order from Website:\n';
      items.forEach((i) => {
        const u = i.unit === 'pc' ? 'pcs' : 'L';
        msg += '\n- ' + i.name + ' x ' + i.qty + ' ' + u + ' = ' + formatINR(i.price * i.qty);
      });
      msg += '\n\nTotal: ' + formatINR(total);
      msg += '\nName: ' + name;
      msg += '\nPhone: ' + phone;

      let orderId = null;
      try {
        const res = await Auth.apiFetch('/api/orders', {
          method: 'POST',
          body: JSON.stringify({ name, phone, items, total }),
        });
        if (res.status === 401) {
          Auth.clear();
          Auth.requireLogin(placeOrder);
          return;
        }
        if (res.ok) {
          const data = await res.json();
          orderId = data.id;
        }
      } catch (err) {
        /* server offline — order is sent via WhatsApp below */
      }

      window.open('https://wa.me/919766798922?text=' + encodeURIComponent(msg), '_blank');
      cart = [];
      saveCart();
      renderCart();
      closeCheckout();
      showToast(orderId ? 'Order #' + orderId + ' saved! Confirming on WhatsApp.' : 'Order sent! Confirming on WhatsApp.');
    }

    orderBtn.addEventListener('click', placeOrder);
  }

  /* ============================================================
     INIT
  ============================================================ */
  renderCart();
  injectDrums();

  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});