// ✅ "Vandaag" paneel voor het dashboard.
// Bundelt de taken van vandaag (deadline vandaag + achterstallig + open hoge-prio
// zonder datum) én de agenda-afspraken van vandaag in één lijst. Snel toevoegen
// (NL natural-language, tijd optioneel) en simpel afvinken — taken én afspraken.
// Ververst alleen zichzelf (eigen mount), niet het hele dashboard.
import { all, put } from './db.js';
import { uid, ymd, escapeHTML, effectiveNow } from './utils.js';
import { parseTaskInput } from './nlp.js';

const CAT_COLOR = { werk: '#6ec9ff', leren: '#a78bfa', persoonlijk: '#fb923c', sport: '#4ade80', rust: '#94a3b8' };
const CAT_LABEL = { werk: 'Werk', leren: 'Leren', persoonlijk: 'Persoonlijk', sport: 'Sport', rust: 'Rust' };

const delay = (ms) => new Promise(r => setTimeout(r, ms));

export async function mountTodayPanel(root) {
  const mount = root && root.querySelector('#today-panel-mount');
  if (!mount) return;
  await renderPanel(mount, true);
}

async function gather() {
  const today = ymd(effectiveNow());
  const [todos, events] = await Promise.all([
    all('todos').catch(() => []),
    all('agenda_events').catch(() => []),
  ]);

  const items = [];
  for (const t of todos) {
    if (t.savedForLater) continue;
    const overdue = !!(t.dueDate && t.dueDate < today);
    const relevant = t.dueDate === today || overdue || (!t.dueDate && t.priority === 'high');
    const doneToday = t.done && (t.completedAt || '').slice(0, 10) === today;
    if (t.done && !doneToday) continue;       // op een andere dag afgerond → niet tonen
    if (!t.done && !relevant) continue;
    items.push({
      kind: 'task', store: 'todos', id: t.id,
      title: t.title, time: t.dueTime || null, overdue,
      priority: t.priority || 'medium', done: !!t.done,
    });
  }
  for (const e of events) {
    if (e.date !== today) continue;
    items.push({
      kind: 'event', store: 'agenda_events', id: e.id,
      title: e.title, time: `${String(e.hour).padStart(2, '0')}:${String(e.minute || 0).padStart(2, '0')}`,
      cat: e.category, done: !!e.done, priority: 'medium', overdue: false,
    });
  }
  return { today, items };
}

function minsOf(it) {
  if (it.overdue) return -1;
  if (it.time) { const [h, m] = it.time.split(':').map(Number); return h * 60 + (m || 0); }
  return 1440 + (it.priority === 'high' ? 0 : 60);
}

function itemHTML(it, i) {
  const meta = [];
  if (it.overdue) meta.push(`<span class="tp-badge-late">te laat${it.time ? ' · ' + it.time : ''}</span>`);
  else if (it.time) meta.push(`<span class="tp-time">${it.time}</span>`);
  if (it.kind === 'event') meta.push(`<span class="tp-tag">${escapeHTML(CAT_LABEL[it.cat] || 'Agenda')}</span>`);
  const accent = it.kind === 'event' ? (CAT_COLOR[it.cat] || '#888') : '';
  const prioDot = it.kind === 'task' && it.priority === 'high' && !it.done ? '<span class="tp-prio-dot"></span>' : '';
  return `<div class="tp-item ${it.kind}${it.done ? ' tp-item-done' : ''}" data-store="${it.store}" data-id="${it.id}" style="${accent ? `--cat:${accent};` : ''}--i:${Math.min(i, 9)}">
    <span class="tp-check${it.done ? ' on' : ''}" role="button" tabindex="0" aria-label="${it.done ? 'Ongedaan maken' : 'Afronden'}"></span>
    <div class="tp-body">
      <div class="tp-item-title">${prioDot}${escapeHTML(it.title)}</div>
      ${meta.length ? `<div class="tp-meta">${meta.join('<span class="tp-dot">·</span>')}</div>` : ''}
    </div>
  </div>`;
}

async function renderPanel(mount, animate = false) {
  const { items } = await gather();
  const active = items.filter(i => !i.done).sort((a, b) => minsOf(a) - minsOf(b));
  const done = items.filter(i => i.done);
  const total = active.length + done.length;
  const pct = total ? Math.round(done.length / total * 100) : 0;
  const showDone = mount.dataset.showDone === '1';

  mount.innerHTML = `
    <div class="card today-panel">
      <div class="tp-head">
        <h2 class="card-title" style="margin:0">Vandaag</h2>
        <span class="tp-sub">${active.length ? `${active.length} te doen` : (total ? 'Alles afgerond' : 'Niets gepland')}</span>
      </div>
      ${total ? `<div class="tp-progress"><div class="tp-progress-fill" style="width:${pct}%"></div></div>` : ''}
      <div class="tp-quick">
        <input id="tp-input" type="text" placeholder="Snel iets toevoegen…" autocomplete="off" enterkeyhint="done" />
        <button class="tp-quick-add" id="tp-add" aria-label="Toevoegen" type="button">+</button>
      </div>
      <div class="tp-list${animate ? ' tp-animate' : ''}" id="tp-list">
        ${active.map((it, i) => itemHTML(it, i)).join('')}
      </div>
      ${active.length === 0 ? `<div class="tp-empty">${total ? 'Alles afgerond voor vandaag ✨' : 'Niets gepland — voeg snel iets toe of plan in je Week.'}</div>` : ''}
      ${done.length ? `
        <button class="tp-done-toggle" id="tp-done-toggle" type="button">${showDone ? '▾' : '▸'} ${done.length} afgerond vandaag</button>
        ${showDone ? `<div class="tp-list tp-done-list">${done.map((it, i) => itemHTML(it, i)).join('')}</div>` : ''}
      ` : ''}
    </div>`;

  wire(mount);
}

function wire(mount) {
  const input = mount.querySelector('#tp-input');
  const addBtn = mount.querySelector('#tp-add');

  const submit = async () => {
    const v = (input?.value || '').trim();
    if (!v) return;
    const p = parseTaskInput(v);
    const today = ymd(effectiveNow());
    await put('todos', {
      id: uid(), title: p.title || v, note: null,
      priority: p.priority || 'medium', done: false, savedForLater: false,
      dueDate: p.dueDate || today, dueTime: p.dueTime || null,
      recurring: p.recurring || null, tags: [], subtasks: [],
      createdAt: new Date().toISOString(),
    });
    try { navigator.vibrate?.(12); } catch (_) {}
    await renderPanel(mount, false);
    mount.querySelector('#tp-input')?.focus();
  };

  if (input) input.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } };
  if (addBtn) addBtn.onclick = submit;

  mount.querySelectorAll('.tp-check').forEach(chk => {
    const handler = async () => {
      const item = chk.closest('.tp-item');
      if (!item) return;
      const { store, id } = item.dataset;
      const currentlyDone = chk.classList.contains('on');
      if (!currentlyDone) {
        item.classList.add('checking');
        try { navigator.vibrate?.(15); } catch (_) {}
        await delay(180);
        item.classList.add('leaving');
        await delay(300);
        await setDone(store, id, true);
      } else {
        await setDone(store, id, false);
      }
      await renderPanel(mount, false);
    };
    chk.onclick = handler;
    chk.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); } };
  });

  const dt = mount.querySelector('#tp-done-toggle');
  if (dt) dt.onclick = async () => {
    mount.dataset.showDone = mount.dataset.showDone === '1' ? '0' : '1';
    await renderPanel(mount, false);
  };
}

async function setDone(store, id, done) {
  const list = await all(store).catch(() => []);
  const obj = list.find(x => x.id === id);
  if (!obj) return;
  obj.done = done;
  if (store === 'todos') obj.completedAt = done ? new Date().toISOString() : null;
  await put(store, obj);
}
