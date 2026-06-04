let _container = null;

function ensureContainer() {
  if (_container) return _container;
  _container = document.createElement('div');
  _container.className = 'toast-container';
  document.body.appendChild(_container);
  return _container;
}

export function toast(message, opts = {}) {
  const { type = 'info', duration = 3000, action = null } = opts;
  const c = ensureContainer();
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `
    <div class="toast-msg">${message}</div>
    ${action ? `<button class="toast-action">${action.label}</button>` : ''}
  `;
  c.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));

  let timer = setTimeout(remove, duration);
  function remove() {
    clearTimeout(timer);
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }

  if (action) {
    el.querySelector('.toast-action').onclick = () => {
      action.onClick();
      remove();
    };
  }
  el.addEventListener('click', (e) => {
    if (e.target.classList.contains('toast-action')) return;
    remove();
  });
  return remove;
}

export const ok = (m, o) => toast(m, { ...o, type: 'ok' });
export const err = (m, o) => toast(m, { ...o, type: 'err' });
export const info = (m, o) => toast(m, { ...o, type: 'info' });
