/* =========================================================
   VARIEGÀ — JS condiviso: nav active state, easter egg
   ========================================================= */

// Mark active nav link
(function () {
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('is-active');
    }
  });
})();

// Easter egg
(function () {
  const trigger = document.querySelector('.egg-trigger');
  const overlay = document.querySelector('.egg-overlay');
  if (!trigger || !overlay) return;

  const msgs = [
    "VARIEGÀ\nMA NON\nTROPPO",
    "OLTREPÒ\nFOREVER",
    "MA SE\nDIFENDO\nQUALCUNO...",
    "CINQUE\nMENTECATTI\nIN AZIONE",
    "PUZZA\nDI FRITTO\nNON SCHERZA",
    "L'INFUSO\nVI SALUTA",
    "ASSUNTA\nPRESENTE",
    "DROGATEVI\nDI COMICITÀ",
  ];
  const msgEl = overlay.querySelector('.egg-overlay__msg');

  trigger.addEventListener('click', () => {
    msgEl.textContent = msgs[Math.floor(Math.random() * msgs.length)];
    overlay.classList.add('is-on');
  });
  overlay.addEventListener('click', () => overlay.classList.remove('is-on'));

  // Konami-ish: type "drip" to trigger
  let buf = '';
  window.addEventListener('keydown', (e) => {
    buf = (buf + e.key.toLowerCase()).slice(-4);
    if (buf === 'drip') {
      msgEl.textContent = "HAI\nTROVATO\nIL DRIP";
      overlay.classList.add('is-on');
    }
    if (e.key === 'Escape') overlay.classList.remove('is-on');
  });
})();

// Member card flip on click (also keyboard)
(function () {
  document.querySelectorAll('.member-card').forEach(card => {
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    const flip = () => card.classList.toggle('is-flipped');
    card.addEventListener('click', flip);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); }
    });
  });
})();

// Tilt-on-hover for sticky elements
(function () {
  document.querySelectorAll('[data-tilt]').forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `rotate(${x * 6}deg) translate(${x * 6}px, ${y * 6}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });
})();
