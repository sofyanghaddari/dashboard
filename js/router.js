const routes = {};
let currentView = null;
let renderToken = 0;

export function register(name, renderFn) { routes[name] = renderFn; }

export async function navigate(name) {
  const route = routes[name] ? name : 'dashboard';
  const view = document.getElementById('view');
  view.innerHTML = '';
  // Her-trigger de viewIn-animatie zodat elke tab-wissel een zachte
  // fade-up krijgt (speelde anders alleen bij de allereerste load).
  view.style.animation = 'none';
  void view.offsetHeight;
  view.style.animation = '';
  document.querySelectorAll('.tab').forEach(t => {
    const active = t.dataset.route === route;
    t.classList.toggle('active', active);
    t.setAttribute('aria-selected', active ? 'true' : 'false');
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
