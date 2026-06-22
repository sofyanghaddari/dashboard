// Motion One wiring — subtiele stagger-animatie bij pagina-wisseling.
// Vendored locally (js/vendor/motion.min.js) zo dat de PWA offline blijft werken.
//
// BELANGRIJK: We gebruiken GEEN scroll-triggered inView-animaties.
// InView/IntersectionObserver die stijlen aanpassen tijdens scrollen
// cancelt iOS scroll-momentum → de gebruiker kan niet scrollen.
// In plaats daarvan: alles gelijk animeren bij load, met CSS-stagger-delay.
import { animate } from './vendor/motion.min.js';

const prefersReduced = () =>
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  '.income-hero',
  '.netto-hero',
  '.kpi-grid',
  '.bucket-section',
].join(',');

/**
 * Animeer alle blokken in de view tegelijk, met een lichte stagger-delay per element.
 * Geen scroll-triggered IntersectionObserver — dit stoort iOS-scroll niet.
 *
 * Na afloop verwijderen we de inline opacity/transform die Motion One achterlaat.
 * Anders behoudt elk element een eigen compositor-layer (GPU-geheugen verspilling +
 * potentiële scroll-stotter).
 */
export function revealView(view) {
  if (!view) return;

  const els = Array.from(view.querySelectorAll(REVEAL_SELECTOR))
    .filter(el => !el.closest('.modal-backdrop, .modal'))
    .slice(0, 12); // max 12 tegelijk om GPU-geheugen te sparen

  if (!els.length) return;

  if (prefersReduced()) return;

  const cleanup = (el) => { el.style.opacity = ''; el.style.transform = ''; };

  els.forEach((el, i) => {
    try {
      const anim = animate(
        el,
        { opacity: [0, 1], y: [10, 0] },
        {
          duration: 0.38,
          delay:    0.04 * Math.min(i, 8),
          ease:     [0.16, 1, 0.3, 1],
        }
      );
      // Motion One retourneert een AnimationPlaybackControls-object, geen Promise.
      // .finished is de echte Promise; na afloop inline stijlen wissen zodat
      // de cards geen onnodige compositor-layers behouden.
      if (anim && anim.finished) {
        anim.finished.then(() => cleanup(el), () => cleanup(el));
      }
    } catch (_) {
      cleanup(el);
    }
  });
}
