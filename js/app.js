import { openDB } from './db.js';
import { register, initRouter, navigate, currentRoute } from './router.js';
import { openSettings } from './components/settings.js';
import { initTheme } from './theme.js';
import { enablePullToRefresh } from './components/pullrefresh.js';
import { initCmdK, openSearch } from './components/cmdk.js';
import { bindRipple, staggerIn } from './animate.js';
import { autoHaptic } from './haptic.js';
import { initSwipeBack } from './gestures.js';
import { exportMonthPDF } from './pdf-export.js';
import { updateBadge } from './app-badge.js';
import { openCalendar } from './components/calendar.js';
import { openYearReview } from './components/year-review.js';
import { lockScreen } from './lock.js';
import { maybeAutoSync, maybeAutoPullOnOpen } from './github-sync.js';
import { initSyncPill, refresh as refreshSyncPill } from './components/sync-pill.js';
import { maybeAutoExport } from './auto-export.js';
import { maybeShowWeeklyReview } from './components/weekly-review.js';
import { render as renderDashboard } from './modules/dashboard.js';
import { render as renderTaxi } from './modules/taxi.js';
import { render as renderKoran } from './modules/koran.js';
import { render as renderArabic } from './modules/arabic.js';
import { render as renderGoals } from './modules/goals.js';
import { render as renderTodo } from './modules/todo.js';
import { render as renderNotes } from './modules/notes.js';

async function bootApp() {
  await openDB();
  register('dashboard', renderDashboard);
  register('taxi', renderTaxi);
  register('koran', renderKoran);
  register('arabic', renderArabic);
  register('goals', renderGoals);
  register('todo', renderTodo);
  register('notes', renderNotes);
  initRouter();
  bindRipple();
  autoHaptic();
  initSwipeBack();
  window.openCalendar = openCalendar;
  window.staggerIn = staggerIn;
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
  // Probeer eerst remote te mergen, dan auto-up
  maybeAutoPullOnOpen().then(merged => {
    if (merged) { refreshSyncPill(); navigate(currentRoute() || 'dashboard'); }
    maybeAutoSync();
  });
  setInterval(maybeAutoSync, 60 * 60 * 1000);
  maybeAutoExport();
  maybeShowWeeklyReview();
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

  let _deferredInstall = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _deferredInstall = e;
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = 'App installeren';
    btn.style.cssText = 'position:fixed;top:8px;left:8px;z-index:30';
    btn.onclick = async () => {
      btn.remove();
      _deferredInstall.prompt();
      await _deferredInstall.userChoice;
      _deferredInstall = null;
    };
    document.body.appendChild(btn);
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(err => console.warn('SW error', err));
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
