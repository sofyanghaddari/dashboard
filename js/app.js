import { openDB } from './db.js';
import { register, initRouter, navigate, currentRoute } from './router.js';
import { openSettings } from './components/settings.js';
import { initTheme } from './theme.js';
import { enablePullToRefresh } from './components/pullrefresh.js';
import { initCmdK, openSearch } from './components/cmdk.js';
import { lockScreen } from './lock.js';
import { maybeAutoSync } from './github-sync.js';
import { render as renderDashboard } from './modules/dashboard.js';
import { render as renderTaxi } from './modules/taxi.js';
import { render as renderKoran } from './modules/koran.js';
import { render as renderArabic } from './modules/arabic.js';
import { render as renderGoals } from './modules/goals.js';
import { render as renderTodo } from './modules/todo.js';

async function bootApp() {
  await openDB();
  register('dashboard', renderDashboard);
  register('taxi', renderTaxi);
  register('koran', renderKoran);
  register('arabic', renderArabic);
  register('goals', renderGoals);
  register('todo', renderTodo);
  initRouter();

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

  maybeAutoSync();
  setInterval(maybeAutoSync, 60 * 60 * 1000);

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

async function main() {
  initTheme();
  lockScreen(bootApp);
}
main();
