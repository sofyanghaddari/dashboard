import { all, put, del } from '../db.js';
import { uid, escapeHTML } from '../utils.js';
import { ok } from '../components/toast.js';

const ACCENTS = ['note-accent-0', 'note-accent-1', 'note-accent-2', 'note-accent-3'];

export async function render(container) {
  const notes  = await all('notes');
  const view   = container.dataset.notesView || 'notes';
  const search = container.dataset.notesSearch || '';

  const notesItems = notes.filter(n => !n.isIdea);
  const ideasItems = notes.filter(n => n.isIdea);
  const pool       = view === 'notes' ? notesItems : ideasItems;

  const filtered = search
    ? pool.filter(n =>
        (n.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (n.body  || '').toLowerCase().includes(search.toLowerCase()))
    : pool;

  const sorted = [...filtered].sort((a, b) =>
    (b.updatedAt || '').localeCompare(a.updatedAt || ''));

  container.innerHTML = `
    <h1>Notities</h1>

    <div class="notes-search-wrap">
      <span class="notes-search-icon">🔍</span>
      <input id="notes-search" placeholder="Zoek in notities…" value="${escapeHTML(search)}" />
    </div>

    <div class="notes-seg">
      <button class="notes-seg-btn ${view==='notes'?'active':''}" id="tab-notes">
        📝 Notities <span style="opacity:.6">${notesItems.length}</span>
      </button>
      <button class="notes-seg-btn ${view==='ideas'?'active':''}" id="tab-ideas">
        💡 Ideeën <span style="opacity:.6">${ideasItems.length}</span>
      </button>
    </div>

    <button class="add-tile" id="add">
      <span class="at-plus">+</span> ${view === 'ideas' ? 'Nieuw idee' : 'Nieuwe notitie'}
    </button>

    <div id="notes-list"></div>
  `;

  const list = container.querySelector('#notes-list');

  if (!sorted.length) {
    list.innerHTML = `
      <div class="notes-empty">
        <div class="notes-empty-icon">${view === 'ideas' ? '💡' : '📝'}</div>
        <div class="notes-empty-title">
          ${search ? 'Geen resultaten' : `Nog geen ${view === 'ideas' ? 'ideeën' : 'notities'}`}
        </div>
        <div class="notes-empty-sub">
          ${search ? `Geen overeenkomsten voor "${escapeHTML(search)}"` : `Tap + om je eerste ${view === 'ideas' ? 'idee' : 'notitie'} toe te voegen`}
        </div>
      </div>`;
  } else {
    list.innerHTML = sorted.map((n, i) => {
      const accentClass = n.isIdea ? 'note-accent-idea' : ACCENTS[i % ACCENTS.length];
      const bodyPreview = n.body
        ? n.body.replace(/[#*`_]/g, '').replace(/\n/g, ' ').trim().slice(0, 120)
        : '';
      return `
        <div class="note-card ${accentClass}" data-id="${n.id}">
          <div class="note-card-top">
            <div class="note-card-title">${escapeHTML(n.title || '(geen titel)')}</div>
            <div class="note-actions">
              <button class="note-btn" data-edit="${n.id}" title="Bewerken">✎</button>
              <button class="note-btn del" data-del="${n.id}" title="Verwijderen">✕</button>
            </div>
          </div>
          ${bodyPreview ? `<div class="note-card-body">${escapeHTML(bodyPreview)}${n.body && n.body.length > 120 ? '…' : ''}</div>` : ''}
          <div class="note-card-footer">
            <span class="note-date">${relativeDate(n.updatedAt || n.createdAt)}</span>
          </div>
        </div>`;
    }).join('');

    list.querySelectorAll('[data-edit]').forEach(b =>
      b.onclick = () => openEditor(container, notes.find(n => n.id === b.dataset.edit)));
    list.querySelectorAll('[data-del]').forEach(b =>
      b.onclick = async () => {
        await del('notes', b.dataset.del);
        ok('Verwijderd');
        render(container);
      });

    // tap card body (not buttons) to edit
    list.querySelectorAll('.note-card').forEach(card => {
      card.onclick = (e) => {
        if (e.target.closest('.note-actions')) return;
        const n = notes.find(x => x.id === card.dataset.id);
        if (n) openEditor(container, n);
      };
    });
  }

  // ── Events ───────────────────────────────────────────────
  container.querySelector('#tab-notes').onclick = () => {
    container.dataset.notesView = 'notes'; render(container);
  };
  container.querySelector('#tab-ideas').onclick = () => {
    container.dataset.notesView = 'ideas'; render(container);
  };
  container.querySelector('#add').onclick = () => openEditor(container, null, view === 'ideas');

  const searchInput = container.querySelector('#notes-search');
  searchInput.oninput = (e) => {
    container.dataset.notesSearch = e.target.value;
    render(container);
  };
  searchInput.addEventListener('focus', () => {
    setTimeout(() => searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
  });
}

// ── Helpers ───────────────────────────────────────────────

function relativeDate(iso) {
  if (!iso) return '';
  const d    = new Date(iso);
  const diff = Date.now() - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Zojuist';
  if (mins < 60) return `${mins}m geleden`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}u geleden`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Gisteren';
  if (days < 7)   return `${days} dagen geleden`;
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}

function openEditor(container, existing, isIdea = false) {
  const editor = document.createElement('div');
  editor.className = 'modal-backdrop';
  editor.innerHTML = `
    <div class="modal">
      <button type="button" class="modal-close" id="ed-x" aria-label="Sluiten">×</button>
      <h2>${existing ? 'Bewerken' : (isIdea ? 'Nieuw idee' : 'Nieuwe notitie')}</h2>
      <label>Titel</label>
      <input id="ed-title" value="${existing ? escapeHTML(existing.title || '') : ''}" placeholder="${isIdea ? 'Idee…' : 'Titel…'}" />
      <label>Tekst <span style="font-weight:400;opacity:.6;font-size:.78rem;text-transform:none">(**vet**, *cursief*, # kop, - lijst)</span></label>
      <textarea id="ed-body" rows="10" style="font-family:'SF Mono',Consolas,monospace;font-size:.9rem">${existing ? escapeHTML(existing.body || '') : ''}</textarea>
      <div class="modal-footer row">
        <button type="button" class="btn secondary" id="ed-cancel">Annuleren</button>
        <button type="button" class="btn" id="ed-save">Opslaan</button>
      </div>
    </div>`;
  document.body.appendChild(editor);

  const titleInput = editor.querySelector('#ed-title');
  const bodyInput  = editor.querySelector('#ed-body');
  if (!existing) setTimeout(() => titleInput.focus(), 100);

  const close = () => editor.remove();
  editor.querySelector('#ed-cancel').onclick = close;
  editor.querySelector('#ed-x').onclick      = close;
  editor.addEventListener('click', e => { if (e.target === editor) close(); });

  editor.querySelector('#ed-save').onclick = async () => {
    const title = titleInput.value.trim();
    const body  = bodyInput.value;
    const now   = new Date().toISOString();
    const base  = existing || { id: uid(), createdAt: now, isIdea: existing?.isIdea ?? isIdea };
    await put('notes', { ...base, title, body, updatedAt: now });
    ok('Opgeslagen');
    close();
    render(container);
  };
}
