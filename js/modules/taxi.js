import { all, put, del } from '../db.js';
import { openModal } from '../components/modal.js';
import { uid, fmtMoney, todayISO, startOfWeek, startOfMonth, monthKey, escapeHTML, ymd, sameDay } from '../utils.js';
import { getNumber } from '../settings.js';
import { voiceAvailable, startVoice, parseRide } from '../voice.js';
import { ok, err, info } from '../components/toast.js';

let _tickTimer = null;

export async function render(container) {
  if (_tickTimer) { clearInterval(_tickTimer); _tickTimer = null; }

  const rides = await all('rides');
  const expenses = await all('expenses');
  const shifts = await all('shifts');
  const now = new Date();
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const sumIf = (arr, pred) => arr.filter(pred).reduce((s, r) => s + Number(r.amount || 0), 0);
  const todayIncome = sumIf(rides, r => sameDay(new Date(r.date), now));
  const weekIncome  = sumIf(rides, r => new Date(r.date) >= weekStart);
  const monthIncome = sumIf(rides, r => new Date(r.date) >= monthStart);
  const weekExp  = sumIf(expenses, e => new Date(e.date) >= weekStart);
  const monthExp = sumIf(expenses, e => new Date(e.date) >= monthStart);

  const taxPct = getNumber('taxReservePercent');
  const monthTaxReserve = monthIncome * (taxPct / 100);

  const bySource = { uber: 0, bolt: 0, whatsapp: 0 };
  const countBySource = { uber: 0, bolt: 0, whatsapp: 0 };
  rides.forEach(r => {
    bySource[r.source] = (bySource[r.source] || 0) + Number(r.amount || 0);
    countBySource[r.source] = (countBySource[r.source] || 0) + 1;
  });
  const totalIncome = bySource.uber + bySource.bolt + bySource.whatsapp;

  const activeShift = shifts.find(s => !s.endTime);

  container.innerHTML = `
    <h1>Taxi</h1>

    <div class="card shift-card" id="shift-card">
      <h2>⏱️ Dienst</h2>
      <div id="shift-body"></div>
    </div>

    <div class="row">
      <button class="btn" id="add-ride" style="flex:3">+ Nieuwe rit</button>
      ${voiceAvailable() ? `<button class="btn secondary" id="voice-ride" title="Spreek in" style="flex:1">🎙️</button>` : ''}
    </div>
    <button class="btn secondary block" id="add-expense" style="margin-top:8px">+ Nieuwe uitgave</button>
    <div class="row" style="margin-top:8px">
      <button class="btn secondary" id="export-csv">CSV exporteren</button>
      <label for="import-csv" class="btn secondary" style="text-align:center;display:flex;align-items:center;justify-content:center">CSV importeren</label>
      <input type="file" id="import-csv" accept=".csv,.txt" style="display:none" />
    </div>
    ${navigator.share ? `<button class="btn secondary block" id="share-stats" style="margin-top:8px">📤 Deel maandoverzicht</button>` : ''}

    <div class="card" style="margin-top:16px">
      <h2>Vandaag</h2>
      <p class="big-money">${fmtMoney(todayIncome)}</p>
    </div>
    <div class="card">
      <h2>Deze week</h2>
      <p>Bruto: <b class="money">${fmtMoney(weekIncome)}</b> · Uitgaven: <b>${fmtMoney(weekExp)}</b></p>
      <p>Netto: <b class="money">${fmtMoney(weekIncome - weekExp)}</b></p>
    </div>
    <div class="card">
      <h2>Deze maand</h2>
      <p>Bruto: <b class="money">${fmtMoney(monthIncome)}</b> · Uitgaven: <b>${fmtMoney(monthExp)}</b></p>
      <p>Netto: <b class="money">${fmtMoney(monthIncome - monthExp)}</b></p>
      <p class="muted" style="margin-top:8px">💰 Reserveer voor belasting (${taxPct}%): <b>${fmtMoney(monthTaxReserve)}</b></p>
    </div>
    <div class="card">
      <h2>Per bron (totaal)</h2>
      ${['uber','bolt','whatsapp'].map(s => {
        const v = bySource[s]; const c = countBySource[s];
        const pct = totalIncome ? Math.round(v / totalIncome * 100) : 0;
        const avg = c ? v / c : 0;
        return `<p>${s[0].toUpperCase()+s.slice(1)}: <b class="money">${fmtMoney(v)}</b> <span class="muted">(${pct}% · ${c} rit${c===1?'':'ten'} · gem ${fmtMoney(avg)})</span></p>`;
      }).join('')}
    </div>

    <div class="card"><h2>Statistieken</h2><div id="stats"></div></div>

    <div class="card"><h2>Netto per maand (12 mnd)</h2><div id="chart"></div></div>

    <h2 style="margin-top:16px">Recente ritten</h2>
    <div class="list" id="rides-list"></div>

    <h2 style="margin-top:16px">Recente uitgaven</h2>
    <div class="list" id="exp-list"></div>
  `;

  renderShiftCard(container, activeShift, shifts, rides);
  renderRidesList(container, rides);
  renderExpensesList(container, expenses);
  renderChart(container, rides, expenses);
  renderStats(container, rides, shifts);

  container.querySelector('#add-ride').onclick = () => openRideModal(container);
  container.querySelector('#add-expense').onclick = () => openExpenseModal(container);
  container.querySelector('#export-csv').onclick = () => exportCSV(rides, expenses);
  container.querySelector('#import-csv').onchange = (e) => importCSV(container, e.target.files[0]);

  const voiceBtn = container.querySelector('#voice-ride');
  if (voiceBtn) voiceBtn.onclick = () => {
    info('Spreek nu, bv. "Uber 25 euro"');
    voiceBtn.classList.add('listening');
    startVoice({
      onResult: async (text) => {
        voiceBtn.classList.remove('listening');
        const { source, amount } = parseRide(text);
        if (!source || !amount) { err('Niet verstaan: "' + text + '"'); return; }
        await put('rides', { id: uid(), date: todayISO(), amount, source, km: null, note: 'Voice: ' + text });
        ok(`${fmtMoney(amount)} (${source}) toegevoegd`);
        render(container);
      },
      onError: (e) => { voiceBtn.classList.remove('listening'); err('Mislukt: ' + e); },
    });
  };

  const shareBtn = container.querySelector('#share-stats');
  if (shareBtn) shareBtn.onclick = async () => {
    const text = `🚖 Maandinkomen: ${fmtMoney(monthIncome)}\n💸 Uitgaven: ${fmtMoney(monthExp)}\n✨ Netto: ${fmtMoney(monthIncome - monthExp)}\n📅 ${new Date().toLocaleString('nl-NL', { month: 'long', year: 'numeric' })}`;
    try { await navigator.share({ title: 'Taxi maandoverzicht', text }); }
    catch (_) {}
  };

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

  const avgRide = rides.reduce((s, r) => s + Number(r.amount || 0), 0) / rides.length;

  const totalShiftHours = shifts.filter(s => s.endTime).reduce((sum, s) => sum + (new Date(s.endTime) - new Date(s.startTime)) / 3600000, 0);
  const totalShiftEarnings = shifts.filter(s => s.endTime).reduce((sum, s) => {
    const start = new Date(s.startTime), end = new Date(s.endTime);
    return sum + rides.filter(r => { const d = new Date(r.date); return d >= start && d <= end; }).reduce((a, r) => a + Number(r.amount || 0), 0);
  }, 0);
  const avgPerHour = totalShiftHours > 0 ? totalShiftEarnings / totalShiftHours : 0;

  el.innerHTML = `
    <p>📅 Beste dag: <b>${bestDay.name}</b> <span class="muted">(gem ${fmtMoney(bestDay.avg)})</span></p>
    <p>🚗 Gemiddelde rit: <b class="money">${fmtMoney(avgRide)}</b></p>
    <p>⏱️ Gemiddelde €/uur (alle diensten): <b class="money">${fmtMoney(avgPerHour)}</b> <span class="muted">over ${totalShiftHours.toFixed(1)}u</span></p>
  `;
}

function renderRidesList(container, rides) {
  const list = container.querySelector('#rides-list');
  const recent = [...rides].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);
  if (!recent.length) { list.innerHTML = '<p class="muted">Nog geen ritten.</p>'; return; }
  list.innerHTML = recent.map(r => `
    <div class="list-item">
      <div>
        <div><b class="money">${fmtMoney(r.amount)}</b> <span class="pill">${escapeHTML(r.source)}</span></div>
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

async function importCSV(container, file) {
  if (!file) return;
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) { err('Bestand leeg'); return; }
  const header = lines[0].toLowerCase();
  const sep = header.includes('\t') ? '\t' : (header.includes(';') ? ';' : ',');
  const cols = header.split(sep).map(c => c.trim().replace(/^["']|["']$/g, ''));
  let okCount = 0, skip = 0;
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(sep).map(p => p.trim().replace(/^["']|["']$/g, ''));
    const get = (names) => {
      for (const n of names) {
        const idx = cols.indexOf(n);
        if (idx >= 0) return parts[idx];
      }
      return null;
    };
    const amountStr = get(['amount','bedrag','fare','total','net amount','net earnings','income']);
    const dateStr = get(['date','datum','timestamp','request time','accepted time']);
    let source = (get(['source','platform','bron']) || '').toLowerCase();
    if (!source) {
      if (/uber/i.test(text)) source = 'uber';
      else if (/bolt/i.test(text)) source = 'bolt';
      else source = 'uber';
    }
    if (!['uber','bolt','whatsapp'].includes(source)) source = 'uber';
    const amount = parseFloat((amountStr || '').replace(',', '.').replace(/[^\d.-]/g,''));
    if (!isFinite(amount) || amount <= 0) { skip++; continue; }
    const date = dateStr ? new Date(dateStr).toISOString() : new Date().toISOString();
    await put('rides', { id: uid(), date, amount, source, km: null, note: 'CSV-import' });
    okCount++;
  }
  ok(`${okCount} ritten geïmporteerd${skip ? `, ${skip} overgeslagen` : ''}`);
  render(container);
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
