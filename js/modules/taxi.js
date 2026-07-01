import { all, put, del, add } from '../db.js';
import { initPrivacyToggle } from '../privacy.js';
import { openModal } from '../components/modal.js';
import { uid, fmtMoney, parseAmount, escapeHTML, ymd, startOfWeek, startOfMonth, monthKey, effectiveNow, effectiveDate } from '../utils.js';
import { getNumber } from '../settings.js';
import { ok, err } from '../components/toast.js';
import { initCountUps } from '../animate.js';
import { incomeRoad } from '../income-road.js';
import { cabmanMeter, initCabman } from '../cabman.js';

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

// Kostenoverzicht per periode — telt de WERKELIJK geboekte (eenmalige, gedateerde)
// kosten op, gegroepeerd per categorie (Brandstof, Onderhoud, …). Geen schatting.
const COST_PERIODS = [
  { key: 'month', label: 'Maand', long: 'deze maand' },
  { key: '3m',    label: '3 mnd', long: 'afgelopen 3 maanden' },
  { key: '6m',    label: '6 mnd', long: 'afgelopen 6 maanden' },
  { key: 'year',  label: 'Jaar',  long: 'dit jaar' },
  { key: 'all',   label: 'Alles', long: 'alles' },
];
function periodStart(key, now) {
  const y = now.getFullYear(), m = now.getMonth();
  if (key === '3m')   return new Date(y, m - 2, 1);
  if (key === '6m')   return new Date(y, m - 5, 1);
  if (key === 'year') return new Date(y, 0, 1);
  if (key === 'all')  return null;
  return new Date(y, m, 1); // 'month'
}
// Alleen echte, geboekte kosten (frequency 'eenmalig' met datum) binnen de periode.
// Vergelijk op datum-string (YYYY-MM-DD) zodat het tijdstip niet meespeelt.
function costsForPeriod(expenses, key, now) {
  const start = periodStart(key, now);
  const startYmd = start ? ymd(start) : null;
  const todayYmd = ymd(now);
  const byPost = {};
  let count = 0;
  for (const e of expenses) {
    if (e.frequency !== 'eenmalig') continue;
    const amt = Number(e.amount) || 0;
    if (amt <= 0 || !e.date) continue;
    if (startYmd && e.date < startYmd) continue;
    if (e.date > todayYmd) continue;
    byPost[e.name] = (byPost[e.name] || 0) + amt;
    count++;
  }
  const posts = Object.entries(byPost).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);
  const total = posts.reduce((s, p) => s + p.total, 0);
  return { total, posts, count };
}
const COST_COLORS = ['#ffb454', '#6ec9ff', '#fb7185', '#5dd49a', '#a78bfa', '#e0b341', '#f97316', '#94a3b8'];
const COST_CATS = ['Brandstof', 'Onderhoud', 'Verzekering', 'Banden', 'Wasstraat', 'Parkeren', 'Boete', 'Reiniging', 'Lease', 'Overig'];

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
  const monthGoalPct = monthlyGoal > 0 ? Math.round(monthIncome / monthlyGoal * 100) : 0;
  const monthRemaining = Math.max(0, monthlyGoal - monthIncome);
  const monthSurplus = Math.max(0, monthIncome - monthlyGoal);

  const breakEvenHit = dailyBreakEven > 0 && todayIncome >= dailyBreakEven;

  content.innerHTML = `
    <!-- CABMAN-METER: bedrag van vandaag + inkomen noteren -->
    ${cabmanMeter({ amount: todayIncome, goalPct, monthIncome, now })}

    <!-- INCOME HERO (dagdoel-scène) -->
    <div class="income-hero">
      <div class="income-hero-label">Dagdoel</div>
      ${dailyGoal > 0 ? `
        ${incomeRoad(goalPct, now)}
        <div class="income-hero-meta">
          <span>${goalPct}% van dagdoel</span>
          <span>Doel: <span class="blurred-amount">${fmtMoney(dailyGoal)}</span></span>
        </div>
      ` : ''}
      ${breakEvenHit ? `<div class="breakeven-badge">✓ Break-even bereikt</div>` : (dailyBreakEven > 0 ? `<div style="font-size:.78rem;color:var(--text-faint);margin-top:6px">Break-even vandaag: <span class="blurred-amount">${fmtMoney(dailyBreakEven)}</span></div>` : '')}
    </div>

    <!-- MAANDDOEL — strakke progressiebalk -->
    ${monthlyGoal > 0 ? `
    <div class="card month-goal-card${monthGoalPct >= 100 ? ' mg-done' : ''}">
      <div class="mg-head">
        <span class="card-title">Maanddoel</span>
        <span class="mg-amt">
          <span class="blurred-amount" data-countup="${monthIncome}">${fmtMoney(monthIncome)}</span>
          <span class="mg-amt-sep">/</span>
          <span class="blurred-amount">${fmtMoney(monthlyGoal)}</span>
        </span>
      </div>
      <div class="mg-stat">
        <span class="mg-pct" data-countup="${monthGoalPct}" data-decimals="0" data-prefix="" data-suffix="%">${monthGoalPct}%</span>
        ${monthGoalPct >= 100
          ? `<span class="mg-pill mg-pill-done">✓ Behaald${monthSurplus > 0 ? ` <span class="blurred-amount">+${fmtMoney(monthSurplus)}</span>` : ''}</span>`
          : `<span class="mg-rem">Nog <span class="blurred-amount">${fmtMoney(monthRemaining)}</span></span>`}
      </div>
      <div class="mg-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.min(100, monthGoalPct)}">
        <div class="mg-bar-fill" style="width:${Math.min(100, monthGoalPct)}%"></div>
        ${monthGoalPct > 100 ? `<div class="mg-bar-over">+${monthGoalPct - 100}%</div>` : ''}
      </div>
    </div>` : ''}

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
  `;

  content.querySelector('#quick-today').onclick = () => openDayModal(container, ymd(now), byDate?.[ymd(now)]);
  initCabman(content);
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
  const now = effectiveNow();
  const monthly = calcMonthlyTotal(expenses);
  const catColor = (name) => { let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0; return COST_COLORS[h % COST_COLORS.length]; };
  const freqLabel = (f) => f === 'weekly' ? '/week' : '/maand';

  const period = container.dataset.costPeriod || 'month';
  const ov = costsForPeriod(expenses, period, now);
  const periodLong = (COST_PERIODS.find(p => p.key === period) || COST_PERIODS[0]).long;

  // Werkelijk geboekte kosten (gedateerd) vs. vaste lasten (terugkerend).
  const logged = expenses.filter(e => e.frequency === 'eenmalig' && e.date)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const recurring = expenses.filter(e => e.frequency !== 'eenmalig');

  const RECUR_PRESETS = [
    { name: 'Brandstof', amount: 600 },
    { name: 'Verzekering', amount: 150 },
    { name: 'Lease/afschrijving', amount: 400 },
    { name: 'TLC/vergunning', amount: 80 },
    { name: 'Onderhoud', amount: 100 },
  ];
  const today = ymd(now);

  content.innerHTML = `
    <!-- KOSTENOVERZICHT (werkelijk geboekt, per periode + categorie) -->
    <div class="card cost-ov">
      <div class="cost-ov-head">
        <h2 class="card-title" style="margin:0">Kostenoverzicht</h2>
        <div class="cost-period" role="tablist">
          ${COST_PERIODS.map(p => `<button class="cost-period-btn ${p.key === period ? 'active' : ''}" data-cp="${p.key}" type="button">${p.label}</button>`).join('')}
        </div>
      </div>
      <div class="cost-ov-total">
        <span class="big-money blurred-amount" data-countup="${ov.total}">${fmtMoney(ov.total)}</span>
        <span class="cost-ov-sub">werkelijk uitgegeven — ${periodLong}</span>
      </div>
      ${ov.posts.length ? `
        <div class="cost-bars">
          ${ov.posts.map((p) => `
            <div class="cost-bar-row">
              <div class="cost-bar-top">
                <span class="cost-bar-name"><span class="cost-dot" style="background:${catColor(p.name)}"></span>${escapeHTML(p.name)}</span>
                <span class="cost-bar-amt blurred-amount">${fmtMoney(p.total)}</span>
              </div>
              <div class="cost-bar-track"><div class="cost-bar-fill" style="width:${ov.total > 0 ? Math.round(p.total / ov.total * 100) : 0}%;background:${catColor(p.name)}"></div></div>
            </div>`).join('')}
        </div>
        <div class="cost-ov-foot">${ov.count} ${ov.count === 1 ? 'boeking' : 'boekingen'} in deze periode</div>
      ` : `<p class="muted" style="text-align:center;font-size:.875rem;padding:8px 0 4px">Nog geen kosten geboekt in deze periode.</p>`}
    </div>

    <!-- KOSTEN BOEKEN -->
    <div class="card cost-book" id="cost-book-form">
      <h2 class="card-title" style="margin-bottom:10px">Kosten boeken</h2>
      <div class="cost-book-grid">
        <div>
          <label>Datum</label>
          <input id="cost-date" type="date" value="${today}" max="${today}" />
        </div>
        <div>
          <label>Bedrag (€)</label>
          <input id="cost-amount" type="text" inputmode="decimal" autocomplete="off" placeholder="0,00" />
        </div>
      </div>
      <label style="margin-top:8px">Categorie</label>
      <input id="cost-cat" list="cost-cats" autocomplete="off" placeholder="bijv. Brandstof" />
      <datalist id="cost-cats">${COST_CATS.map(c => `<option value="${c}"></option>`).join('')}</datalist>
      <div class="cost-cat-chips">${COST_CATS.slice(0, 6).map(c => `<button type="button" class="cost-cat-chip" data-cat="${c}">${c}</button>`).join('')}</div>
      <label style="margin-top:8px">Notitie <span style="font-weight:400;opacity:.6;text-transform:none;letter-spacing:0">(optioneel)</span></label>
      <input id="cost-note" autocomplete="off" placeholder="bijv. Shell A10, grote beurt…" />
      <button class="btn block" id="cost-save" style="margin-top:12px">Boeken</button>
    </div>

    <!-- GEBOEKTE KOSTEN -->
    <div class="card" style="padding:14px;margin-bottom:12px">
      <h2 class="card-title" style="margin-bottom:10px">Geboekte kosten</h2>
      <div class="cost-log-list">
        ${logged.length ? logged.map(e => `
          <div class="cost-log-item" data-id="${e.id}">
            <span class="cost-dot" style="background:${catColor(e.name)}"></span>
            <div class="cost-log-main">
              <div class="cost-log-name">${escapeHTML(e.name)}${e.note ? ` <span class="cost-log-note">· ${escapeHTML(e.note)}</span>` : ''}</div>
              <div class="cost-log-date">${new Date(e.date + 'T12:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            </div>
            <span class="cost-log-amt blurred-amount">${fmtMoney(e.amount)}</span>
            <button class="expense-item-del" data-del="${e.id}" title="Verwijder">×</button>
          </div>`).join('') : `<p class="muted" style="text-align:center;font-size:.875rem;padding:8px 0">Nog niets geboekt — boek hierboven je eerste kostenpost.</p>`}
      </div>
    </div>

    <!-- VASTE LASTEN (voor break-even) -->
    <div class="card" style="padding:14px;margin-bottom:12px">
      <div class="cost-ov-head" style="margin-bottom:8px">
        <h2 class="card-title" style="margin:0">Vaste lasten</h2>
        <span style="font-size:.72rem;color:var(--text-faint)">voor break-even</span>
      </div>
      ${monthly > 0 ? `<div style="font-size:.85rem;color:var(--text-faint);margin-bottom:10px">Samen <b class="blurred-amount" style="color:var(--text)">${fmtMoney(monthly)}</b>/maand · break-even per dag <b class="blurred-amount" style="color:var(--text)">${fmtMoney(monthly / 30)}</b></div>` : ''}
      <div class="expense-list">
        ${recurring.length ? recurring.map(e => `
          <div class="expense-item" data-id="${e.id}">
            <div class="expense-item-name">${escapeHTML(e.name)}</div>
            <div>
              <span class="expense-item-amount blurred-amount">${fmtMoney(e.amount)}</span>
              <span class="expense-item-freq">${freqLabel(e.frequency)}</span>
            </div>
            <button class="expense-item-del" data-del="${e.id}" title="Verwijder">×</button>
          </div>`).join('') : `<p class="muted" style="text-align:center;font-size:.85rem;padding:6px 0">Nog geen vaste lasten ingesteld</p>`}
      </div>
      <div class="expense-preset-row" style="margin-top:10px">
        ${RECUR_PRESETS.map(p => `<button class="expense-preset-btn" data-preset-name="${escapeHTML(p.name)}" data-preset-amount="${p.amount}">${p.name}</button>`).join('')}
      </div>
      <div class="expense-add-form" id="add-expense-form" style="margin-top:12px">
        <label>Naam</label>
        <input id="exp-name" placeholder="bijv. Parkeervergunning" />
        <label>Bedrag (€)</label>
        <input id="exp-amount" type="text" inputmode="decimal" autocomplete="off" placeholder="0,00" />
        <label>Frequentie</label>
        <div class="segmented" style="margin-bottom:12px">
          <button type="button" class="seg active" data-freq="monthly">Per maand</button>
          <button type="button" class="seg" data-freq="weekly">Per week</button>
        </div>
        <button class="btn secondary block" id="save-expense">Vaste last toevoegen</button>
      </div>
    </div>
  `;

  // Periode-knoppen kostenoverzicht
  content.querySelectorAll('.cost-period-btn').forEach(btn => {
    btn.onclick = () => { container.dataset.costPeriod = btn.dataset.cp; render(container); };
  });

  // Delete (zowel geboekte kosten als vaste lasten)
  content.querySelectorAll('[data-del]').forEach(btn => {
    btn.onclick = async () => { await del('taxi_expenses', btn.dataset.del); render(container); };
  });

  // Categorie-chips vullen het categorieveld
  content.querySelectorAll('.cost-cat-chip').forEach(chip => {
    chip.onclick = () => { content.querySelector('#cost-cat').value = chip.dataset.cat; content.querySelector('#cost-amount').focus(); };
  });

  // Kosten boeken (werkelijke, gedateerde kostenpost)
  content.querySelector('#cost-save').onclick = async () => {
    const cat = content.querySelector('#cost-cat').value.trim();
    const amount = parseAmount(content.querySelector('#cost-amount').value);
    const date = content.querySelector('#cost-date').value || today;
    const note = content.querySelector('#cost-note').value.trim();
    if (!cat) { content.querySelector('#cost-cat').focus(); err('Kies of typ een categorie'); return; }
    if (!isFinite(amount) || amount <= 0) { content.querySelector('#cost-amount').focus(); err('Vul een geldig bedrag in'); return; }
    const item = { id: uid(), name: cat, amount, frequency: 'eenmalig', date };
    if (note) item.note = note;
    await put('taxi_expenses', item);
    ok('Kosten geboekt');
    render(container);
  };

  // Vaste lasten — frequentie + presets + toevoegen
  let selectedFreq = 'monthly';
  content.querySelectorAll('.expense-preset-btn').forEach(btn => {
    btn.onclick = () => {
      content.querySelector('#exp-name').value = btn.dataset.presetName;
      content.querySelector('#exp-amount').value = btn.dataset.presetAmount || '';
      content.querySelector('#add-expense-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
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
  content.querySelector('#save-expense').onclick = async () => {
    const name = content.querySelector('#exp-name').value.trim();
    const amount = parseAmount(content.querySelector('#exp-amount').value);
    if (!name) { content.querySelector('#exp-name').focus(); err('Vul eerst een naam in'); return; }
    if (!isFinite(amount) || amount <= 0) { content.querySelector('#exp-amount').focus(); err('Vul een geldig bedrag in'); return; }
    await put('taxi_expenses', { id: uid(), name, amount, frequency: selectedFreq });
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
  if (n >= 1000) return '€' + (n / 1000).toFixed(1).replace('.', ',') + 'k';
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
              <b class="money blurred-amount">${fmtMoney(it.amount)}</b>
              ${it.note ? `<div class="muted" style="font-size:.8rem;margin-top:2px">${escapeHTML(it.note)}</div>` : ''}
            </div>
            <button type="button" class="btn danger sm" data-del-line="${it.id}">×</button>
          </div>`).join('')}
        <p class="muted" style="font-size:.85rem;margin-top:8px">Dagtotaal: <b class="money blurred-amount">${fmtMoney(total)}</b></p>
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
