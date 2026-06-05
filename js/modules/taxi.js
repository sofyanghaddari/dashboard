import { all, put, del } from '../db.js';
import { openModal } from '../components/modal.js';
import { uid, fmtMoney, todayISO, startOfWeek, startOfMonth, monthKey, escapeHTML, ymd, sameDay } from '../utils.js';
import { ok } from '../components/toast.js';

let _tickTimer = null;

export async function render(container) {
  if (_tickTimer) { clearInterval(_tickTimer); _tickTimer = null; }

  const rides = await all('rides');
  const shifts = await all('shifts');
  const now = new Date();
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const sumIf = (arr, pred) => arr.filter(pred).reduce((s, r) => s + Number(r.amount || 0), 0);
  const todayIncome = sumIf(rides, r => sameDay(new Date(r.date), now));
  const weekIncome  = sumIf(rides, r => new Date(r.date) >= weekStart);
  const monthIncome = sumIf(rides, r => new Date(r.date) >= monthStart);

  const activeShift = shifts.find(s => !s.endTime);

  container.innerHTML = `
    <h1>Taxi</h1>

    <div class="card shift-card" id="shift-card">
      <h2>⏱️ Dienst</h2>
      <div id="shift-body"></div>
    </div>

    <button class="btn block" id="add-income">+ Inkomen vandaag noteren</button>
    <button class="btn secondary block" id="export-csv" style="margin-top:8px">CSV exporteren</button>

    <div class="card" style="margin-top:16px">
      <h2>Vandaag</h2>
      <p class="big-money">${fmtMoney(todayIncome)}</p>
    </div>
    <div class="card">
      <h2>Deze week</h2>
      <p class="big-money">${fmtMoney(weekIncome)}</p>
    </div>
    <div class="card">
      <h2>Deze maand</h2>
      <p class="big-money">${fmtMoney(monthIncome)}</p>
    </div>

    <div class="card"><h2>Statistieken</h2><div id="stats"></div></div>

    <div class="card"><h2>Per maand (12 mnd)</h2><div id="chart"></div></div>

    <h2 style="margin-top:16px">Recente notities</h2>
    <div class="list" id="rides-list"></div>
  `;

  renderShiftCard(container, activeShift, shifts, rides);
  renderRidesList(container, rides);
  renderChart(container, rides);
  renderStats(container, rides, shifts);

  container.querySelector('#add-income').onclick = () => openIncomeModal(container);
  container.querySelector('#export-csv').onclick = () => exportCSV(rides);

  if (activeShift) {
    _tickTimer = setInterval(() => updateLiveTimer(container, activeShift, rides), 1000);
  }
}

function renderShiftCard(container, active, shifts, rides) {
  const body = container.querySelector('#shift-body');
  if (active) {
    body.innerHTML = `
      <p>Bezig sinds <b>${new Date(active.startTime).toLocaleTimeString('nl-NL', {hour:'2-digit',minute:'2-digit'})}</b></p>
      <p class="big-money" id="shift-elapsed">--:--:--</p>
      <p class="muted">Verdiend deze dienst: <b class="money" id="shift-earned">€ 0.00</b> · <span id="shift-perhour">€ 0.00/u</span></p>
      <button class="btn danger block" id="stop-shift" style="margin-top:8px">Dienst stoppen</button>
    `;
    updateLiveTimer(container, active, rides);
    body.querySelector('#stop-shift').onclick = async () => {
      await put('shifts', { ...active, endTime: new Date().toISOString() });
      render(container);
    };
  } else {
    const last = shifts.filter(s => s.endTime).sort((a,b) => b.startTime.localeCompare(a.startTime))[0];
    body.innerHTML = `
      <p class="muted">Geen actieve dienst</p>
      ${last ? `<p class="muted" style="font-size:.85rem">Laatste: ${new Date(last.startTime).toLocaleDateString('nl-NL')} — ${shiftDuration(last)}</p>` : ''}
      <button class="btn block" id="start-shift" style="margin-top:8px">Dienst starten</button>
    `;
    body.querySelector('#start-shift').onclick = async () => {
      await put('shifts', { id: uid(), startTime: new Date().toISOString(), endTime: null });
      render(container);
    };
  }
}

function updateLiveTimer(container, shift, rides) {
  const el = container.querySelector('#shift-elapsed');
  const earnedEl = container.querySelector('#shift-earned');
  const phEl = container.querySelector('#shift-perhour');
  if (!el) return;
  const start = new Date(shift.startTime);
  const now = new Date();
  const sec = Math.floor((now - start) / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  el.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  const earned = rides.filter(r => new Date(r.date) >= start).reduce((sum, r) => sum + Number(r.amount || 0), 0);
  earnedEl.textContent = fmtMoney(earned);
  const hours = sec / 3600;
  phEl.textContent = hours > 0 ? fmtMoney(earned / hours) + '/u' : '€ 0.00/u';
}

function shiftDuration(shift) {
  const ms = new Date(shift.endTime) - new Date(shift.startTime);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}u ${m}m`;
}

function renderStats(container, rides, shifts) {
  const el = container.querySelector('#stats');
  if (!rides.length) { el.innerHTML = '<p class="muted">Nog geen data.</p>'; return; }

  const dayNames = ['Zondag','Maandag','Dinsdag','Woensdag','Donderdag','Vrijdag','Zaterdag'];
  const byDay = Array(7).fill(0).map(() => ({ total: 0, count: 0 }));
  rides.forEach(r => {
    const d = new Date(r.date).getDay();
    byDay[d].total += Number(r.amount || 0);
    byDay[d].count += 1;
  });
  const dayAvg = byDay.map((b, i) => ({
    name: dayNames[i],
    avg: b.count ? b.total / Math.max(1, new Set(rides.filter(r => new Date(r.date).getDay() === i).map(r => ymd(new Date(r.date)))).size) : 0,
  })).sort((a, b) => b.avg - a.avg);
  const bestDay = dayAvg[0];

  const totalShiftHours = shifts.filter(s => s.endTime).reduce((sum, s) => sum + (new Date(s.endTime) - new Date(s.startTime)) / 3600000, 0);
  const totalShiftEarnings = shifts.filter(s => s.endTime).reduce((sum, s) => {
    const start = new Date(s.startTime), end = new Date(s.endTime);
    return sum + rides.filter(r => { const d = new Date(r.date); return d >= start && d <= end; }).reduce((a, r) => a + Number(r.amount || 0), 0);
  }, 0);
  const avgPerHour = totalShiftHours > 0 ? totalShiftEarnings / totalShiftHours : 0;

  el.innerHTML = `
    <p>📅 Beste dag: <b>${bestDay.name}</b> <span class="muted">(gem ${fmtMoney(bestDay.avg)})</span></p>
    <p>⏱️ Gemiddelde €/uur (alle diensten): <b class="money">${fmtMoney(avgPerHour)}</b> <span class="muted">over ${totalShiftHours.toFixed(1)}u</span></p>
  `;
}

function renderRidesList(container, rides) {
  const list = container.querySelector('#rides-list');
  const recent = [...rides].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);
  if (!recent.length) { list.innerHTML = '<p class="muted">Nog geen inkomen genoteerd.</p>'; return; }
  list.innerHTML = recent.map(r => `
    <div class="list-item">
      <div>
        <div><b class="money">${fmtMoney(r.amount)}</b></div>
        <div class="muted" style="font-size:.8rem">
          ${new Date(r.date).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}${r.note ? ' · ' + escapeHTML(r.note) : ''}
        </div>
      </div>
      <button class="btn danger" data-del-ride="${r.id}">×</button>
    </div>`).join('');
  list.querySelectorAll('[data-del-ride]').forEach(b => {
    b.onclick = async () => { await del('rides', b.dataset.delRide); render(container); };
  });
}

function openIncomeModal(container) {
  openModal('Inkomen noteren', `
    <label>Datum</label>
    <input name="date" type="date" required value="${ymd()}" />
    <label>Bedrag (€) *</label>
    <input name="amount" type="number" step="0.01" required autofocus />
    <label>Notitie (optioneel)</label>
    <input name="note" />
  `, async (d) => {
    const amount = parseFloat(d.amount);
    if (!isFinite(amount) || amount <= 0) throw new Error('Bedrag ongeldig');
    const date = d.date ? new Date(d.date + 'T12:00:00').toISOString() : todayISO();
    await put('rides', {
      id: uid(), date, amount,
      source: 'daily', km: null, note: d.note || null,
    });
    ok('Inkomen genoteerd: ' + fmtMoney(amount));
    render(container);
  });
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
