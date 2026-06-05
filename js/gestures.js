// Swipe-back vanaf links voor terug-navigatie (iOS-stijl)
import { navigate, currentRoute } from './router.js';

const ORDER = ['dashboard','taxi','koran','arabic','goals','todo','notes'];

export function initSwipeBack() {
  let startX = null, startY = null, dx = 0, dy = 0;

  document.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    // Alleen vanaf linker 24px voor swipe-back
    if (t.clientX <= 24) { startX = t.clientX; startY = t.clientY; dx = 0; dy = 0; }
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (startX == null) return;
    const t = e.touches[0];
    dx = t.clientX - startX;
    dy = t.clientY - startY;
  }, { passive: true });

  document.addEventListener('touchend', () => {
    if (startX != null && dx > 80 && Math.abs(dy) < 60) {
      const cur = currentRoute() || 'dashboard';
      const idx = ORDER.indexOf(cur);
      if (idx > 0) navigate(ORDER[idx - 1]);
    }
    startX = startY = null; dx = dy = 0;
  });
}
