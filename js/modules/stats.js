import { all } from '../db.js';
import { ymd, escapeHTML } from '../utils.js';

export async function render(container) {
  const period = container.dataset.statsPeriod || '30';

  container.innerHTML = `
    <h1 class="page-title">Statistieken</h1>
    <div class="todo-seg" style="margin-bottom:20px">
      <button class="todo-seg-btn ${period==='7'  ?'active':''}" data-p="7">7 d</button>
      <button class="todo-seg-btn ${period==='30' ?'active':''}" data-p="30">30 d</button>
      <button class="todo-seg-btn ${period==='90' ?'active':''}" data-p="90">90 d</button>
      <button class="todo-seg-btn ${period==='all'?'active':''}" data-p="all">Alles</button>
    </div>
    <div id="stats-body">
      <div style="text-align:center;padding:40px;color:var(--text-dim)">Laden…</div>
    </div>
  `;

  container.querySelectorAll('[data-p]').forEach(btn => {
    btn.onclick = () => { container.dataset.statsPeriod = btn.dataset.p; render(container); };
  });

  const [rides, hizbLog, cards, todos] = await Promise.all([
    all('rides').catch(() => []),
    all('hizb_log').catch(() => []),
    all('cards').catch(() => []),
    all('todos').catch(() => []),
  ]);

  const body = container.querySelector('#stats-body');
  const cutoff = getCutoff(period);

  body.innerHTML = `
    ${renderTaxiStats(rides, cutoff)}
    ${renderKoranStats(hizbLog, cutoff)}
    ${renderArabicStats(cards, cutoff)}
    ${renderTaakStats(todos, cutoff)}
  `;
}

function getCutoff(period) {
  if (period === 'all') return null;
  const d = new Date();
  d.setDate(d.getDate() - +period);
  return ymd(d);
}

function inRange(dateStr, cutoff) {
  if (!cutoff) return true;
  return dateStr >= cutoff;
}

// ── TAXI STATS ───────────────────────────────────────────────────────────────
function renderTaxiStats(rides, cutoff) {
  const filtered = rides.filter(r => r.date && inRange(r.date, cutoff));
  if (!filtered.length) return statSection('🚖 Taxi & Inkomen', `<div class="stats-empty">Nog geen ritgegevens</div>`);

  const total     = filtered.reduce((s, r) => s + (r.amount || 0), 0);
  const days      = [...new Set(filtered.map(r => r.date))];
  const avgDay    = days.length ? total / days.length : 0;

  // Best day
  const byDay = {};
  filtered.forEach(r => { byDay[r.date] = (byDay[r.date] || 0) + (r.amount || 0); });
  const bestDayEntry = Object.entries(byDay).sort((a,b) => b[1]-a[1])[0];
  const bestDay   = bestDayEntry ? bestDayEntry[0] : null;
  const bestAmt   = bestDayEntry ? bestDayEntry[1] : 0;

  // Drukste dag van de week
  const byWeekday = [0,0,0,0,0,0,0];
  const weekdayCnt = [0,0,0,0,0,0,0];
  Object.entries(byDay).forEach(([d, amt]) => {
    const wd = new Date(d + 'T12:00:00').getDay(); // 0=Sun
    byWeekday[wd] += amt; weekdayCnt[wd]++;
  });
  const avgByWd = byWeekday.map((t, i) => weekdayCnt[i] ? t / weekdayCnt[i] : 0);
  const busyWd  = avgByWd.indexOf(Math.max(...avgByWd));
  const WD_NL   = ['Zondag','Maandag','Dinsdag','Woensdag','Donderdag','Vrijdag','Zaterdag'];

  // Last 6 months bar chart
  const monthBars = lastNMonths(6).map(m => {
    const monthRides = rides.filter(r => r.date && r.date.startsWith(m));
    return { m, total: monthRides.reduce((s, r) => s + (r.amount || 0), 0) };
  });

  return statSection('🚖 Taxi & Inkomen', `
    <div class="stats-grid-2">
      <div class="stat-card">
        <div class="stat-num money">${fmtMoney(avgDay)}</div>
        <div class="stat-lbl">Gem. per dag</div>
      </div>
      <div class="stat-card">
        <div class="stat-num money">${fmtMoney(total)}</div>
        <div class="stat-lbl">Totaal inkomen</div>
      </div>
      <div class="stat-card">
        <div class="stat-num money">${fmtMoney(bestAmt)}</div>
        <div class="stat-lbl">Beste dag${bestDay ? ` (${fmtDate(bestDay)})` : ''}</div>
      </div>
      <div class="stat-card">
        <div class="stat-num" style="font-size:1.1rem">${WD_NL[busyWd]}</div>
        <div class="stat-lbl">Drukste dag</div>
      </div>
    </div>
    <div style="margin-top:14px">
      <div class="card-title" style="margin-bottom:8px">Inkomen laatste 6 maanden</div>
      ${barChart(monthBars.map(b => ({ label: b.m.slice(5), value: b.total })))}
    </div>
  `);
}

// ── KORAN STATS ──────────────────────────────────────────────────────────────
function renderKoranStats(log, cutoff) {
  const filtered = log.filter(l => inRange(l.date, cutoff));
  const totalDone  = filtered.length;
  const allLog     = log;

  // Streak current
  const doneSet = new Set(allLog.map(l => l.date));
  let streak = 0;
  const cur = new Date();
  while (doneSet.has(ymd(cur))) { streak++; cur.setDate(cur.getDate() - 1); }

  // Longest streak (all time)
  let longest = 0, running = 0;
  const sorted = [...doneSet].sort();
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) running = 1;
    else {
      const diff = Math.round((new Date(sorted[i]+'T12:00:00') - new Date(sorted[i-1]+'T12:00:00')) / 86400000);
      running = diff === 1 ? running + 1 : 1;
    }
    if (running > longest) longest = running;
  }

  // Miss rate per weekday
  const byWd = [0,0,0,0,0,0,0], totalWd = [0,0,0,0,0,0,0];
  if (allLog.length) {
    const from = new Date(sorted[0] + 'T12:00:00');
    const to   = new Date();
    for (let d = new Date(from); d <= to; d.setDate(d.getDate()+1)) {
      const k = ymd(d);
      totalWd[d.getDay()]++;
      if (!doneSet.has(k)) byWd[d.getDay()]++;
    }
  }
  const missRates = byWd.map((m, i) => totalWd[i] ? Math.round(m/totalWd[i]*100) : 0);
  const WD_SHORT = ['Zo','Ma','Di','Wo','Do','Vr','Za'];
  const WD_FULL  = ['Zondag','Maandag','Dinsdag','Woensdag','Donderdag','Vrijdag','Zaterdag'];
  const worstWd = missRates.indexOf(Math.max(...missRates));

  return statSection('📖 Koran & Hizb', `
    <div class="stats-grid-2">
      <div class="stat-card">
        <div class="stat-num" style="color:var(--gold)">${streak}</div>
        <div class="stat-lbl">Huidige streak 🔥</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">${longest}</div>
        <div class="stat-lbl">Langste streak ooit</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">${totalDone}</div>
        <div class="stat-lbl">Hizbs voltooid (periode)</div>
      </div>
      <div class="stat-card">
        <div class="stat-num" style="color:var(--err);font-size:1.1rem">${WD_FULL[worstWd]}</div>
        <div class="stat-lbl">Meest gemist (${missRates[worstWd]}%)</div>
      </div>
    </div>
    ${allLog.length ? `
    <div style="margin-top:14px">
      <div class="card-title" style="margin-bottom:8px">Mis-rate per dag</div>
      ${barChart(WD_SHORT.map((d, i) => ({ label: d, value: missRates[i] })), '%', 100)}
    </div>` : ''}
  `);
}

// ── ARABISCH STATS ────────────────────────────────────────────────────────────
function renderArabicStats(cards, cutoff) {
  if (!cards.length) return statSection('📚 Arabisch', `<div class="stats-empty">Nog geen kaarten</div>`);

  const totalCards   = cards.length;
  const learnedCards = cards.filter(c => c.repetitions > 0).length;

  // Lowest ease (hardest cards)
  const worst = cards.filter(c => c.ease).sort((a,b) => a.ease - b.ease).slice(0, 3);

  // Weekly review scores (last 8 weeks) - approximate from card due dates
  const weekScores = lastNWeeks(8).map(wStart => {
    const wEnd = new Date(wStart); wEnd.setDate(wEnd.getDate() + 7);
    const due = cards.filter(c => {
      if (!c.dueDate) return false;
      const d = new Date(c.dueDate + 'T12:00:00');
      return d >= new Date(wStart+'T12:00:00') && d < wEnd;
    });
    return { label: wStart.slice(5), value: due.length };
  });

  return statSection('📚 Arabisch', `
    <div class="stats-grid-2">
      <div class="stat-card">
        <div class="stat-num">${learnedCards}</div>
        <div class="stat-lbl">Geleerde woorden</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">${totalCards}</div>
        <div class="stat-lbl">Totaal kaarten</div>
      </div>
    </div>
    ${worst.length ? `
    <div style="margin-top:14px">
      <div class="card-title" style="margin-bottom:8px">Moeilijkste woorden</div>
      ${worst.map(c => `
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:.88rem">
          <span>${escapeHTML(c.front || '')}</span>
          <span style="color:var(--err);font-weight:600">ease ${(c.ease||2.5).toFixed(1)}</span>
        </div>`).join('')}
    </div>` : ''}
    <div style="margin-top:14px">
      <div class="card-title" style="margin-bottom:8px">Reviews per week</div>
      ${barChart(weekScores)}
    </div>
  `);
}

// ── TAAK STATS ────────────────────────────────────────────────────────────────
function renderTaakStats(todos, cutoff) {
  const filtered    = todos.filter(t => !cutoff || (t.createdAt && t.createdAt.slice(0,10) >= cutoff));
  const done        = filtered.filter(t => t.done);
  const total       = filtered.length;
  const pct         = total ? Math.round(done.length / total * 100) : 0;

  // Average completion time (days)
  const withTime = done.filter(t => t.createdAt && t.completedAt);
  const avgDays  = withTime.length
    ? (withTime.reduce((s, t) => s + (new Date(t.completedAt) - new Date(t.createdAt)) / 86400000, 0) / withTime.length).toFixed(1)
    : null;

  // Top tags
  const tagCounts = {};
  filtered.forEach(t => (t.tags||[]).forEach(g => { tagCounts[g] = (tagCounts[g]||0)+1; }));
  const topTags = Object.entries(tagCounts).sort((a,b) => b[1]-a[1]).slice(0,3);

  return statSection('✅ Taken', `
    <div class="stats-grid-2">
      <div class="stat-card">
        <div class="stat-num" style="color:var(--ok)">${pct}%</div>
        <div class="stat-lbl">Voltooiingspercentage</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">${done.length}/${total}</div>
        <div class="stat-lbl">Gedaan / totaal</div>
      </div>
      ${avgDays !== null ? `
      <div class="stat-card" style="grid-column:1/-1">
        <div class="stat-num">${avgDays}d</div>
        <div class="stat-lbl">Gem. aanmaken → voltooien</div>
      </div>` : ''}
    </div>
    ${topTags.length ? `
    <div style="margin-top:12px">
      <div class="card-title" style="margin-bottom:8px">Top tags</div>
      ${topTags.map(([tag, cnt]) => `
        <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border);font-size:.88rem">
          <span>#${escapeHTML(tag)}</span>
          <span style="color:var(--text-dim)">${cnt} taken</span>
        </div>`).join('')}
    </div>` : ''}
  `);
}

// ── Layout helpers ────────────────────────────────────────────────────────────
function statSection(title, content) {
  return `<div class="card stats-section"><h2 class="card-title">${title}</h2>${content}</div>`;
}

function barChart(items, unit = '', max = null) {
  if (!items.length) return '';
  const maxVal = max || Math.max(...items.map(i => i.value), 1);
  return `<div class="stats-bar-chart">
    ${items.map(item => `
      <div class="sbc-col">
        <div class="sbc-bar-wrap">
          <div class="sbc-bar" style="height:${Math.round(item.value/maxVal*100)}%"></div>
        </div>
        <div class="sbc-lbl">${item.label}</div>
        ${item.value > 0 ? `<div class="sbc-val">${Math.round(item.value)}${unit}</div>` : ''}
      </div>`).join('')}
  </div>`;
}

function fmtMoney(n) {
  return '€' + Math.round(n).toLocaleString('nl-NL');
}

function fmtDate(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}

function lastNMonths(n) {
  const result = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    result.push(d.toISOString().slice(0, 7));
  }
  return result;
}

function lastNWeeks(n) {
  const result = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    const day = d.getDay();
    d.setDate(d.getDate() - ((day === 0 ? 7 : day) - 1) - i * 7);
    result.push(ymd(d));
  }
  return result;
}
