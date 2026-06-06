// Realtime sync: debounced push bij elke wijziging, pull bij focus
import { syncUp, syncMerge, getSyncStatus } from './github-sync.js';
import { refresh as refreshPill } from './components/sync-pill.js';

let _pushTimer = null;
const PUSH_DEBOUNCE = 8000; // 8 sec na laatste wijziging

export function scheduleAutoPush() {
  if (!getSyncStatus().enabled || !navigator.onLine) return;
  if (_pushTimer) clearTimeout(_pushTimer);
  _pushTimer = setTimeout(async () => {
    _pushTimer = null;
    try { await syncUp(); refreshPill(); } catch (e) { console.warn('Auto-push', e); }
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
