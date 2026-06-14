/* ════════════════════════════════════════════════
   GH Taxi Amsterdam — Booking Site JS
   ════════════════════════════════════════════════ */

// ── Config (pas aan!) ──
const PHONE = '31600000000'; // jouw telefoonnummer zonder + of spaties

// ── Bekende adressen / autocomplete ──
const LOCATIONS = [
  { label: 'Amsterdam Centraal Station', icon: '🚉', zone: 'centrum' },
  { label: 'Amsterdam Noord (NDSM)', icon: '📍', zone: 'noord' },
  { label: 'Amsterdam Oost (Watergraafsmeer)', icon: '📍', zone: 'oost' },
  { label: 'Amsterdam Zuid (Rivierenbuurt)', icon: '📍', zone: 'zuid' },
  { label: 'Amsterdam West (Jordaan)', icon: '📍', zone: 'west' },
  { label: 'Amsterdam Nieuw-West', icon: '📍', zone: 'nieuwwest' },
  { label: 'Amsterdam Zuidoost (Bijlmer)', icon: '📍', zone: 'zuidoost' },
  { label: 'Schiphol Airport', icon: '✈️', zone: 'schiphol' },
  { label: 'Amsterdam RAI', icon: '🏢', zone: 'zuidoost' },
  { label: 'Ziggo Dome', icon: '🎵', zone: 'zuidoost' },
  { label: 'Johan Cruyff ArenA', icon: '⚽', zone: 'zuidoost' },
  { label: 'AFAS Live', icon: '🎤', zone: 'zuidoost' },
  { label: 'Amsterdam UMC (AMC)', icon: '🏥', zone: 'zuidoost' },
  { label: 'OLVG Ziekenhuis Oost', icon: '🏥', zone: 'oost' },
  { label: 'Amstelstation', icon: '🚉', zone: 'oost' },
  { label: 'Sloterdijk Station', icon: '🚉', zone: 'west' },
  { label: 'Haarlem Centrum', icon: '🏙️', zone: 'haarlem' },
  { label: 'Utrecht Centraal', icon: '🚉', zone: 'utrecht' },
  { label: 'Den Haag Centraal', icon: '🚉', zone: 'denhaag' },
  { label: 'Rotterdam Centraal', icon: '🚉', zone: 'rotterdam' },
  { label: 'Almere Centrum', icon: '🏙️', zone: 'almere' },
  { label: 'Zaandam Centrum', icon: '🏙️', zone: 'zaandam' },
  { label: 'Amstelveen', icon: '📍', zone: 'amstelveen' },
  { label: 'Diemen', icon: '📍', zone: 'diemen' },
];

// ── Prijstabel per zone-combinatie ──
// Format: 'van_zone-naar_zone' — symmetrisch (werkt beide kanten)
const PRICES = {
  // Vanuit centrum
  'centrum-schiphol':   { comfort: 45, business: 55 },
  'centrum-rai':        { comfort: 18, business: 25 },
  'centrum-haarlem':    { comfort: 35, business: 45 },
  'centrum-utrecht':    { comfort: 65, business: 80 },
  'centrum-denhaag':    { comfort: 95, business: 115 },
  'centrum-rotterdam':  { comfort: 100, business: 120 },
  'centrum-almere':     { comfort: 45, business: 55 },
  'centrum-zaandam':    { comfort: 30, business: 38 },
  'centrum-amstelveen': { comfort: 25, business: 32 },
  'centrum-diemen':     { comfort: 20, business: 28 },
  // Vanuit noord
  'noord-schiphol':     { comfort: 48, business: 58 },
  'noord-centrum':      { comfort: 18, business: 24 },
  'noord-rai':          { comfort: 28, business: 36 },
  'noord-haarlem':      { comfort: 42, business: 52 },
  'noord-utrecht':      { comfort: 72, business: 88 },
  // Vanuit oost
  'oost-schiphol':      { comfort: 50, business: 60 },
  'oost-centrum':       { comfort: 16, business: 22 },
  'oost-rai':           { comfort: 16, business: 22 },
  'oost-haarlem':       { comfort: 48, business: 58 },
  'oost-utrecht':       { comfort: 62, business: 78 },
  // Vanuit zuidoost
  'zuidoost-schiphol':  { comfort: 48, business: 58 },
  'zuidoost-centrum':   { comfort: 22, business: 28 },
  'zuidoost-haarlem':   { comfort: 52, business: 62 },
  'zuidoost-utrecht':   { comfort: 60, business: 75 },
  // Vanuit west
  'west-schiphol':      { comfort: 42, business: 52 },
  'west-centrum':       { comfort: 14, business: 20 },
  // Vanuit nieuwwest
  'nieuwwest-schiphol': { comfort: 38, business: 48 },
  'nieuwwest-centrum':  { comfort: 18, business: 24 },
  // Vanuit zuid
  'zuid-schiphol':      { comfort: 40, business: 50 },
  'zuid-centrum':       { comfort: 16, business: 22 },
  'zuid-rai':           { comfort: 12, business: 18 },
  // Schiphol ↔ overig
  'schiphol-haarlem':   { comfort: 30, business: 38 },
  'schiphol-utrecht':   { comfort: 70, business: 85 },
  'schiphol-denhaag':   { comfort: 75, business: 90 },
  'schiphol-rotterdam': { comfort: 90, business: 110 },
};

// ── Zone detectie ──
function detectZone(text) {
  const t = text.toLowerCase().trim();
  if (!t) return null;
  if (t.includes('schiphol') || t.includes('airport') || t.includes('luchthaven')) return 'schiphol';
  if (t.includes('centraal') && (t.includes('amsterdam') || t.length < 20)) return 'centrum';
  if (t.includes('noord') || t.includes('ndsm')) return 'noord';
  if (t.includes('oost') || t.includes('watergraafsmeer') || t.includes('ijburg') || t.includes('olvg')) return 'oost';
  if (t.includes('amsterdam rai') || (t.includes(' rai') && !t.includes('station')) || t === 'amsterdam rai') return 'rai';
  if (t.includes('zuidoost') || t.includes('bijlmer') || t.includes('arena') || t.includes('ziggo') || t.includes('afas') || t.includes('cruyff') || t.includes('amc') || t.includes('umc')) return 'zuidoost';
  if (t.includes('nieuw-west') || t.includes('nieuwwest') || t.includes('geuzenveld') || t.includes('slotervaart')) return 'nieuwwest';
  if (t.includes('west') || t.includes('jordaan') || t.includes('sloterdijk')) return 'west';
  if (t.includes('buitenveldert') || t.includes('rivierenbuurt') || t.includes('apollobuurt')) return 'zuid';
  if (t.includes('centrum') || t.includes('dam') || t.includes('leidseplein') || t.includes('rembrandtplein')) return 'centrum';
  if (t.includes('haarlem')) return 'haarlem';
  if (t.includes('utrecht')) return 'utrecht';
  if (t.includes('den haag') || t.includes('haag') || t.includes('denhaag')) return 'denhaag';
  if (t.includes('rotterdam')) return 'rotterdam';
  if (t.includes('almere')) return 'almere';
  if (t.includes('zaandam') || t.includes('zaan')) return 'zaandam';
  if (t.includes('amstelveen')) return 'amstelveen';
  if (t.includes('diemen')) return 'diemen';
  // Fallback: als "amsterdam" staat in tekst maar geen specifieke wijk → centrum
  if (t.includes('amsterdam')) return 'centrum';
  return null;
}

function getPrice(fromZone, toZone, vehicle) {
  if (!fromZone || !toZone) return null;
  if (fromZone === toZone) {
    if (fromZone === 'schiphol') return null;
    const stadRitten = { comfort: 15, business: 22, bus: 45 };
    return stadRitten[vehicle] ?? 15;
  }
  const key1 = `${fromZone}-${toZone}`;
  const key2 = `${toZone}-${fromZone}`;
  const entry = PRICES[key1] || PRICES[key2];
  if (!entry) return null;
  if (vehicle === 'bus') return Math.round((entry.business || entry.comfort || 0) * 1.5);
  return entry[vehicle] || entry.comfort || null;
}

// ── Autocomplete ──
function setupAutocomplete(inputId, suggestId) {
  const input = document.getElementById(inputId);
  const box   = document.getElementById(suggestId);
  if (!input || !box) return;

  let activeIdx = -1;

  function renderSuggestions(term) {
    if (!term || term.length < 2) { hideSuggest(); return; }
    const t = term.toLowerCase();
    const matches = LOCATIONS.filter(l => l.label.toLowerCase().includes(t)).slice(0, 6);
    if (!matches.length) { hideSuggest(); return; }
    box.innerHTML = matches.map((l, i) =>
      `<div class="wsuggest-item" data-idx="${i}" data-label="${l.label}">
        <span class="wsuggest-item-icon">${l.icon}</span>
        ${l.label}
      </div>`
    ).join('');
    box.classList.add('visible');
    activeIdx = -1;

    box.querySelectorAll('.wsuggest-item').forEach(el => {
      el.addEventListener('mousedown', e => {
        e.preventDefault();
        input.value = el.dataset.label;
        hideSuggest();
        updatePriceEstimate();
      });
    });
  }

  function hideSuggest() {
    box.classList.remove('visible');
    box.innerHTML = '';
    activeIdx = -1;
  }

  input.addEventListener('input', () => renderSuggestions(input.value));
  input.addEventListener('blur', () => setTimeout(hideSuggest, 150));
  input.addEventListener('keydown', e => {
    const items = box.querySelectorAll('.wsuggest-item');
    if (e.key === 'ArrowDown') { e.preventDefault(); activeIdx = Math.min(activeIdx + 1, items.length - 1); highlightItem(items); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); activeIdx = Math.max(activeIdx - 1, -1); highlightItem(items); }
    else if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); input.value = items[activeIdx].dataset.label; hideSuggest(); updatePriceEstimate(); }
    else if (e.key === 'Escape') hideSuggest();
  });

  function highlightItem(items) {
    items.forEach((el, i) => el.style.background = i === activeIdx ? 'rgba(255,255,255,.08)' : '');
    if (activeIdx >= 0) items[activeIdx]?.scrollIntoView({ block: 'nearest' });
  }
}

// ── Prijs berekenen en weergeven ──
function updatePriceEstimate() {
  const pickup  = document.getElementById('pickup')?.value || '';
  const dropoff = document.getElementById('dropoff')?.value || '';
  const vehicle = document.getElementById('vehicle')?.value || 'business';
  const box     = document.getElementById('price-estimate');
  const amountEl = document.getElementById('pe-amount');

  const fromZone = detectZone(pickup);
  const toZone   = detectZone(dropoff);
  const price    = getPrice(fromZone, toZone, vehicle);

  if (price && pickup.length >= 3 && dropoff.length >= 3) {
    box.classList.add('visible');
    amountEl.textContent = `€ ${price}`;
    amountEl.style.fontSize = '';
  } else if (pickup.length >= 3 && dropoff.length >= 3) {
    box.classList.add('visible');
    amountEl.textContent = 'Op aanvraag';
    amountEl.style.fontSize = '1.3rem';
  } else {
    box.classList.remove('visible');
    amountEl.style.fontSize = '';
  }
}

// ── WhatsApp bericht bouwen ──
function buildWhatsAppMsg({ pickup, dropoff, passengers, vehicle, date, time }) {
  const vehicleNames = { comfort: 'Comfort (sedan)', business: 'Business (SUV/E-klasse)', bus: 'Minibus (8 pers.)' };
  let msg = `Hallo, ik wil graag een taxi boeken via GH Taxi Amsterdam.\n\n`;
  if (pickup)     msg += `📍 *Ophaaladres:* ${pickup}\n`;
  if (dropoff)    msg += `🏁 *Bestemming:* ${dropoff}\n`;
  if (date)       msg += `📅 *Datum:* ${formatDate(date)}\n`;
  if (time)       msg += `🕐 *Tijd:* ${time}\n`;
  if (passengers) msg += `👥 *Passagiers:* ${passengers}\n`;
  if (vehicle)    msg += `🚗 *Voertuig:* ${vehicleNames[vehicle] || vehicle}\n`;
  msg += `\nKunt u mij een vaste prijs bevestigen?`;
  return encodeURIComponent(msg);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const months = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
  return `${parseInt(d)} ${months[parseInt(m)-1]} ${y}`;
}

// ── Nav scroll effect ──
function initNav() {
  const nav = document.getElementById('nav');
  const ham = document.getElementById('hamburger');
  const mob = document.getElementById('nav-mobile');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  ham.addEventListener('click', () => {
    const open = ham.classList.toggle('open');
    mob.classList.toggle('open', open);
    ham.setAttribute('aria-label', open ? 'Menu sluiten' : 'Menu openen');
  });

  // Sluit mobiel menu bij link klik
  mob.querySelectorAll('.nav-mobile-link').forEach(a => {
    a.addEventListener('click', () => {
      ham.classList.remove('open');
      mob.classList.remove('open');
    });
  });
}

// ── Widget tabs ──
function initWidgetTabs() {
  const tabs = document.querySelectorAll('.wtab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const pane = tab.dataset.tab;
      document.getElementById('pane-direct')?.classList.toggle('hidden', pane !== 'direct');
      document.getElementById('pane-later')?.classList.toggle('hidden', pane !== 'later');
    });
  });
}

// ── Veld-validatie (shake animatie) ──
function shakeField(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('winput-error');
  void el.offsetWidth;
  el.classList.add('winput-error');
  el.focus();
  setTimeout(() => el.classList.remove('winput-error'), 800);
}

// ── Boek knop ──
function initBookButton() {
  document.getElementById('btn-book')?.addEventListener('click', () => {
    const pickup     = document.getElementById('pickup')?.value?.trim() || '';
    const dropoff    = document.getElementById('dropoff')?.value?.trim() || '';
    if (!pickup) { shakeField('pickup'); return; }
    if (!dropoff) { shakeField('dropoff'); return; }
    const passengers = document.getElementById('passengers')?.value || '1';
    const vehicle    = document.getElementById('vehicle')?.value || 'business';
    const msg = buildWhatsAppMsg({ pickup, dropoff, passengers, vehicle });
    window.open(`https://wa.me/${PHONE}?text=${msg}`, '_blank', 'noopener');
  });

  document.getElementById('btn-schedule')?.addEventListener('click', () => {
    const pickup     = document.getElementById('pickup-l')?.value?.trim() || '';
    const dropoff    = document.getElementById('dropoff-l')?.value?.trim() || '';
    if (!pickup) { shakeField('pickup-l'); return; }
    if (!dropoff) { shakeField('dropoff-l'); return; }
    const date       = document.getElementById('date-l')?.value || '';
    const time       = document.getElementById('time-l')?.value || '';
    const passengers = document.getElementById('passengers-l')?.value || '1';
    const vehicle    = document.getElementById('vehicle-l')?.value || 'business';
    const msg = buildWhatsAppMsg({ pickup, dropoff, passengers, vehicle, date, time });
    window.open(`https://wa.me/${PHONE}?text=${msg}`, '_blank', 'noopener');
  });
}

// ── Datum minimum (vandaag) ──
function initDateMin() {
  const dateInput = document.getElementById('date-l');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    dateInput.value = today;
  }
}

// ── Count-up animaties ──
function countUp(el, target, duration = 1400) {
  const start = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  }
  requestAnimationFrame(step);
}

function initCountUps() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target, 10);
        if (!isNaN(target)) countUp(el, target);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.stat-num[data-target]').forEach(el => observer.observe(el));
}

// ── Scroll-reveal ──
function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ── Smooth scroll voor anker-links ──
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(a => {
    a.addEventListener('click', e => {
      try {
        const target = document.querySelector(a.getAttribute('href'));
        if (target) {
          e.preventDefault();
          const offset = document.getElementById('nav')?.offsetHeight || 64;
          const top = target.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      } catch (_) { /* ignore invalid selectors */ }
    });
  });
}

// ── FAB verberg boven hero ──
function initFabVisibility() {
  const fab = document.getElementById('fab-wa');
  if (!fab) return;
  window.addEventListener('scroll', () => {
    fab.classList.toggle('fab-visible', window.scrollY > 300);
  }, { passive: true });
}

// ── Bootstrap ──
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initWidgetTabs();
  setupAutocomplete('pickup',   'pickup-suggest');
  setupAutocomplete('dropoff',  'dropoff-suggest');
  setupAutocomplete('pickup-l', 'pickup-l-suggest');
  setupAutocomplete('dropoff-l','dropoff-l-suggest');
  initBookButton();
  initDateMin();
  initCountUps();
  initReveal();
  initSmoothScroll();
  initFabVisibility();

  // Live prijs-update bij typen of selectie wisselen
  ['pickup', 'dropoff', 'vehicle'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updatePriceEstimate);
    document.getElementById(id)?.addEventListener('change', updatePriceEstimate);
  });
});
