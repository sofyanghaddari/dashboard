// Voeg swipe-to-delete toe aan .list-item elementen.
// usage: enableSwipeDelete(containerEl, async (item) => { await del(...); })
export function enableSwipeDelete(container, onDelete) {
  container.querySelectorAll('.list-item').forEach(el => {
    if (el.dataset.swipeBound) return;
    el.dataset.swipeBound = '1';
    let startX = null, dx = 0;
    const inner = el;
    inner.style.transition = 'transform .15s ease';
    el.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX; dx = 0; inner.style.transition = '';
    }, { passive: true });
    el.addEventListener('touchmove', (e) => {
      if (startX == null) return;
      dx = e.touches[0].clientX - startX;
      if (dx < 0) inner.style.transform = `translateX(${Math.max(-120, dx)}px)`;
    }, { passive: true });
    el.addEventListener('touchend', () => {
      inner.style.transition = 'transform .2s ease';
      if (dx < -80) {
        inner.style.transform = 'translateX(-100%)';
        const id = el.dataset.id;
        if (id && onDelete) setTimeout(() => onDelete(id), 200);
      } else {
        inner.style.transform = '';
      }
      startX = null; dx = 0;
    });
  });
}
