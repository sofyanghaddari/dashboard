// Auto-backup naar GitHub Gist met versie-historie, multi-gist en restore.
import { all, put, clear } from './db.js';
import { getSetting, setSetting } from './settings.js';
import { encrypt, decrypt, isEncrypted } from './crypto.js';

const STORES = ['rides','expenses','hizb_log','cards','goals','todos','shifts','notes','habits','habit_log','pots'];
const LATEST_FILE = 'dashboard-backup.json';
const KEEP_VERSIONS = 30;

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
    monthlyIncomeGoal: getSetting('monthlyIncomeGoal'),
    taxReservePercent: getSetting('taxReservePercent'),
    hizbReminderTime: getSetting('hizbReminderTime'),
    hizbStartPoint: getSetting('hizbStartPoint'),
    themeMode: getSetting('themeMode'),
    accentColor: getSetting('accentColor'),
    themePreset: getSetting('themePreset'),
    density: getSetting('density'),
  };
  data._syncedAt = new Date().toISOString();
  return JSON.stringify(data, null, 2);
}

function getGistIds() {
  const raw = localStorage.getItem('ghGistIds');
  if (raw) return JSON.parse(raw);
  // Legacy: single gistId
  const single = localStorage.getItem('ghGistId');
  return single ? [single] : [];
}

function setGistIds(ids) {
  localStorage.setItem('ghGistIds', JSON.stringify(ids));
  if (ids[0]) localStorage.setItem('ghGistId', ids[0]); // backwards compat
}

function snapshotFilename() {
  const d = new Date();
  const pad = n => String(n).padStart(2,'0');
  return `backup-${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.json`;
}

export async function syncUp() {
  const token = localStorage.getItem('ghToken');
  if (!token) throw new Error('Geen GitHub token ingesteld');
  let content = await buildPayload();
  const encPwd = sessionStorage.getItem('ghEncPwd');
  if (encPwd) content = await encrypt(content, encPwd);

  const ids = getGistIds();
  const newId = ids.length === 0;

  if (newId) {
    const gist = await api('/gists', token, {
      method: 'POST',
      body: JSON.stringify({
        description: 'Dashboard backup',
        public: false,
        files: {
          [LATEST_FILE]: { content },
          [snapshotFilename()]: { content },
        },
      }),
    });
    setGistIds([gist.id]);
  } else {
    // Sync naar alle gists
    for (const gistId of ids) {
      try {
        const gist = await api(`/gists/${gistId}`, token);
        const backupFiles = Object.keys(gist.files).filter(f => f.startsWith('backup-')).sort();
        const files = { [LATEST_FILE]: { content }, [snapshotFilename()]: { content } };
        // Verwijder oudste als boven KEEP_VERSIONS
        const totalAfter = backupFiles.length + 1;
        if (totalAfter > KEEP_VERSIONS) {
          const toDelete = backupFiles.slice(0, totalAfter - KEEP_VERSIONS);
          toDelete.forEach(f => { files[f] = null; });
        }
        await api(`/gists/${gistId}`, token, {
          method: 'PATCH',
          body: JSON.stringify({ files }),
        });
      } catch (e) { console.warn('Sync naar gist faalde', gistId, e); }
    }
  }
  setSetting('lastGhSync', new Date().toISOString());
}

async function fetchPayload(specificFile = LATEST_FILE) {
  const token = localStorage.getItem('ghToken');
  const ids = getGistIds();
  if (!token || !ids.length) throw new Error('GitHub niet geconfigureerd');
  let content = null;
  for (const gistId of ids) {
    try {
      const gist = await api(`/gists/${gistId}`, token);
      content = gist.files[specificFile]?.content;
      if (content) break;
    } catch (_) {}
  }
  if (!content) throw new Error('Geen backup gevonden');
  if (isEncrypted(content)) {
    const pwd = sessionStorage.getItem('ghEncPwd') || prompt('Backup is versleuteld. Voer wachtwoord in:');
    if (!pwd) throw new Error('Wachtwoord verplicht');
    try { content = await decrypt(content, pwd); sessionStorage.setItem('ghEncPwd', pwd); }
    catch (e) { throw new Error('Wachtwoord onjuist of bestand beschadigd'); }
  }
  return JSON.parse(content);
}

// Vol overschrijven (oude gedrag, voor versie-restore)
export async function syncDown(specificFile = LATEST_FILE) {
  const data = await fetchPayload(specificFile);
  for (const s of STORES) {
    if (!Array.isArray(data[s])) continue;
    await clear(s);
    for (const item of data[s]) await put(s, item);
  }
  if (data._settings) for (const [k, v] of Object.entries(data._settings)) if (v != null) setSetting(k, v);
  setSetting('lastGhSync', new Date().toISOString());
}

// Slim mergen: combineert local + remote, nieuwste wint per record
export async function syncMerge() {
  const data = await fetchPayload();
  let added = 0, updated = 0, kept = 0;

  for (const s of STORES) {
    if (!Array.isArray(data[s])) continue;
    const local = await all(s);
    const localByKey = new Map();
    const key = getKeyField(s);
    local.forEach(item => localByKey.set(item[key], item));

    for (const remote of data[s]) {
      const k = remote[key];
      const localItem = localByKey.get(k);
      if (!localItem) {
        await put(s, remote); added++;
      } else {
        const winner = pickWinner(s, localItem, remote);
        if (winner !== localItem) { await put(s, winner); updated++; }
        else kept++;
        localByKey.delete(k);
      }
    }
    // Items die alleen lokaal bestaan blijven gewoon staan
  }

  // Settings mergen op laatste sync-tijdstip
  if (data._settings) {
    const remoteSyncedAt = new Date(data._syncedAt || 0).getTime();
    const lastLocalSync = new Date(getSetting('lastGhSync') || 0).getTime();
    if (remoteSyncedAt > lastLocalSync) {
      for (const [k, v] of Object.entries(data._settings)) if (v != null) setSetting(k, v);
    }
  }
  setSetting('lastGhSync', new Date().toISOString());
  return { added, updated, kept };
}

function getKeyField(store) {
  if (store === 'hizb_log') return 'date';
  return 'id';
}

function tsField(item, fields) {
  return fields.reduce((m, f) => Math.max(m, +new Date(item[f] || 0)), 0);
}

function pickWinner(store, local, remote) {
  // Per-store conflict resolution
  switch (store) {
    case 'rides':
    case 'expenses':
    case 'shifts':
      // Vergelijk op datum/startTime — nieuwste wint (mocht iets bewerkt zijn)
      return tsField(remote, ['date','startTime','endTime']) > tsField(local, ['date','startTime','endTime']) ? remote : local;
    case 'hizb_log':
      return remote;
    case 'cards': {
      // Hoger repetitions = recenter beoefend
      const rR = Number(remote.repetitions || 0), lR = Number(local.repetitions || 0);
      if (rR !== lR) return rR > lR ? remote : local;
      return tsField(remote, ['dueDate','createdAt']) > tsField(local, ['dueDate','createdAt']) ? remote : local;
    }
    case 'goals':
      // Hoger progress wint, anders nieuwer
      if (Number(remote.progress || 0) !== Number(local.progress || 0))
        return Number(remote.progress || 0) > Number(local.progress || 0) ? remote : local;
      return remote;
    case 'todos':
      // Afgevinkt wint van niet-afgevinkt
      if (local.done !== remote.done) return remote.done ? remote : local;
      return tsField(remote, ['completedAt','createdAt']) > tsField(local, ['completedAt','createdAt']) ? remote : local;
    case 'notes':
    case 'habits':
      return tsField(remote, ['updatedAt','createdAt']) > tsField(local, ['updatedAt','createdAt']) ? remote : local;
    case 'habit_log':
      return remote;
    case 'pots':
      // Hoger current = recente storting
      return Number(remote.current || 0) > Number(local.current || 0) ? remote : local;
    default:
      return remote;
  }
}

export async function listVersions() {
  const token = localStorage.getItem('ghToken');
  const ids = getGistIds();
  if (!token || !ids.length) return [];
  const seen = new Set();
  const versions = [];
  for (const gistId of ids) {
    try {
      const gist = await api(`/gists/${gistId}`, token);
      Object.entries(gist.files).forEach(([name, file]) => {
        if (!name.startsWith('backup-') || seen.has(name)) return;
        seen.add(name);
        // parse date+time uit naam: backup-YYYY-MM-DD-HHMM.json
        const m = name.match(/backup-(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})\.json/);
        const date = m ? new Date(+m[1], +m[2]-1, +m[3], +m[4], +m[5]) : null;
        versions.push({ filename: name, size: file.size, date, gistId });
      });
    } catch (_) {}
  }
  return versions.sort((a, b) => (b.date || 0) - (a.date || 0));
}

export function getSyncStatus() {
  const token = localStorage.getItem('ghToken');
  const ids = getGistIds();
  const last = getSetting('lastGhSync');
  return {
    enabled: !!token && ids.length > 0,
    last: last ? new Date(last) : null,
    gistCount: ids.length,
    gistIds: ids,
  };
}

export function setupGithub(token, gistId = '') {
  if (!token) {
    localStorage.removeItem('ghToken');
    localStorage.removeItem('ghGistId');
    localStorage.removeItem('ghGistIds');
    return;
  }
  localStorage.setItem('ghToken', token);
  if (gistId) setGistIds([gistId]);
}

export function addSecondaryGist(gistId) {
  const ids = getGistIds();
  if (!gistId || ids.includes(gistId)) return;
  ids.push(gistId);
  setGistIds(ids);
}

export function removeGist(gistId) {
  const ids = getGistIds().filter(id => id !== gistId);
  setGistIds(ids);
}

export async function maybeAutoSync() {
  const status = getSyncStatus();
  if (!status.enabled) return;
  if (status.last && (Date.now() - status.last.getTime()) < 3600 * 1000) return;
  try { await syncUp(); } catch (e) { console.warn('Auto-sync failed', e); }
}

// Bij app-open: pull eerst remote en merge
export async function maybeAutoPullOnOpen() {
  if (getSetting('autoPullOnOpen') !== '1') return false;
  const status = getSyncStatus();
  if (!status.enabled) return false;
  if (!navigator.onLine) return false;
  try { await syncMerge(); return true; }
  catch (e) { console.warn('Auto-pull failed', e); return false; }
}

export async function createSecondaryGist() {
  const token = localStorage.getItem('ghToken');
  if (!token) throw new Error('Geen token');
  let content = await buildPayload();
  const encPwd = sessionStorage.getItem('ghEncPwd');
  if (encPwd) content = await encrypt(content, encPwd);
  const gist = await api('/gists', token, {
    method: 'POST',
    body: JSON.stringify({
      description: 'Dashboard backup (mirror)',
      public: false,
      files: { [LATEST_FILE]: { content }, [snapshotFilename()]: { content } },
    }),
  });
  addSecondaryGist(gist.id);
  return gist.id;
}

export function emailGistLink() {
  const ids = getGistIds();
  if (!ids.length) return;
  const links = ids.map(id => `https://gist.github.com/${id}`).join('%0A');
  const subject = encodeURIComponent('Mijn Dashboard backup-link');
  const body = encodeURIComponent(
    `Mijn dashboard-backup staat hier:\n\n` +
    ids.map(id => `https://gist.github.com/${id}`).join('\n') +
    `\n\nGist-ID('s) bewaren voor herstel:\n${ids.join('\n')}\n\nLaatste sync: ${getSetting('lastGhSync') || 'onbekend'}`
  );
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}
