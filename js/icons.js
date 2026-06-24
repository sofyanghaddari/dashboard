// js/icons.js — consistente inline SVG line-iconen.
// Vervangt kleurrijke pictogram-emoji in UI-chrome. Eén taal: viewBox 0 0 24 24,
// stroke=currentColor, stroke-width 1.7, round caps. Functionele monochrome glyphs
// (→ ✓ ✕ ↑ ↩) blijven gewoon tekst — die zijn al strak.

const ATTR = 'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';

const PATHS = {
  // navigatie / modules
  home:      '<path d="M3.4 10.8 12 4l8.6 6.8"/><path d="M5.4 9.5V20h13.2V9.5"/><path d="M9.6 20v-5.2h4.8V20"/>',
  taxi:      '<path d="M5 13l1.5-4.2A2 2 0 0 1 8.4 7.4h7.2a2 2 0 0 1 1.9 1.4L19 13"/><rect x="3.5" y="12.7" width="17" height="4.2" rx="1.3"/><circle cx="7.4" cy="18.4" r="1.4"/><circle cx="16.6" cy="18.4" r="1.4"/><rect x="10.2" y="5.3" width="3.6" height="2.2" rx=".5"/>',
  car:       '<path d="M5 13l1.5-4.2A2 2 0 0 1 8.4 7.4h7.2a2 2 0 0 1 1.9 1.4L19 13"/><rect x="3.6" y="12.8" width="16.8" height="4" rx="1.2"/><circle cx="7.4" cy="18" r="1.4"/><circle cx="16.6" cy="18" r="1.4"/>',
  mosque:    '<path d="M3.6 20.3h16.8"/><path d="M5.6 20.3v-7.7h12.8v7.7"/><path d="M5.4 12.8a6.6 6.6 0 0 1 13.2 0"/><path d="M12 3.1v2.4"/><path d="M10.3 20.3v-3a1.7 1.7 0 0 1 3.4 0v3"/><path d="M3.5 20.3v-6.6"/><path d="M20.5 20.3v-6.6"/>',
  target:    '<circle cx="12" cy="12" r="8.2"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/>',
  check:     '<circle cx="12" cy="12" r="8.4"/><path d="M8.1 12.2l2.7 2.7 5-5.4"/>',
  note:      '<path d="M6 3.6h8.2L18.6 8v12a.4.4 0 0 1-.4.4H6a.4.4 0 0 1-.4-.4V4a.4.4 0 0 1 .4-.4z"/><path d="M14 3.6V8h4.4"/><path d="M8.4 12.4h7"/><path d="M8.4 15.6h7"/>',
  calendar:  '<rect x="3.8" y="5.2" width="16.4" height="15" rx="2"/><path d="M3.8 9.4h16.4"/><path d="M8 3.4v3.4"/><path d="M16 3.4v3.4"/>',
  stats:     '<path d="M4 19.6h16"/><rect x="5.6" y="13.4" width="2.8" height="6.2" rx=".6" fill="currentColor" stroke="none"/><rect x="10.6" y="9.4" width="2.8" height="10.2" rx=".6" fill="currentColor" stroke="none"/><rect x="15.6" y="11.4" width="2.8" height="8.2" rx=".6" fill="currentColor" stroke="none"/>',
  receipt:   '<path d="M6 3.7h12v16.6l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3z"/><path d="M8.5 8h7"/><path d="M8.5 11.4h7"/><path d="M8.5 14.8h4.4"/>',
  book:      '<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H18a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6.5A1.5 1.5 0 0 0 5 20.5z"/><path d="M5 17.5A1.5 1.5 0 0 1 6.5 16H19"/>',
  books:     '<path d="M5 5.5A1.2 1.2 0 0 1 6.2 4.3h3a1.2 1.2 0 0 1 1.2 1.2V19a1.2 1.2 0 0 0-1.2-1.2h-3A1.2 1.2 0 0 1 5 16.6z"/><path d="M13.6 5.5a1.2 1.2 0 0 1 1.2-1.2h3A1.2 1.2 0 0 1 19 5.5v11.1a1.2 1.2 0 0 1-1.2 1.2h-3a1.2 1.2 0 0 0-1.2 1.2z"/>',
  trophy:    '<path d="M7 4.5h10v3a5 5 0 0 1-10 0z"/><path d="M7 5.5H4.6v1.4A2.6 2.6 0 0 0 7 9.4"/><path d="M17 5.5h2.4v1.4A2.6 2.6 0 0 1 17 9.4"/><path d="M12 12.5V16"/><path d="M8.6 19.5h6.8"/><path d="M9.6 19.5l.5-3.5h3.8l.5 3.5"/>',
  bell:      '<path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.4 2H5.1z"/><path d="M10 19.5a2 2 0 0 0 4 0"/>',
  cloud:     '<path d="M7.2 18.5a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10 .6 3.6 3.6 0 0 1-.6 7.1z"/>',
  gear:      '<circle cx="12" cy="12" r="3.1"/><path d="M12 3.6v2.2M12 18.2v2.2M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M3.6 12h2.2M18.2 12h2.2M5.6 18.4l1.6-1.6M16.8 7.2l1.6-1.6"/>',
  search:    '<circle cx="11" cy="11" r="6.4"/><path d="M15.8 15.8 20 20"/>',
  lock:      '<rect x="5.5" y="10.5" width="13" height="9" rx="2"/><path d="M8.3 10.5V8a3.7 3.7 0 0 1 7.4 0v2.5"/><circle cx="12" cy="15" r="1.1" fill="currentColor" stroke="none"/>',
  clipboard: '<rect x="6" y="5" width="12" height="15.5" rx="2"/><path d="M9 5V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/><path d="M9 5h6"/><path d="M9 11h6M9 14.5h4"/>',
  users:     '<circle cx="9" cy="8.6" r="3.1"/><path d="M3.6 19a5.4 5.4 0 0 1 10.8 0"/><path d="M15.5 6a3 3 0 0 1 0 5.6"/><path d="M16.4 13.7A5.4 5.4 0 0 1 20.4 19"/>',
  user:      '<circle cx="12" cy="8" r="3.4"/><path d="M5.5 19.5a6.5 6.5 0 0 1 13 0"/>',
  trend:     '<path d="M4 16.5 9.5 11l3.2 3.2L20 6.8"/><path d="M15.4 6.8H20v4.6"/>',
  bookmark:  '<path d="M7 4.5h10v15.5l-5-3.4-5 3.4z"/>',
  doc:       '<path d="M7 3.6h7L18.5 8v11.9a.5.5 0 0 1-.5.5H7a.5.5 0 0 1-.5-.5V4.1a.5.5 0 0 1 .5-.5z"/><path d="M13.5 3.6V8H18"/><path d="M9 12.5h6M9 15.5h6"/>',
  euro:      '<circle cx="12" cy="12" r="8.4"/><path d="M15 8.6a3.6 3.6 0 0 0-5.7 1.1 5 5 0 0 0 0 4.6A3.6 3.6 0 0 0 15 15.4"/><path d="M7.6 11h5M7.6 13h5"/>',
  money:     '<rect x="3.5" y="6.5" width="17" height="11" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6.5 6.5v11M17.5 6.5v11"/>',
  idea:      '<path d="M9 16.5a5.5 5.5 0 1 1 6 0c-.7.5-1 1.1-1 2v.5h-4v-.5c0-.9-.3-1.5-1-2z"/><path d="M10 21.5h4"/>',
  flame:     '<path d="M12 3.5c.6 3-1.4 4.2-2.6 5.8A5.5 5.5 0 1 0 17 12.5c-.6 1-1.6 1.4-2.4 1-1-.5-.6-2.2-.3-3.4.5-2.2-.3-4.6-2.3-6.6z"/>',
  dot:       '<circle cx="12" cy="12" r="5.5" fill="currentColor" stroke="none"/>',
  plus:      '<path d="M12 5.5v13M5.5 12h13"/>',
  download:  '<path d="M12 4v10.5"/><path d="M8 11l4 4 4-4"/><path d="M5 19.5h14"/>',
  mail:      '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 5.5L20 7"/>',
  send:      '<path d="M20 4 11 13"/><path d="M20 4l-6 16-3.5-7.5L3 9z"/>',
  eye:       '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.7"/>',
  cloudsync: '<path d="M7.4 17.5a3.8 3.8 0 0 1-.4-7.6 5 5 0 0 1 9.6.6 3.4 3.4 0 0 1 .3 6.7"/><path d="M9.5 14.5l2.5-2.5 2.5 2.5"/><path d="M12 12v7"/>',
  cloudoff:  '<path d="M7.2 18.5a4 4 0 0 1-.5-8 5.2 5.2 0 0 1 8.1-2.6"/><path d="M16.3 11.3a3.6 3.6 0 0 1-.1 7.2H9.2"/><path d="M4.5 4.5l15 15"/>',
  trash:     '<path d="M5.5 7h13"/><path d="M9 7V5.4a1.4 1.4 0 0 1 1.4-1.4h3.2A1.4 1.4 0 0 1 15 5.4V7"/><path d="M6.8 7l.9 11.4a1.5 1.5 0 0 0 1.5 1.4h5.6a1.5 1.5 0 0 0 1.5-1.4L17.2 7"/><path d="M10.5 10.5v6M13.5 10.5v6"/>',
  edit:      '<path d="M14.5 5.5l4 4"/><path d="M4.5 19.5l1-4L16 5a1.5 1.5 0 0 1 2.1 0l.9.9a1.5 1.5 0 0 1 0 2.1L8.5 18.5z"/>',
  print:     '<path d="M7 9V4h10v5"/><rect x="4.5" y="9" width="15" height="7" rx="1.5"/><path d="M7 14h10v5.5H7z"/><circle cx="16.4" cy="11.4" r=".7" fill="currentColor" stroke="none"/>',
  whatsapp:  '<path d="M4 20l1.4-4A7.5 7.5 0 1 1 8 18.6z"/>',
  camera:    '<rect x="3.5" y="7" width="17" height="12" rx="2.4"/><path d="M8.5 7l1.3-2.2h4.4L15.5 7"/><circle cx="12" cy="13" r="3.1"/>',
  warning:   '<path d="M12 4.5 21 19H3z"/><path d="M12 10v4.2"/><circle cx="12" cy="17" r=".9" fill="currentColor" stroke="none"/>',
  star:      '<path d="M12 4.5l2.3 4.9 5.2.6-3.9 3.6 1.1 5.2L12 16.7l-4.8 2.7 1.1-5.2-3.9-3.6 5.2-.6z"/>',
  sparkle:   '<path d="M12 4v6M12 14v6M4 12h6M14 12h6"/>',
  route:     '<circle cx="6" cy="6" r="2.2"/><circle cx="18" cy="18" r="2.2"/><path d="M8 6h6a3 3 0 0 1 0 6H10a3 3 0 0 0 0 6h6"/>',
  pin:       '<path d="M12 21s6-5.3 6-10.2A6 6 0 0 0 6 10.8C6 15.7 12 21 12 21z"/><circle cx="12" cy="10.6" r="2.2"/>',
  list:      '<path d="M9 6.5h10M9 12h10M9 17.5h10"/><circle cx="5" cy="6.5" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="17.5" r="1" fill="currentColor" stroke="none"/>',
  palette:   '<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.3 0 2-1 2-2s.7-2 2-2h1.6A3 3 0 0 0 20.5 12 8.5 8.5 0 0 0 12 3.5z"/><circle cx="8" cy="11" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="8" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="10.5" r="1" fill="currentColor" stroke="none"/>',
  box:       '<path d="M4 8l8-4 8 4v8l-8 4-8-4z"/><path d="M4 8l8 4 8-4"/><path d="M12 12.2V20"/>',
  shield:    '<path d="M12 3.5l7 2.4v5.3c0 4.4-3 7.5-7 9.3-4-1.8-7-4.9-7-9.3V5.9z"/><path d="M9.2 12l2 2 3.6-3.8"/>',
  database:  '<ellipse cx="12" cy="6" rx="6.5" ry="2.6"/><path d="M5.5 6v6c0 1.4 2.9 2.6 6.5 2.6s6.5-1.2 6.5-2.6V6"/><path d="M5.5 12v6c0 1.4 2.9 2.6 6.5 2.6s6.5-1.2 6.5-2.6v-6"/>',
  volume:    '<path d="M4.5 9.5v5h3l4 3.5v-12l-4 3.5z"/><path d="M15 9.2a3.5 3.5 0 0 1 0 5.6"/><path d="M17.4 7a6.5 6.5 0 0 1 0 10"/>',
  mic:       '<rect x="9.2" y="3" width="5.6" height="10.5" rx="2.8"/><path d="M6 11a6 6 0 0 0 12 0"/><path d="M12 17v3.5"/><path d="M9 20.5h6"/>',
  clock:     '<circle cx="12" cy="12" r="8.2"/><path d="M12 7.5V12l3 1.8"/>',
  bulb:      '<path d="M9 16.5a5.5 5.5 0 1 1 6 0c-.7.5-1 1.1-1 2v.5h-4v-.5c0-.9-.3-1.5-1-2z"/><path d="M10 21.5h4"/>',
  tag:       '<path d="M4 7.5a2 2 0 0 1 2-2h5.2a2 2 0 0 1 1.4.6l6.4 6.4a1.8 1.8 0 0 1 0 2.5l-4.8 4.8a1.8 1.8 0 0 1-2.5 0L5.3 13.4A2 2 0 0 1 4 11.5z"/><circle cx="8.4" cy="9.4" r="1.1" fill="currentColor" stroke="none"/>',
  pencil:    '<path d="M14.5 5.5l4 4"/><path d="M4.5 19.5l1-4L16 5a1.5 1.5 0 0 1 2.1 0l.9.9a1.5 1.5 0 0 1 0 2.1L8.5 18.5z"/>',
  refresh:   '<path d="M19 8a7 7 0 1 0 1.2 5"/><path d="M19.5 3.5V8H15"/>',
  compass:   '<circle cx="12" cy="12" r="8.4"/><path d="M15.2 8.8l-1.7 4.7-4.7 1.7 1.7-4.7z"/>',
  // weer
  'w-clear':   '<circle cx="12" cy="12" r="4"/><path d="M12 3.5v2.2M12 18.3v2.2M4.4 12h2.2M17.4 12h2.2M6.4 6.4l1.5 1.5M16.1 16.1l1.5 1.5M6.4 17.6l1.5-1.5M16.1 7.9l1.5-1.5"/>',
  'w-partly':  '<circle cx="8.5" cy="8" r="3"/><path d="M8.5 2.6v1.5M3.1 8h1.5M4.7 4.2l1 1M13 8.6a4 4 0 0 1 4.3 3.3 3 3 0 0 1-.5 6H8.4a3.4 3.4 0 0 1-.3-6.8A4.2 4.2 0 0 1 13 8.6z"/>',
  'w-cloud':   '<path d="M7.2 17.5a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10 .6 3.6 3.6 0 0 1-.6 7.1z"/>',
  'w-fog':     '<path d="M7.4 13.5a3.6 3.6 0 0 1-.4-7.2 4.8 4.8 0 0 1 9.2.5 3.2 3.2 0 0 1 .6 6.3"/><path d="M5 17h14M7 20h10"/>',
  'w-drizzle': '<path d="M7.4 14.5a3.8 3.8 0 0 1-.4-7.6 5 5 0 0 1 9.6.6 3.4 3.4 0 0 1-.3 6.7"/><path d="M9 17v2M12 17.5v2.5M15 17v2"/>',
  'w-rain':    '<path d="M7.4 13.5a3.8 3.8 0 0 1-.4-7.6 5 5 0 0 1 9.6.6 3.4 3.4 0 0 1-.3 6.7"/><path d="M8.6 16l-1 3M12 16l-1 3.4M15.4 16l-1 3"/>',
  'w-snow':    '<path d="M7.4 13.5a3.8 3.8 0 0 1-.4-7.6 5 5 0 0 1 9.6.6 3.4 3.4 0 0 1-.3 6.7"/><path d="M9 17.5h.01M12 19h.01M15 17.5h.01M10.5 20.5h.01M13.5 20.5h.01"/>',
  'w-storm':   '<path d="M7.4 13.5a3.8 3.8 0 0 1-.4-7.6 5 5 0 0 1 9.6.6 3.4 3.4 0 0 1-.3 6.7"/><path d="M12.5 15l-2.5 3.4h3L10.5 22"/>',
  'w-thermo':  '<path d="M10 13.5V6a2 2 0 0 1 4 0v7.5a3.5 3.5 0 1 1-4 0z"/><circle cx="12" cy="16.5" r="1.4" fill="currentColor" stroke="none"/>',
};

// Geeft een inline-SVG string terug. `cls` voegt extra classes toe.
export function icon(name, cls = '') {
  const p = PATHS[name];
  if (!p) return '';
  return `<svg class="ic${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" ${ATTR} aria-hidden="true">${p}</svg>`;
}

// Weercode → icoonnaam (Open-Meteo WMO codes)
export function weatherIconName(code) {
  if (code === 0) return 'w-clear';
  if (code === 1 || code === 2) return 'w-partly';
  if (code === 3) return 'w-cloud';
  if (code === 45 || code === 48) return 'w-fog';
  if (code >= 51 && code <= 57) return 'w-drizzle';
  if ((code >= 61 && code <= 67) || code === 80 || code === 81) return 'w-rain';
  if (code === 82) return 'w-storm';
  if (code >= 71 && code <= 77) return 'w-snow';
  if (code >= 95) return 'w-storm';
  return 'w-thermo';
}
