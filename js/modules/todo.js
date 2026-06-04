import { all, put, del } from '../db.js';
import { openModal } from '../components/modal.js';
import { uid, escapeHTML } from '../utils.js';

const LABELS = { high: 'Prioriteit', medium: 'Medium', waiting: 'Waiting' };

export async function render(container) {
  const todos = await all('todos');
  const active = todos.filter(t => !t.done);
  const archived = todos.filter(t => t.done);
  const view = container.dataset.todoView || 'active';

  container.innerHTML = `
    <h1>To-do</h1>
    <div class="row">
      <button class="btn ${view==='active'?'':'secondary'}" id="tab-active">Actief (${active.length})</button>
      <button class="btn ${view==='archive'?'':'secondary'}" id="tab-archive">Afgerond (${archived.length})</button>
    </div>
    <button class="btn block" id="add" style="margin-top:8px">+ Nieuwe taak</button>
    <div id="todo-body" style="margin-top:16px"></div>
  `;

  const body = container.querySelector('#todo-body');
  if (view === 'active') {
    body.innerHTML = ['high','medium','waiting'].map(p => `
      <h2>${LABELS[p]}</h2>
      <div class="list" data-bucket="${p}"></div>
    `).join('');
    for (const p of ['high','medium','waiting']) {
      renderBucket(container, p, active.filter(t => t.priority === p));
    }
  } else {
    body.innerHTML = `<div class="list" data-bucket="archive"></div>`;
    renderArchive(container, archived);
  }

  container.querySelector('#add').onclick = () => openTodoModal(container);
  container.querySelector('#tab-active').onclick = () => { container.dataset.todoView = 'active'; render(container); };
  container.querySelector('#tab-archive').onclick = () => { container.dataset.todoView = 'archive'; render(container); };
}

function renderBucket(container, p, items) {
  const el = container.querySelector(`[data-bucket="${p}"]`);
  if (!items.length) { el.innerHTML = '<p class="muted">Geen taken.</p>'; return; }
  el.innerHTML = items.map(t => `
    <div class="list-item">
      <label style="display:flex;gap:8px;align-items:center;flex:1;margin:0">
        <input type="checkbox" data-check="${t.id}" style="width:auto" />
        <div>
          <div>${escapeHTML(t.title)}</div>
          ${t.note ? `<div class="muted" style="font-size:.8rem">${escapeHTML(t.note)}</div>` : ''}
        </div>
      </label>
      <button class="btn danger" data-del="${t.id}">×</button>
    </div>`).join('');
  el.querySelectorAll('[data-check]').forEach(cb => {
    cb.onchange = async () => {
      const t = items.find(x => x.id === cb.dataset.check);
      await put('todos', { ...t, done: true });
      render(container);
    };
  });
  el.querySelectorAll('[data-del]').forEach(b => {
    b.onclick = async () => { await del('todos', b.dataset.del); render(container); };
  });
}

function renderArchive(container, items) {
  const el = container.querySelector('[data-bucket="archive"]');
  if (!items.length) { el.innerHTML = '<p class="muted">Niets afgerond.</p>'; return; }
  el.innerHTML = items.map(t => `
    <div class="list-item">
      <div>
        <div style="text-decoration:line-through">${escapeHTML(t.title)}</div>
        <div class="muted" style="font-size:.8rem">${LABELS[t.priority]}</div>
      </div>
      <div class="row" style="flex:0 0 auto;gap:4px">
        <button class="btn secondary" data-restore="${t.id}">↺</button>
        <button class="btn danger" data-del="${t.id}">×</button>
      </div>
    </div>`).join('');
  el.querySelectorAll('[data-restore]').forEach(b => {
    b.onclick = async () => {
      const t = items.find(x => x.id === b.dataset.restore);
      await put('todos', { ...t, done: false });
      render(container);
    };
  });
  el.querySelectorAll('[data-del]').forEach(b => {
    b.onclick = async () => { await del('todos', b.dataset.del); render(container); };
  });
}

function openTodoModal(container) {
  openModal('Nieuwe taak', `
    <label>Titel *</label><input name="title" required />
    <label>Notitie</label><textarea name="note" rows="2"></textarea>
    <label>Prioriteit</label>
    <select name="priority">
      <option value="high">Prioriteit</option>
      <option value="medium">Medium</option>
      <option value="waiting">Waiting</option>
    </select>
  `, async (d) => {
    if (!d.title) throw new Error('Titel verplicht');
    await put('todos', {
      id: uid(), title: d.title, note: d.note || null,
      priority: d.priority, done: false, createdAt: new Date().toISOString(),
    });
    render(container);
  });
}
