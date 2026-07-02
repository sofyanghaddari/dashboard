import { openDB, onWrite, onStorageError, all } from './db.js';
import { icon } from './icons.js';
import { err as toastErr, info as toastInfo } from './components/toast.js';
import { initRealtimeSync, scheduleAutoPush } from './auto-realtime-sync.js';
import { register, initRouter, navigate, currentRoute } from './router.js';
import { openSettings } from './components/settings.js';
import { initTheme, initAutoTheme } from './theme.js';
import { enablePullToRefresh } from './components/pullrefresh.js';
import { initCmdK, openSearch } from './components/cmdk.js';
import { bindRipple } from './animate.js';
import { revealView } from './motion.js';
import { autoHaptic } from './haptic.js';
import { initSwipeBack } from './gestures.js';
import { exportMonthPDF } from './pdf-export.js';
import { updateBadge } from './app-badge.js';
import { openCalendar } from './components/calendar.js';
import { openYearReview } from './components/year-review.js';
import { lockScreen } from './lock.js';
import { maybeAutoSync, maybeAutoPullOnOpen, syncMerge, getSyncStatus } from './github-sync.js';
import { migrateSessionKeys } from './settings.js';
import { initSyncPill, refresh as refreshSyncPill } from './components/sync-pill.js';
import { maybeAutoExport } from './auto-export.js';
import { maybeShowWeeklyReview } from './components/weekly-review.js';
import { checkAllNotifications, scheduleSwNotifications } from './notifications.js';
import { render as renderDashboard } from './modules/dashboard.js';

// Overige tabs lazy laden: scheelt fors parse-werk bij het opstarten
// (boekhouding alleen al is ±3200 regels). De service worker pre-cachet
// alle modules, dus offline werkt dit gewoon.
const lazyRender = (load) => {
  let mod = null;
  return async (view) => {
    mod ??= await load();
    return mod.render(view);
  };
};

async function bootApp() {
  migrateSessionKeys(); // Promoveer ghToken/ghEncPwd eenmalig van sessionStorage naar localStorage
  await openDB();
  onStorageError(() => toastErr('Opslag vol — maak ruimte vrij op je apparaat'));

  // Lege DB detecteren: als backup geconfigureerd is maar data ontbreekt → auto-herstel
  if (getSyncStatus().enabled && navigator.onLine) {
    const rides = await all('rides').catch(() => []);
    if (rides.length === 0) {
      try {
        await syncMerge();
        toastInfo('Data opgehaald uit backup');
      } catch (_) {
        setTimeout(() => toastInfo('Geen data gevonden — voer je GitHub-token in via Instellingen → Data', { duration: 10000 }), 3000);
      }
    }
  } else if (!getSyncStatus().enabled) {
    const rides = await all('rides').catch(() => []);
    if (rides.length === 0) {
      setTimeout(() => toastInfo('Geen backup gekoppeld — voer je GitHub-token in via Instellingen → Data', { duration: 10000 }), 3000);
    }
  }
  register('dashboard', renderDashboard);
  register('taxi', lazyRender(() => import('./modules/taxi.js')));
  register('geloof', lazyRender(() => import('./modules/geloof.js')));
  register('koran',  (v) => { v.dataset.geloofSub = 'koran';  navigate('geloof'); });
  register('arabic', (v) => { v.dataset.geloofSub = 'arabic'; navigate('geloof'); });
  register('grammatica', (v) => { v.dataset.geloofSub = 'grammatica'; navigate('geloof'); });
  register('goals', lazyRender(() => import('./modules/goals.js')));
  register('todo', lazyRender(() => import('./modules/todo.js')));
  register('notes', lazyRender(() => import('./modules/notes.js')));
  register('agenda', lazyRender(() => import('./modules/agenda.js')));
  register('stats', lazyRender(() => import('./modules/stats.js')));
  register('boekhouding', lazyRender(() => import('./modules/boekhouding.js')));
  initRouter();
  initAutoTheme();
  bindRipple();
  autoHaptic();
  initSwipeBack();
  window.openCalendar = openCalendar;
  window.staggerIn = revealView;
  window.openYearReview = openYearReview;

  document.getElementById('settings-btn').onclick = () => {
    openSettings(() => navigate(currentRoute() || 'dashboard'));
  };

  const updateOnline = () => document.body.classList.toggle('is-offline', !navigator.onLine);
  window.addEventListener('online', updateOnline);
  window.addEventListener('offline', updateOnline);
  updateOnline();

  enablePullToRefresh(() => navigate(currentRoute() || 'dashboard'));

  initCmdK();
  window.openCmdK = openSearch;

  initSyncPill();
  initRealtimeSync();
  onWrite(scheduleAutoPush);
  // ── Niet-kritische achtergrondtaken: uitstellen tot ná de eerste render +
  // splash-fade, zodat het opstarten vloeiend blijft (geen jank/stotter). ──
  const runWhenIdle = (fn) =>
    (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 2500 }) : setTimeout(fn, 400));
  runWhenIdle(() => {
    // Eerst remote mergen, dan auto-up (her-render pas ná de splash → geen flits)
    maybeAutoPullOnOpen().then(merged => {
      if (merged) { refreshSyncPill(); navigate(currentRoute() || 'dashboard'); }
      maybeAutoSync();
    });
    setInterval(maybeAutoSync, 60 * 60 * 1000);
    maybeAutoExport();
    maybeShowWeeklyReview();
    checkAllNotifications();
    scheduleSwNotifications();
    import('./push.js').then(m => m.refreshPushConfig()).catch(() => {});
    updateBadge();
    setInterval(updateBadge, 5 * 60 * 1000);
    // Auto-PDF op de 1e van de maand
    const todayStr = new Date().toISOString().slice(0,10);
    if (localStorage.getItem('autoPdf') === '1' && new Date().getDate() === 1) {
      const last = localStorage.getItem('lastAutoPdf');
      if (last !== todayStr.slice(0,7)) {
        localStorage.setItem('lastAutoPdf', todayStr.slice(0,7));
        const prev = new Date(); prev.setMonth(prev.getMonth() - 1);
        setTimeout(() => exportMonthPDF(prev), 2000);
      }
    }
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persisted().then(p => { if (!p) navigator.storage.persist(); });
    }
  });

  const _appStartTime = Date.now();
  let _deferredInstall = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _deferredInstall = e;
    const elapsed = Date.now() - _appStartTime;
    const delay = Math.max(0, 8000 - elapsed);
    setTimeout(() => {
      if (!_deferredInstall) return;
      if (document.getElementById('install-banner')) return;
      const banner = document.createElement('div');
      banner.id = 'install-banner';
      banner.style.cssText = [
        'position:fixed','bottom:80px','left:50%','transform:translateX(-50%)',
        'background:var(--card)','border:1px solid var(--accent)','border-radius:14px',
        'padding:12px 16px','z-index:9998','display:flex','align-items:center',
        'gap:12px','box-shadow:0 4px 24px rgba(0,0,0,.4)','max-width:calc(100vw - 32px)',
        'font-size:.9rem','animation:bk-fade-up .3s ease',
      ].join(';');
      banner.innerHTML = `
        <span style="display:inline-flex;color:var(--accent)">${icon('download', 'ic-lg')}</span>
        <span style="flex:1">Installeer de app op je homescreen</span>
        <button class="btn" style="padding:6px 14px;font-size:.83rem;white-space:nowrap" id="install-yes">Installeren</button>
        <button class="btn secondary" style="padding:6px 10px;font-size:.83rem" id="install-no">✕</button>
      `;
      banner.querySelector('#install-yes').onclick = async () => {
        banner.remove();
        _deferredInstall.prompt();
        await _deferredInstall.userChoice;
        _deferredInstall = null;
      };
      banner.querySelector('#install-no').onclick = () => banner.remove();
      document.body.appendChild(banner);
    }, delay);
  });

  if ('serviceWorker' in navigator) {
    let _swRefreshing = false;
    // Zodra de controller wisselt (nieuwe SW actief) → direct herladen
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!_swRefreshing) { _swRefreshing = true; window.location.reload(); }
    });

    navigator.serviceWorker.register('./service-worker.js').then(reg => {
      const _activate = (sw) => sw?.postMessage({ type: 'SKIP_WAITING' });

      // Al een wachtende SW aanwezig bij openen → meteen activeren
      if (reg.waiting) _activate(reg.waiting);

      // Nieuwe SW geïnstalleerd terwijl pagina open is → meteen activeren
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) _activate(nw);
        });
      });

      // Controleer elke 5 minuten op nieuwe versie (handig als PWA lang open staat)
      setInterval(() => reg.update(), 5 * 60 * 1000);
    }).catch(err => console.warn('SW error', err));
  }
}

function dismissSplash() {
  const s = document.getElementById('splash');
  if (s) { s.classList.add('hide'); setTimeout(() => s.remove(), 500); }
}

async function main() {
  initTheme();
  lockScreen(async () => { await bootApp(); setTimeout(dismissSplash, 200); });
}
main();
