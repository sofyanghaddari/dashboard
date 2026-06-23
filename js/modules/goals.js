import { all, put, del } from '../db.js';
import { openModal } from '../components/modal.js';
import { uid, fmtMoney, parseAmount, escapeHTML, ymd, orderedHabits, effectiveNow } from '../utils.js';
import { ok } from '../components/toast.js';
import { celebrateTask } from '../components/celebrate.js';

export async function render(container) {
  const [goals, rides, habits, habitLog, pots] = await Promise.all([
    all('goals'), all('rides'), all('habits'), all('habit_log'), all('pots'),
  ]);
  const totalRides = rides.reduce((s, r) => s + Number(r.amount || 0), 0);

  const long  = goals.filter(g => g.term === 'long');
  const short = goals.filter(g => g.term === 'short');

  container.innerHTML = `
    <h1 class="page-title">Doelen &amp; Gewoontes</h1>

    <div class="section-header" style="margin-top:4px">
      <h2>Lange termijn</h2>
      <button class="section-add-btn" id="add-long">+ Doel</button>
    </div>
    <div id="long-list"></div>

    <div class="section-header">
      <h2>Korte termijn</h2>
      <button class="section-add-btn" id="add-short">+ Doel</button>
    </div>
    <div id="short-list"></div>

    <div class="section-header">
      <h2>🔁 Dagelijkse gewoontes</h2>
      <button class="section-add-btn" id="add-habit">+ Gewoonte</button>
    </div>
    <div id="habits-list"></div>

    <div class="section-header">
      <h2>Spaarpotjes</h2>
      <button class="section-add-btn" id="add-pot">+ Potje</button>
    </div>
    <div id="pots-list"></div>
  `;

  renderGoals(container, '#long-list',  long,  totalRides);
  renderGoals(container, '#short-list', short, totalRides);
  renderHabits(container, habits, habitLog);
  renderPots(container, pots);

  container.querySelector('#add-long').onclick  = () => openGoalModal(container, null, 'long');
  container.querySelector('#add-short').onclick = () => openGoalModal(container, null, 'short');
  container.querySelector('#add-habit').onclick = () => openHabitModal(container, null, habits);
  container.querySelector('#add-pot').onclick   = () => openPotModal(container, null);
}

// ── Goals ─────────────────────────────────────────────────

function renderGoals(container, sel, items, totalRides) {
  const el = container.querySelector(sel);
  if (!items.length) {
    el.replaceChildren();
    el.insertAdjacentHTML('beforeend', `<div class="section-empty">
      <div class="section-empty-icon">🎯</div>
      <div class="section-empty-text">Nog geen doelen — tik <b>+ Doel</b> om er een te stellen.</div>
    </div>`);
    return;
  }
  el.innerHTML = items.map(g => {
    const target      = Number(g.target || 0);
    const taxiPct     = Number(g.taxiPercent || 0);
    const taxiSaved   = taxiPct > 0 ? totalRides * (taxiPct / 100) : 0;
    const progress    = target > 0 && taxiPct > 0
      ? Math.min(100, Math.round(taxiSaved / target * 100))
      : Number(g.progress || 0);
    const isAutoTrack = taxiPct > 0 && target > 0;
    const status      = progress >= 100 ? 'voltooid' : 'actief';

    const deadlineChip = g.deadline
      ? `<span class="goal-meta-chip">📅 ${new Date(g.deadline + 'T12:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}</span>` : '';
    const taxiChip = isAutoTrack
      ? `<span class="goal-meta-chip">🚖 ${taxiPct}% per rit · <b class="money blurred-amount">${fmtMoney(taxiSaved)}</b> / <span class="blurred-amount">${fmtMoney(target)}</span></span>` : '';

    const progressControl = isAutoTrack
      ? `<div class="goal-progress-row">
           <div class="progress-bar goal-progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
           <span class="goal-pct">${progress}%</span>
         </div>`
      : `<div class="goal-slider-row">
           <div class="goal-progress-row">
             <div class="progress-bar goal-progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
             <span class="goal-pct">${progress}%</span>
           </div>
           <input type="range" min="0" max="100" value="${progress}" data-progress="${g.id}" style="margin-top:8px" />
         </div>`;

    return `
      <div class="goal-card">
        <div class="goal-card-top">
          <div class="goal-card-left">
            <div class="goal-card-title">${escapeHTML(g.title)}</div>
            ${g.description ? `<div class="goal-card-desc">${escapeHTML(g.description)}</div>` : ''}
          </div>
          <div class="goal-card-right">
            <span class="goal-status status-${status}">${status === 'voltooid' ? '✓ Voltooid' : '● Actief'}</span>
            <div class="goal-actions">
              <button class="goal-btn" data-edit="${g.id}" title="Bewerken">✎</button>
              <button class="goal-btn del" data-del="${g.id}" title="Verwijderen">✕</button>
            </div>
          </div>
        </div>
        ${progressControl}
        ${(deadlineChip || taxiChip) ? `<div class="goal-meta-row">${deadlineChip}${taxiChip}</div>` : ''}
      </div>`;
  }).join('');

  el.querySelectorAll('[data-del]').forEach(b =>
    b.onclick = async () => { await del('goals', b.dataset.del); render(container); });

  el.querySelectorAll('[data-edit]').forEach(b =>
    b.onclick = () => {
      const g = items.find(x => x.id === b.dataset.edit);
      if (g) openGoalModal(container, g, g.term);
    });

  el.querySelectorAll('[data-progress]').forEach(input => {
    input.oninput = () => {
      const pctEl = input.closest('.goal-card')?.querySelector('.goal-pct');
      if (pctEl) pctEl.textContent = input.value + '%';
      const fillEl = input.closest('.goal-card')?.querySelector('.progress-fill');
      if (fillEl) fillEl.style.width = input.value + '%';
    };
    input.onchange = async () => {
      const g = items.find(x => x.id === input.dataset.progress);
      if (!g) return;
      await put('goals', { ...g, progress: parseInt(input.value, 10) });
      const card = input.closest('.goal-card');
      const newPct = parseInt(input.value, 10);
      if (card) {
        const statusEl = card.querySelector('.goal-status');
        if (statusEl) {
          if (newPct >= 100) {
            statusEl.textContent = '✓ Voltooid';
            statusEl.className = 'goal-status status-voltooid';
            celebrateTask();
            ok('🎉 Doel behaald!');
          } else {
            statusEl.textContent = '● Actief';
            statusEl.className = 'goal-status status-actief';
          }
        }
      }
    };
  });
}

// ── Habits ────────────────────────────────────────────────

function renderHabits(container, habits, log) {
  const el = container.querySelector('#habits-list');
  if (!habits.length) {
    el.replaceChildren();
    el.insertAdjacentHTML('beforeend', `<div class="section-empty">
      <div class="section-empty-icon">🔁</div>
      <div class="section-empty-text">Geen gewoontes — bouw een dagelijkse routine die blijft plakken.</div>
    </div>`);
    return;
  }
  const now      = effectiveNow();
  const today    = ymd(now);
  const doneToday = new Set(log.filter(l => l.date === today && l.done).map(l => l.habitId));

  const ordered = orderedHabits(habits);

  el.innerHTML = ordered.map(h => {
    const done   = doneToday.has(h.id);
    const chained = !!h.after;
    const strip  = [];
    for (let d = 13; d >= 0; d--) {
      const date  = ymd(new Date(now.getTime() - d * 86400000));
      const dDone = log.some(l => l.habitId === h.id && l.date === date && l.done);
      strip.push(`<span class="hab-day ${dDone ? 'done' : ''}" title="${date}"></span>`);
    }
    return `
      <div class="habit-item ${chained ? 'chained' : ''}">
        <div class="habit-item-top">
          ${chained ? `<span class="habit-chain-arrow">↳</span>` : ''}
          <button class="habit-check-btn ${done ? 'done' : ''}" data-toggle="${h.id}">
            ${done ? '✓' : ''}
          </button>
          <div class="habit-name-row">
            <div class="habit-name"><span style="font-size:1.1rem">${h.emoji || '✨'}</span> ${escapeHTML(h.name)}</div>
          </div>
          <div class="habit-actions">
            <button class="task-btn" data-habit-edit="${h.id}">✎</button>
            <button class="task-btn del" data-habit-del="${h.id}">✕</button>
          </div>
        </div>
        <div class="habit-strip">${strip.join('')}</div>
      </div>`;
  }).join('');

  el.querySelectorAll('[data-toggle]').forEach(b => {
    b.onclick = async () => {
      const id  = b.dataset.toggle;
      const key = today + ':' + id;
      const existing = log.find(l => l.id === key);
      if (existing) await put('habit_log', { ...existing, done: !existing.done });
      else          await put('habit_log', { id: key, date: today, habitId: id, done: true });
      if (!existing || !existing.done) celebrateTask();
      render(container);
    };
  });
  el.querySelectorAll('[data-habit-del]').forEach(b =>
    b.onclick = async () => {
      const deletedId = b.dataset.habitDel;
      await del('habits', deletedId);
      // Clear orphaned chain references that pointed to the deleted habit
      await Promise.all(
        habits.filter(h => h.after === deletedId).map(h => put('habits', { ...h, after: null }))
      );
      render(container);
    });
  el.querySelectorAll('[data-habit-edit]').forEach(b =>
    b.onclick = () => {
      const h = habits.find(x => x.id === b.dataset.habitEdit);
      if (h) openHabitModal(container, h, habits);
    });
}

// ── Pots ──────────────────────────────────────────────────

function renderPots(container, pots) {
  const el = container.querySelector('#pots-list');
  if (!pots.length) {
    el.replaceChildren();
    el.insertAdjacentHTML('beforeend', `<div class="section-empty">
      <div class="section-empty-icon">🏺</div>
      <div class="section-empty-text">Geen spaarpotjes — verdeel je geld in virtuele potjes.</div>
    </div>`);
    return;
  }
  el.innerHTML = pots.map(p => {
    const pct = p.target > 0 ? Math.min(100, Math.round(p.current / p.target * 100)) : 0;
    return `
      <div class="pot-item">
        <div class="pot-item-top">
          <div class="pot-icon">${p.emoji || '🏺'}</div>
          <div class="pot-info">
            <div class="pot-name">${escapeHTML(p.name)}</div>
            <div class="pot-amount">
              <b class="money blurred-amount">${fmtMoney(p.current)}</b>
              ${p.target ? ` / <span class="muted blurred-amount">${fmtMoney(p.target)}</span>` : ''}
            </div>
          </div>
          <div class="pot-actions">
            <button class="pot-btn" data-pot-add="${p.id}" title="Toevoegen">+</button>
            <button class="pot-btn" data-pot-sub="${p.id}" title="Afhalen">−</button>
            <button class="pot-btn" data-pot-edit="${p.id}" title="Bewerken">✎</button>
            <button class="pot-btn del" data-pot-del="${p.id}" title="Verwijderen">✕</button>
          </div>
        </div>
        ${p.target ? `
          <div class="pot-bar-row">
            <div class="progress-bar pot-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
            <span class="pot-pct">${pct}%</span>
          </div>` : ''}
      </div>`;
  }).join('');

  el.querySelectorAll('[data-pot-add]').forEach(b => {
    b.onclick = () => {
      const p = pots.find(x => x.id === b.dataset.potAdd);
      if (!p) return;
      openModal(`Toevoegen — ${escapeHTML(p.name)}`, `
        <label>Bedrag (€) *</label>
        <input name="amount" type="text" inputmode="decimal" autocomplete="off" required autofocus placeholder="0,00" />
      `, async (d) => {
        const amt = parseAmount(d.amount);
        if (!isFinite(amt) || amt <= 0) throw new Error('Bedrag moet groter dan 0 zijn');
        await put('pots', { ...p, current: Number(p.current || 0) + amt });
        ok(`${fmtMoney(amt)} toegevoegd aan ${escapeHTML(p.name)}`);
        render(container);
      });
    };
  });
  el.querySelectorAll('[data-pot-sub]').forEach(b => {
    b.onclick = () => {
      const p = pots.find(x => x.id === b.dataset.potSub);
      if (!p) return;
      openModal(`Afhalen — ${escapeHTML(p.name)}`, `
        <label>Bedrag (€) *</label>
        <input name="amount" type="text" inputmode="decimal" autocomplete="off" required autofocus placeholder="0,00" />
      `, async (d) => {
        const amt = parseAmount(d.amount);
        if (!isFinite(amt) || amt <= 0) throw new Error('Bedrag moet groter dan 0 zijn');
        await put('pots', { ...p, current: Math.max(0, Number(p.current || 0) - amt) });
        ok(`${fmtMoney(amt)} afgehaald van ${escapeHTML(p.name)}`);
        render(container);
      });
    };
  });
  el.querySelectorAll('[data-pot-edit]').forEach(b => {
    b.onclick = () => {
      const p = pots.find(x => x.id === b.dataset.potEdit);
      if (p) openPotModal(container, p);
    };
  });
  el.querySelectorAll('[data-pot-del]').forEach(b =>
    b.onclick = async () => { await del('pots', b.dataset.potDel); render(container); });
}

// ── Modals ────────────────────────────────────────────────

function openHabitModal(container, existing, allHabits) {
  const others = allHabits.filter(h => !existing || h.id !== existing.id);
  openModal(existing ? 'Gewoonte bewerken' : 'Nieuwe gewoonte', `
    <label>Naam *</label><input name="name" required value="${existing ? escapeHTML(existing.name) : ''}" />
    <label>Emoji (1 teken)</label><input name="emoji" maxlength="2" value="${existing?.emoji || '✨'}" />
    <label>Onderdeel van keten? (na welke gewoonte)</label>
    <select name="after">
      <option value="">— zelfstandig —</option>
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

function openPotModal(container, existing) {
  openModal(existing ? 'Potje bewerken' : 'Nieuw potje', `
    <label>Naam *</label><input name="name" required value="${existing ? escapeHTML(existing.name) : ''}" />
    <label>Emoji</label><input name="emoji" maxlength="2" value="${existing?.emoji || '🏺'}" />
    <label>Doelbedrag (€)</label><input name="target" type="text" inputmode="decimal" autocomplete="off" value="${existing?.target || ''}" />
    <label>Huidig bedrag (€)</label><input name="current" type="text" inputmode="decimal" autocomplete="off" value="${existing?.current || 0}" />
  `, async (d) => {
    if (!d.name) throw new Error('Naam verplicht');
    const base = existing || { id: uid(), createdAt: new Date().toISOString() };
    await put('pots', {
      ...base, name: d.name, emoji: d.emoji || '🏺',
      target: parseAmount(d.target) || 0,
      current: Math.max(0, parseAmount(d.current) || 0),
    });
    ok('Opgeslagen');
    render(container);
  });
}

function openGoalModal(container, existing, term) {
  openModal(existing ? 'Doel bewerken' : 'Nieuw doel', `
    <label>Titel *</label><input name="title" required value="${existing ? escapeHTML(existing.title) : ''}" />
    <label>Beschrijving</label><textarea name="description" rows="2">${existing?.description ? escapeHTML(existing.description) : ''}</textarea>
    <label>Deadline</label><input name="deadline" type="date" value="${existing?.deadline || ''}" />
    <label>Streefbedrag (€) — optioneel</label>
    <input name="target" type="text" inputmode="decimal" autocomplete="off" value="${existing?.target || ''}" />
    <label>% van elke taxi-rit — optioneel (auto-voortgang)</label>
    <input name="taxiPercent" type="text" inputmode="decimal" autocomplete="off" placeholder="bijv. 2,5" value="${existing?.taxiPercent || ''}" />
  `, async (d) => {
    if (!d.title) throw new Error('Titel verplicht');
    if (d.taxiPercent) {
      const pct = parseAmount(d.taxiPercent);
      if (isNaN(pct) || pct < 0 || pct > 100) throw new Error('Percentage moet tussen 0 en 100 liggen');
    }
    const base = existing || { id: uid(), term, progress: 0 };
    await put('goals', {
      ...base, title: d.title,
      description: d.description || '',
      deadline: d.deadline || null,
      target: d.target ? parseAmount(d.target) : null,
      taxiPercent: d.taxiPercent ? Math.min(100, Math.max(0, parseAmount(d.taxiPercent))) : null,
    });
    ok('Opgeslagen');
    render(container);
  });
}
