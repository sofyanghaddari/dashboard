import { all, put, del } from '../db.js';
import { icon } from '../icons.js';
import { uid, escapeHTML } from '../utils.js';
import { ok, err as toastErr } from '../components/toast.js';
import { convertToMarkdown, SUPPORTED_EXTENSIONS } from '../markitdown.js';
import { undoable } from '../components/undo.js';

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

  const sorted = [...filtered].sort((a, b) => {
    // Gepinde notities bovenaan
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return (b.updatedAt || '').localeCompare(a.updatedAt || '');
  });

  container.innerHTML = `
    <h1 class="page-title">Notities</h1>

    <div class="notes-search-wrap">
      <span class="notes-search-icon">${icon('search')}</span>
      <input id="notes-search" placeholder="Zoek in notities…" value="${escapeHTML(search)}" />
    </div>

    <div class="notes-seg">
      <button class="notes-seg-btn ${view==='notes'?'active':''}" id="tab-notes">
        ${icon('note')} Notities <span style="opacity:.6">${notesItems.length}</span>
      </button>
      <button class="notes-seg-btn ${view==='ideas'?'active':''}" id="tab-ideas">
        ${icon('bulb')} Ideeën <span style="opacity:.6">${ideasItems.length}</span>
      </button>
    </div>

    <div class="notes-add-row">
      <button class="add-tile" id="add" style="flex:1">
        <span class="at-plus">+</span> ${view === 'ideas' ? 'Nieuw idee' : 'Nieuwe notitie'}
      </button>
      <button class="btn secondary notes-import-btn" id="bulk-paste" title="Meerdere notities in één keer plakken">
        ${icon('note')} Plakken
      </button>
      <button class="btn secondary notes-import-btn" id="import-doc" title="Document importeren als notitie">
        ${icon('doc')} Bestand
      </button>
    </div>
    <input type="file" id="import-file" accept="${SUPPORTED_EXTENSIONS}" style="display:none" />

    <div id="notes-list"></div>
  `;

  const list = container.querySelector('#notes-list');

  if (!sorted.length) {
    list.innerHTML = `
      <div class="notes-empty">
        <div class="notes-empty-icon">${view === 'ideas' ? icon('bulb') : icon('note')}</div>
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
        <div class="note-card ${accentClass}${n.pinned ? ' note-pinned' : ''}" data-id="${n.id}">
          <div class="note-card-top">
            <div class="note-card-title">${n.pinned ? icon('pin') + ' ' : ''}${escapeHTML(n.title || '(geen titel)')}</div>
            <div class="note-actions">
              <button class="note-btn" data-pin="${n.id}" title="${n.pinned ? 'Losmaken' : 'Vastpinnen'}">${n.pinned ? icon('pin') : '☆'}</button>
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

    list.querySelectorAll('[data-pin]').forEach(b =>
      b.onclick = async (e) => {
        e.stopPropagation();
        const n = notes.find(x => x.id === b.dataset.pin);
        if (!n) return;
        await put('notes', { ...n, pinned: !n.pinned });
        render(container);
      });
    list.querySelectorAll('[data-edit]').forEach(b =>
      b.onclick = () => openEditor(container, notes.find(n => n.id === b.dataset.edit)));
    list.querySelectorAll('[data-del]').forEach(b =>
      b.onclick = async (e) => {
        e.stopPropagation();
        const n = notes.find(x => x.id === b.dataset.del);
        await del('notes', b.dataset.del);
        undoable('Notitie verwijderd', async () => { if (n) { await put('notes', n); render(container); } });
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
  container.querySelector('#bulk-paste').onclick = () => openBulkImport(container, view === 'ideas');

  const searchInput = container.querySelector('#notes-search');
  let _searchTimer = null;
  searchInput.oninput = (e) => {
    const val = e.target.value;
    container.dataset.notesSearch = val;
    clearTimeout(_searchTimer);
    _searchTimer = setTimeout(async () => {
      await render(container);
      const newInput = container.querySelector('#notes-search');
      if (newInput && document.activeElement !== newInput) {
        newInput.focus();
        newInput.setSelectionRange(val.length, val.length);
      }
    }, 320);
  };
  searchInput.addEventListener('focus', () => {
    setTimeout(() => searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
  });

  // ── Document importeren via MarkItDown ────────────────────────────────
  const fileInput = container.querySelector('#import-file');
  container.querySelector('#import-doc').onclick = () => fileInput.click();

  fileInput.onchange = async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    fileInput.value = '';
    openImportProgress(container, file, view === 'ideas');
  };
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

function openImportProgress(container, file, isIdea) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-backdrop';
  overlay.innerHTML = `
    <div class="modal" style="text-align:center">
      <h2 style="display:flex;align-items:center;gap:8px">${icon('doc')} Importeren</h2>
      <p style="opacity:.7;font-size:.9rem;margin:.5rem 0 1.2rem">${escapeHTML(file.name)}</p>
      <div class="rcpt-scan-bar" style="margin:0 auto 1rem">
        <div class="rcpt-scan-fill" id="imp-fill" style="width:0%"></div>
      </div>
      <div id="imp-status" style="font-size:.85rem;opacity:.6">Bestand analyseren…</div>
      <button class="btn secondary" id="imp-cancel" style="margin-top:1.4rem">Annuleren</button>
    </div>`;
  document.body.appendChild(overlay);

  let cancelled = false;
  overlay.querySelector('#imp-cancel').onclick = () => { cancelled = true; overlay.remove(); };

  const setProgress = (status, pct) => {
    if (cancelled) return;
    const fill = overlay.querySelector('#imp-fill');
    if (fill) fill.style.width = `${Math.round(pct * 100)}%`;
    const lbl  = overlay.querySelector('#imp-status');
    if (lbl)  lbl.textContent = status;
  };

  convertToMarkdown(file, setProgress).then(({ markdown, title }) => {
    if (cancelled) return;
    overlay.remove();
    openEditor(container, null, isIdea, { prefillTitle: title, prefillBody: markdown });
  }).catch(e => {
    if (cancelled) return;
    overlay.remove();
    toastErr(e.message || 'Importeren mislukt');
  });
}

// Splitst geplakte tekst in losse notities. eerste niet-lege regel = titel, rest = body.
function parseBulk(text, mode) {
  if (!text || !text.trim()) return [];
  let chunks;
  if (mode === 'hr') {
    // splitsen op een regel die enkel uit streepjes/isgelijktekens bestaat.
    // iPhone verandert "---" automatisch in een lang streepje (— of –),
    // dus we accepteren -, –, — (1 of meer) én === als scheiding.
    chunks = text.split(/^[ \t]*(?:[-–—]+|={2,})[ \t]*$/m);
  } else if (mode === 'blank') {
    // splitsen op één of meer lege regels
    chunks = text.split(/\n[ \t]*\n+/);
  } else { // 'line' — elke regel een aparte notitie
    chunks = text.split(/\n+/);
  }
  return chunks
    .map(c => c.replace(/\r/g, '').trim())
    .filter(Boolean)
    .map(chunk => {
      const lines = chunk.split('\n');
      let title = (lines.shift() || '').replace(/^#+\s*/, '').trim();
      const body = lines.join('\n').trim();
      if (title.length > 80) {           // hele lange eerste regel: niet als titel forceren
        return { title: title.slice(0, 60).trim() + '…', body: chunk };
      }
      return { title: title || '(geen titel)', body };
    });
}

function openBulkImport(container, isIdea) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-backdrop';
  overlay.innerHTML = `
    <div class="modal">
      <button type="button" class="modal-close" id="bi-x" aria-label="Sluiten">×</button>
      <h2>${isIdea ? 'Ideeën' : 'Notities'} plakken</h2>
      <p style="opacity:.7;font-size:.85rem;margin:.2rem 0 .9rem">
        Plak hieronder je iPhone-notities. Elke notitie wordt los opgeslagen — de eerste regel wordt de titel.
      </p>
      <label>Scheiding tussen notities</label>
      <select id="bi-mode">
        <option value="hr">Een regel met --- (aanbevolen)</option>
        <option value="blank">Een lege regel ertussen</option>
        <option value="line">Elke regel = aparte notitie</option>
      </select>
      <label style="margin-top:.7rem">Tekst</label>
      <textarea id="bi-text" rows="11" placeholder="Plak hier je notities…" style="font-family:'SF Mono',Consolas,monospace;font-size:.9rem"></textarea>
      <div id="bi-count" style="font-size:.85rem;opacity:.7;margin-top:.5rem">Nog niets geplakt</div>
      <div class="modal-footer row">
        <button type="button" class="btn secondary" id="bi-cancel">Annuleren</button>
        <button type="button" class="btn" id="bi-save" disabled>Importeren</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const textEl  = overlay.querySelector('#bi-text');
  const modeEl  = overlay.querySelector('#bi-mode');
  const countEl = overlay.querySelector('#bi-count');
  const saveBtn = overlay.querySelector('#bi-save');

  const refresh = () => {
    const parsed = parseBulk(textEl.value, modeEl.value);
    const n = parsed.length;
    countEl.textContent = n
      ? `${n} ${n === 1 ? 'notitie' : 'notities'} herkend`
      : 'Nog niets herkend';
    saveBtn.disabled = n === 0;
    return parsed;
  };
  textEl.oninput = refresh;
  modeEl.onchange = refresh;

  const close = () => overlay.remove();
  overlay.querySelector('#bi-cancel').onclick = close;
  overlay.querySelector('#bi-x').onclick      = close;
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  saveBtn.onclick = async () => {
    const parsed = parseBulk(textEl.value, modeEl.value);
    if (!parsed.length) return;
    saveBtn.disabled = true;
    saveBtn.textContent = 'Bezig…';
    const now = Date.now();
    let i = 0;
    for (const { title, body } of parsed) {
      // iets oplopende timestamps zodat de volgorde van plakken bewaard blijft
      const ts = new Date(now + i++).toISOString();
      await put('notes', { id: uid(), title, body, isIdea, createdAt: ts, updatedAt: ts });
    }
    ok(`${parsed.length} ${parsed.length === 1 ? 'notitie' : 'notities'} geïmporteerd`);
    close();
    render(container);
  };

  setTimeout(() => textEl.focus(), 100);
}

function openEditor(container, existing, isIdea = false, prefill = {}) {
  const editor = document.createElement('div');
  editor.className = 'modal-backdrop';
  editor.innerHTML = `
    <div class="modal">
      <button type="button" class="modal-close" id="ed-x" aria-label="Sluiten">×</button>
      <h2>${existing ? 'Bewerken' : (isIdea ? 'Nieuw idee' : 'Nieuwe notitie')}</h2>
      <label>Titel</label>
      <input id="ed-title" value="${existing ? escapeHTML(existing.title || '') : escapeHTML(prefill.prefillTitle || '')}" placeholder="${isIdea ? 'Idee…' : 'Titel…'}" />
      <label>Tekst <span style="font-weight:400;opacity:.6;font-size:.78rem;text-transform:none">(**vet**, *cursief*, # kop, - lijst)</span></label>
      <textarea id="ed-body" rows="10" style="font-family:'SF Mono',Consolas,monospace;font-size:.9rem">${existing ? escapeHTML(existing.body || '') : escapeHTML(prefill.prefillBody || '')}</textarea>
      <div class="modal-footer row">
        <button type="button" class="btn secondary" id="ed-cancel">Annuleren</button>
        <button type="button" class="btn" id="ed-save">Opslaan</button>
      </div>
    </div>`;
  document.body.appendChild(editor);

  const titleInput = editor.querySelector('#ed-title');
  const bodyInput  = editor.querySelector('#ed-body');
  if (!existing) setTimeout(() => titleInput.focus(), 100);

  const initialTitle = existing ? (existing.title || '') : (prefill.prefillTitle || '');
  const initialBody  = existing ? (existing.body  || '') : (prefill.prefillBody  || '');
  let _saved = false;

  const hasChanges = () => titleInput.value !== initialTitle || bodyInput.value !== initialBody;
  const close = () => {
    if (!_saved && hasChanges() && !window.confirm('Je hebt niet-opgeslagen wijzigingen. Toch sluiten?')) return;
    editor.remove();
  };
  editor.querySelector('#ed-cancel').onclick = close;
  editor.querySelector('#ed-x').onclick      = close;
  editor.addEventListener('click', e => { if (e.target === editor) close(); });

  editor.querySelector('#ed-save').onclick = async () => {
    const title = titleInput.value.trim();
    const body  = bodyInput.value;
    const now   = new Date().toISOString();
    const base  = existing || { id: uid(), createdAt: now, isIdea: existing?.isIdea ?? isIdea };
    await put('notes', { ...base, title, body, updatedAt: now });
    _saved = true;
    ok('Opgeslagen');
    close();
    render(container);
  };
}
