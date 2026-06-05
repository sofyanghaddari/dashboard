// Wekelijkse auto-export naar Downloads (browser-prompt voor save)
import { all } from './db.js';
import { getSetting } from './settings.js';

const STORES = ['rides','expenses','hizb_log','cards','goals','todos','shifts','notes','habits','habit_log','pots'];
const WEEK_MS = 7 * 24 * 3600 * 1000;

export async function maybeAutoExport() {
  if (getSetting('autoExport') !== '1') return;
  const last = parseInt(localStorage.getItem('lastAutoExport') || '0', 10);
  if (Date.now() - last < WEEK_MS) return;

  const data = {};
  for (const s of STORES) data[s] = await all(s);
  data._exportedAt = new Date().toISOString();
  data._auto = true;

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'dashboard-auto-' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
  localStorage.setItem('lastAutoExport', Date.now().toString());
}
