const routes = {};
let currentView = null;
let renderToken = 0;

const prefersReduced = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export function register(name, renderFn) { routes[name] = renderFn; }

export async function navigate(name) {
  const route = routes[name] ? name : 'dashboard';
  const view = document.getElementById('view');

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
  location.hash = '#' + route;
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
  const initial = (location.hash || '#dashboard').slice(1);
  navigate(initial);
}
