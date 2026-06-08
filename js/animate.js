// Tel-animaties voor getallen
export function countUp(element, to, opts = {}) {
  const { duration = 800, prefix = '€ ', suffix = '', decimals = 2 } = opts;
  const start = performance.now();
  const from = 0;
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const v = from + (to - from) * ease(t);
    element.textContent = prefix + v.toFixed(decimals) + suffix;
    if (t < 1) requestAnimationFrame(step);
    else element.textContent = prefix + to.toFixed(decimals) + suffix;
  }
  requestAnimationFrame(step);
}

// Voeg stagger-entrance toe aan alle .card / .list-item kinderen
export function staggerIn(container) {
  const els = container.querySelectorAll('.card, .list > .list-item');
  els.forEach((el, i) => {
    el.style.animationDelay = (i * 40) + 'ms';
    el.classList.add('stagger-in');
  });
}

// Button ripple effect
export function bindRipple(root = document) {
  root.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('.btn, .tab');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const r = document.createElement('span');
    r.className = 'ripple';
    const size = Math.max(rect.width, rect.height);
    r.style.width = r.style.height = size + 'px';
    r.style.left = (e.clientX - rect.left - size / 2) + 'px';
    r.style.top  = (e.clientY - rect.top  - size / 2) + 'px';
    btn.appendChild(r);
    setTimeout(() => r.remove(), 600);
  });
}
