import { all, put, del, add } from '../db.js';
import { initPrivacyToggle } from '../privacy.js';
import { openModal } from '../components/modal.js';
import { uid, fmtMoney, parseAmount, escapeHTML, ymd, startOfWeek, startOfMonth, monthKey, effectiveNow, effectiveDate } from '../utils.js';
import { getNumber } from '../settings.js';
import { ok, err } from '../components/toast.js';
import { initCountUps } from '../animate.js';

const BREAKEVEN_KEY = 'breakEvenToastDate';

// Eenmalige migratie van localStorage → IndexedDB
async function migrateExpenses() {
  const raw = localStorage.getItem('taxiExpenses');
  if (!raw) return;
  try {
    const items = JSON.parse(raw);
    if (items.length > 0) {
      const existing = await all('taxi_expenses');
      if (existing.length === 0) {
        for (const item of items) {
          if (!item.id) item.id = uid();
          await put('taxi_expenses', item);
        }
      } else {
        // IDB already has data — only add items missing from IDB to avoid data loss
        const existingIds = new Set(existing.map(e => e.id));
        for (const item of items) {
          if (!item.id) item.id = uid();
          if (!existingIds.has(item.id)) await put('taxi_expenses', item);
        }
      }
    }
    localStorage.removeItem('taxiExpenses');
  } catch (_) {}
}
// Terugkerende maandkosten (maandelijks + wekelijks omgerekend). Eenmalige
// kosten tellen NIET mee in het terugkerende totaal / de dagelijkse break-even.
function calcMonthlyTotal(expenses) {
  return expenses.reduce((s, e) => {
    const amt = Number(e.amount) || 0;
    if (e.frequency === 'weekly') return s + amt * (52 / 12);
    if (e.frequency === 'eenmalig') return s; // eenmalig telt niet mee als vaste last
    return s + amt; // monthly default
  }, 0);
}

// Som van eenmalige kosten die in de opgegeven maand vallen.
function calcOneTimeThisMonth(expenses, now = new Date()) {
  const mk = monthKey(now);
  return expenses.reduce((s, e) => {
    if (e.frequency !== 'eenmalig') return s;
    if (!e.date || monthKey(new Date(e.date)) !== mk) return s;
    return s + (Number(e.amount) || 0);
  }, 0);
}

function checkBreakEven(todayIncome, expenses) {
  const monthly = calcMonthlyTotal(expenses);
  if (monthly <= 0) return;
  const daily = monthly / 30;
  const today = ymd(effectiveNow());
  if (localStorage.getItem(BREAKEVEN_KEY) === today) return;
  if (todayIncome >= daily) {
    localStorage.setItem(BREAKEVEN_KEY, today);
    ok('Break-even bereikt — vanaf nu is alles winst');
  }
}

export async function render(container) {
  await migrateExpenses();
  const [rides, expenses] = await Promise.all([all('rides'), all('taxi_expenses')]);
  const tab = container.dataset.taxiTab || 'overview';
  const state = container.dataset.taxiMonth ? new Date(container.dataset.taxiMonth) : new Date();
  const year  = state.getFullYear();
  const month = state.getMonth();

  const byDate = {};
  rides.forEach(r => {
    // Gebruik effectieve datum: rit om 01:30 valt onder de vorige dag
    const k = ymd(effectiveDate(new Date(r.date)));
    if (!byDate[k]) byDate[k] = { total: 0, items: [] };
    byDate[k].total += Number(r.amount || 0);
    byDate[k].items.push(r);
  });

  const now  = effectiveNow(); // Dag begint om DAY_CUTOFF_HOUR, niet om 00:00
  const sum  = (arr, pred) => arr.filter(pred).reduce((s, r) => s + Number(r.amount || 0), 0);
  const todayIncome = sum(rides, r => ymd(effectiveDate(new Date(r.date))) === ymd(now));
  const weekIncome  = sum(rides, r => effectiveDate(new Date(r.date)) >= startOfWeek(now));
  const monthIncome = sum(rides, r => effectiveDate(new Date(r.date)) >= startOfMonth(now));

  const dailyGoal   = getNumber('dailyIncomeGoal');
  const monthlyGoal = getNumber('monthlyIncomeGoal');
  const goalPct     = dailyGoal > 0 ? Math.min(100, Math.round(todayIncome / dailyGoal * 100)) : 0;

  const daysIntoMonth  = now.getDate();
  const daysInMonth    = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const projectedMonth = daysIntoMonth > 0 ? Math.round((monthIncome / daysIntoMonth) * daysInMonth) : 0;

  const monthlyExpenses = calcMonthlyTotal(expenses);
  const oneTimeThisMonth = calcOneTimeThisMonth(expenses, now);
  const totalCostThisMonth = monthlyExpenses + oneTimeThisMonth;
  const dailyBreakEven  = monthlyExpenses > 0 ? Math.round(monthlyExpenses / 30 * 100) / 100 : 0;
  const monthNetto      = monthIncome - totalCostThisMonth;
  const costRatioPct    = monthIncome > 0 ? Math.min(100, Math.round(totalCostThisMonth / monthIncome * 100)) : (totalCostThisMonth > 0 ? 100 : 0);
  const todayNetto      = todayIncome - dailyBreakEven;

  container.innerHTML = `
    <h1 class="page-title">Taxi inkomen</h1>
    <div class="taxi-tab-bar">
      <button class="taxi-tab ${tab === 'overview' ? 'active' : ''}" data-taxi-tab="overview">Overzicht</button>
      <button class="taxi-tab ${tab === 'rides' ? 'active' : ''}" data-taxi-tab="rides">Ritten</button>
      <button class="taxi-tab ${tab === 'costs' ? 'active' : ''}" data-taxi-tab="costs">Kosten</button>
    </div>
    <div id="taxi-content"></div>
  `;

  container.querySelectorAll('.taxi-tab').forEach(btn => {
    btn.onclick = () => {
      container.dataset.taxiTab = btn.dataset.taxiTab;
      render(container);
    };
  });

  const content = container.querySelector('#taxi-content');

  if (tab === 'overview') {
    renderOverview(content, container, {
      todayIncome, weekIncome, monthIncome, projectedMonth,
      dailyGoal, goalPct, monthlyGoal,
      monthlyExpenses, oneTimeThisMonth, totalCostThisMonth, dailyBreakEven, monthNetto, costRatioPct, todayNetto,
      expenses, rides, now, daysIntoMonth, daysInMonth, byDate,
    });
    checkBreakEven(todayIncome, expenses);
  } else if (tab === 'rides') {
    renderRitten(content, container, year, month, byDate, rides, now);
  } else {
    renderKosten(content, container, expenses);
  }

  initPrivacyToggle(container);
  initCountUps(container);
}

// ─── OVERZICHT TAB ────────────────────────────────────────────────────────
function renderOverview(content, container, d) {
  const { todayIncome, weekIncome, monthIncome, projectedMonth,
    dailyGoal, goalPct, monthlyGoal, monthlyExpenses, oneTimeThisMonth, totalCostThisMonth, dailyBreakEven,
    monthNetto, costRatioPct, todayNetto, expenses, rides, now, daysIntoMonth, daysInMonth, byDate } = d;

  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0);
  const sum = (arr, pred) => arr.filter(pred).reduce((s, r) => s + Number(r.amount || 0), 0);
  const lastMonthAtPos = sum(rides, r => {
    const dt = effectiveDate(new Date(r.date));
    return dt >= lastMonthStart && dt <= lastMonthEnd && dt.getDate() <= daysIntoMonth;
  });
  const trendPct = lastMonthAtPos > 0 ? Math.round((monthIncome - lastMonthAtPos) / lastMonthAtPos * 100) : null;

  const breakEvenHit = dailyBreakEven > 0 && todayIncome >= dailyBreakEven;

  content.innerHTML = `
    <!-- INCOME HERO -->
    <div class="income-hero">
      <div class="income-hero-label" style="display:flex;justify-content:space-between;align-items:center">
        <span>Vandaag verdiend</span>
        <button class="privacy-toggle" title="Toon bedragen" aria-label="Toon bedragen"></button>
      </div>
      <div class="income-hero-amount blurred-amount" data-countup="${todayIncome}">${fmtMoney(todayIncome)}</div>
      ${dailyGoal > 0 ? `
        <div class="income-hero-progress">
          <div class="progress-bar"><div class="progress-fill" style="width:${goalPct}%"></div></div>
        </div>
        <div class="income-hero-meta">
          <span>${goalPct}% van dagdoel</span>
          <span>Doel: <span class="blurred-amount">${fmtMoney(dailyGoal)}</span></span>
        </div>
      ` : ''}
      ${breakEvenHit ? `<div class="breakeven-badge">✓ Break-even bereikt</div>` : (dailyBreakEven > 0 ? `<div style="font-size:.78rem;color:var(--text-faint);margin-top:6px">Break-even vandaag: <span class="blurred-amount">${fmtMoney(dailyBreakEven)}</span></div>` : '')}
    </div>

    <!-- KPI GRID -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Week</div>
        <div class="kpi-value blurred-amount" data-countup="${weekIncome}">${fmtMoney(weekIncome)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Maand bruto</div>
        <div class="kpi-value blurred-amount" data-countup="${monthIncome}">${fmtMoney(monthIncome)}</div>
        ${trendPct !== null ? `<div class="kpi-trend ${trendPct>=0?'up':'down'}">${trendPct>=0?'↑':'↓'}${Math.abs(trendPct)}% vs vorige</div>` : ''}
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Verwacht</div>
        <div class="kpi-value blurred-amount" data-countup="${projectedMonth}">${fmtMoney(projectedMonth)}</div>
      </div>
    </div>

    <!-- NETTO OVERZICHT (alleen als kosten ingesteld) -->
    ${totalCostThisMonth > 0 ? `
    <div class="netto-hero card">
      <h2 class="card-title">Netto overzicht — ${now.toLocaleString('nl-NL', { month: 'long' })}</h2>
      <div class="netto-row">
        <span class="netto-label">Bruto inkomen</span>
        <span class="netto-value gold blurred-amount">${fmtMoney(monthIncome)}</span>
      </div>
      ${monthlyExpenses > 0 ? `
      <div class="netto-row">
        <span class="netto-label">Vaste maandkosten</span>
        <span class="netto-value negative">- ${fmtMoney(monthlyExpenses)}</span>
      </div>` : ''}
      ${oneTimeThisMonth > 0 ? `
      <div class="netto-row">
        <span class="netto-label">Eenmalig deze maand</span>
        <span class="netto-value negative">- ${fmtMoney(oneTimeThisMonth)}</span>
      </div>` : ''}
      <div class="netto-row netto-total-row">
        <span class="netto-label">Netto inkomen</span>
        <span class="netto-value ${monthNetto >= 0 ? 'positive' : 'negative'} blurred-amount" data-countup="${monthNetto}">${fmtMoney(monthNetto)}</span>
      </div>
      <div class="cost-ratio-bar">
        <div class="cost-ratio-fill ${costRatioPct < 70 ? 'safe' : ''}" style="width:${costRatioPct}%"></div>
      </div>
      <div class="cost-ratio-meta">
        <span>Kosten zijn ${costRatioPct}% van bruto</span>
        ${dailyBreakEven > 0 ? `<span>Break-even/dag: ${fmtMoney(dailyBreakEven)}</span>` : ''}
      </div>
    </div>
    ` : `
    <div class="card" style="padding:14px;text-align:center">
      <p class="muted" style="font-size:.875rem;margin-bottom:8px">Voeg je vaste kosten toe om netto inkomen en break-even te berekenen.</p>
      <button class="btn secondary" id="go-costs" style="font-size:.85rem">→ Kosten instellen</button>
    </div>
    `}

    <!-- INKOMEN TOEVOEGEN -->
    <button class="add-income-btn" id="quick-today">
      <span class="add-income-btn-icon">＋</span>
      Inkomen vandaag noteren
    </button>
  `;

  content.querySelector('#quick-today').onclick = () => openDayModal(container, ymd(now), byDate?.[ymd(now)]);
  const goCosts = content.querySelector('#go-costs');
  if (goCosts) goCosts.onclick = () => {
    container.dataset.taxiTab = 'costs';
    render(container);
  };
}

// ─── RITTEN TAB ───────────────────────────────────────────────────────────
function renderRitten(content, container, year, month, byDate, rides, now) {
  const state = new Date(year, month, 1);

  content.innerHTML = `
    <button class="add-income-btn" id="quick-today-r">
      <span class="add-income-btn-icon">＋</span>
      Inkomen vandaag noteren
    </button>
    <div class="card" style="padding:16px">
      <div class="cal-nav">
        <button class="cal-nav-btn" id="mon-prev">‹</button>
        <div class="cal-nav-title">${state.toLocaleString('nl-NL', { month: 'long', year: 'numeric' })}</div>
        <button class="cal-nav-btn" id="mon-next">›</button>
      </div>
      <div class="cal-weekdays">
        ${['ma','di','wo','do','vr','za','zo'].map((d, i) => `<div class="cal-weekday${i>=5?' weekend':''}">${d}</div>`).join('')}
      </div>
      <div class="income-grid-wrap" id="income-grid"></div>
      <p class="muted" style="font-size:.72rem;margin-top:10px;text-align:center">Tik op een dag om inkomen in te vullen</p>
    </div>
    <div class="card">
      <h2 class="card-title">Jaarverloop</h2>
      <div id="chart"></div>
    </div>
    <button class="btn secondary block" id="export-csv" style="margin-top:4px;font-size:.875rem">CSV exporteren</button>
  `;

  renderGrid(content, container, year, month, byDate);
  renderChart(content, rides);

  content.querySelector('#quick-today-r').onclick = () => openDayModal(container, ymd(now), byDate[ymd(now)]);
  content.querySelector('#mon-prev').onclick = () => {
    container.dataset.taxiMonth = new Date(year, month - 1, 1).toISOString();
    render(container);
  };
  content.querySelector('#mon-next').onclick = () => {
    container.dataset.taxiMonth = new Date(year, month + 1, 1).toISOString();
    render(container);
  };
  content.querySelector('#export-csv').onclick = () => exportCSV(rides);
}

// ─── KOSTEN TAB ───────────────────────────────────────────────────────────
function renderKosten(content, container, expenses) {
  const monthly = calcMonthlyTotal(expenses);
  const oneTime = calcOneTimeThisMonth(expenses);
  const freqLabel = (f) => f === 'weekly' ? '/week' : f === 'eenmalig' ? 'eenmalig' : '/maand';

  const PRESETS = [
    { name: 'Brandstof', amount: 600, frequency: 'monthly' },
    { name: 'Verzekering', amount: 150, frequency: 'monthly' },
    { name: 'Lease/afschrijving', amount: 400, frequency: 'monthly' },
    { name: 'TLC/vergunning', amount: 80, frequency: 'monthly' },
    { name: 'Onderhoud', amount: 100, frequency: 'monthly' },
  ];

  content.innerHTML = `
    <div class="card" style="padding:14px;margin-bottom:12px">
      <h2 class="card-title">Totaal maandkosten</h2>
      <div style="font-size:1.6rem;font-family:Georgia,serif;font-weight:700;color:var(--danger);margin:6px 0 2px"><span data-countup="${monthly}">${fmtMoney(monthly)}</span><span style="font-size:.9rem;font-weight:400;color:var(--text-faint)">/maand</span></div>
      <div style="font-size:.82rem;color:var(--text-faint)">Break-even per dag: <b style="color:var(--text)">${fmtMoney(monthly / 30)}</b></div>
      ${oneTime > 0 ? `<div style="font-size:.82rem;color:var(--text-faint);margin-top:6px;padding-top:6px;border-top:1px solid var(--border-soft)">Eenmalig deze maand: <b style="color:var(--text)">${fmtMoney(oneTime)}</b></div>` : ''}
    </div>

    <div class="expense-list" id="expense-list">
      ${expenses.length ? expenses.map(e => `
        <div class="expense-item" data-id="${e.id}">
          <div class="expense-item-name">${escapeHTML(e.name)}</div>
          <div>
            <span class="expense-item-amount">${fmtMoney(e.amount)}</span>
            <span class="expense-item-freq">${freqLabel(e.frequency)}${e.frequency === 'eenmalig' && e.date ? ' · ' + new Date(e.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) : ''}</span>
          </div>
          <button class="expense-item-del" data-del="${e.id}" title="Verwijder">×</button>
        </div>`).join('') : `<p class="muted" style="text-align:center;font-size:.875rem;padding:10px 0">Nog geen kosten ingesteld</p>`}
    </div>

    <!-- SNELKEUZE PRESETS -->
    <div class="card" style="padding:14px;margin-bottom:12px">
      <h2 class="card-title" style="margin-bottom:10px">Snel toevoegen</h2>
      <div class="expense-preset-row">
        ${PRESETS.map(p => `<button class="expense-preset-btn" data-preset-name="${escapeHTML(p.name)}" data-preset-amount="${p.amount}" data-preset-freq="${p.frequency}">${p.name}</button>`).join('')}
      </div>
    </div>

    <!-- HANDMATIG TOEVOEGEN -->
    <div class="card expense-add-form" id="add-expense-form">
      <h2 class="card-title" style="margin-bottom:10px">Handmatig toevoegen</h2>
      <label>Naam</label>
      <input id="exp-name" placeholder="bijv. Parkeervergunning" />
      <label>Bedrag (€)</label>
      <input id="exp-amount" type="text" inputmode="decimal" autocomplete="off" placeholder="0,00" />
      <label>Frequentie</label>
      <div class="segmented" style="margin-bottom:12px">
        <button type="button" class="seg active" data-freq="monthly">Per maand</button>
        <button type="button" class="seg" data-freq="weekly">Per week</button>
        <button type="button" class="seg" data-freq="eenmalig">Eenmalig</button>
      </div>
      <button class="btn block" id="save-expense">Toevoegen</button>
    </div>
  `;

  // Delete handler
  content.querySelectorAll('[data-del]').forEach(btn => {
    btn.onclick = async () => {
      await del('taxi_expenses', btn.dataset.del);
      render(container);
    };
  });

  // Frequency segmented control
  let selectedFreq = 'monthly';

  // Preset buttons — vul formulier in, laat user bedrag aanpassen
  content.querySelectorAll('.expense-preset-btn').forEach(btn => {
    btn.onclick = () => {
      content.querySelector('#exp-name').value = btn.dataset.presetName;
      content.querySelector('#exp-amount').value = '';
      // Zet frequentie
      content.querySelectorAll('[data-freq]').forEach(s => s.classList.remove('active'));
      const freqBtn = content.querySelector(`[data-freq="${btn.dataset.presetFreq}"]`);
      if (freqBtn) { freqBtn.classList.add('active'); selectedFreq = btn.dataset.presetFreq; }
      // Scroll naar formulier en focus bedrag
      content.querySelector('#add-expense-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
      content.querySelector('#exp-amount').focus();
    };
  });
  content.querySelectorAll('[data-freq]').forEach(seg => {
    seg.onclick = () => {
      content.querySelectorAll('[data-freq]').forEach(s => s.classList.remove('active'));
      seg.classList.add('active');
      selectedFreq = seg.dataset.freq;
    };
  });

  // Save new expense
  content.querySelector('#save-expense').onclick = async () => {
    const name = content.querySelector('#exp-name').value.trim();
    const amount = parseAmount(content.querySelector('#exp-amount').value);
    if (!name) { content.querySelector('#exp-name').focus(); err('Vul eerst een naam in'); return; }
    if (!isFinite(amount) || amount <= 0) { content.querySelector('#exp-amount').focus(); err('Vul een geldig bedrag in'); return; }
    const item = { id: uid(), name, amount, frequency: selectedFreq };
    if (selectedFreq === 'eenmalig') item.date = ymd(new Date());
    await put('taxi_expenses', item);
    render(container);
  };
}

// ─── HULPFUNCTIES ─────────────────────────────────────────────────────────
function renderGrid(content, container, year, month, byDate) {
  const first        = new Date(year, month, 1);
  const lastDate     = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (first.getDay() + 6) % 7;
  const today        = ymd(effectiveNow());

  const monthValues = [];
  for (let d = 1; d <= lastDate; d++) {
    const key = ymd(new Date(year, month, d));
    if (byDate[key]) monthValues.push(byDate[key].total);
  }
  const maxVal = Math.max(1, ...monthValues);

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push('<div></div>');
  for (let d = 1; d <= lastDate; d++) {
    const key   = ymd(new Date(year, month, d));
    const entry = byDate[key];
    const total = entry ? entry.total : 0;
    const intensity = total > 0 ? Math.min(1, total / maxVal) : 0;
    const isToday   = key === today;
    const bg = total > 0 ? `background:linear-gradient(135deg,rgba(212,176,107,${(0.08 + intensity * 0.5).toFixed(2)}),rgba(212,176,107,${(intensity * 0.25).toFixed(2)}))` : '';
    cells.push(`
      <div class="income-cell ${isToday ? 'today' : ''} ${total > 0 ? 'has-income' : ''}"
           style="${bg}" data-day="${key}">
        <div class="cal-day">${d}</div>
        ${total > 0 ? `<div class="cal-amt blurred-amount">${fmtMoneyCompact(total)}</div>` : ''}
      </div>`);
  }

  const grid = content.querySelector('#income-grid');
  grid.innerHTML = cells.join('');
  grid.querySelectorAll('[data-day]').forEach(cell => {
    cell.onclick = () => openDayModal(container, cell.dataset.day, byDate[cell.dataset.day]);
  });
}

function fmtMoneyCompact(n) {
  if (n >= 1000) return '€' + (n / 1000).toFixed(1) + 'k';
  return '€' + Math.round(n);
}

function openDayModal(container, dateKey, existing) {
  // Prevent double-open if a modal is already showing
  if (document.querySelector('.modal-backdrop')) return;

  const items      = existing?.items || [];
  const total      = existing?.total || 0;
  const dateObj    = new Date(dateKey + 'T12:00:00');
  const friendlyDate = dateObj.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });

  const closeModal = openModal(friendlyDate, `
    ${items.length ? `
      <div style="margin-bottom:16px">
        <div class="card-title">Eerdere notities</div>
        ${items.map(it => `
          <div class="list-item" style="margin-bottom:6px">
            <div>
              <b class="money">${fmtMoney(it.amount)}</b>
              ${it.note ? `<div class="muted" style="font-size:.8rem;margin-top:2px">${escapeHTML(it.note)}</div>` : ''}
            </div>
            <button type="button" class="btn danger sm" data-del-line="${it.id}">×</button>
          </div>`).join('')}
        <p class="muted" style="font-size:.85rem;margin-top:8px">Dagtotaal: <b class="money">${fmtMoney(total)}</b></p>
      </div>` : ''}
    <label>Bedrag (€) *</label>
    <input name="amount" type="text" inputmode="decimal" autocomplete="off" required autofocus placeholder="0,00" />
    <label>Notitie <span class="muted" style="font-size:.8rem;text-transform:none;letter-spacing:0">(optioneel)</span></label>
    <input name="note" placeholder="dagdienst, nachtshift…" />
  `, async (d) => {
    const amount = parseAmount(d.amount);
    if (!isFinite(amount) || amount <= 0) throw new Error('Voer een geldig bedrag in');
    await put('rides', {
      id: uid(), date: new Date(dateKey + 'T12:00:00').toISOString(),
      amount, source: 'daily', km: null, note: d.note || null,
    });
    ok('Toegevoegd op ' + friendlyDate);
    if (container) render(container);
  });

  // Scope delete handlers to this modal's backdrop (openModal appends it synchronously)
  const modalBackdrop = document.body.lastElementChild;
  modalBackdrop.querySelectorAll('[data-del-line]').forEach(b => {
    b.onclick = async (e) => {
      e.preventDefault();
      await del('rides', b.dataset.delLine);
      closeModal();
      ok('Verwijderd');
      if (container) render(container);
    };
  });
}

function renderChart(content, rides) {
  const buckets = {};
  const now = effectiveNow();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets[monthKey(d)] = { in: 0, label: d.toLocaleString('nl-NL', { month: 'short' }) };
  }
  rides.forEach(r => { const k = monthKey(r.date); if (buckets[k]) buckets[k].in += Number(r.amount || 0); });
  const entries = Object.values(buckets);
  const max = Math.max(1, ...entries.map(b => b.in));

  content.querySelector('#chart').innerHTML = `
    <div class="bar-chart">
      ${entries.map(b => {
        const h = Math.max(2, Math.round((b.in / max) * 110));
        return `<div class="bar-col">
          <div class="bar" style="height:${h}px" title="${b.label}: ${fmtMoney(b.in, true)}"></div>
          <div class="bar-label">${b.label}</div>
        </div>`;
      }).join('')}
    </div>`;
}

function weekNum(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function exportCSV(rides) {
  const today = new Date().toISOString().slice(0, 10);
  const WEEKDAG = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];
  const sorted  = [...rides].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const rows    = ['sep=;', ['datum', 'week', 'dag', 'bedrag', 'notitie'].join(';')];
  let prevMonth = null, monthTotal = 0;

  for (const r of sorted) {
    const date     = new Date(r.date);
    const monthKey = (r.date || '').slice(0, 7);
    if (prevMonth !== null && monthKey !== prevMonth) {
      rows.push([`Totaal ${prevMonth}`, '', '', (Math.round(monthTotal * 100) / 100).toFixed(2).replace('.', ','), ''].join(';'));
      monthTotal = 0;
    }
    prevMonth   = monthKey;
    monthTotal += (r.amount || 0);
    rows.push([
      (r.date || '').slice(0, 10),
      `W${String(weekNum(date)).padStart(2, '0')}`,
      WEEKDAG[date.getDay()],
      String(r.amount || 0).replace('.', ','),
      '"' + (r.note || '').replace(/"/g, '""').replace(/[\r\n;]/g, ' ') + '"',
    ].join(';'));
  }
  if (prevMonth !== null) {
    rows.push([`Totaal ${prevMonth}`, '', '', (Math.round(monthTotal * 100) / 100).toFixed(2).replace('.', ','), ''].join(';'));
  }

  const blob = new Blob(['﻿' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = `taxi-inkomen-${today}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}
