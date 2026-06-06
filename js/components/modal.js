export function openModal(title, bodyHTML, onSubmit) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <button type="button" class="modal-close" id="modal-cancel" aria-label="Sluiten">×</button>
      <h2>${title}</h2>
      <form id="modal-form">${bodyHTML}
        <div class="row" style="margin-top:16px">
          <button type="submit" class="btn block">Opslaan</button>
        </div>
      </form>
    </div>`;
  document.body.appendChild(backdrop);
  const close = () => backdrop.remove();
  backdrop.querySelector('#modal-cancel').onclick = close;
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
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
