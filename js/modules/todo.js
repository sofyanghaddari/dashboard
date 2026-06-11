import { all, put, del } from '../db.js';
import { openModal } from '../components/modal.js';
import { uid, escapeHTML, ymd, startOfWeek } from '../utils.js';
import { celebrateTask, celebrateAllDone } from '../components/celebrate.js';
import { ok } from '../components/toast.js';
import { enableSwipeDelete } from '../components/swipe.js';
import { undoable } from '../components/undo.js';
import { logActivity } from '../activity.js';
import { parseTaskInput } from '../nlp.js';
import { scheduleTaskNotification, cancelTaskNotification, requestNotificationPermission } from '../notifications.js';

const BUCKET_META = {
  high:    { label: 'Prioriteit', dot: 'bucket-dot-high' },
  medium:  { label: 'Medium',     dot: 'bucket-dot-medium' },
  waiting: { label: 'Wachtend',   dot: 'bucket-dot-waiting' },
};

export async function render(container) {
  const todos = await all('todos');
  const view      = container.dataset.todoView   || 'active';
  const filter    = container.dataset.todoFilter || 'all';
  const tagFilter = container.dataset.todoTag    || '';
  const bulkMode  = container.dataset.todoBulk   === '1';

  const active   = todos.filter(t => !t.done && !t.savedForLater);
  const later    = todos.filter(t => !t.done && t.savedForLater);
  const archived = todos.filter(t => t.done);

  const allTags = [...new Set(todos.flatMap(t => t.tags || []))].sort();

  const today = ymd();
  const dueToday = active.filter(t => t.dueDate && t.dueDate <= today).length;

  container.innerHTML = `
    <div class="todo-head">
      <h1 class="page-title">To-do</h1>
      <span class="todo-summary">${active.length} open${dueToday ? ` · <b>${dueToday}</b> vandaag` : ''}</span>
    </div>

    <div class="quick-add-row">
      <div class="quick-add-wrap">
        <input id="quick-add" placeholder="Snel toevoegen — 'morgen 10:00 APK'" />
        <span class="quick-add-enter">↵</span>
      </div>
      <button class="quick-detail-btn" id="add" aria-label="Gedetailleerde taak toevoegen" title="Gedetailleerde taak">＋</button>
    </div>

    <div class="todo-seg">
      <button class="todo-seg-btn ${view==='active' ?'active':''}" id="tab-active">
        Actief <span style="opacity:.6">${active.length}</span>
      </button>
      <button class="todo-seg-btn ${view==='later'  ?'active':''}" id="tab-later">
        🔖 Later <span style="opacity:.6">${later.length}</span>
      </button>
      <button class="todo-seg-btn ${view==='archive'?'active':''}" id="tab-archive">
        Klaar <span style="opacity:.6">${archived.length}</span>
      </button>
    </div>

    ${view === 'active' ? `
      <div class="todo-chiprow">
        <button class="filter-chip ${filter==='all'  ?'active':''}" data-filter="all">Alle</button>
        <button class="filter-chip ${filter==='today'?'active':''}" data-filter="today">Vandaag</button>
        <button class="filter-chip ${filter==='week' ?'active':''}" data-filter="week">Week</button>
        ${allTags.length ? `<span class="chip-sep"></span>
          ${allTags.map(t => `<button class="filter-chip tag-chip ${tagFilter===t?'active':''}" data-tag="${tagFilter===t?'':escapeHTML(t)}">#${escapeHTML(t)}</button>`).join('')}` : ''}
        <span class="chip-spacer"></span>
        <button class="filter-chip ${bulkMode?'active':''}" id="bulk-toggle">${bulkMode ? '✕ Klaar' : '☑ Selecteer'}</button>
      </div>
    ` : ''}

    ${bulkMode ? `
      <div class="row" style="margin-bottom:14px">
        <button class="btn secondary" id="bulk-done">✓ Klaar</button>
        <button class="btn danger" id="bulk-del">✕ Verwijder</button>
      </div>` : ''}

    <div id="todo-body"></div>
  `;

  let displayed;
  if (view === 'active')   displayed = applyFilters(active, filter, tagFilter);
  else if (view === 'later') displayed = later;
  else                      displayed = archived;

  const body = container.querySelector('#todo-body');

  if (view === 'active') {
    // Alleen niet-lege groepen tonen — geen lege placeholder-blokken die
    // de echte taken naar beneden duwen.
    const buckets = ['high', 'medium', 'waiting']
      .map(p => ({ p, items: displayed.filter(t => t.priority === p) }))
      .filter(b => b.items.length);

    if (!buckets.length) {
      const isFiltered = filter !== 'all' || tagFilter;
      body.innerHTML = `
        <div class="notes-empty">
          <div class="notes-empty-icon">${isFiltered ? '🔍' : '✨'}</div>
          <div class="notes-empty-title">${isFiltered ? 'Niets binnen dit filter' : 'Alles is gedaan'}</div>
          <div class="notes-empty-sub">${isFiltered ? 'Pas het filter aan of voeg een nieuwe taak toe.' : 'Geen open taken — voeg er snel één toe via de balk hierboven.'}</div>
        </div>`;
    } else {
      body.innerHTML = buckets.map(({ p, items }) => {
        const m = BUCKET_META[p];
        return `
          <div class="bucket-section">
            <div class="bucket-hd">
              <span class="bucket-dot ${m.dot}"></span>
              <span class="bucket-lbl">${m.label}</span>
              <span class="bucket-cnt">${items.length}</span>
            </div>
            <div class="task-list" data-bucket="${p}"></div>
          </div>`;
      }).join('');
      let idx = 0;
      for (const { p, items } of buckets) {
        renderBucket(container, p, items, bulkMode, idx);
        idx += items.length;
      }
    }
  } else if (view === 'later') {
    body.innerHTML = `<div class="task-list" data-bucket="later"></div>`;
    renderLater(container, displayed);
  } else {
    body.innerHTML = `<div id="archive-list"></div>`;
    renderArchive(container, displayed);
  }

  // ── Events ───────────────────────────────────────────────
  container.querySelector('#add').onclick = () => openTodoModal(container);

  const quick = container.querySelector('#quick-add');
  if (quick) {
    quick.onkeydown = async (e) => {
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
    quick.addEventListener('focus', () => {
      setTimeout(() => quick.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
    });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        if (document.activeElement === quick)
          quick.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }

  container.querySelector('#tab-active').onclick  = () => { container.dataset.todoView = 'active';  render(container); };
  container.querySelector('#tab-later').onclick   = () => { container.dataset.todoView = 'later';   render(container); };
  container.querySelector('#tab-archive').onclick = () => { container.dataset.todoView = 'archive'; render(container); };

  container.querySelectorAll('[data-filter]').forEach(b =>
    b.onclick = () => { container.dataset.todoFilter = b.dataset.filter; render(container); });
  container.querySelectorAll('[data-tag]').forEach(el =>
    el.onclick = () => { container.dataset.todoTag = el.dataset.tag; render(container); });

  const bulkBtn = container.querySelector('#bulk-toggle');
  if (bulkBtn) bulkBtn.onclick = () => { container.dataset.todoBulk = bulkMode ? '' : '1'; render(container); };
  if (bulkMode) {
    container.querySelector('#bulk-done').onclick = () => bulkAction(container, displayed, 'done');
    container.querySelector('#bulk-del').onclick  = () => bulkAction(container, displayed, 'del');
  }
}

// ── Helpers ───────────────────────────────────────────────

function applyFilters(items, filter, tagFilter) {
  const today     = ymd();
  const weekStart = startOfWeek();
  let res = items;
  if (filter === 'today')
    res = res.filter(t => t.dueDate && t.dueDate <= today);
  else if (filter === 'week')
    res = res.filter(t => t.dueDate && new Date(t.dueDate) >= weekStart && new Date(t.dueDate) <= addDays(weekStart, 6));
  if (tagFilter) res = res.filter(t => (t.tags || []).includes(tagFilter));
  return res;
}

function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

function dueDateBadge(dueDate) {
  if (!dueDate) return null;
  const today    = ymd();
  const tomorrow = ymd(new Date(Date.now() + 86400000));
  const bell = dueDate <= today ? '🔔' : '🔔';
  if (dueDate < today)    return { label: `${bell} ⚠ ${dueDate}`, cls: 'task-badge-overdue' };
  if (dueDate === today)  return { label: `${bell} Vandaag`,       cls: 'task-badge-today' };
  if (dueDate === tomorrow) return { label: `${bell} Morgen`,      cls: 'task-badge-date' };
  return { label: `${bell} ${dueDate}`, cls: 'task-badge-date' };
}

function taskCard(t, bulkMode, idx = 0) {
  const subs    = t.subtasks || [];
  const subDone = subs.filter(s => s.done).length;
  const badge   = dueDateBadge(t.dueDate);
  const tagsHTML = (t.tags || []).map(tag =>
    `<span class="task-badge">#${escapeHTML(tag)}</span>`).join('');

  const metaBadges = [
    badge ? `<span class="task-badge ${badge.cls}">${badge.label}</span>` : '',
    t.recurring ? `<span class="task-badge">🔁 ${t.recurring}</span>` : '',
    tagsHTML,
  ].filter(Boolean).join('');

  const subHTML = subs.length ? `
    <div class="task-sub-mini">
      <div class="task-sub-bar"><div class="task-sub-fill" style="width:${Math.round(subDone/subs.length*100)}%"></div></div>
      <span class="task-sub-txt">${subDone}/${subs.length}</span>
    </div>` : '';

  const subtaskExpanded = subs.length ? `
    <div class="subtasks" style="margin-top:8px">
      ${subs.map((s, i) => `
        <label class="subtask">
          <input type="checkbox" data-sub="${t.id}:${i}" ${s.done ? 'checked' : ''} />
          <span>${escapeHTML(s.title)}</span>
        </label>`).join('')}
    </div>` : '';

  return `
    <div class="task-card" data-id="${t.id}" data-priority="${t.priority}" style="--i:${Math.min(idx, 8)}">
      ${bulkMode
        ? `<input type="checkbox" data-bulk="${t.id}" style="width:22px;height:22px;min-width:22px;margin-top:1px" />`
        : `<button class="task-chk" data-check="${t.id}" aria-label="Afvinken"></button>`}
      <div class="task-body">
        <div class="task-title">${escapeHTML(t.title)}</div>
        ${t.note ? `<div class="task-note">${escapeHTML(t.note)}</div>` : ''}
        ${metaBadges ? `<div class="task-meta">${metaBadges}</div>` : ''}
        ${subHTML}
        ${subtaskExpanded}
      </div>
      <div class="task-actions">
        <button class="task-btn" data-later="${t.id}" title="Bewaar voor later">🔖</button>
        <button class="task-btn" data-edit="${t.id}" title="Bewerken">✎</button>
        ${bulkMode ? '' : `<button class="task-btn del" data-del="${t.id}" title="Verwijderen">✕</button>`}
      </div>
    </div>`;
}

function renderBucket(container, p, items, bulkMode, offset = 0) {
  const el = container.querySelector(`[data-bucket="${p}"]`);
  el.innerHTML = items.map((t, i) => taskCard(t, bulkMode, offset + i)).join('');
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

function bindRowEvents(container, el, items) {
  el.querySelectorAll('[data-check]').forEach(btn => {
    btn.onclick = async () => {
      const t = items.find(x => x.id === btn.dataset.check);
      if (!t) return;
      btn.disabled = true;
      btn.classList.add('chk-pop');
      const card = btn.closest('.task-card');
      if (card) {
        await new Promise(r => setTimeout(r, 180));
        card.classList.add('task-out');
        await new Promise(r => setTimeout(r, 240));
      }
      await completeTask(container, t);
    };
  });
  el.querySelectorAll('[data-del]').forEach(b => {
    b.onclick = async (e) => {
      e.stopPropagation();
      const id = b.dataset.del;
      const t = items.find(x => x.id === id);
      cancelTaskNotification(id);
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
  if (!items.length) {
    el.innerHTML = `<div class="todo-empty" style="padding:32px">
      <div style="font-size:1.8rem;margin-bottom:8px">🔖</div>
      <div style="font-weight:600;margin-bottom:4px">Niets bewaard voor later</div>
      <div style="font-size:.84rem;color:var(--text-dim)">Tap 🔖 op een taak om hem hier te parkeren</div>
    </div>`;
    return;
  }
  el.innerHTML = items.map((t, i) => taskCard(t, false, i)).join('');
  bindRowEvents(container, el, items);
}

function renderArchive(container, items) {
  const el = container.querySelector('#archive-list');
  if (!items.length) {
    el.innerHTML = `<div class="todo-empty" style="padding:32px">
      <div style="font-size:1.8rem;margin-bottom:8px">✅</div>
      <div style="font-weight:600;margin-bottom:4px">Nog niets afgerond</div>
      <div style="font-size:.84rem;color:var(--text-dim)">Voltooide taken verschijnen hier</div>
    </div>`;
    return;
  }
  el.innerHTML = `<div class="task-list">` + items.map((t, i) => `
    <div class="task-card task-card-done" data-id="${t.id}" data-priority="${t.priority || 'medium'}" style="--i:${Math.min(i, 8)}">
      <div style="width:22px;height:22px;min-width:22px;border-radius:6px;background:var(--ok);display:flex;align-items:center;justify-content:center;font-size:.8rem;color:white;flex-shrink:0;margin-top:1px">✓</div>
      <div class="task-body">
        <div class="task-title">${escapeHTML(t.title)}</div>
        <div class="task-meta">
          <span class="task-badge" style="color:var(--ok);border-color:rgba(93,212,154,.2)">
            Klaar ${t.completedAt ? '· ' + new Date(t.completedAt).toLocaleDateString('nl-NL') : ''}
          </span>
        </div>
      </div>
      <div class="task-actions">
        <button class="task-btn" data-restore="${t.id}" title="Herstellen">↺</button>
        <button class="task-btn del" data-del="${t.id}" title="Verwijderen">✕</button>
      </div>
    </div>`).join('') + `</div>`;

  el.querySelectorAll('[data-restore]').forEach(b => {
    b.onclick = async () => {
      const t = items.find(x => x.id === b.dataset.restore);
      await put('todos', { ...t, done: false, completedAt: null });
      render(container);
    };
  });
  el.querySelectorAll('[data-del]').forEach(b => {
    b.onclick = async () => { await del('todos', b.dataset.del); render(container); };
  });
}

async function completeTask(container, item) {
  await put('todos', { ...item, done: true, completedAt: new Date().toISOString() });
  logActivity('task-done', item.title);
  celebrateTask();

  if (item.recurring) {
    const next = { ...item, id: uid(), done: false, completedAt: null, createdAt: new Date().toISOString() };
    if (item.recurring === 'daily')  next.dueDate = addDaysISO(item.dueDate || ymd(), 1);
    if (item.recurring === 'weekly') next.dueDate = addDaysISO(item.dueDate || ymd(), 7);
    await put('todos', next);
  }

  const remaining = (await all('todos')).filter(t => !t.done && !t.savedForLater);
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
  const d = new Date(yyyymmdd); d.setDate(d.getDate() + n); return ymd(d);
}

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
  } else {
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

function openTodoModal(container, existing = null) {
  const tags = existing?.tags?.join(', ') || '';
  const subs = existing?.subtasks?.map(s => s.title).join('\n') || '';
  openModal(existing ? 'Taak bewerken' : 'Nieuwe taak', `
    <label>Titel *</label><input name="title" required value="${existing ? escapeHTML(existing.title) : ''}" />
    <label>Notitie</label><textarea name="note" rows="2">${existing?.note ? escapeHTML(existing.note) : ''}</textarea>
    <label>Prioriteit</label>
    <select name="priority">
      <option value="high"    ${existing?.priority==='high'   ?'selected':''}>Prioriteit</option>
      <option value="medium"  ${existing?.priority==='medium' ?'selected':''}>Medium</option>
      <option value="waiting" ${existing?.priority==='waiting'?'selected':''}>Wachtend</option>
    </select>
    <label>Datum (optioneel)</label>
    <input name="dueDate" type="date" value="${existing?.dueDate || ''}" />
    <label>Herhalend (optioneel)</label>
    <select name="recurring">
      <option value="">Niet herhalend</option>
      <option value="daily"  ${existing?.recurring==='daily' ?'selected':''}>Dagelijks</option>
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
      const ex = existing?.subtasks?.find(s => s.title === title);
      return ex || { title, done: false };
    });
    const base = existing || { id: uid(), done: false, createdAt: new Date().toISOString() };
    const saved = {
      ...base,
      title: d.title, note: d.note || null,
      priority: d.priority,
      dueDate: d.dueDate || null, recurring: d.recurring || null,
      tags: tagsArr, subtasks: subsArr,
      savedForLater: base.savedForLater || false,
    };
    await put('todos', saved);
    // Handle notifications
    if (d.dueDate && localStorage.getItem('taskNotifications') !== '0') {
      if ('Notification' in window && Notification.permission === 'default') {
        requestNotificationPermission().then(perm => {
          if (perm === 'granted') scheduleTaskNotification(saved);
        });
      } else {
        scheduleTaskNotification(saved);
      }
    } else if (!d.dueDate && existing?.dueDate) {
      cancelTaskNotification(saved.id);
    }
    logActivity(existing ? 'task-edit' : 'task-add', d.title);
    ok(existing ? 'Bijgewerkt' : 'Toegevoegd');
    render(container);
  });
}
