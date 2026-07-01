// cabman.js — gestileerde Cabman-taximeter voor het Taxi-overzicht.
// Toont het verdiende bedrag van vandaag als rollende blauwe display-cijfers,
// met live klok en de blauwe balk als "Inkomen noteren"-knop (id: quick-today).
// Bewust gestileerd (geen fotorealisme): donker paneel, blauwe digits, glans.
import { escapeHTML } from './utils.js';

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

// Bedrag → digit-kolommen (NL-komma). Elke digit is een verticale strip 0-9
// die via translateY naar zijn cijfer rolt.
function digitsMarkup(amount) {
  const str = (Math.round((amount || 0) * 100) / 100).toFixed(2).replace('.', ',');
  return [...str].map(ch => {
    if (ch === ',') return `<span class="cb-sep">,</span>`;
    const strip = Array.from({ length: 10 }, (_, i) => `<i>${i}</i>`).join('');
    return `<span class="cb-digit" data-d="${ch}"><span class="cb-col">${strip}</span></span>`;
  }).join('');
}

export function cabmanMeter({ amount, goalPct, monthIncome, now }) {
  const dateStr = now.toLocaleDateString('nl-NL', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
  const monthCompact = monthIncome >= 1000
    ? (monthIncome / 1000).toFixed(1).replace('.', ',') + 'k'
    : String(Math.round(monthIncome));
  return `
    <div class="cabman card" id="cabman-meter">
      <div class="cb-status">
        <span class="cb-status-app">Taxivervoer · vandaag</span>
        <span class="cb-status-right">
          <span id="cb-date">${escapeHTML(dateStr)}</span>
          <button class="privacy-toggle" title="Toon bedragen" aria-label="Toon bedragen"></button>
        </span>
      </div>
      <div class="cb-screen">
        <div class="cb-label">Bedrag</div>
        <div class="cb-amount blurred-amount">
          <span class="cb-euro">€</span>
          <span class="cb-digits" aria-label="verdiend vandaag">${digitsMarkup(amount)}</span>
        </div>
        <div class="cb-row">
          <span class="cb-cell">Doel <b>${goalPct}%</b></span>
          <span class="cb-cell">Tijd <b id="cb-clock">--:--:--</b></span>
          <span class="cb-cell">Maand <b class="blurred-amount">€ ${escapeHTML(monthCompact)}</b></span>
        </div>
      </div>
      <button class="cb-bar" id="quick-today">＋ &nbsp;Inkomen noteren</button>
      <div class="cb-brand">cabman</div>
    </div>`;
}

let _clockTimer = null;

export function initCabman(container) {
  const meter = container.querySelector('#cabman-meter');
  if (!meter) return;

  // Digits laten rollen: start op 0, rol met per-digit vertraging naar het doel
  const digits = meter.querySelectorAll('.cb-digit');
  digits.forEach((el, i) => {
    const col = el.querySelector('.cb-col');
    const target = parseInt(el.dataset.d, 10) || 0;
    if (reduced()) { col.style.transition = 'none'; col.style.transform = `translateY(${-target}em)`; return; }
    col.style.transform = 'translateY(0)';
    setTimeout(() => { col.style.transform = `translateY(${-target}em)`; }, 120 + i * 90);
  });

  // Live klok (stopt zichzelf zodra de meter uit de DOM is of de tab verborgen)
  if (_clockTimer) clearInterval(_clockTimer);
  const clock = meter.querySelector('#cb-clock');
  const tick = () => {
    if (!clock.isConnected) { clearInterval(_clockTimer); _clockTimer = null; return; }
    if (document.hidden) return;
    clock.textContent = new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  tick();
  _clockTimer = setInterval(tick, 1000);
}
