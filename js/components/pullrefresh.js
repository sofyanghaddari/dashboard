// Pull-to-refresh op het view-element. Trigger callback wanneer ver genoeg getrokken.
export function enablePullToRefresh(onRefresh) {
  let startY = null, dy = 0;
  const indicator = document.createElement('div');
  indicator.className = 'pull-indicator';
  indicator.innerHTML = '↓';
  document.body.appendChild(indicator);

  document.addEventListener('touchstart', (e) => {
    if (window.scrollY > 0) { startY = null; return; }
    startY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (startY == null) return;
    dy = e.touches[0].clientY - startY;
    if (dy > 0 && window.scrollY === 0) {
      const pulled = Math.min(120, dy);
      indicator.style.transform = `translateY(${pulled - 60}px) rotate(${Math.min(180, pulled * 1.5)}deg)`;
      indicator.style.opacity = Math.min(1, pulled / 80);
    }
  }, { passive: true });

  document.addEventListener('touchend', async () => {
    if (startY != null && dy > 80) {
      indicator.classList.add('refreshing');
      try { await onRefresh(); } catch (_) {}
      indicator.classList.remove('refreshing');
    }
    indicator.style.transform = '';
    indicator.style.opacity = '';
    startY = null; dy = 0;
  });
}
