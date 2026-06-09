// Motion One wiring — subtle, restrained scroll-in reveals.
// Vendored locally (js/vendor/motion.min.js) so the PWA keeps working offline.
import { animate, inView } from './vendor/motion.min.js';

const prefersReduced = () =>
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Top-level blocks we reveal on entry. Kept to whole "cards/sections" so motion
// stays calm — we never animate individual text runs.
const REVEAL_SELECTOR = [
  '.card',
  '.goal-card',
  '.note-card',
  '.habit-item',
  '.pot-item',
  '.section-header',
  '.agenda-grid',
  '.stats-section',
  '.hizb-voortgang-card',
  '.notes-empty',
  '.section-empty',
  '.day-empty-hint',
].join(',');

/**
 * Reveal the blocks inside a freshly-rendered view.
 * Fade + small upward translate, gentle per-item stagger, once on entry.
 * Respects prefers-reduced-motion (elements simply appear).
 */
export function revealView(view) {
  if (!view) return;
  const els = Array.from(view.querySelectorAll(REVEAL_SELECTOR))
    .filter(el => !el.closest('.modal-backdrop, .modal'));

  if (!els.length) return;

  if (prefersReduced()) {
    els.forEach(el => { el.style.opacity = ''; el.style.transform = ''; });
    return;
  }

  const reveal = (el) => { el.style.willChange = ''; el.style.opacity = ''; el.style.transform = ''; };

  try {
    // Hidden start state, applied synchronously to avoid a flash.
    els.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(12px)';
      el.style.willChange = 'opacity, transform';
    });

    els.forEach((el, i) => {
      const stop = inView(el, () => {
        // `y` is Motion's transform shorthand → GPU-composited, transform+opacity only.
        animate(
          el,
          { opacity: [0, 1], y: [12, 0] },
          { duration: 0.42, delay: 0.045 * Math.min(i, 6), ease: [0.16, 1, 0.3, 1] }
        ).finished.then(() => reveal(el)).catch(() => reveal(el));
        stop(); // animate each element exactly once
      }, { amount: 0.1 });
    });
  } catch (_) {
    // If Motion ever fails, never leave content hidden.
    els.forEach(reveal);
  }
}
