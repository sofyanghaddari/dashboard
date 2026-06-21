const FOCUSABLE = 'button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

// Animated dismiss — adds .closing class so CSS handles the fade+slide.
function dismissBackdrop(backdrop, cleanup) {
  if (reduced()) {
    backdrop.remove();
    cleanup?.();
    return;
  }
  backdrop.classList.add('closing');
  setTimeout(() => { backdrop.remove(); cleanup?.(); }, 210);
}

export function openModal(title, bodyHTML, onSubmit) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title-label">
      <button type="button" class="modal-close" id="modal-cancel" aria-label="Sluiten">×</button>
      <h2 id="modal-title-label">${title}</h2>
      <form id="modal-form">${bodyHTML}
        <div class="row" style="margin-top:16px">
          <button type="submit" class="btn block">Opslaan</button>
        </div>
      </form>
    </div>`;
  document.body.appendChild(backdrop);

  const escHandler = (e) => { if (e.key === 'Escape') close(); };
  const close = () => dismissBackdrop(backdrop, () => document.removeEventListener('keydown', escHandler));

  backdrop.querySelector('#modal-cancel').onclick = close;
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  document.addEventListener('keydown', escHandler);

  // Focus trap
  const modal = backdrop.querySelector('.modal');
  modal.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const items = [...modal.querySelectorAll(FOCUSABLE)];
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  setTimeout(() => { const f = modal.querySelector(FOCUSABLE); if (f) f.focus(); }, 50);

  backdrop.querySelector('#modal-form').onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    try {
      await onSubmit(data);
      close();
    } catch (err) {
      let errEl = e.target.querySelector('.modal-form-err');
      if (!errEl) {
        errEl = document.createElement('p');
        errEl.className = 'modal-form-err';
        errEl.style.cssText = 'color:var(--danger);margin:8px 0 0;font-size:.88rem';
        e.target.querySelector('.row').before(errEl);
      }
      errEl.textContent = err.message || 'Er is iets misgegaan';
    }
  };
  return close;
}
