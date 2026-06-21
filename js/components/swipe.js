// Swipe-to-delete voor .list-item elementen.
// Voegt visuele rode feedback toe terwijl de gebruiker veegt.
// Usage: enableSwipeDelete(containerEl, async (id) => { await del(id); })
export function enableSwipeDelete(container, onDelete) {
  container.querySelectorAll('.list-item').forEach(el => {
    if (el.dataset.swipeBound) return;
    el.dataset.swipeBound = '1';

    // Zorg voor positie-context zodat het pseudo-element correct geplaatst wordt
    el.style.position = 'relative';
    el.style.overflow = 'hidden';

    let startX = null, startY = null, dx = 0, locked = false;

    const reset = () => {
      el.style.transition = 'transform .22s cubic-bezier(.4,0,.2,1)';
      el.style.transform = '';
      el.classList.remove('swiping', 'swipe-confirm');
      startX = null; startY = null; dx = 0; locked = false;
    };

    el.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      dx = 0;
      locked = false;
      el.style.transition = 'none';
    }, { passive: true });

    el.addEventListener('touchmove', (e) => {
      if (startX == null) return;
      const curDx = e.touches[0].clientX - startX;
      const curDy = e.touches[0].clientY - startY;

      // Slot vast op horizontale richting; verticaal scrollen wint altijd
      if (!locked) {
        if (Math.abs(curDy) > Math.abs(curDx) + 4) { reset(); return; }
        if (Math.abs(curDx) > 6) locked = true;
      }
      if (!locked) return;

      dx = curDx;
      if (dx < 0) {
        const offset = Math.max(-110, dx);
        el.style.transform = `translateX(${offset}px)`;
        el.classList.toggle('swiping',      Math.abs(offset) > 14);
        el.classList.toggle('swipe-confirm', Math.abs(offset) >= 78);
      } else {
        el.style.transform = '';
        el.classList.remove('swiping', 'swipe-confirm');
      }
    }, { passive: true });

    el.addEventListener('touchend', () => {
      if (dx < -78) {
        // Drempelwaarde gehaald — animeer weg en verwijder
        el.style.transition = 'transform .22s ease, opacity .18s ease';
        el.style.transform   = 'translateX(-105%)';
        el.style.opacity     = '0';
        const id = el.dataset.id;
        if (id && onDelete) setTimeout(() => onDelete(id), 220);
      } else {
        reset();
      }
    });

    el.addEventListener('touchcancel', reset);
  });
}
