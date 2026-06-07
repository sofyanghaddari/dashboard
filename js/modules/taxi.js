import { all, put, del } from '../db.js';
import { initPrivacyToggle } from '../privacy.js';
import { openModal } from '../components/modal.js';
import { uid, fmtMoney, escapeHTML, ymd, startOfWeek, startOfMonth, monthKey } from '../utils.js';
import { getNumber } from '../settings.js';
import { ok } from '../components/toast.js';

export async function render(container) {
  const rides = await all('rides');
  const state = container.dataset.taxiMonth ? new Date(container.dataset.taxiMonth) : new Date();
  const year  = state.getFullYear();
  const month = state.getMonth();

  const byDate = {};
  rides.forEach(r => {
    const k = ymd(new Date(r.date));
    if (!byDate[k]) byDate[k] = { total: 0, items: [] };
    byDate[k].total += Number(r.amount || 0);
    byDate[k].items.push(r);
  });

  const now  = new Date();
  const sum  = (arr, pred) => arr.filter(pred).reduce((s, r) => s + Number(r.amount || 0), 0);
  const todayIncome = sum(rides, r => ymd(new Date(r.date)) === ymd(now));
  const weekIncome  = sum(rides, r => new Date(r.date) >= startOfWeek(now));
  const monthIncome = sum(rides, r => new Date(r.date) >= startOfMonth(now));

  const dailyGoal   = getNumber('dailyIncomeGoal');
  const monthlyGoal = getNumber('monthlyIncomeGoal');
  const goalPct     = dailyGoal > 0 ? Math.min(100, Math.round(todayIncome / dailyGoal * 100)) : 0;

  const daysIntoMonth  = now.getDate();
  const daysInMonth    = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const projectedMonth = daysIntoMonth > 0 ? Math.round((monthIncome / daysIntoMonth) * daysInMonth) : 0;

  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0);
  const lastMonthAtPos = rides.filter(r => {
    const d = new Date(r.date);
    return d >= lastMonthStart && d <= lastMonthEnd && d.getDate() <= daysIntoMonth;
  }).reduce((s, r) => s + Number(r.amount || 0), 0);
  const trendPct = lastMonthAtPos > 0 ? Math.round((monthIncome - lastMonthAtPos) / lastMonthAtPos * 100) : null;

  container.innerHTML = `
    <h1 class="page-title">Taxi inkomen</h1>

    <!-- INCOME HERO (vandaag) -->
    <div class="income-hero">
      <div class="income-hero-label" style="display:flex;justify-content:space-between;align-items:center">
        <span>Vandaag verdiend</span>
        <button class="privacy-toggle" title="Toon bedragen" aria-label="Toon bedragen"></button>
      </div>
      <div class="income-hero-amount blurred-amount">${fmtMoney(todayIncome)}</div>
      ${dailyGoal > 0 ? `
        <div class="income-hero-progress">
          <div class="progress-bar"><div class="progress-fill" style="width:${goalPct}%"></div></div>
        </div>
        <div class="income-hero-meta">
          <span>${goalPct}% van dagdoel</span>
          <span>Doel: <span class="blurred-amount">${fmtMoney(dailyGoal)}</span></span>
        </div>
      ` : ''}
    </div>

    <!-- KPI GRID: week / maand / verwacht -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Week</div>
        <div class="kpi-value blurred-amount">${fmtMoney(weekIncome)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Maand</div>
        <div class="kpi-value blurred-amount">${fmtMoney(monthIncome)}</div>
        ${trendPct !== null ? `<div class="kpi-trend ${trendPct>=0?'up':'down'}">${trendPct>=0?'↑':'↓'}${Math.abs(trendPct)}% vs vorige</div>` : ''}
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Verwacht</div>
        <div class="kpi-value blurred-amount">${fmtMoney(projectedMonth)}</div>
      </div>
    </div>

    <!-- INKOMEN TOEVOEGEN -->
    <button class="add-income-btn" id="quick-today">
      <span class="add-income-btn-icon">＋</span>
      Inkomen vandaag noteren
    </button>

    <!-- MAANDKALENDER -->
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
      <p class="muted" style="font-size:.72rem;margin-top:10px;text-align:center;letter-spacing:.01em">Tik op een dag om inkomen in te vullen</p>
    </div>

    <!-- JAARVERLOOP -->
    <div class="card">
      <h2 class="card-title">Jaarverloop</h2>
      <div id="chart"></div>
    </div>

    <button class="btn secondary block" id="export-csv" style="margin-top:4px;font-size:.875rem">CSV exporteren</button>
  `;

  renderGrid(container, year, month, byDate);
  renderChart(container, rides);

  if (rides.length === 0) {
    const empty = document.createElement('div');
    empty.innerHTML = `
      <div class="card empty-cta" style="text-align:center;padding:2rem">
        <div style="font-size:2.5rem;margin-bottom:8px">🚖</div>
        <h3 style="margin-bottom:6px">Nog geen inkomsten</h3>
        <p class="muted" style="font-size:.875rem">Tik op de knop hierboven om je eerste inkomen te noteren.</p>
      </div>`;
    const calCard = container.querySelector('.card[style]');
    calCard.parentNode.insertBefore(empty.firstElementChild, calCard);
  }

  container.querySelector('#mon-prev').onclick = () => {
    container.dataset.taxiMonth = new Date(year, month - 1, 1).toISOString();
    render(container);
  };
  container.querySelector('#mon-next').onclick = () => {
    container.dataset.taxiMonth = new Date(year, month + 1, 1).toISOString();
    render(container);
  };
  container.querySelector('#quick-today').onclick = () => openDayModal(container, ymd(now), byDate[ymd(now)]);
  container.querySelector('#export-csv').onclick = () => exportCSV(rides);
  initPrivacyToggle(container);
}

function renderGrid(container, year, month, byDate) {
  const first       = new Date(year, month, 1);
  const lastDate    = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (first.getDay() + 6) % 7;
  const today       = ymd();

  const monthValues = [];
  for (let d = 1; d <= lastDate; d++) {
    const key = ymd(new Date(year, month, d));
    if (byDate[key]) monthValues.push(byDate[key].total);
  }
  const maxVal = Math.max(1, ...monthValues);

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push('<div></div>');

  for (let d = 1; d <= lastDate; d++) {
    const key       = ymd(new Date(year, month, d));
    const entry     = byDate[key];
    const total     = entry ? entry.total : 0;
    const intensity = total > 0 ? Math.min(1, total / maxVal) : 0;
    const isToday   = key === today;

    const bg = total > 0
      ? `background:linear-gradient(135deg,rgba(212,176,107,${(0.08 + intensity * 0.5).toFixed(2)}),rgba(212,176,107,${(intensity * 0.25).toFixed(2)}))`
      : '';

    cells.push(`
      <div class="income-cell ${isToday ? 'today' : ''} ${total > 0 ? 'has-income' : ''}"
           style="${bg}" data-day="${key}">
        <div class="cal-day">${d}</div>
        ${total > 0 ? `<div class="cal-amt blurred-amount">${fmtMoneyCompact(total)}</div>` : ''}
      </div>`);
  }

  const grid = container.querySelector('#income-grid');
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
  const items      = existing?.items || [];
  const total      = existing?.total || 0;
  const dateObj    = new Date(dateKey + 'T12:00:00');
  const friendlyDate = dateObj.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });

  openModal(friendlyDate, `
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
    <input name="amount" type="number" step="0.01" inputmode="decimal" required autofocus placeholder="0.00" />
    <label>Notitie <span class="muted" style="font-size:.8rem;text-transform:none;letter-spacing:0">(optioneel)</span></label>
    <input name="note" placeholder="dagdienst, nachtshift…" />
  `, async (d) => {
    const amount = parseFloat(d.amount);
    if (!isFinite(amount) || amount <= 0) throw new Error('Voer een geldig bedrag in');
    await put('rides', {
      id: uid(),
      date: new Date(dateKey + 'T12:00:00').toISOString(),
      amount,
      source: 'daily',
      km: null,
      note: d.note || null,
    });
    ok('Toegevoegd op ' + friendlyDate);
    render(container);
  });

  setTimeout(() => {
    document.querySelectorAll('[data-del-line]').forEach(b => {
      b.onclick = async (e) => {
        e.preventDefault();
        await del('rides', b.dataset.delLine);
        document.querySelector('.modal-backdrop')?.remove();
        ok('Verwijderd');
        render(container);
      };
    });
  }, 50);
}

function renderChart(container, rides) {
  const buckets = {};
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets[monthKey(d)] = { in: 0, label: d.toLocaleString('nl-NL', { month: 'short' }) };
  }
  rides.forEach(r => { const k = monthKey(r.date); if (buckets[k]) buckets[k].in += Number(r.amount || 0); });
  const entries = Object.values(buckets);
  const max = Math.max(1, ...entries.map(b => b.in));

  container.querySelector('#chart').innerHTML = `
    <div class="bar-chart">
      ${entries.map(b => {
        const h = Math.max(2, Math.round((b.in / max) * 110));
        return `<div class="bar-col">
          <div class="bar" style="height:${h}px" title="${b.label}: ${fmtMoney(b.in)}"></div>
          <div class="bar-label">${b.label}</div>
        </div>`;
      }).join('')}
    </div>`;
}

function exportCSV(rides) {
  const rows = [['datum','bedrag','notitie']];
  rides.forEach(r => rows.push([
    new Date(r.date).toISOString().slice(0, 10),
    r.amount,
    (r.note || '').replace(/[\r\n,]/g, ' '),
  ]));
  const csv  = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a    = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'taxi-inkomen-' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}
