import { all, put, del } from '../db.js';
import { openModal } from '../components/modal.js';
import { newCard, review } from '../srs.js';
import { ymd, escapeHTML } from '../utils.js';
import { ok as toastOk, err as toastErr } from '../components/toast.js';

export async function render(container) {
  const cards = await all('cards');
  const today  = ymd();
  const due    = cards.filter(c => c.dueDate <= today);
  const mastered = cards.filter(c => c.interval > 21);

  container.innerHTML = `
    <h1>Arabisch</h1>

    <div class="arabic-stats">
      <div class="arabic-stat highlight">
        <div class="arabic-stat-val">${due.length}</div>
        <div class="arabic-stat-lbl">Vandaag</div>
      </div>
      <div class="arabic-stat">
        <div class="arabic-stat-val">${cards.length}</div>
        <div class="arabic-stat-lbl">Totaal</div>
      </div>
      <div class="arabic-stat mastered">
        <div class="arabic-stat-val">${mastered.length}</div>
        <div class="arabic-stat-lbl">Beheerst</div>
      </div>
    </div>

    <div class="arabic-start-card">
      <h2>${due.length > 0 ? `${due.length} kaart${due.length === 1 ? '' : 'en'} klaar` : 'Alles up-to-date'}</h2>
      <p>${due.length > 0 ? 'Herhaal vandaag je Arabische woordenschat' : 'Kom morgen terug voor nieuwe herhalingen'}</p>
      <button class="btn block" id="start" ${due.length === 0 ? 'disabled' : ''} style="max-width:280px;margin:0 auto">
        ${due.length > 0 ? `▶ Start sessie (${due.length})` : 'Niets te herhalen'}
      </button>
    </div>

    <div style="display:flex;gap:8px;margin-bottom:16px">
      <button class="btn secondary" id="add" style="flex:1">+ Nieuwe kaart</button>
      <label for="import" class="btn secondary" style="flex:1;text-align:center;cursor:pointer;display:flex;align-items:center;justify-content:center">↑ CSV importeren</label>
      <input type="file" id="import" accept=".csv,.tsv,.txt" style="display:none" />
    </div>

    <div class="section-header" style="margin-top:4px">
      <h2>Alle kaarten (${cards.length})</h2>
    </div>
    <div class="notes-search-wrap">
      <span class="notes-search-icon">🔍</span>
      <input id="search" placeholder="Zoek op Arabisch of vertaling…" />
    </div>
    <div id="cards-list" style="display:flex;flex-direction:column;gap:7px"></div>
  `;

  const renderList = (filter = '') => {
    const list = container.querySelector('#cards-list');
    const f    = filter.toLowerCase();
    const items = cards
      .filter(c => !f || c.front.toLowerCase().includes(f) || c.back.toLowerCase().includes(f))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 200);

    if (!items.length) {
      list.innerHTML = cards.length === 0
        ? `<div class="notes-empty">
             <div class="notes-empty-icon">📚</div>
             <div class="notes-empty-title">Nog geen Arabische kaarten</div>
             <div class="notes-empty-sub">Importeer via CSV of voeg handmatig toe</div>
           </div>`
        : `<div style="padding:16px;text-align:center;color:var(--text-faint);font-size:.88rem">Geen overeenkomsten</div>`;
      return;
    }

    list.innerHTML = items.map(c => {
      const badge = dueBadge(c.dueDate, today);
      return `
        <div class="arabic-card">
          <div class="arabic-card-front">${escapeHTML(c.front)}</div>
          <div class="arabic-sep"></div>
          <div class="arabic-card-back">${escapeHTML(c.back)}</div>
          <div class="arabic-card-meta">
            <span class="arabic-due-badge ${badge.cls}">${badge.label}</span>
          </div>
          <div class="arabic-card-actions">
            <button class="arabic-act-btn" data-edit="${c.id}" title="Bewerken">✎</button>
            <button class="arabic-act-btn del" data-del="${c.id}" title="Verwijderen">✕</button>
          </div>
        </div>`;
    }).join('');

    list.querySelectorAll('[data-del]').forEach(b =>
      b.onclick = async () => { await del('cards', b.dataset.del); render(container); });
    list.querySelectorAll('[data-edit]').forEach(b =>
      b.onclick = () => openCardModal(container, cards.find(c => c.id === b.dataset.edit)));
  };

  renderList();
  container.querySelector('#search').oninput = (e) => renderList(e.target.value);
  container.querySelector('#add').onclick     = () => openCardModal(container, null);
  container.querySelector('#start').onclick   = () => startSession(container, due);
  container.querySelector('#import').onchange = (e) => importCSV(container, e.target.files[0]);
}

// ── Helpers ───────────────────────────────────────────────

function dueBadge(dueDate, today) {
  if (dueDate < today)  return { label: 'Te laat',  cls: 'adu-overdue' };
  if (dueDate === today) return { label: 'Vandaag', cls: 'adu-today' };
  const diff = Math.round((new Date(dueDate) - new Date(today)) / 86400000);
  if (diff <= 3) return { label: `Over ${diff}d`, cls: 'adu-soon' };
  return { label: `Over ${diff}d`, cls: 'adu-ok' };
}

function openCardModal(container, existing) {
  openModal(existing ? 'Kaart bewerken' : 'Nieuwe kaart', `
    <label>Arabisch (voorkant) *</label>
    <input name="front" required value="${existing ? escapeHTML(existing.front) : ''}" dir="rtl" style="font-size:1.1rem" />
    <label>Vertaling (achterkant) *</label>
    <input name="back" required value="${existing ? escapeHTML(existing.back) : ''}" />
    <label>Notitie</label>
    <input name="note" value="${existing?.note ? escapeHTML(existing.note) : ''}" />
  `, async (d) => {
    if (!d.front || !d.back) throw new Error('Vul beide velden in');
    if (existing) await put('cards', { ...existing, front: d.front, back: d.back, note: d.note || null });
    else          await put('cards', newCard(d.front, d.back, d.note || null));
    render(container);
  });
}

async function importCSV(container, file) {
  if (!file) return;
  const text      = await file.text();
  const rawLines  = text.split(/\r?\n/).filter(l => l.trim());
  if (!rawLines.length) { toastErr('Leeg bestand — niets geïmporteerd'); return; }

  const delim = rawLines[0].includes('\t') ? '\t' : ',';
  let imported = 0, skipped = 0;
  for (const line of rawLines) {
    const parts = line.split(delim).map(p => (p || '').trim());
    if (parts.length < 2) { skipped++; continue; }
    const [front, back, note] = parts;
    if (!front || !back) { skipped++; continue; }
    await put('cards', newCard(front, back, note || null));
    imported++;
  }

  if (imported === 0)    toastErr('Geen geldige kaarten. Formaat: arabisch[tab]vertaling');
  else if (skipped > 0)  toastErr(`${imported} geïmporteerd, ${skipped} overgeslagen`);
  else                   toastOk(`${imported} kaart${imported !== 1 ? 'en' : ''} geïmporteerd`);
  render(container);
}

function startSession(container, queue) {
  let idx      = 0;
  let revealed = false;

  const showCard = () => {
    if (idx >= queue.length) { render(container); return; }
    const c = queue[idx];

    container.innerHTML = `
      <h1 style="margin-bottom:4px">Sessie</h1>
      <div class="flashcard-progress">${idx + 1} / ${queue.length}</div>
      <div class="progress-bar" style="margin-bottom:16px;height:4px">
        <div class="progress-fill" style="width:${Math.round(idx/queue.length*100)}%"></div>
      </div>

      <div class="flashcard-card">
        <div class="flashcard-arabic">${escapeHTML(c.front)}</div>
        ${revealed ? `
          <div class="flashcard-answer">${escapeHTML(c.back)}</div>
          ${c.note ? `<div class="flashcard-note">${escapeHTML(c.note)}</div>` : ''}
        ` : ''}
      </div>

      ${revealed ? `
        <div class="grade-grid">
          <button class="grade-btn grade-again" data-grade="again">😓 Opnieuw</button>
          <button class="grade-btn grade-hard"  data-grade="hard">😐 Moeilijk</button>
          <button class="grade-btn grade-good"  data-grade="good">🙂 Goed</button>
          <button class="grade-btn grade-easy"  data-grade="easy">😄 Makkelijk</button>
        </div>
      ` : `
        <button class="btn block" id="reveal">Toon vertaling</button>
      `}

      <button class="btn secondary block" id="stop" style="margin-top:10px">Stoppen</button>
    `;

    if (!revealed) {
      container.querySelector('#reveal').onclick = () => { revealed = true; showCard(); };
    } else {
      container.querySelectorAll('[data-grade]').forEach(btn => {
        btn.onclick = async () => {
          const updated = review(c, btn.dataset.grade);
          await put('cards', updated);
          idx++; revealed = false; showCard();
        };
      });
    }
    container.querySelector('#stop').onclick = () => render(container);
  };

  showCard();
}
