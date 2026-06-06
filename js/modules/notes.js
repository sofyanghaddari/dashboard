import { all, put, del } from '../db.js';
import { uid, escapeHTML } from '../utils.js';
import { ok } from '../components/toast.js';

export async function render(container) {
  const notes = await all('notes');
  const view = container.dataset.notesView || 'notes';
  const filtered = notes.filter(n => view === 'notes' ? !n.isIdea : n.isIdea);

  container.innerHTML = `
    <h1>Notities</h1>
    <div class="row">
      <button class="btn ${view==='notes'?'':'secondary'}" id="tab-notes">📝 Notities (${notes.filter(n=>!n.isIdea).length})</button>
      <button class="btn ${view==='ideas'?'':'secondary'}" id="tab-ideas">💡 Ideeën (${notes.filter(n=>n.isIdea).length})</button>
    </div>
    <button class="btn block" id="add" style="margin-top:8px">+ ${view==='ideas'?'Nieuw idee':'Nieuwe notitie'}</button>
    <div class="list" id="notes-list" style="margin-top:12px"></div>
  `;

  const list = container.querySelector('#notes-list');
  if (!filtered.length) {
    list.innerHTML = `
      <div class="empty-state" style="text-align:center;padding:2rem">
        <div style="font-size:2rem">📝</div>
        <p>Nog geen ${view === 'ideas' ? 'ideeën' : 'notities'}.</p>
        <p style="opacity:0.6;font-size:14px">Tap + om je eerste ${view === 'ideas' ? 'idee' : 'notitie'} toe te voegen.</p>
      </div>`;
  }
  else {
    const sorted = [...filtered].sort((a,b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    list.innerHTML = sorted.map(n => `
      <div class="card" data-id="${n.id}">
        <div style="display:flex;justify-content:space-between;align-items:start;gap:8px">
          <b>${escapeHTML(n.title || '(geen titel)')}</b>
          <div class="row" style="flex:0 0 auto;gap:4px">
            <button class="btn secondary" data-edit="${n.id}">✎</button>
            <button class="btn danger" data-del="${n.id}">×</button>
          </div>
        </div>
        ${n.body ? `<div class="note-body">${renderMD(n.body)}</div>` : ''}
        <div class="muted" style="font-size:.75rem;margin-top:6px">${new Date(n.updatedAt || n.createdAt).toLocaleString('nl-NL')}</div>
      </div>
    `).join('');
    list.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => openEditor(container, notes.find(n => n.id === b.dataset.edit)));
    list.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => { await del('notes', b.dataset.del); ok('Verwijderd'); render(container); });
  }

  container.querySelector('#tab-notes').onclick = () => { container.dataset.notesView = 'notes'; render(container); };
  container.querySelector('#tab-ideas').onclick = () => { container.dataset.notesView = 'ideas'; render(container); };
  container.querySelector('#add').onclick = () => openEditor(container, null, view === 'ideas');
}

function openEditor(container, existing, isIdea = false) {
  const editor = document.createElement('div');
  editor.className = 'modal-backdrop';
  editor.innerHTML = `
    <div class="modal">
      <button type="button" class="modal-close" id="ed-x" aria-label="Sluiten">×</button>
      <h2>${existing ? 'Bewerken' : (isIdea ? 'Nieuw idee' : 'Nieuwe notitie')}</h2>
      <label>Titel</label>
      <input id="ed-title" value="${existing ? escapeHTML(existing.title || '') : ''}" />
      <label>Tekst (markdown: **vet**, *cursief*, # kop, - lijst)</label>
      <textarea id="ed-body" rows="10" style="font-family:'SF Mono',Consolas,monospace;font-size:.9rem">${existing ? escapeHTML(existing.body || '') : ''}</textarea>
      <div class="row" style="margin-top:12px">
        <button type="button" class="btn secondary" id="ed-cancel">Annuleren</button>
        <button type="button" class="btn" id="ed-save">Opslaan</button>
      </div>
    </div>`;
  document.body.appendChild(editor);
  const close = () => editor.remove();
  editor.querySelector('#ed-cancel').onclick = close;
  editor.querySelector('#ed-x').onclick = close;
  editor.addEventListener('click', e => { if (e.target === editor) close(); });
  editor.querySelector('#ed-save').onclick = async () => {
    const title = editor.querySelector('#ed-title').value.trim();
    const body = editor.querySelector('#ed-body').value;
    const now = new Date().toISOString();
    const base = existing || { id: uid(), createdAt: now, isIdea };
    await put('notes', { ...base, title, body, updatedAt: now });
    ok('Opgeslagen');
    close();
    render(container);
  };
}

// Heel lichte markdown → HTML
function renderMD(md) {
  let h = escapeHTML(md);
  h = h.replace(/^### (.+)$/gm, '<h4>$1</h4>');
  h = h.replace(/^## (.+)$/gm, '<h3>$1</h3>');
  h = h.replace(/^# (.+)$/gm, '<h2>$1</h2>');
  h = h.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  h = h.replace(/\*([^*]+)\*/g, '<i>$1</i>');
  h = h.replace(/`([^`]+)`/g, '<code>$1</code>');
  h = h.replace(/^- (.+)$/gm, '• $1');
  h = h.replace(/\n/g, '<br>');
  return h;
}
