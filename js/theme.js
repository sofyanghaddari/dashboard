import { getSetting, setSetting } from './settings.js';

const ACCENTS = {
  // Warm taupe — het enige accent van het "stille luxe" systeem (donker + licht variant)
  taupe:    { gold: '#bfb09a', goldBright: '#d4c6b0', glow: 'rgba(138,126,111,.18)',
              goldLight: '#8a7e6f', goldBrightLight: '#a3957d', glowLight: 'rgba(138,126,111,.14)' },
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

// Preset accent-dot kleuren voor preview in instellingen
export const PRESET_DOT_COLORS = {
  onyx: '#ffffff', graphite: '#c2a76d', midnight: '#d4b06b', slate: '#b8a87f',
  sterling: '#b8aa8a', espresso: '#c4a484', ash: '#b0b0b0', obsidian: '#4a9eff',
  chalk: '#444444', concrete: '#2d4a6b',
  daylight: '#c17d2a', ivory: '#8b7355', stone: '#44546a', cloud: '#3d6fa8',
  pearl: '#0071e3', paper: '#2d3748', linen: '#6b5f4b',
};

const LIGHT_PRESETS = new Set(['daylight','ivory','stone','cloud','pearl','paper','linen','chalk','concrete']);

export function applyTheme() {
  const mode = getSetting('themeMode') || 'dark';
  const accent = getSetting('accentColor') || 'taupe';
  const preset = getSetting('themePreset') || 'midnight';

  let actual = mode;
  if (mode === 'auto') {
    actual = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  document.body.dataset.theme = actual;
  document.body.dataset.preset = preset;
  document.body.dataset.density = getSetting('density') || 'comfortable';

  // Accent (money/glow) volgt licht/donker zodat het op beide leesbaar blijft.
  const a = ACCENTS[accent] || ACCENTS.taupe;
  const isLight = actual === 'light';
  document.documentElement.style.setProperty('--gold', isLight && a.goldLight ? a.goldLight : a.gold);
  document.documentElement.style.setProperty('--gold-bright', isLight && a.goldBrightLight ? a.goldBrightLight : a.goldBright);
  document.documentElement.style.setProperty('--gold-glow', isLight && a.glowLight ? a.glowLight : a.glow);
}

function _todayStr() { return new Date().toISOString().split('T')[0]; }

function _applyAutoTheme() {
  if (getSetting('autoTheme') === '0') return;
  if (getSetting('autoThemeOverride') === _todayStr()) return;

  const hour = new Date().getHours();
  const isDay = hour >= 6 && hour < 20;
  if (isDay) {
    setSetting('themeMode', 'light');
    setSetting('themePreset', 'daylight');
  } else {
    setSetting('themeMode', 'dark');
    setSetting('themePreset', getSetting('autoThemeDarkPreset') || 'midnight');
  }
  applyTheme();
}

export function initAutoTheme() {
  _applyAutoTheme();
  setInterval(_applyAutoTheme, 15 * 60 * 1000);
}

export function setPreset(preset) {
  setSetting('autoThemeOverride', _todayStr()); // gebruiker overschrijft vandaag
  if (!LIGHT_PRESETS.has(preset)) setSetting('autoThemeDarkPreset', preset);
  setSetting('themePreset', preset);
  applyTheme();
}

export function setDensity(d) { setSetting('density', d); applyTheme(); }

export function initTheme() {
  // Eenmalige overgang naar het warm-neutrale systeem: taupe accent + een nette
  // warm-donkere modus als standaard (gebruiker kan dit later aanpassen in
  // instellingen). De automatische dag/nacht-wissel zetten we uit zodat de app
  // niet ongevraagd naar licht springt.
  if (!localStorage.getItem('warmAccentV1')) {
    setSetting('accentColor', 'taupe');
    setSetting('themeMode', 'dark');
    setSetting('themePreset', 'midnight');
    setSetting('autoTheme', '0');
    localStorage.setItem('warmAccentV1', '1');
  }
  applyTheme();
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
      if ((getSetting('themeMode') || 'dark') === 'auto') applyTheme();
    });
  }
}

export function setThemeMode(mode) {
  setSetting('autoThemeOverride', _todayStr());
  setSetting('themeMode', mode);
  applyTheme();
}
export function setAccent(accent) { setSetting('accentColor', accent); applyTheme(); }
export const ACCENT_NAMES = Object.keys(ACCENTS);
