import { getSetting, setSetting } from './settings.js';

// Één accent (goud), twee varianten: donker en licht
const GOLD_DARK  = { gold: '#C9A75A', goldBright: '#D8B86A', glow: 'rgba(201,167,90,.18)' };
// Iets donkerder dan voorheen (#8B6B2A) zodat kleine bedragen op lichte kaarten WCAG AA halen
const GOLD_LIGHT = { gold: '#7A5C20', goldBright: '#A67F30', glow: 'rgba(139,107,42,.15)' };

export const THEME_PRESETS = ['onyx', 'midnight', 'daylight'];

export const PRESET_DOT_COLORS = {
  onyx:     '#C9A75A',
  midnight: '#C9A75A',
  daylight: '#8B6B2A',
};

const LIGHT_PRESETS = new Set(['daylight']);

export function applyTheme() {
  const preset = getSetting('themePreset') || 'midnight';
  const isLight = LIGHT_PRESETS.has(preset);

  document.body.dataset.theme  = isLight ? 'light' : 'dark';
  document.body.dataset.preset = preset;
  document.body.dataset.density = getSetting('density') || 'comfortable';

  const a = isLight ? GOLD_LIGHT : GOLD_DARK;
  document.documentElement.style.setProperty('--gold',        a.gold);
  document.documentElement.style.setProperty('--gold-bright', a.goldBright);
  document.documentElement.style.setProperty('--gold-glow',   a.glow);

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

function _todayStr() { return new Date().toISOString().split('T')[0]; }

function _applyAutoTheme() {
  if (getSetting('autoTheme') === '0') return;
  if (getSetting('autoThemeOverride') === _todayStr()) return;

  const hour = new Date().getHours();
  const isDay = hour >= 6 && hour < 20;
  setSetting('themePreset', isDay ? 'daylight' : (getSetting('autoThemeDarkPreset') || 'midnight'));
  applyTheme();
}

export function initAutoTheme() {
  _applyAutoTheme();
  setInterval(_applyAutoTheme, 15 * 60 * 1000);
}

export function setPreset(preset) {
  setSetting('autoThemeOverride', _todayStr());
  if (!LIGHT_PRESETS.has(preset)) setSetting('autoThemeDarkPreset', preset);
  setSetting('themePreset', preset);
  applyTheme();
}

export function setDensity(d) { setSetting('density', d); applyTheme(); }

export function initTheme() {
  // Eenmalige migratie: zet accent altijd op gold en thema op midnight als het nog op
  // een oud preset staat dat we hebben verwijderd.
  const validPresets = new Set(THEME_PRESETS);
  if (!validPresets.has(getSetting('themePreset'))) {
    setSetting('themePreset', 'midnight');
  }
  setSetting('accentColor', 'gold');
  applyTheme();
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => applyTheme());
  }
}

export function setThemeMode(mode) { applyTheme(); }
export function setAccent(accent)  { applyTheme(); }
export const ACCENT_NAMES = ['gold'];
