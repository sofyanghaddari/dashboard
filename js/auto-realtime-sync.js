// Realtime sync: debounced push bij elke wijziging, pull bij focus
import { syncUp, syncMerge, getSyncStatus } from './github-sync.js';
import { refresh as refreshPill } from './components/sync-pill.js';
import { info } from './components/toast.js';

let _pushTimer = null;
let _lastSyncErrShown = 0;
const PUSH_DEBOUNCE  = 8000;
const SYNC_ERR_QUIET = 5 * 60_000; // max 1 melding per 5 min

function notifySyncErr(e) {
  console.warn('Auto-push', e);
  if (Date.now() - _lastSyncErrShown < SYNC_ERR_QUIET) return;
  _lastSyncErrShown = Date.now();
  info('Backup mislukt — controleer je verbinding of GitHub-token');
}

export function scheduleAutoPush() {
  if (!getSyncStatus().enabled || !navigator.onLine) return;
  if (_pushTimer) clearTimeout(_pushTimer);
  _pushTimer = setTimeout(async () => {
    _pushTimer = null;
    try { await syncUp(); refreshPill(); } catch (e) { notifySyncErr(e); }
  }, PUSH_DEBOUNCE);
}

export function initRealtimeSync() {
  // Bij verbergen tab/app: meteen push (geen wachten)
  document.addEventListener('visibilitychange', async () => {
    if (document.hidden) {
      if (_pushTimer) { clearTimeout(_pushTimer); _pushTimer = null; }
      if (getSyncStatus().enabled && navigator.onLine) {
        try { await syncUp(); } catch (_) {}
      }
    } else {
      // Bij weer-zichtbaar: merge remote in
      if (getSyncStatus().enabled && navigator.onLine) {
        try { await syncMerge(); refreshPill(); } catch (_) {}
      }
    }
  });

  // Bij window-blur (desktop browser)
  window.addEventListener('pagehide', async () => {
    if (_pushTimer) { clearTimeout(_pushTimer); _pushTimer = null; }
    if (getSyncStatus().enabled && navigator.onLine) {
      try { await syncUp(); } catch (_) {}
    }
  });
}
