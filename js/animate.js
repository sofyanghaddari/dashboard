// Tel-animaties voor getallen
export function countUp(element, to, opts = {}) {
  const { duration = 800, prefix = '€ ', suffix = '', decimals = 2 } = opts;
  const start = performance.now();
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    element.textContent = prefix + (to * ease(t)).toFixed(decimals) + suffix;
    if (t < 1) requestAnimationFrame(step);
    else element.textContent = prefix + to.toFixed(decimals) + suffix;
  }
  requestAnimationFrame(step);
}

// Declaratieve tel-animaties: elk element met [data-countup] telt op naar zijn
// eindwaarde. Formattering volgt fmtMoney via data-prefix / data-decimals / data-suffix.
// Respecteert prefers-reduced-motion. Staggert automatisch bij meerdere elementen.
//   <div data-countup="142.5">€ 142.50</div>
//   <div data-countup="7" data-decimals="0" data-prefix="">7</div>
export function initCountUps(root = document) {
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const els = [...root.querySelectorAll('[data-countup]')];
  els.forEach((el, idx) => {
    if (el._counted) return;
    el._counted = true;
    const target   = parseFloat(el.dataset.countup);
    if (!isFinite(target)) return;
    const decimals = el.dataset.decimals != null ? parseInt(el.dataset.decimals, 10) : 2;
    const prefix   = el.dataset.prefix  != null ? el.dataset.prefix  : '€ ';
    const suffix   = el.dataset.suffix  || '';
    const fmt      = (v) => prefix + v.toFixed(decimals) + suffix;
    if (reduced || target === 0) { el.textContent = fmt(target); return; }
    // Natural stagger: first element starts immediately, others ramp in
    const baseDelay = idx * 60;
    const duration  = parseInt(el.dataset.duration || '950', 10);
    setTimeout(() => {
      const t0   = performance.now();
      const ease = (t) => 1 - Math.pow(1 - t, 3);
      const step = (now) => {
        const t = Math.min(1, (now - t0) / duration);
        el.textContent = fmt(target * ease(t));
        if (t < 1) requestAnimationFrame(step);
        else el.textContent = fmt(target);
      };
      requestAnimationFrame(step);
    }, baseDelay);
  });
}

// Stagger-entrance voor kaarten en lijst-items
export function staggerIn(container) {
  const els = container.querySelectorAll('.card, .list > .list-item');
  els.forEach((el, i) => {
    // Natural easing curve: quick start, then diminishing returns
    const delay = Math.round(i * 40 * Math.pow(0.88, i));
    el.style.animationDelay = delay + 'ms';
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

// ── Skeleton loaders ────────────────────────────────────────────────────────
// Voeg tijdelijke skeleton-kaarten toe terwijl data laadt.
// Gebruik:
//   const hide = showSkeleton(container, 3);
//   await loadData();
//   hide();   // verwijdert de skeletons
export function showSkeleton(container, count = 3) {
  const html = Array.from({ length: count }, (_, i) => `
    <div class="skeleton skeleton-card" style="animation-delay:${i * 70}ms" aria-hidden="true"></div>
  `).join('');
  container.insertAdjacentHTML('beforeend', html);
  return () => container.querySelectorAll('.skeleton.skeleton-card').forEach(el => el.remove());
}

// Skeleton voor een rij statistieken (3 naast elkaar)
export function showStatSkeleton(container) {
  const html = `<div class="skeleton-stat-row" aria-hidden="true">
    <div class="skeleton skeleton-stat"></div>
    <div class="skeleton skeleton-stat" style="animation-delay:70ms"></div>
    <div class="skeleton skeleton-stat" style="animation-delay:140ms"></div>
  </div>`;
  container.insertAdjacentHTML('beforeend', html);
  return () => container.querySelector('.skeleton-stat-row')?.remove();
}
