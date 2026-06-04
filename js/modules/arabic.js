import { all, put, del } from '../db.js';
import { openModal } from '../components/modal.js';
import { newCard, review } from '../srs.js';
import { ymd, escapeHTML } from '../utils.js';

export async function render(container) {
  const cards = await all('cards');
  const today = ymd();
  const due = cards.filter(c => c.dueDate <= today);

  container.innerHTML = `
    <h1>Arabisch</h1>
    <div class="card">
      <h2>Vandaag</h2>
      <p><b>${due.length}</b> kaart${due.length===1?'':'en'} te leren</p>
      <button class="btn block" id="start" ${due.length === 0 ? 'disabled' : ''}>Start sessie</button>
    </div>
    <button class="btn secondary block" id="add">+ Nieuwe kaart</button>
    <label for="import" class="btn secondary block" style="text-align:center;margin-top:8px;display:block">CSV importeren</label>
    <input type="file" id="import" accept=".csv,.tsv,.txt" style="display:none" />

    <h2 style="margin-top:16px">Alle kaarten (${cards.length})</h2>
    <input id="search" placeholder="Zoeken..." />
    <div class="list" id="cards-list" style="margin-top:8px"></div>
  `;

  const renderList = (filter = '') => {
    const list = container.querySelector('#cards-list');
    const f = filter.toLowerCase();
    const items = cards
      .filter(c => !f || c.front.toLowerCase().includes(f) || c.back.toLowerCase().includes(f))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 200);
    if (!items.length) { list.innerHTML = '<p class="muted">Geen kaarten.</p>'; return; }
    list.innerHTML = items.map(c => `
      <div class="list-item">
        <div>
          <div><b>${escapeHTML(c.front)}</b> → ${escapeHTML(c.back)}</div>
          <div class="muted" style="font-size:.8rem">due ${c.dueDate} · ease ${c.ease.toFixed(2)} · interval ${c.interval}d</div>
        </div>
        <div class="row" style="flex:0 0 auto;gap:4px">
          <button class="btn secondary" data-edit="${c.id}">✎</button>
          <button class="btn danger" data-del="${c.id}">×</button>
        </div>
      </div>`).join('');
    list.querySelectorAll('[data-del]').forEach(b => {
      b.onclick = async () => { await del('cards', b.dataset.del); render(container); };
    });
    list.querySelectorAll('[data-edit]').forEach(b => {
      b.onclick = () => openCardModal(container, cards.find(c => c.id === b.dataset.edit));
    });
  };

  renderList();
  container.querySelector('#search').oninput = (e) => renderList(e.target.value);
  container.querySelector('#add').onclick = () => openCardModal(container, null);
  container.querySelector('#start').onclick = () => startSession(container, due);
  container.querySelector('#import').onchange = (e) => importCSV(container, e.target.files[0]);
}

function openCardModal(container, existing) {
  openModal(existing ? 'Kaart bewerken' : 'Nieuwe kaart', `
    <label>Voorkant *</label><input name="front" required value="${existing ? escapeHTML(existing.front) : ''}" />
    <label>Achterkant *</label><input name="back" required value="${existing ? escapeHTML(existing.back) : ''}" />
    <label>Notitie</label><input name="note" value="${existing && existing.note ? escapeHTML(existing.note) : ''}" />
  `, async (d) => {
    if (!d.front || !d.back) throw new Error('Vul beide velden in');
    if (existing) {
      await put('cards', { ...existing, front: d.front, back: d.back, note: d.note || null });
    } else {
      await put('cards', newCard(d.front, d.back, d.note || null));
    }
    render(container);
  });
}

async function importCSV(container, file) {
  if (!file) return;
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  let ok = 0, skip = 0;
  for (const line of lines) {
    const parts = line.includes('\t') ? line.split('\t') : line.split(',');
    const [front, back, note] = parts.map(p => (p || '').trim());
    if (!front || !back) { skip++; continue; }
    await put('cards', newCard(front, back, note || null));
    ok++;
  }
  alert(`${ok} geïmporteerd, ${skip} overgeslagen`);
  render(container);
}

function startSession(container, queue) {
  let idx = 0;
  let revealed = false;
  const showCard = () => {
    if (idx >= queue.length) { render(container); return; }
    const c = queue[idx];
    container.innerHTML = `
      <h1>Sessie (${idx + 1}/${queue.length})</h1>
      <div class="card" style="text-align:center;padding:32px">
        <div style="font-size:1.6rem">${escapeHTML(c.front)}</div>
        ${revealed ? `<hr style="border-color:var(--border);margin:16px 0" />
          <div style="font-size:1.4rem">${escapeHTML(c.back)}</div>
          ${c.note ? `<div class="muted" style="margin-top:8px">${escapeHTML(c.note)}</div>` : ''}` : ''}
      </div>
      ${revealed ? `
        <div class="row">
          <button class="btn danger" data-grade="again">Opnieuw</button>
          <button class="btn secondary" data-grade="hard">Moeilijk</button>
        </div>
        <div class="row" style="margin-top:8px">
          <button class="btn" data-grade="good">Bijna</button>
          <button class="btn" data-grade="easy" style="background:var(--ok)">Makkelijk</button>
        </div>` : `<button class="btn block" id="reveal">Toon antwoord</button>`}
      <button class="btn secondary block" id="stop" style="margin-top:16px">Stoppen</button>
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
