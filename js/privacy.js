const EYE_OFF = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
const EYE_ON  = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;

// Standaard zijn bedragen ZICHTBAAR bij het openen van de app. Pas wanneer de
// gebruiker zelf op het oogje/de zon tikt worden ze geblurd. Sessie-only
// (module-var), dus elke nieuwe app-start begint weer zichtbaar.
let _hidden = false;

export function isAmountsHidden() { return _hidden; }
export function setAmountsHidden(v) {
  _hidden = !!v;
  document.body.classList.toggle('amounts-hidden', _hidden);
}

// Klassieke oog-knop (gebruikt o.a. in Taxi-overzicht).
export function initPrivacyToggle(container) {
  document.body.classList.toggle('amounts-hidden', _hidden);

  const btn = container.querySelector('.privacy-toggle');
  if (!btn) return;

  const apply = () => {
    document.body.classList.toggle('amounts-hidden', _hidden);
    btn.innerHTML = _hidden ? EYE_OFF : EYE_ON;
    btn.title = _hidden ? 'Toon bedragen' : 'Verberg bedragen';
    btn.setAttribute('aria-label', btn.title);
  };
  btn.onclick = e => { e.stopPropagation(); _hidden = !_hidden; apply(); };
  apply();
}

// ☀️ Zon/maan op het dashboard ís de verberg-knop. Tik = bedragen verbergen,
// met een zonsondergang-animatie (stralen in, ooglid dicht, lucht wordt nacht).
export function initSkyPrivacy(container) {
  document.body.classList.toggle('amounts-hidden', _hidden);

  const card = container.querySelector('.dagstart-card');
  const orb  = container.querySelector('#sky-privacy');
  if (!card || !orb) return;

  const sync = () => {
    card.classList.toggle('sky-hidden', _hidden);
    orb.title = _hidden ? 'Toon bedragen' : 'Verberg bedragen';
    orb.setAttribute('aria-label', orb.title);
    orb.setAttribute('aria-pressed', _hidden ? 'true' : 'false');
  };

  orb.onclick = (e) => {
    e.stopPropagation();
    setAmountsHidden(!_hidden);
    sync();
    try { navigator.vibrate?.(12); } catch (_) {}
  };

  sync();
}
