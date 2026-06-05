// Long-press context-menu helper
const LONG_MS = 500;

export function enableLongPress(selector, onLongPress) {
  let timer = null;
  let startTarget = null;
  document.addEventListener('touchstart', (e) => {
    const el = e.target.closest(selector);
    if (!el) return;
    startTarget = el;
    timer = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(20);
      onLongPress(el, e);
      timer = null;
    }, LONG_MS);
  }, { passive: true });
  const cancel = () => { if (timer) { clearTimeout(timer); timer = null; } startTarget = null; };
  document.addEventListener('touchmove', cancel, { passive: true });
  document.addEventListener('touchend', cancel);
  document.addEventListener('touchcancel', cancel);
}

export function showContextMenu(items, anchorRect) {
  // Close existing
  document.querySelector('.context-menu')?.remove();
  const menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.innerHTML = items.map((it, i) =>
    `<button class="ctx-item ${it.danger?'danger':''}" data-i="${i}">${it.icon ? it.icon + ' ' : ''}${it.label}</button>`
  ).join('');
  document.body.appendChild(menu);
  const top = Math.min(window.innerHeight - menu.offsetHeight - 20, anchorRect.top + anchorRect.height + 8);
  const left = Math.max(8, Math.min(window.innerWidth - menu.offsetWidth - 8, anchorRect.left));
  menu.style.top = top + 'px';
  menu.style.left = left + 'px';
  menu.classList.add('show');
  menu.querySelectorAll('[data-i]').forEach(btn => {
    btn.onclick = () => { items[+btn.dataset.i].onClick(); menu.remove(); };
  });
  setTimeout(() => {
    document.addEventListener('pointerdown', function close(e) {
      if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener('pointerdown', close); }
    });
  }, 50);
}
