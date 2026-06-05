import { all, put, del } from '../db.js';
import { openModal } from '../components/modal.js';
import { uid, fmtMoney, escapeHTML, ymd, startOfWeek, startOfMonth, monthKey } from '../utils.js';
import { ok } from '../components/toast.js';

export async function render(container) {
  const rides = await all('rides');
  const state = container.dataset.taxiMonth ? new Date(container.dataset.taxiMonth) : new Date();
  const year = state.getFullYear(), month = state.getMonth();

  const byDate = {};
  rides.forEach(r => {
    const k = ymd(new Date(r.date));
    if (!byDate[k]) byDate[k] = { total: 0, items: [] };
    byDate[k].total += Number(r.amount || 0);
    byDate[k].items.push(r);
  });

  const now = new Date();
  const sum = (arr, pred) => arr.filter(pred).reduce((s, r) => s + Number(r.amount || 0), 0);
  const todayIncome = sum(rides, r => ymd(new Date(r.date)) === ymd(now));
  const weekIncome  = sum(rides, r => new Date(r.date) >= startOfWeek(now));
  const monthIncome = sum(rides, r => new Date(r.date) >= startOfMonth(now));

  // Trend: deze maand vs vorige maand op zelfde dag-positie
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const daysIn = now.getDate();
  const lastMonthAtPos = rides.filter(r => {
    const d = new Date(r.date);
    return d >= lastMonthStart && d <= lastMonthEnd && d.getDate() <= daysIn;
  }).reduce((s, r) => s + Number(r.amount || 0), 0);
  const trendPct = lastMonthAtPos > 0 ? Math.round((monthIncome - lastMonthAtPos) / lastMonthAtPos * 100) : null;

  container.innerHTML = `
    <h1 class="page-title">Taxi inkomen</h1>

    <div class="stat-row">
      <div class="stat">
        <div class="stat-label">Vandaag</div>
        <div class="stat-value">${fmtMoney(todayIncome)}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Deze week</div>
        <div class="stat-value">${fmtMoney(weekIncome)}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Deze maand</div>
        <div class="stat-value">${fmtMoney(monthIncome)}</div>
        ${trendPct !== null ? `<div class="stat-trend ${trendPct>=0?'up':'down'}">${trendPct>=0?'↑':'↓'} ${Math.abs(trendPct)}% vs vorige</div>` : ''}
      </div>
    </div>

    <button class="btn block" id="quick-today">+ Inkomen vandaag noteren</button>

    <div class="card cal-card" style="margin-top:14px">
      <div class="cal-head">
        <button class="btn secondary" id="mon-prev">◀</button>
        <h2 style="margin:0;flex:1;text-align:center;text-transform:capitalize">${state.toLocaleString('nl-NL', { month: 'long', year: 'numeric' })}</h2>
        <button class="btn secondary" id="mon-next">▶</button>
      </div>
      <div class="cal-grid" id="income-grid"></div>
      <p class="muted" style="font-size:.78rem;margin-top:10px;text-align:center">Tik op een dag om in te vullen of aan te passen</p>
    </div>

    <div class="card"><h2 class="card-title">Jaarverloop</h2><div id="chart"></div></div>

    <button class="btn secondary block" id="export-csv" style="margin-top:8px">CSV exporteren</button>
  `;

  renderGrid(container, year, month, byDate);
  renderChart(container, rides);

  container.querySelector('#mon-prev').onclick = () => {
    const d = new Date(year, month - 1, 1);
    container.dataset.taxiMonth = d.toISOString();
    render(container);
  };
  container.querySelector('#mon-next').onclick = () => {
    const d = new Date(year, month + 1, 1);
    container.dataset.taxiMonth = d.toISOString();
    render(container);
  };
  container.querySelector('#quick-today').onclick = () => openDayModal(container, ymd(now), byDate[ymd(now)]);
  container.querySelector('#export-csv').onclick = () => exportCSV(rides);
}

function renderGrid(container, year, month, byDate) {
  const first = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (first.getDay() + 6) % 7;
  const today = ymd();

  const grid = container.querySelector('#income-grid');
  const cells = [];
  ['ma','di','wo','do','vr','za','zo'].forEach(d => cells.push(`<div class="cal-head-day">${d}</div>`));

  for (let i = 0; i < firstWeekday; i++) cells.push('<div></div>');

  // Bepaal max bedrag deze maand voor heatmap-intensiteit
  const monthValues = [];
  for (let d = 1; d <= lastDate; d++) {
    const key = ymd(new Date(year, month, d));
    if (byDate[key]) monthValues.push(byDate[key].total);
  }
  const maxVal = Math.max(1, ...monthValues);

  for (let d = 1; d <= lastDate; d++) {
    const key = ymd(new Date(year, month, d));
    const entry = byDate[key];
    const total = entry ? entry.total : 0;
    const intensity = total > 0 ? Math.min(1, total / maxVal) : 0;
    const isToday = key === today;
    cells.push(`
      <div class="cal-cell income-cell ${isToday ? 'today' : ''} ${total > 0 ? 'has-income' : ''}"
           style="${total > 0 ? `--heat:${intensity};background:linear-gradient(135deg,rgba(var(--gold-rgb,212,176,107),${0.08 + intensity*0.5}),var(--bg-elev))` : ''}"
           data-day="${key}">
        <div class="cal-day">${d}</div>
        ${total > 0 ? `<div class="cal-amt">${fmtMoneyCompact(total)}</div>` : ''}
      </div>`);
  }
  grid.innerHTML = cells.join('');
  grid.querySelectorAll('[data-day]').forEach(cell => {
    cell.onclick = () => openDayModal(container, cell.dataset.day, byDate[cell.dataset.day]);
  });
}

function fmtMoneyCompact(n) {
  if (n >= 1000) return '€' + (n/1000).toFixed(1) + 'k';
  return '€' + Math.round(n);
}

function openDayModal(container, dateKey, existing) {
  const items = existing?.items || [];
  const total = existing?.total || 0;
  const dateObj = new Date(dateKey + 'T12:00:00');
  const friendlyDate = dateObj.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });

  openModal(friendlyDate, `
    ${items.length ? `
      <div style="margin-bottom:14px">
        <div class="muted" style="font-size:.75rem;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">Eerdere notities</div>
        ${items.map(it => `
          <div class="list-item" style="margin-bottom:6px">
            <div>
              <b class="money">${fmtMoney(it.amount)}</b>
              ${it.note ? `<div class="muted" style="font-size:.78rem">${escapeHTML(it.note)}</div>` : ''}
            </div>
            <button type="button" class="btn danger" data-del-line="${it.id}">×</button>
          </div>`).join('')}
        <p class="muted" style="font-size:.85rem;margin-top:8px">Dagtotaal: <b class="money">${fmtMoney(total)}</b></p>
      </div>` : ''}
    <label>Bedrag toevoegen (€) *</label>
    <input name="amount" type="number" step="0.01" inputmode="decimal" required autofocus />
    <label>Notitie (optioneel)</label>
    <input name="note" placeholder="dagdienst, nachtshift, etc" />
  `, async (d) => {
    const amount = parseFloat(d.amount);
    if (!isFinite(amount) || amount <= 0) throw new Error('Bedrag ongeldig');
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

  // Bind delete buttons in modal (after modal renders)
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
        const h = Math.max(2, Math.round((b.in / max) * 130));
        return `<div style="display:flex;flex-direction:column;flex:1">
          <div class="bar" style="height:${h}px" title="${b.label}: ${fmtMoney(b.in)}"></div>
          <div class="bar-label">${b.label}</div>
        </div>`;
      }).join('')}
    </div>`;
}

function exportCSV(rides) {
  const rows = [['datum','bedrag','notitie']];
  rides.forEach(r => rows.push([
    new Date(r.date).toISOString().slice(0,10),
    r.amount,
    (r.note||'').replace(/[\r\n,]/g,' '),
  ]));
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'taxi-inkomen-' + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}
