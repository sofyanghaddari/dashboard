const routes = {};
let currentView = null;
let renderToken = 0;
let firstNav = true;      // eerste navigatie: hash via replaceState (geen redirect/history-entry)
let suppressHash = false; // eigen hash-schrijfactie niet nogmaals afhandelen in hashchange

const prefersReduced = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export function register(name, renderFn) { routes[name] = renderFn; }

export async function navigate(name) {
  const route = routes[name] ? name : 'dashboard';
  const view = document.getElementById('view');

  // Scroll direct naar boven bij tab-wissel (behavior instant = geen animatie-lag)
  window.scrollTo({ top: 0, behavior: 'instant' });

  // Exit animation — fade + slight upward drift (first load has no content → skip)
  if (view.children.length > 0 && !prefersReduced()) {
    view.style.animation = 'viewOut .16s var(--ease-standard) forwards';
    await new Promise(r => setTimeout(r, 145));
  }

  view.innerHTML = `
    <div class="tab-skeleton">
      <div class="sk-hero"></div>
      <div class="sk-stats"><div class="sk-stat"></div><div class="sk-stat"></div></div>
      <div class="sk-card"></div>
      <div class="sk-card"></div>
      <div class="sk-card"></div>
    </div>`;

  // Re-trigger the CSS viewIn animation on .view
  view.style.animation = 'none';
  void view.offsetHeight; // force reflow
  view.style.animation = '';

  // Update tabs + bounce the icon of the newly active tab
  document.querySelectorAll('.tab').forEach(t => {
    const active = t.dataset.route === route;
    t.classList.toggle('active', active);
    t.setAttribute('aria-selected', active ? 'true' : 'false');
    if (active && !prefersReduced()) {
      t.classList.remove('tab-pop');
      void t.offsetHeight;
      t.classList.add('tab-pop');
      setTimeout(() => t.classList.remove('tab-pop'), 520);
    }
  });

  currentView = route;
  if (location.hash !== '#' + route) {
    if (firstNav) {
      history.replaceState(null, '', '#' + route);
    } else {
      suppressHash = true;
      location.hash = '#' + route;
    }
  }
  firstNav = false;
  const token = ++renderToken;
  try {
    await routes[route](view);
    if (token !== renderToken) return; // navigated away during async render
    if (window.staggerIn) window.staggerIn(view);
  } catch (err) {
    if (token !== renderToken) return;
    console.error('Render error in tab:', err);
    view.innerHTML = `<div class="card" style="margin:1rem"><p>Er ging iets mis bij het laden. Probeer opnieuw.</p></div>`;
  }
}

export function currentRoute() { return currentView; }

export function initRouter() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => navigate(tab.dataset.route));
  });
  // Terugknop in Safari + app-shortcuts ("./#taxi") terwijl de app al open is
  window.addEventListener('hashchange', () => {
    if (suppressHash) { suppressHash = false; return; }
    const r = (location.hash || '#dashboard').slice(1);
    if (r !== currentView) navigate(r);
  });
  const initial = (location.hash || '#dashboard').slice(1);
  navigate(initial);
}
