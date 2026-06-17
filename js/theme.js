import { getSetting, setSetting } from './settings.js';

const ACCENTS = {
  gold: { gold: '#C9A75A', goldBright: '#D8B86A', glow: 'rgba(201,167,90,.18)' },
};

export const THEME_PRESETS = ['midnight'];

export const PRESET_DOT_COLORS = {
  midnight: '#C9A75A',
};

export function applyTheme() {
  document.body.dataset.theme = 'dark';
  document.body.dataset.preset = 'midnight';
  document.body.dataset.density = getSetting('density') || 'comfortable';

  const a = ACCENTS.gold;
  document.documentElement.style.setProperty('--gold', a.gold);
  document.documentElement.style.setProperty('--gold-bright', a.goldBright);
  document.documentElement.style.setProperty('--gold-glow', a.glow);

  _syncThemeColorMeta();
}

function _syncThemeColorMeta() {
  requestAnimationFrame(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta || !document.body) return;
    const bg = getComputedStyle(document.body).backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') meta.setAttribute('content', bg);
  });
}

export function initAutoTheme() {
  // No-op: single midnight theme, no auto-switching
}

export function setPreset(preset) {
  applyTheme();
}

export function setDensity(d) { setSetting('density', d); applyTheme(); }

export function initTheme() {
  // Force midnight + gold, clear any old accent/preset/mode settings
  setSetting('themeMode', 'dark');
  setSetting('accentColor', 'gold');
  setSetting('themePreset', 'midnight');
  applyTheme();
}

export function setThemeMode(mode) { applyTheme(); }
export function setAccent(accent) { applyTheme(); }
export const ACCENT_NAMES = Object.keys(ACCENTS);
