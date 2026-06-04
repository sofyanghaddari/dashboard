// Auto-backup naar GitHub Gist. Vereist eenmalige PAT-setup.
import { all, put, clear } from './db.js';
import { getSetting, setSetting } from './settings.js';

const STORES = ['rides','expenses','hizb_log','cards','goals','todos','shifts','notes','habits','habit_log','pots'];
const FILE = 'dashboard-backup.json';

async function api(path, token, opts = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...opts,
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function buildPayload() {
  const data = {};
  for (const s of STORES) data[s] = await all(s);
  data._settings = {
    dailyIncomeGoal: getSetting('dailyIncomeGoal'),
    taxReservePercent: getSetting('taxReservePercent'),
    hizbReminderTime: getSetting('hizbReminderTime'),
    hizbStartPoint: getSetting('hizbStartPoint'),
    themeMode: getSetting('themeMode'),
    accentColor: getSetting('accentColor'),
  };
  data._syncedAt = new Date().toISOString();
  return JSON.stringify(data, null, 2);
}

export async function syncUp() {
  const token = localStorage.getItem('ghToken');
  if (!token) throw new Error('Geen GitHub token ingesteld');
  const gistId = localStorage.getItem('ghGistId');
  const content = await buildPayload();
  if (gistId) {
    await api(`/gists/${gistId}`, token, {
      method: 'PATCH',
      body: JSON.stringify({ files: { [FILE]: { content } } }),
    });
  } else {
    const gist = await api('/gists', token, {
      method: 'POST',
      body: JSON.stringify({
        description: 'Dashboard backup',
        public: false,
        files: { [FILE]: { content } },
      }),
    });
    localStorage.setItem('ghGistId', gist.id);
  }
  setSetting('lastGhSync', new Date().toISOString());
}

export async function syncDown() {
  const token = localStorage.getItem('ghToken');
  const gistId = localStorage.getItem('ghGistId');
  if (!token || !gistId) throw new Error('GitHub niet geconfigureerd');
  const gist = await api(`/gists/${gistId}`, token);
  const content = gist.files[FILE]?.content;
  if (!content) throw new Error('Geen backup in gist gevonden');
  const data = JSON.parse(content);
  for (const s of STORES) {
    if (!Array.isArray(data[s])) continue;
    await clear(s);
    for (const item of data[s]) await put(s, item);
  }
  if (data._settings) for (const [k, v] of Object.entries(data._settings)) if (v != null) setSetting(k, v);
  setSetting('lastGhSync', new Date().toISOString());
}

export function getSyncStatus() {
  const token = localStorage.getItem('ghToken');
  const last = getSetting('lastGhSync');
  return {
    enabled: !!token,
    last: last ? new Date(last) : null,
  };
}

export function setupGithub(token, gistId = '') {
  if (!token) { localStorage.removeItem('ghToken'); localStorage.removeItem('ghGistId'); return; }
  localStorage.setItem('ghToken', token);
  if (gistId) localStorage.setItem('ghGistId', gistId);
}

// Auto-sync: silently push if enabled and last sync > 1 hour ago
export async function maybeAutoSync() {
  const status = getSyncStatus();
  if (!status.enabled) return;
  if (status.last && (Date.now() - status.last.getTime()) < 3600 * 1000) return;
  try { await syncUp(); } catch (e) { console.warn('Auto-sync failed', e); }
}
