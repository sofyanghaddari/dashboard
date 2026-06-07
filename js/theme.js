import { getSetting, setSetting } from './settings.js';

const ACCENTS = {
  gold:     { gold: '#d4b06b', goldBright: '#e8c785', glow: 'rgba(212,176,107,.15)' },
  blue:     { gold: '#6ec9ff', goldBright: '#9dd9ff', glow: 'rgba(110,201,255,.15)' },
  green:    { gold: '#5dd49a', goldBright: '#7fe8b3', glow: 'rgba(93,212,154,.15)' },
  purple:   { gold: '#c084fc', goldBright: '#d4a8fd', glow: 'rgba(192,132,252,.15)' },
  red:      { gold: '#ff8585', goldBright: '#ffa0a0', glow: 'rgba(255,133,133,.15)' },
  navy:     { gold: '#4a9eff', goldBright: '#7ab8ff', glow: 'rgba(74,158,255,.15)' },
  forest:   { gold: '#3daa6a', goldBright: '#5dcc88', glow: 'rgba(61,170,106,.15)' },
  burgundy: { gold: '#cc4466', goldBright: '#e86080', glow: 'rgba(204,68,102,.15)' },
  copper:   { gold: '#c4652a', goldBright: '#de8048', glow: 'rgba(196,101,42,.15)' },
};

export const THEME_PRESETS = [
  'onyx','graphite','midnight','slate','sterling','espresso','ash',
  'obsidian','chalk','concrete',
  'daylight','ivory','stone','cloud','pearl','paper','linen',
];

export function applyTheme() {
  const mode = getSetting('themeMode') || 'dark';
  const accent = getSetting('accentColor') || 'gold';
  const preset = getSetting('themePreset') || 'midnight';

  let actual = mode;
  if (mode === 'auto') {
    actual = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  document.body.dataset.theme = actual;
  document.body.dataset.preset = preset;
  document.body.dataset.density = getSetting('density') || 'comfortable';

  const a = ACCENTS[accent] || ACCENTS.gold;
  document.documentElement.style.setProperty('--gold', a.gold);
  document.documentElement.style.setProperty('--gold-bright', a.goldBright);
  document.documentElement.style.setProperty('--gold-glow', a.glow);
}

export function setPreset(preset) { setSetting('themePreset', preset); applyTheme(); }
export function setDensity(d) { setSetting('density', d); applyTheme(); }

export function initTheme() {
  applyTheme();
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
      if ((getSetting('themeMode') || 'dark') === 'auto') applyTheme();
    });
  }
}

export function setThemeMode(mode) { setSetting('themeMode', mode); applyTheme(); }
export function setAccent(accent) { setSetting('accentColor', accent); applyTheme(); }
export const ACCENT_NAMES = Object.keys(ACCENTS);
