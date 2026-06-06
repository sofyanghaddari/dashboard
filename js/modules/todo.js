import { all, put, del } from '../db.js';
import { openModal } from '../components/modal.js';
import { uid, escapeHTML, ymd, startOfWeek } from '../utils.js';
import { celebrateTask, celebrateAllDone } from '../components/celebrate.js';
import { ok } from '../components/toast.js';
import { enableSwipeDelete } from '../components/swipe.js';
import { undoable } from '../components/undo.js';
import { logActivity } from '../activity.js';
import { parseTaskInput } from '../nlp.js';

const LABELS = { high: 'Prioriteit', medium: 'Medium', waiting: 'Waiting' };

export async function render(container) {
  const todos = await all('todos');
  const view = container.dataset.todoView || 'active';
  const filter = container.dataset.todoFilter || 'all';
  const tagFilter = container.dataset.todoTag || '';
  const bulkMode = container.dataset.todoBulk === '1';

  const active = todos.filter(t => !t.done && !t.savedForLater);
  const later = todos.filter(t => !t.done && t.savedForLater);
  const archived = todos.filter(t => t.done);

  const allTags = [...new Set(todos.flatMap(t => t.tags || []))].sort();

  container.innerHTML = `
    <h1>To-do</h1>
    <div class="row">
      <button class="btn ${view==='active'?'':'secondary'}" id="tab-active">Actief (${active.length})</button>
      <button class="btn ${view==='later'?'':'secondary'}" id="tab-later">🔖 Later (${later.length})</button>
      <button class="btn ${view==='archive'?'':'secondary'}" id="tab-archive">Klaar (${archived.length})</button>
    </div>

    ${view === 'active' ? `
      <div class="row" style="margin-top:8px">
        <button class="btn ${filter==='all'?'':'secondary'}" data-filter="all">Alle</button>
        <button class="btn ${filter==='today'?'':'secondary'}" data-filter="today">Vandaag</button>
        <button class="btn ${filter==='week'?'':'secondary'}" data-filter="week">Week</button>
      </div>
      ${allTags.length ? `
        <div class="tag-row">
          <span class="pill ${tagFilter===''?'active':''}" data-tag="">alle</span>
          ${allTags.map(t => `<span class="pill ${tagFilter===t?'active':''}" data-tag="${escapeHTML(t)}">#${escapeHTML(t)}</span>`).join('')}
        </div>` : ''}
    ` : ''}

    <input id="quick-add" placeholder="⚡ Snel toevoegen: 'morgen 10:00 APK' of 'elke maandag tanken'" style="margin-top:8px" />
    <button class="btn block" id="add" style="margin-top:8px">+ Nieuwe taak (gedetailleerd)</button>
    ${view === 'active' ? `<button class="btn secondary block" id="bulk-toggle" style="margin-top:8px">${bulkMode ? 'Bulk-modus uit' : '☑️ Bulk-selectie'}</button>` : ''}
    ${bulkMode ? `
      <div class="row" style="margin-top:8px" id="bulk-bar">
        <button class="btn secondary" id="bulk-done">✓ Markeer klaar</button>
        <button class="btn danger" id="bulk-del">× Verwijder</button>
      </div>` : ''}
    <div id="todo-body" style="margin-top:16px"></div>
  `;

  let displayed;
  if (view === 'active') displayed = applyFilters(active, filter, tagFilter);
  else if (view === 'later') displayed = later;
  else displayed = archived;

  const body = container.querySelector('#todo-body');
  if (view === 'active') {
    body.innerHTML = ['high','medium','waiting'].map(p => `
      <h2>${LABELS[p]}</h2>
      <div class="list" data-bucket="${p}"></div>
    `).join('');
    for (const p of ['high','medium','waiting']) {
      renderBucket(container, p, displayed.filter(t => t.priority === p), bulkMode);
    }
  } else if (view === 'later') {
    body.innerHTML = `<div class="list" data-bucket="later"></div>`;
    renderLater(container, displayed);
  } else {
    body.innerHTML = `<div class="list" data-bucket="archive"></div>`;
    renderArchive(container, displayed);
  }

  container.querySelector('#add').onclick = () => openTodoModal(container);

  const quick = container.querySelector('#quick-add');
  if (quick) quick.onkeydown = async (e) => {
    if (e.key !== 'Enter' || !quick.value.trim()) return;
    const parsed = parseTaskInput(quick.value);
    if (!parsed.title) return;
    await put('todos', {
      id: uid(), title: parsed.title,
      note: null, priority: parsed.priority,
      done: false, savedForLater: false,
      dueDate: parsed.dueDate, recurring: parsed.recurring,
      tags: [], subtasks: [],
      createdAt: new Date().toISOString(),
    });
    logActivity('task-quick', parsed.title);
    ok('Toegevoegd: ' + parsed.title);
    quick.value = '';
    render(container);
  };
  if (quick) {
    quick.addEventListener('focus', () => {
      setTimeout(() => {
        quick.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300); // wait for iOS keyboard animation
    });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        if (document.activeElement === quick) {
          quick.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }
  }
  container.querySelector('#tab-active').onclick = () => { container.dataset.todoView = 'active'; render(container); };
  container.querySelector('#tab-later').onclick = () => { container.dataset.todoView = 'later'; render(container); };
  container.querySelector('#tab-archive').onclick = () => { container.dataset.todoView = 'archive'; render(container); };

  container.querySelectorAll('[data-filter]').forEach(b => {
    b.onclick = () => { container.dataset.todoFilter = b.dataset.filter; render(container); };
  });
  container.querySelectorAll('[data-tag]').forEach(el => {
    el.onclick = () => { container.dataset.todoTag = el.dataset.tag; render(container); };
  });

  const bulkBtn = container.querySelector('#bulk-toggle');
  if (bulkBtn) bulkBtn.onclick = () => {
    container.dataset.todoBulk = bulkMode ? '' : '1';
    render(container);
  };
  if (bulkMode) {
    container.querySelector('#bulk-done').onclick = () => bulkAction(container, displayed, 'done');
    container.querySelector('#bulk-del').onclick = () => bulkAction(container, displayed, 'del');
  }
}

function applyFilters(items, filter, tagFilter) {
  let res = items;
  const today = ymd();
  const weekStart = startOfWeek();
  if (filter === 'today') {
    res = res.filter(t => t.dueDate && t.dueDate <= today);
  } else if (filter === 'week') {
    res = res.filter(t => t.dueDate && new Date(t.dueDate) >= weekStart && new Date(t.dueDate) <= addDays(weekStart, 6));
  }
  if (tagFilter) res = res.filter(t => (t.tags || []).includes(tagFilter));
  return res;
}

function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

async function bulkAction(container, items, action) {
  const checked = [...container.querySelectorAll('[data-bulk]:checked')].map(c => c.dataset.bulk);
  if (!checked.length) { ok('Niets geselecteerd'); return; }
  if (action === 'done') {
    for (const id of checked) {
      const t = items.find(x => x.id === id);
      if (t) await put('todos', { ...t, done: true, completedAt: new Date().toISOString() });
    }
    logActivity('bulk-done', `${checked.length} taken klaar`);
    ok(`${checked.length} klaar`);
  } else if (action === 'del') {
    const backups = checked.map(id => items.find(x => x.id === id)).filter(Boolean);
    for (const id of checked) await del('todos', id);
    logActivity('bulk-del', `${checked.length} taken verwijderd`);
    undoable(`${checked.length} verwijderd`, async () => {
      for (const b of backups) await put('todos', b);
      render(container);
    });
  }
  container.dataset.todoBulk = '';
  render(container);
}

async function completeTask(container, item) {
  const updated = { ...item, done: true, completedAt: new Date().toISOString() };
  await put('todos', updated);
  logActivity('task-done', item.title);
  celebrateTask();

  // Herhalende taak → nieuwe instantie aanmaken
  if (item.recurring) {
    const next = { ...item, id: uid(), done: false, completedAt: null, createdAt: new Date().toISOString() };
    if (item.recurring === 'daily') next.dueDate = addDaysISO(item.dueDate || ymd(), 1);
    else if (item.recurring === 'weekly') next.dueDate = addDaysISO(item.dueDate || ymd(), 7);
    await put('todos', next);
  }

  // Alles-af viering
  const todos = await all('todos');
  const remaining = todos.filter(t => !t.done && !t.savedForLater);
  if (remaining.length === 0) {
    const today = ymd();
    const lastBig = localStorage.getItem('lastAllDoneCelebrate');
    if (lastBig !== today) {
      localStorage.setItem('lastAllDoneCelebrate', today);
      setTimeout(() => celebrateAllDone(), 600);
    }
  }
  render(container);
}

function addDaysISO(yyyymmdd, n) {
  const d = new Date(yyyymmdd); d.setDate(d.getDate() + n);
  return ymd(d);
}

function renderBucket(container, p, items, bulkMode) {
  const el = container.querySelector(`[data-bucket="${p}"]`);
  if (!items.length) { el.innerHTML = '<p class="muted">Geen taken.</p>'; return; }
  el.innerHTML = items.map(t => taskRow(t, bulkMode)).join('');
  bindRowEvents(container, el, items);
  if (!bulkMode) {
    enableSwipeDelete(el, async (id) => {
      const t = items.find(x => x.id === id);
      await del('todos', id);
      undoable('Taak verwijderd', async () => { if (t) await put('todos', t); render(container); });
      render(container);
    });
  }
}

function taskRow(t, bulkMode) {
  const sub = (t.subtasks || []);
  const subDone = sub.filter(s => s.done).length;
  const tagsHTML = (t.tags || []).map(tag => `<span class="pill">#${escapeHTML(tag)}</span>`).join(' ');
  return `
    <div class="list-item" data-id="${t.id}">
      ${bulkMode
        ? `<input type="checkbox" data-bulk="${t.id}" style="width:auto;margin-right:10px" />`
        : `<input type="checkbox" data-check="${t.id}" style="width:auto;margin-right:10px" />`}
      <div style="flex:1;min-width:0">
        <div>${escapeHTML(t.title)}${t.recurring ? ` <span class="pill">🔁 ${t.recurring}</span>` : ''}${t.dueDate ? ` <span class="pill">📅 ${t.dueDate}</span>` : ''}</div>
        ${t.note ? `<div class="muted" style="font-size:.8rem">${escapeHTML(t.note)}</div>` : ''}
        ${tagsHTML ? `<div style="margin-top:4px">${tagsHTML}</div>` : ''}
        ${sub.length ? `
          <div class="subtasks">
            <div class="muted" style="font-size:.78rem;margin:6px 0 4px">Subtaken (${subDone}/${sub.length})</div>
            ${sub.map((s, i) => `<label class="subtask"><input type="checkbox" data-sub="${t.id}:${i}" ${s.done?'checked':''}/> <span>${escapeHTML(s.title)}</span></label>`).join('')}
          </div>` : ''}
      </div>
      <div class="row" style="flex:0 0 auto;gap:4px">
        <button class="btn secondary" data-later="${t.id}" title="Mark voor later">🔖</button>
        <button class="btn secondary" data-edit="${t.id}">✎</button>
        ${bulkMode ? '' : `<button class="btn danger" data-del="${t.id}">×</button>`}
      </div>
    </div>`;
}

function bindRowEvents(container, el, items) {
  el.querySelectorAll('[data-check]').forEach(cb => {
    cb.onchange = async () => {
      const t = items.find(x => x.id === cb.dataset.check);
      if (t) await completeTask(container, t);
    };
  });
  el.querySelectorAll('[data-del]').forEach(b => {
    b.onclick = async (e) => {
      e.stopPropagation();
      const id = b.dataset.del;
      const t = items.find(x => x.id === id);
      await del('todos', id);
      logActivity('task-del', t ? t.title : id);
      undoable('Taak verwijderd', async () => { if (t) await put('todos', t); render(container); });
      render(container);
    };
  });
  el.querySelectorAll('[data-later]').forEach(b => {
    b.onclick = async () => {
      const id = b.dataset.later;
      const t = items.find(x => x.id === id);
      if (!t) return;
      await put('todos', { ...t, savedForLater: !t.savedForLater });
      ok(t.savedForLater ? 'Terug naar actief' : '🔖 Bewaard voor later');
      render(container);
    };
  });
  el.querySelectorAll('[data-edit]').forEach(b => {
    b.onclick = () => {
      const t = items.find(x => x.id === b.dataset.edit);
      if (t) openTodoModal(container, t);
    };
  });
  el.querySelectorAll('[data-sub]').forEach(cb => {
    cb.onchange = async () => {
      const [tid, idx] = cb.dataset.sub.split(':');
      const t = items.find(x => x.id === tid);
      if (!t) return;
      const subs = [...(t.subtasks || [])];
      subs[+idx] = { ...subs[+idx], done: cb.checked };
      await put('todos', { ...t, subtasks: subs });
      render(container);
    };
  });
}

function renderLater(container, items) {
  const el = container.querySelector('[data-bucket="later"]');
  if (!items.length) { el.innerHTML = '<p class="muted">Niets bewaard voor later.</p>'; return; }
  el.innerHTML = items.map(t => taskRow(t, false)).join('');
  bindRowEvents(container, el, items);
}

function renderArchive(container, items) {
  const el = container.querySelector('[data-bucket="archive"]');
  if (!items.length) { el.innerHTML = '<p class="muted">Niets afgerond.</p>'; return; }
  el.innerHTML = items.map(t => `
    <div class="list-item" data-id="${t.id}">
      <div style="flex:1">
        <div style="text-decoration:line-through">${escapeHTML(t.title)}</div>
        <div class="muted" style="font-size:.8rem">${LABELS[t.priority]}${t.completedAt ? ' · ' + new Date(t.completedAt).toLocaleDateString('nl-NL') : ''}</div>
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

function openTodoModal(container, existing = null) {
  const tags = existing?.tags?.join(', ') || '';
  const subs = existing?.subtasks?.map(s => s.title).join('\n') || '';
  openModal(existing ? 'Taak bewerken' : 'Nieuwe taak', `
    <label>Titel *</label><input name="title" required value="${existing ? escapeHTML(existing.title) : ''}" />
    <label>Notitie</label><textarea name="note" rows="2">${existing?.note ? escapeHTML(existing.note) : ''}</textarea>
    <label>Prioriteit</label>
    <select name="priority">
      <option value="high" ${existing?.priority==='high'?'selected':''}>Prioriteit</option>
      <option value="medium" ${existing?.priority==='medium'?'selected':''}>Medium</option>
      <option value="waiting" ${existing?.priority==='waiting'?'selected':''}>Waiting</option>
    </select>
    <label>Datum (optioneel)</label>
    <input name="dueDate" type="date" value="${existing?.dueDate || ''}" />
    <label>Herhalend (optioneel)</label>
    <select name="recurring">
      <option value="">Niet herhalend</option>
      <option value="daily" ${existing?.recurring==='daily'?'selected':''}>Dagelijks</option>
      <option value="weekly" ${existing?.recurring==='weekly'?'selected':''}>Wekelijks</option>
    </select>
    <label>Tags (komma-gescheiden)</label>
    <input name="tags" placeholder="werk, admin, persoonlijk" value="${escapeHTML(tags)}" />
    <label>Sub-taken (één per regel)</label>
    <textarea name="subtasks" rows="3" placeholder="Eerste stap&#10;Tweede stap">${escapeHTML(subs)}</textarea>
  `, async (d) => {
    if (!d.title) throw new Error('Titel verplicht');
    const tagsArr = (d.tags || '').split(',').map(s => s.trim()).filter(Boolean);
    const subsArr = (d.subtasks || '').split('\n').map(s => s.trim()).filter(Boolean).map(title => {
      const existingSub = existing?.subtasks?.find(s => s.title === title);
      return existingSub || { title, done: false };
    });
    const base = existing || { id: uid(), done: false, createdAt: new Date().toISOString() };
    await put('todos', {
      ...base,
      title: d.title,
      note: d.note || null,
      priority: d.priority,
      dueDate: d.dueDate || null,
      recurring: d.recurring || null,
      tags: tagsArr,
      subtasks: subsArr,
      savedForLater: base.savedForLater || false,
    });
    logActivity(existing ? 'task-edit' : 'task-add', d.title);
    ok(existing ? 'Bijgewerkt' : 'Toegevoegd');
    render(container);
  });
}
