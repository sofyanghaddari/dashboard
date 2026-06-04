import { all, put, del } from '../db.js';
import { openModal } from '../components/modal.js';
import { uid, fmtMoney, todayISO, startOfWeek, startOfMonth, monthKey, escapeHTML } from '../utils.js';

export async function render(container) {
  const rides = await all('rides');
  const expenses = await all('expenses');
  const now = new Date();
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const sumIf = (arr, pred) => arr.filter(pred).reduce((s, r) => s + Number(r.amount || 0), 0);
  const weekIncome  = sumIf(rides, r => new Date(r.date) >= weekStart);
  const monthIncome = sumIf(rides, r => new Date(r.date) >= monthStart);
  const weekExp  = sumIf(expenses, e => new Date(e.date) >= weekStart);
  const monthExp = sumIf(expenses, e => new Date(e.date) >= monthStart);

  const bySource = { uber: 0, bolt: 0, whatsapp: 0 };
  rides.forEach(r => { bySource[r.source] = (bySource[r.source] || 0) + Number(r.amount || 0); });
  const totalIncome = bySource.uber + bySource.bolt + bySource.whatsapp;

  container.innerHTML = `
    <h1>Taxi</h1>
    <button class="btn block" id="add-ride">+ Nieuwe rit</button>
    <button class="btn secondary block" id="add-expense" style="margin-top:8px">+ Nieuwe uitgave</button>
    <button class="btn secondary block" id="export-csv" style="margin-top:8px">CSV exporteren</button>

    <div class="card" style="margin-top:16px">
      <h2>Deze week</h2>
      <p>Bruto: <b>${fmtMoney(weekIncome)}</b> · Uitgaven: <b>${fmtMoney(weekExp)}</b> · Netto: <b>${fmtMoney(weekIncome - weekExp)}</b></p>
    </div>
    <div class="card">
      <h2>Deze maand</h2>
      <p>Bruto: <b>${fmtMoney(monthIncome)}</b> · Uitgaven: <b>${fmtMoney(monthExp)}</b> · Netto: <b>${fmtMoney(monthIncome - monthExp)}</b></p>
    </div>
    <div class="card">
      <h2>Per bron (totaal)</h2>
      ${['uber','bolt','whatsapp'].map(s => {
        const v = bySource[s]; const pct = totalIncome ? Math.round(v / totalIncome * 100) : 0;
        return `<p>${s[0].toUpperCase()+s.slice(1)}: <b>${fmtMoney(v)}</b> <span class="muted">(${pct}%)</span></p>`;
      }).join('')}
    </div>

    <div class="card"><h2>Netto per maand (12 mnd)</h2><div id="chart"></div></div>

    <h2 style="margin-top:16px">Recente ritten</h2>
    <div class="list" id="rides-list"></div>

    <h2 style="margin-top:16px">Recente uitgaven</h2>
    <div class="list" id="exp-list"></div>
  `;

  renderRidesList(container, rides);
  renderExpensesList(container, expenses);
  renderChart(container, rides, expenses);

  container.querySelector('#add-ride').onclick = () => openRideModal(container);
  container.querySelector('#add-expense').onclick = () => openExpenseModal(container);
  container.querySelector('#export-csv').onclick = () => exportCSV(rides, expenses);
}

function renderRidesList(container, rides) {
  const list = container.querySelector('#rides-list');
  const recent = [...rides].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);
  if (!recent.length) { list.innerHTML = '<p class="muted">Nog geen ritten.</p>'; return; }
  list.innerHTML = recent.map(r => `
    <div class="list-item">
      <div>
        <div><b>${fmtMoney(r.amount)}</b> <span class="pill">${escapeHTML(r.source)}</span></div>
        <div class="muted" style="font-size:.8rem">
          ${new Date(r.date).toLocaleString('nl-NL')}${r.km ? ' · ' + r.km + ' km' : ''}${r.note ? ' · ' + escapeHTML(r.note) : ''}
        </div>
      </div>
      <button class="btn danger" data-del-ride="${r.id}">×</button>
    </div>`).join('');
  list.querySelectorAll('[data-del-ride]').forEach(b => {
    b.onclick = async () => { await del('rides', b.dataset.delRide); render(container); };
  });
}

function renderExpensesList(container, expenses) {
  const list = container.querySelector('#exp-list');
  const recent = [...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);
  if (!recent.length) { list.innerHTML = '<p class="muted">Nog geen uitgaven.</p>'; return; }
  list.innerHTML = recent.map(e => `
    <div class="list-item">
      <div>
        <div><b>${fmtMoney(e.amount)}</b> <span class="pill">${escapeHTML(e.category)}</span></div>
        <div class="muted" style="font-size:.8rem">
          ${new Date(e.date).toLocaleString('nl-NL')}${e.note ? ' · ' + escapeHTML(e.note) : ''}
        </div>
      </div>
      <button class="btn danger" data-del-exp="${e.id}">×</button>
    </div>`).join('');
  list.querySelectorAll('[data-del-exp]').forEach(b => {
    b.onclick = async () => { await del('expenses', b.dataset.delExp); render(container); };
  });
}

function openRideModal(container) {
  openModal('Nieuwe rit', `
    <label>Bedrag (€) *</label><input name="amount" type="number" step="0.01" required />
    <label>Bron *</label>
    <select name="source" required>
      <option value="uber">Uber</option>
      <option value="bolt">Bolt</option>
      <option value="whatsapp">WhatsApp</option>
    </select>
    <label>Km (optioneel)</label><input name="km" type="number" step="0.1" />
    <label>Notitie</label><input name="note" />
  `, async (d) => {
    const amount = parseFloat(d.amount);
    if (!isFinite(amount) || amount <= 0) throw new Error('Bedrag ongeldig');
    await put('rides', {
      id: uid(), date: todayISO(), amount,
      source: d.source, km: d.km ? parseFloat(d.km) : null, note: d.note || null,
    });
    render(container);
  });
}

function openExpenseModal(container) {
  openModal('Nieuwe uitgave', `
    <label>Bedrag (€) *</label><input name="amount" type="number" step="0.01" required />
    <label>Categorie *</label>
    <select name="category" required>
      <option value="brandstof">Brandstof</option>
      <option value="verzekering">Verzekering</option>
      <option value="onderhoud">Onderhoud</option>
      <option value="overig">Overig</option>
    </select>
    <label>Notitie</label><input name="note" />
  `, async (d) => {
    const amount = parseFloat(d.amount);
    if (!isFinite(amount) || amount <= 0) throw new Error('Bedrag ongeldig');
    await put('expenses', { id: uid(), date: todayISO(), amount, category: d.category, note: d.note || null });
    render(container);
  });
}

function renderChart(container, rides, expenses) {
  const buckets = {};
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets[monthKey(d)] = { in: 0, out: 0, label: d.toLocaleString('nl-NL', { month: 'short' }) };
  }
  rides.forEach(r => { const k = monthKey(r.date); if (buckets[k]) buckets[k].in += Number(r.amount || 0); });
  expenses.forEach(e => { const k = monthKey(e.date); if (buckets[k]) buckets[k].out += Number(e.amount || 0); });
  const entries = Object.values(buckets);
  const max = Math.max(1, ...entries.map(b => b.in - b.out));
  container.querySelector('#chart').innerHTML = `
    <div class="bar-chart">
      ${entries.map(b => {
        const net = b.in - b.out;
        const h = Math.max(2, Math.round((Math.max(0, net) / max) * 130));
        return `<div style="display:flex;flex-direction:column;flex:1">
          <div class="bar" style="height:${h}px" title="${b.label}: ${fmtMoney(net)}"></div>
          <div class="bar-label">${b.label}</div>
        </div>`;
      }).join('')}
    </div>`;
}

function exportCSV(rides, expenses) {
  const rows = [['type','date','amount','source_or_category','km','note']];
  rides.forEach(r => rows.push(['rit', r.date, r.amount, r.source, r.km ?? '', (r.note||'').replace(/[\r\n,]/g,' ')]));
  expenses.forEach(e => rows.push(['uitgave', e.date, e.amount, e.category, '', (e.note||'').replace(/[\r\n,]/g,' ')]));
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'taxi-export-' + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}
