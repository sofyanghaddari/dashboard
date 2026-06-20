// Auto-backup naar GitHub Gist met versie-historie, multi-gist en restore.
import { all, put, clear } from './db.js';
import { getSetting, setSetting, removeSetting } from './settings.js';
import { encrypt, decrypt, isEncrypted } from './crypto.js';

function askPassword() {
  return new Promise((resolve, reject) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <button type="button" class="modal-close" id="pw-x" aria-label="Sluiten">×</button>
        <h2>Backup is versleuteld</h2>
        <form id="pw-form">
          <label>Wachtwoord</label>
          <input name="pwd" type="password" autocomplete="current-password" required autofocus />
          <p id="pw-err" style="color:var(--danger);font-size:.88rem;min-height:1em;margin:6px 0 0"></p>
          <div class="row" style="margin-top:16px">
            <button type="submit" class="btn block">Ontgrendelen</button>
          </div>
        </form>
      </div>`;
    document.body.appendChild(backdrop);
    const close = (val) => { backdrop.remove(); resolve(val); };
    backdrop.querySelector('#pw-x').onclick = () => close(null);
    backdrop.addEventListener('click', e => { if (e.target === backdrop) close(null); });
    backdrop.querySelector('#pw-form').onsubmit = e => {
      e.preventDefault();
      close(new FormData(e.target).get('pwd'));
    };
  });
}

const STORES = ['rides','expenses','hizb_log','cards','goals','todos','shifts','notes','habits','habit_log','pots','invoices','purchase_invoices','km_log','clients','taxi_expenses','agenda_events'];
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

// Zoek een bestaande dashboard-gist in het account (meest recent bijgewerkt eerst).
// Voorkomt dat er telkens een NIEUWE gist wordt aangemaakt wanneer de lokale
// gist-ID kwijt is (bv. na storage-eviction, browser-data wissen, of op een
// apart PWA-storage-partitie). Niet-primaire "mirror"-gists worden achteraan gezet.
async function findExistingDashboardGistId(token) {
  try {
    const gists = await api('/gists?per_page=100', token);
    const matches = gists
      .filter(g => /dashboard/i.test(g.description || '') ||
                   Object.keys(g.files || {}).some(f => f === LATEST_FILE || f.startsWith('backup-')))
      .sort((a, b) => {
        // Primaire backups vóór mirrors, daarna nieuwste eerst
        const am = /mirror/i.test(a.description || '') ? 1 : 0;
        const bm = /mirror/i.test(b.description || '') ? 1 : 0;
        if (am !== bm) return am - bm;
        return new Date(b.updated_at) - new Date(a.updated_at);
      });
    return matches.length ? matches[0].id : null;
  } catch (_) {
    return null; // bij netwerkfout: terugvallen op normaal gedrag
  }
}

export async function syncUp() {
  const token = getSetting('ghToken');
  if (!token) throw new Error('Geen GitHub token ingesteld');
  let content = await buildPayload();
  const encPwd = getSetting('ghEncPwd');
  if (encPwd) content = await encrypt(content, encPwd);

  let ids = getGistIds();

  // Geen lokale gist-ID? Probeer eerst een BESTAANDE dashboard-gist te hergebruiken
  // i.p.v. blind een nieuwe aan te maken (oorzaak van de "te veel gists"-bug).
  if (ids.length === 0) {
    const existing = await findExistingDashboardGistId(token);
    if (existing) {
      setGistIds([existing]);
      ids = getGistIds();
    }
  }

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

  // Registreer Background Sync als fallback (werkt offline → herstart zodra online)
  _registerBackgroundSync();
}

function _registerBackgroundSync() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.ready.then(reg => {
    if (!reg.sync) return; // Browser ondersteunt Background Sync niet
    reg.sync.register('github-sync').catch(err => console.warn('Background sync registratie mislukt', err));
  }).catch(() => {});
}

// Luister naar SW-berichten die een sync-poging triggeren (bijv. na background sync event)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data?.type === 'BACKGROUND_SYNC_TRIGGER') {
      maybeAutoSync().catch(err => console.warn('Background sync trigger mislukt', err));
    }
  });
}

async function fetchPayload(specificFile = LATEST_FILE) {
  const token = getSetting('ghToken');
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
    const pwd = getSetting('ghEncPwd') || await askPassword();
    if (!pwd) throw new Error('Wachtwoord verplicht');
    try { content = await decrypt(content, pwd); setSetting('ghEncPwd', pwd); }
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
  // Universeel: _updatedAt wint altijd (gezet bij elke schrijf-actie)
  const lUpd = Number(local._updatedAt || 0);
  const rUpd = Number(remote._updatedAt || 0);
  if (lUpd > 0 || rUpd > 0) {
    if (rUpd > lUpd) return remote;
    if (lUpd > rUpd) return local;
  }
  // Fallback per-store
  switch (store) {
    case 'rides':
    case 'expenses':
    case 'shifts':
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
  const token = getSetting('ghToken');
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
  const token = getSetting('ghToken');
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
    removeSetting('ghToken');
    localStorage.removeItem('ghGistId');
    localStorage.removeItem('ghGistIds');
    return;
  }
  setSetting('ghToken', token);
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

// Lijst alle dashboard-gerelateerde gists van de gebruiker
export async function findMyGists() {
  const token = getSetting('ghToken');
  if (!token) throw new Error('Geen token');
  const all = await api('/gists?per_page=100', token);
  return all
    .filter(g => /dashboard/i.test(g.description || '') || Object.keys(g.files).some(f => f === LATEST_FILE || f.startsWith('backup-')))
    .map(g => ({
      id: g.id,
      description: g.description || '(geen omschrijving)',
      created_at: g.created_at,
      updated_at: g.updated_at,
      files: Object.keys(g.files),
      isCurrent: getGistIds().includes(g.id),
    }));
}

// Wissel huidige gist-ID voor opgegeven ID (zonder nieuwe aanmaken)
export function useExistingGist(gistId) {
  if (!gistId) throw new Error('Geen gist-ID');
  setGistIds([gistId]);
}

// Voeg bestaande gist-ID toe als secundaire
export function useExistingAsSecondary(gistId) {
  if (!gistId) throw new Error('Geen gist-ID');
  addSecondaryGist(gistId);
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
  const token = getSetting('ghToken');
  if (!token) throw new Error('Geen token');
  let content = await buildPayload();
  const encPwd = getSetting('ghEncPwd');
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
