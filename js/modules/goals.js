import { all, put, del } from '../db.js';
import { openModal } from '../components/modal.js';
import { uid, fmtMoney, escapeHTML, ymd } from '../utils.js';
import { ok } from '../components/toast.js';
import { celebrateTask } from '../components/celebrate.js';

export async function render(container) {
  const [goals, rides, habits, habitLog, pots] = await Promise.all([
    all('goals'), all('rides'), all('habits'), all('habit_log'), all('pots'),
  ]);
  const totalRides = rides.reduce((s, r) => s + Number(r.amount || 0), 0);

  const long = goals.filter(g => g.term === 'long');
  const short = goals.filter(g => g.term === 'short');

  container.innerHTML = `
    <h1>Doelen & Gewoontes</h1>

    <div class="row">
      <button class="btn" id="add-long">+ Lange termijn</button>
      <button class="btn secondary" id="add-short">+ Korte termijn</button>
    </div>

    <h2 style="margin-top:16px">Lange termijn</h2>
    <div class="list" id="long-list"></div>
    <h2 style="margin-top:16px">Korte termijn</h2>
    <div class="list" id="short-list"></div>

    <hr style="border-color:var(--border);margin:24px 0" />

    <h2>🔁 Dagelijkse gewoontes</h2>
    <p class="muted" style="font-size:.85rem;margin:0 0 10px">Klik om af te vinken. Chains: bouw een keten ("na X doe ik Y").</p>
    <button class="btn block" id="add-habit">+ Nieuwe gewoonte</button>
    <div id="habits-list" style="margin-top:12px"></div>

    <hr style="border-color:var(--border);margin:24px 0" />

    <h2>🏺 Spaarpotjes</h2>
    <p class="muted" style="font-size:.85rem;margin:0 0 10px">Verdeel je geld virtueel in potjes (zoals Bunq).</p>
    <button class="btn block" id="add-pot">+ Nieuw potje</button>
    <div id="pots-list" style="margin-top:12px"></div>
  `;

  renderSection(container, '#long-list', long, totalRides);
  renderSection(container, '#short-list', short, totalRides);
  renderHabits(container, habits, habitLog);
  renderPots(container, pots);

  container.querySelector('#add-long').onclick = () => openGoalModal(container, null, 'long');
  container.querySelector('#add-short').onclick = () => openGoalModal(container, null, 'short');
  container.querySelector('#add-habit').onclick = () => openHabitModal(container, null, habits);
  container.querySelector('#add-pot').onclick = () => openPotModal(container, null);
}

function renderSection(container, sel, items, totalRides) {
  const el = container.querySelector(sel);
  if (!items.length) { el.innerHTML = '<p class="muted">Nog geen doelen.</p>'; return; }
  el.innerHTML = items.map(g => {
    const target = Number(g.target || 0);
    const taxiPct = Number(g.taxiPercent || 0);
    const savedFromTaxi = taxiPct > 0 ? totalRides * (taxiPct / 100) : 0;
    const progress = target > 0
      ? Math.min(100, Math.round(savedFromTaxi / target * 100))
      : Number(g.progress || 0);
    const showTaxi = taxiPct > 0 && target > 0;

    return `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:start;gap:8px">
        <div>
          <b>${escapeHTML(g.title)}</b>
          ${g.deadline ? `<div class="muted" style="font-size:.8rem">deadline ${g.deadline}</div>` : ''}
          ${g.description ? `<div class="muted" style="margin-top:4px">${escapeHTML(g.description)}</div>` : ''}
          ${showTaxi ? `<div class="muted" style="font-size:.85rem;margin-top:6px">🚖 ${taxiPct}% van elke rit · gespaard: <b class="money">${fmtMoney(savedFromTaxi)}</b> / ${fmtMoney(target)}</div>` : ''}
        </div>
        <div class="row" style="flex:0 0 auto;gap:4px">
          <button class="btn secondary" data-edit="${g.id}">✎</button>
          <button class="btn danger" data-del="${g.id}">×</button>
        </div>
      </div>
      ${showTaxi
        ? `<div class="progress-bar" style="margin-top:10px"><div class="progress-fill" style="width:${progress}%"></div></div>
           <div class="muted" style="font-size:.8rem;margin-top:4px">${progress}%</div>`
        : `<label>Voortgang: <b>${progress}%</b></label>
           <input type="range" min="0" max="100" value="${progress}" data-progress="${g.id}" />`}
    </div>`;
  }).join('');
  el.querySelectorAll('[data-del]').forEach(b => {
    b.onclick = async () => { await del('goals', b.dataset.del); render(container); };
  });
  el.querySelectorAll('[data-edit]').forEach(b => {
    b.onclick = () => {
      const g = items.find(x => x.id === b.dataset.edit);
      openGoalModal(container, g, g.term);
    };
  });
  el.querySelectorAll('[data-progress]').forEach(input => {
    // Update label instantly while dragging (no DB write)
    input.oninput = () => {
      const label = input.previousElementSibling;
      if (label) label.innerHTML = `Voortgang: <b>${input.value}%</b>`;
    };
    // Save to DB only when user releases the slider
    input.onchange = async () => {
      const g = items.find(x => x.id === input.dataset.progress);
      await put('goals', { ...g, progress: parseInt(input.value, 10) });
      render(container);
    };
  });
}

function renderHabits(container, habits, log) {
  const el = container.querySelector('#habits-list');
  if (!habits.length) { el.innerHTML = '<p class="muted">Nog geen gewoontes.</p>'; return; }
  const today = ymd();
  const doneToday = new Set(log.filter(l => l.date === today && l.done).map(l => l.habitId));

  // Order: chain head first, then their chain
  const heads = habits.filter(h => !h.after);
  const followers = habits.filter(h => h.after);
  const ordered = [];
  function addChain(h) {
    ordered.push(h);
    followers.filter(f => f.after === h.id).forEach(addChain);
  }
  heads.forEach(addChain);
  // catch orphans
  habits.forEach(h => { if (!ordered.includes(h)) ordered.push(h); });

  el.innerHTML = ordered.map((h, i) => {
    const done = doneToday.has(h.id);
    const indent = h.after ? 'margin-left:24px' : '';
    const chainArrow = h.after ? '<span class="muted" style="margin-right:6px">↳</span>' : '';
    // 14-day strip
    const strip = [];
    for (let d = 13; d >= 0; d--) {
      const date = ymd(new Date(Date.now() - d * 86400000));
      const dDone = log.some(l => l.habitId === h.id && l.date === date && l.done);
      strip.push(`<span class="hab-day ${dDone?'done':''}" title="${date}"></span>`);
    }
    return `
      <div class="card" style="${indent};padding:12px">
        <div style="display:flex;align-items:center;gap:10px">
          ${chainArrow}
          <button class="hab-check ${done?'done':''}" data-toggle="${h.id}">${done?'✓':''}</button>
          <div style="flex:1;min-width:0">
            <div><span style="font-size:1.1rem">${h.emoji || '✨'}</span> <b>${escapeHTML(h.name)}</b></div>
            <div class="hab-strip">${strip.join('')}</div>
          </div>
          <div class="row" style="flex:0 0 auto;gap:4px">
            <button class="btn secondary" data-habit-edit="${h.id}">✎</button>
            <button class="btn danger" data-habit-del="${h.id}">×</button>
          </div>
        </div>
      </div>`;
  }).join('');

  el.querySelectorAll('[data-toggle]').forEach(b => {
    b.onclick = async () => {
      const id = b.dataset.toggle;
      const key = today + ':' + id;
      const existing = log.find(l => l.id === key);
      if (existing) await put('habit_log', { ...existing, done: !existing.done });
      else await put('habit_log', { id: key, date: today, habitId: id, done: true });
      if (!existing || !existing.done) celebrateTask();
      render(container);
    };
  });
  el.querySelectorAll('[data-habit-del]').forEach(b => {
    b.onclick = async () => { await del('habits', b.dataset.habitDel); render(container); };
  });
  el.querySelectorAll('[data-habit-edit]').forEach(b => {
    b.onclick = () => {
      const h = habits.find(x => x.id === b.dataset.habitEdit);
      openHabitModal(container, h, habits);
    };
  });
}

function openHabitModal(container, existing, allHabits) {
  const others = allHabits.filter(h => !existing || h.id !== existing.id);
  openModal(existing ? 'Gewoonte bewerken' : 'Nieuwe gewoonte', `
    <label>Naam *</label><input name="name" required value="${existing ? escapeHTML(existing.name) : ''}" />
    <label>Emoji (1 teken)</label><input name="emoji" maxlength="2" value="${existing?.emoji || '✨'}" />
    <label>Onderdeel van keten? (na deze gewoonte)</label>
    <select name="after">
      <option value="">— geen, zelfstandig —</option>
      ${others.map(h => `<option value="${h.id}" ${existing?.after===h.id?'selected':''}>${escapeHTML(h.name)}</option>`).join('')}
    </select>
  `, async (d) => {
    if (!d.name) throw new Error('Naam verplicht');
    const base = existing || { id: uid(), createdAt: new Date().toISOString() };
    await put('habits', { ...base, name: d.name, emoji: d.emoji || '✨', after: d.after || null });
    ok('Opgeslagen');
    render(container);
  });
}

function renderPots(container, pots) {
  const el = container.querySelector('#pots-list');
  if (!pots.length) { el.innerHTML = '<p class="muted">Nog geen potjes.</p>'; return; }
  el.innerHTML = pots.map(p => {
    const pct = p.target > 0 ? Math.min(100, Math.round(p.current / p.target * 100)) : 0;
    return `
      <div class="card pot-card">
        <div style="display:flex;justify-content:space-between;align-items:start;gap:8px">
          <div>
            <b style="font-size:1.05rem">${p.emoji || '🏺'} ${escapeHTML(p.name)}</b>
            <div class="muted" style="font-size:.85rem;margin-top:4px"><b class="money">${fmtMoney(p.current)}</b> / ${fmtMoney(p.target || 0)}</div>
          </div>
          <div class="row" style="flex:0 0 auto;gap:4px">
            <button class="btn" data-pot-add="${p.id}">+ €</button>
            <button class="btn secondary" data-pot-sub="${p.id}">– €</button>
            <button class="btn danger" data-pot-del="${p.id}">×</button>
          </div>
        </div>
        <div class="progress-bar" style="margin-top:10px"><div class="progress-fill" style="width:${pct}%"></div></div>
      </div>`;
  }).join('');
  el.querySelectorAll('[data-pot-add]').forEach(b => {
    b.onclick = () => {
      const p = pots.find(x => x.id === b.dataset.potAdd);
      openModal(`Toevoegen — ${escapeHTML(p.name)}`, `
        <label>Bedrag (€) *</label>
        <input name="amount" type="number" step="0.01" min="0.01" inputmode="decimal" required autofocus />
      `, async (d) => {
        const amt = parseFloat(d.amount);
        if (!isFinite(amt) || amt <= 0) throw new Error('Bedrag moet groter dan 0 zijn');
        await put('pots', { ...p, current: Number(p.current || 0) + amt });
        ok(`€${amt.toFixed(2)} toegevoegd aan ${p.name}`);
        render(container);
      });
    };
  });
  el.querySelectorAll('[data-pot-sub]').forEach(b => {
    b.onclick = () => {
      const p = pots.find(x => x.id === b.dataset.potSub);
      openModal(`Afhalen — ${escapeHTML(p.name)}`, `
        <label>Bedrag (€) *</label>
        <input name="amount" type="number" step="0.01" min="0.01" inputmode="decimal" required autofocus />
      `, async (d) => {
        const amt = parseFloat(d.amount);
        if (!isFinite(amt) || amt <= 0) throw new Error('Bedrag moet groter dan 0 zijn');
        await put('pots', { ...p, current: Math.max(0, Number(p.current || 0) - amt) });
        ok(`€${amt.toFixed(2)} afgehaald van ${p.name}`);
        render(container);
      });
    };
  });
  el.querySelectorAll('[data-pot-del]').forEach(b => {
    b.onclick = async () => { await del('pots', b.dataset.potDel); render(container); };
  });
}

function openPotModal(container, existing) {
  openModal(existing ? 'Potje bewerken' : 'Nieuw potje', `
    <label>Naam *</label><input name="name" required value="${existing ? escapeHTML(existing.name) : ''}" />
    <label>Emoji</label><input name="emoji" maxlength="2" value="${existing?.emoji || '🏺'}" />
    <label>Doelbedrag (€)</label><input name="target" type="number" step="1" value="${existing?.target || ''}" />
    <label>Huidig bedrag (€)</label><input name="current" type="number" step="0.01" value="${existing?.current || 0}" />
  `, async (d) => {
    if (!d.name) throw new Error('Naam verplicht');
    const base = existing || { id: uid(), createdAt: new Date().toISOString() };
    await put('pots', {
      ...base,
      name: d.name,
      emoji: d.emoji || '🏺',
      target: parseFloat(d.target) || 0,
      current: parseFloat(d.current) || 0,
    });
    ok('Opgeslagen');
    render(container);
  });
}

function openGoalModal(container, existing, term) {
  openModal(existing ? 'Doel bewerken' : 'Nieuw doel', `
    <label>Titel *</label><input name="title" required value="${existing ? escapeHTML(existing.title) : ''}" />
    <label>Beschrijving</label><textarea name="description" rows="2">${existing && existing.description ? escapeHTML(existing.description) : ''}</textarea>
    <label>Deadline</label><input name="deadline" type="date" value="${existing && existing.deadline ? existing.deadline : ''}" />
    <label>Streefbedrag (€) — optioneel</label>
    <input name="target" type="number" step="1" value="${existing && existing.target ? existing.target : ''}" />
    <label>% van elke taxi-rit — optioneel (auto-voortgang)</label>
    <input name="taxiPercent" type="number" step="0.5" min="0" max="100" value="${existing && existing.taxiPercent ? existing.taxiPercent : ''}" />
  `, async (d) => {
    if (!d.title) throw new Error('Titel verplicht');
    const base = existing || { id: uid(), term, progress: 0 };
    await put('goals', {
      ...base,
      title: d.title,
      description: d.description || '',
      deadline: d.deadline || null,
      target: d.target ? parseFloat(d.target) : null,
      taxiPercent: d.taxiPercent ? parseFloat(d.taxiPercent) : null,
    });
    render(container);
  });
}
