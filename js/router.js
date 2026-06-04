const routes = {};
let currentView = null;

export function register(name, renderFn) { routes[name] = renderFn; }

export async function navigate(name) {
  const route = routes[name] ? name : 'dashboard';
  const view = document.getElementById('view');
  view.innerHTML = '';
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.route === route);
  });
  currentView = route;
  location.hash = '#' + route;
  await routes[route](view);
  if (window.staggerIn) window.staggerIn(view);
}

export function currentRoute() { return currentView; }

export function initRouter() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => navigate(tab.dataset.route));
  });
  const initial = (location.hash || '#dashboard').slice(1);
  navigate(initial);
}
