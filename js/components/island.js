// Dynamic Island-stijl pill bovenin voor status (saving, synced, etc)
import { icon as svgIcon } from '../icons.js';
let _el = null;
let _hideTimer = null;

function ensure() {
  if (_el) return _el;
  _el = document.createElement('div');
  _el.className = 'island';
  _el.innerHTML = `<span class="island-icon"></span><span class="island-msg"></span>`;
  document.body.appendChild(_el);
  return _el;
}

export function island(message, opts = {}) {
  const { icon = '●', duration = 1800, kind = 'info' } = opts;
  const el = ensure();
  if (_hideTimer) clearTimeout(_hideTimer);
  el.dataset.kind = kind;
  const iconEl = el.querySelector('.island-icon');
  if (typeof icon === 'string' && icon.includes('<svg')) iconEl.innerHTML = icon;
  else iconEl.textContent = icon;
  el.querySelector('.island-msg').textContent = message;
  el.classList.add('show');
  _hideTimer = setTimeout(() => el.classList.remove('show'), duration);
}

export const islandSaving = () => island('Opslaan…', { icon: '↻', duration: 2000 });
export const islandSaved  = () => island('Opgeslagen', { icon: '✓', kind: 'ok', duration: 1400 });
export const islandSynced = () => island('Gesynchroniseerd', { icon: svgIcon('cloud'), kind: 'ok', duration: 1600 });
