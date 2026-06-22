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
 */
export function revealView(view) {
  if (!view) return;

  const els = Array.from(view.querySelectorAll(REVEAL_SELECTOR))
    .filter(el => !el.closest('.modal-backdrop, .modal'))
    .slice(0, 12); // max 12 tegelijk om GPU-geheugen te sparen

  if (!els.length) return;

  if (prefersReduced()) return; // geen animatie bij reduced-motion

  try {
    els.forEach((el, i) => {
      animate(
        el,
        { opacity: [0, 1], y: [10, 0] },
        {
          duration: 0.38,
          delay:    0.04 * Math.min(i, 8),
          ease:     [0.16, 1, 0.3, 1],
        }
      ).catch(() => {
        // Ruim op als animatie faalt
        el.style.opacity = '';
        el.style.transform = '';
      });
    });
  } catch (_) {
    // Als Motion One beschikbaar is maar een onverwachte fout gooit
    els.forEach(el => { el.style.opacity = ''; el.style.transform = ''; });
  }
}
