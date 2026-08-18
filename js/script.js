/* ============================================================
   Satyawati Trading & Paints Suppliers
   Interactions
============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---- Active nav link on scroll ---- */
  const sections = document.querySelectorAll('section[id]');
  const navLinkEls = document.querySelectorAll('.nav-link');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinkEls.forEach((l) =>
            l.classList.toggle('active', l.getAttribute('href') === '#' + entry.target.id)
          );
        }
      });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );

  sections.forEach((s) => observer.observe(s));

  /* ---- Product filtering ---- */
  const filterBar = document.getElementById('filterBar');
  if (filterBar) {
    const productCards = document.querySelectorAll('.product-card');

    filterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;

      filterBar.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      productCards.forEach((card) => {
        const show = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('hide', !show);
        card.style.animation = 'none';
        void card.offsetWidth;
        card.style.animation = '';
      });
    });
  }

  /* ---- Scroll reveal ---- */
  const revealEls = document.querySelectorAll('.section-head, .about-card, .product-card, .service-card, .gallery-item, .contact-grid');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => {
      el.classList.add('reveal');
      revealObserver.observe(el);
    });
  }

  /* ---- Contact form ---- */
  const form = document.getElementById('contactForm');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const fields = form.querySelectorAll('input, textarea');
    let valid = true;

    fields.forEach((f) => {
      if (f.hasAttribute('required') && !f.value.trim()) {
        f.classList.add('invalid');
        valid = false;
      } else {
        f.classList.remove('invalid');
      }
    });

    const existingSuccess = form.querySelector('.form-success');
    if (existingSuccess) existingSuccess.remove();

    if (!valid) {
      const error = document.createElement('p');
      error.className = 'form-success';
      error.style.cssText = 'background:#fdecea;border-color:#f5a3a0;color:#b3001f;';
      error.textContent = 'Please fill in all required fields.';
      form.prepend(error);
      return;
    }

    const success = document.createElement('p');
    success.className = 'form-success';
    success.textContent =
      'Thank you! Your message has been received. We will contact you shortly.';
    form.prepend(success);

    const name = form.querySelector('[name="name"]').value.trim();
    const phone = form.querySelector('[name="phone"]').value.trim();
    const subject = form.querySelector('[name="subject"]').value.trim();
    const message = form.querySelector('[name="message"]').value.trim();

    fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, subject, message }),
    })
      .then((res) => {
        if (res.ok) {
          form.reset();
        } else {
          throw new Error('failed');
        }
      })
      .catch(() => {
        success.textContent =
          'Message ready to send — if you do not hear back, please call us at 9766798922.';
      });
  });
});