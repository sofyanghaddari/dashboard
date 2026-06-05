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
      alert('Opslaan mislukt: ' + (err.message || err));
    }
  };
  return close;
}
