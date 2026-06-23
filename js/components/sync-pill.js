// Sync-status pill bovenin (toont laatst gesynced + tap voor handmatige sync)
import { getSyncStatus, syncUp, syncMerge } from '../github-sync.js';
import { island } from './island.js';
import { navigate, currentRoute } from '../router.js';

let _el = null;
let _refreshTimer = null;

function ago(date) {
  if (!date) return 'nooit';
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return 'net';
  if (sec < 3600) return Math.floor(sec / 60) + 'm geleden';
  if (sec < 86400) return Math.floor(sec / 3600) + 'u geleden';
  return Math.floor(sec / 86400) + 'd geleden';
}

export function initSyncPill() {
  _el = document.createElement('button');
  _el.id = 'sync-pill';
  _el.className = 'sync-pill';
  _el.onclick = manualSync;
  document.body.appendChild(_el);
  refresh();
  _refreshTimer = setInterval(refresh, 30 * 1000);
  window.addEventListener('online', refresh);
  window.addEventListener('offline', refresh);
}

export function refresh() {
  if (!_el) return;
  const status = getSyncStatus();
  if (!status.enabled) { _el.style.display = 'none'; return; }
  _el.style.display = '';
  if (!navigator.onLine) {
    _el.dataset.state = 'offline';
    _el.innerHTML = '<span>📡</span><span>Offline</span>';
    return;
  }
  _el.dataset.state = 'idle';
  _el.innerHTML = `<span>☁️</span><span>${ago(status.last)}</span>`;
}

async function manualSync() {
  if (!navigator.onLine) { island('Geen verbinding', { icon: '📡', duration: 1500 }); return; }
  _el.dataset.state = 'busy';
  _el.innerHTML = '<span class="sync-spin">↻</span><span>Sync…</span>';
  try {
    const merge = await syncMerge();
    await syncUp();
    island(`Gesynced (${merge.added} nieuw, ${merge.updated} bijgewerkt)`, { icon: '✓', kind: 'ok', duration: 2000 });
    refresh();
    if (merge.added > 0 || merge.updated > 0) {
      navigate(currentRoute() || 'dashboard');
    }
  } catch (e) {
    _el.dataset.state = 'err';
    _el.innerHTML = '<span>⚠️</span><span>Mislukt</span>';
    island('Sync mislukt: ' + e.message, { icon: '⚠️', duration: 2500 });
    setTimeout(refresh, 3000);
  }
}
