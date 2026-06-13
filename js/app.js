import { openDB, onWrite } from './db.js';
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
import { maybeAutoSync, maybeAutoPullOnOpen } from './github-sync.js';
import { migrateSessionKeys } from './settings.js';
import { initSyncPill, refresh as refreshSyncPill } from './components/sync-pill.js';
import { maybeAutoExport } from './auto-export.js';
import { maybeShowWeeklyReview } from './components/weekly-review.js';
import { checkPendingNotifications } from './notifications.js';
import { render as renderDashboard } from './modules/dashboard.js';
import { render as renderTaxi } from './modules/taxi.js';
import { render as renderKoran } from './modules/koran.js';
import { render as renderArabic } from './modules/arabic.js';
import { render as renderGoals } from './modules/goals.js';
import { render as renderTodo } from './modules/todo.js';
import { render as renderNotes } from './modules/notes.js';
import { render as renderAgenda } from './modules/agenda.js';
import { render as renderStats } from './modules/stats.js';
import { render as renderBoekhouding } from './modules/boekhouding.js';

async function bootApp() {
  migrateSessionKeys(); // Promoveer ghToken/ghEncPwd eenmalig van sessionStorage naar localStorage
  await openDB();
  register('dashboard', renderDashboard);
  register('taxi', renderTaxi);
  register('koran', renderKoran);
  register('arabic', renderArabic);
  register('goals', renderGoals);
  register('todo', renderTodo);
  register('notes', renderNotes);
  register('agenda', renderAgenda);
  register('stats', renderStats);
  register('boekhouding', renderBoekhouding);
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
  // Probeer eerst remote te mergen, dan auto-up
  maybeAutoPullOnOpen().then(merged => {
    if (merged) { refreshSyncPill(); navigate(currentRoute() || 'dashboard'); }
    maybeAutoSync();
  });
  setInterval(maybeAutoSync, 60 * 60 * 1000);
  maybeAutoExport();
  maybeShowWeeklyReview();
  checkPendingNotifications();
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

  const _appStartTime = Date.now();
  let _deferredInstall = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _deferredInstall = e;
    const elapsed = Date.now() - _appStartTime;
    const delay = Math.max(0, 8000 - elapsed);
    setTimeout(() => {
      if (!_deferredInstall) return; // al gebruikt of afgewezen
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.id = 'install-btn';
      btn.textContent = 'App installeren';
      btn.style.cssText = 'position:fixed;top:8px;left:8px;z-index:30';
      btn.onclick = async () => {
        btn.remove();
        _deferredInstall.prompt();
        await _deferredInstall.userChoice;
        _deferredInstall = null;
      };
      document.body.appendChild(btn);
    }, delay);
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').then(reg => {
      // Luister naar SW-berichten (bijv. SW_UPDATED)
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data?.type === 'SW_UPDATED') {
          _showUpdateBanner(reg);
        }
      });
      // Als er al een wachtende SW is bij registratie
      if (reg.waiting) {
        _showUpdateBanner(reg);
      }
      // Nieuwe SW geïnstalleerd terwijl pagina open is
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            _showUpdateBanner(reg);
          }
        });
      });
    }).catch(err => console.warn('SW error', err));
  }

  function _showUpdateBanner(reg) {
    if (document.getElementById('sw-update-banner')) return; // al zichtbaar
    const banner = document.createElement('div');
    banner.id = 'sw-update-banner';
    banner.style.cssText = [
      'position:fixed','bottom:80px','left:50%','transform:translateX(-50%)',
      'background:var(--card)','border:1px solid var(--accent)','border-radius:12px',
      'padding:12px 16px','z-index:9999','display:flex','align-items:center',
      'gap:12px','box-shadow:0 4px 20px rgba(0,0,0,.35)','max-width:calc(100vw - 32px)',
      'font-size:.93rem'
    ].join(';');
    banner.innerHTML = `
      <span>Nieuwe versie beschikbaar</span>
      <button class="btn" style="padding:6px 14px;font-size:.88rem" id="sw-reload-btn">Herladen</button>
    `;
    document.body.appendChild(banner);
    banner.querySelector('#sw-reload-btn').onclick = () => {
      const sw = reg.waiting || (reg.active);
      if (sw) sw.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    };
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
