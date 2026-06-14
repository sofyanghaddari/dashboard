import { all } from '../db.js';
import { ymd, escapeHTML, fmtMoney as fmtMoneyUtil } from '../utils.js';

export async function render(container) {
  const period = container.dataset.statsPeriod || '30';

  container.innerHTML = `
    <div class="stats-header">
      <h1 class="stats-title">Jouw Inzichten</h1>
      <div class="stats-period-seg">
        <button class="stats-period-btn ${period==='7'   ?'active':''}" data-p="7">7d</button>
        <button class="stats-period-btn ${period==='30'  ?'active':''}" data-p="30">30d</button>
        <button class="stats-period-btn ${period==='90'  ?'active':''}" data-p="90">90d</button>
        <button class="stats-period-btn ${period==='all' ?'active':''}" data-p="all">Alles</button>
      </div>
    </div>
    <div id="stats-body" class="stats-body">
      <div class="stats-loading"><span></span><span></span><span></span></div>
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

  body.innerHTML =
    renderInkomenHero(rides, cutoff, period) +
    renderWeekdayStats(rides, cutoff) +
    renderKoranRing(hizbLog) +
    renderArabicMastery(cards) +
    renderTakenDonut(todos, cutoff) +
    renderActivityGrid(rides);

  // Count-ups start immediately
  requestAnimationFrame(() => {
    body.querySelectorAll('[data-count]').forEach(el => {
      const target = +el.dataset.count;
      if (target > 0) animateCount(el, target, el.hasAttribute('data-money'));
    });
    // SVG transitions need double rAF so initial state is committed
    requestAnimationFrame(() => {
      body.querySelectorAll('.sring-circle').forEach(c => {
        c.style.strokeDashoffset = c.dataset.offset;
      });
      body.querySelectorAll('.donut-seg').forEach(s => {
        s.style.strokeDasharray = s.dataset.dash;
      });
    });
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCutoff(period) {
  if (period === 'all') return null;
  const d = new Date();
  d.setDate(d.getDate() - +period);
  return ymd(d);
}

function inRange(dateStr, cutoff) {
  if (!cutoff) return true;
  return dateStr.slice(0, 10) >= cutoff;
}

function animateCount(el, target, isMoney = false, duration = 1500) {
  const start = performance.now();
  function step(now) {
    const p = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    const val = Math.round(target * ease);
    el.textContent = isMoney ? fmtMoney(val) : val.toLocaleString('nl-NL');
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function fmtMoney(n) { return fmtMoneyUtil(n); }

function fmtDate(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}

function lastNWeeks(n) {
  const result = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    const day = (d.getDay() + 6) % 7; // 0=Mon
    d.setDate(d.getDate() - day - i * 7);
    result.push(ymd(d));
  }
  return result;
}

// ── INKOMEN HERO ──────────────────────────────────────────────────────────────

function renderInkomenHero(rides, cutoff, period) {
  const filtered = rides.filter(r => r.date && inRange(r.date, cutoff));
  const total = filtered.reduce((s, r) => s + (r.amount || 0), 0);

  const byDay = {};
  filtered.forEach(r => {
    const dk = r.date.slice(0, 10);
    byDay[dk] = (byDay[dk] || 0) + (r.amount || 0);
  });
  const days = Object.keys(byDay);
  const avgDay = days.length ? total / days.length : 0;
  const bestEntry = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0];
  const bestAmt = bestEntry ? bestEntry[1] : 0;
  const bestDay = bestEntry ? bestEntry[0] : null;

  // Growth vs previous period
  let growthHtml = '';
  if (period !== 'all' && cutoff) {
    const days_n = +period;
    const d2 = new Date(); d2.setDate(d2.getDate() - days_n * 2);
    const cutoff2 = ymd(d2);
    const prev = rides.filter(r => r.date && r.date >= cutoff2 && r.date < cutoff)
      .reduce((s, r) => s + (r.amount || 0), 0);
    if (prev > 0) {
      const pct = Math.round((total - prev) / prev * 100);
      const up = pct >= 0;
      growthHtml = `<span class="shero-growth ${up ? 'up' : 'down'}">${up ? '↑' : '↓'} ${Math.abs(pct)}% vs vorige periode</span>`;
    }
  }

  // Last 8 weeks bar chart
  const weeks = lastNWeeks(8);
  const weekBars = weeks.map((wStart, i) => {
    const wEnd = new Date(wStart + 'T00:00:00'); wEnd.setDate(wEnd.getDate() + 7);
    const wTotal = rides.filter(r => r.date && r.date >= wStart && r.date < ymd(wEnd))
      .reduce((s, r) => s + (r.amount || 0), 0);
    return { label: wStart.slice(5).replace('-', '/'), value: wTotal, current: i === weeks.length - 1 };
  });
  const barMax = Math.max(...weekBars.map(b => b.value), 1);

  return `
    <div class="stats-section-wrap" style="--i:0">
      <div class="stat-hero">
        <div class="stat-hero-glow"></div>
        <div class="shero-label">Totaal inkomen</div>
        <div class="shero-amount" data-count="${Math.round(total)}" data-money>${fmtMoney(total)}</div>
        ${growthHtml}
        <div class="shero-grid">
          <div class="shero-metric">
            <div class="shero-metric-val" data-count="${Math.round(avgDay)}" data-money>${fmtMoney(Math.round(avgDay))}</div>
            <div class="shero-metric-lbl">Gem. per dag</div>
          </div>
          <div class="shero-metric">
            <div class="shero-metric-val" data-count="${Math.round(bestAmt)}" data-money>${fmtMoney(Math.round(bestAmt))}</div>
            <div class="shero-metric-lbl">Beste dag${bestDay ? `<br><span class="shero-date">${fmtDate(bestDay)}</span>` : ''}</div>
          </div>
          <div class="shero-metric">
            <div class="shero-metric-val plain" data-count="${days.length}">${days.length}</div>
            <div class="shero-metric-lbl">Rijdagen</div>
          </div>
          <div class="shero-metric">
            <div class="shero-metric-val" data-count="${Math.round(total / Math.max(weeks.length, 1))}" data-money>${fmtMoney(Math.round(total / Math.max(weeks.length, 1)))}</div>
            <div class="shero-metric-lbl">Gem. per week</div>
          </div>
        </div>
        <div class="shero-chart-title">Inkomen per week</div>
        <div class="shero-barchart">
          ${weekBars.map((b, i) => `
            <div class="shbc-col" title="${b.label}: ${fmtMoney(b.value)}">
              <div class="shbc-bar-wrap">
                <div class="shbc-bar ${b.current ? 'current' : ''}"
                     style="--h:${Math.max(Math.round(b.value / barMax * 100), b.value > 0 ? 2 : 0)}%;--i:${i}"></div>
              </div>
              <div class="shbc-lbl">${b.label}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>
  `;
}

// ── WEEKDAG ANALYSE ───────────────────────────────────────────────────────────

function renderWeekdayStats(rides, cutoff) {
  const filtered = rides.filter(r => r.date && inRange(r.date, cutoff));
  if (filtered.length < 5) return ''; // Te weinig data

  const WD_LABEL  = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];
  const WD_FULL   = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];

  // Groepeer per weekdag: accumuleer totaal + unieke rijdagen
  const byWd = Array.from({ length: 7 }, () => ({ total: 0, days: new Set() }));
  filtered.forEach(r => {
    const wd = new Date(r.date.slice(0, 10) + 'T12:00:00').getDay(); // 0=zo, 6=za
    byWd[wd].total += r.amount || 0;
    byWd[wd].days.add(r.date.slice(0, 10));
  });

  // Gemiddelde per rijdag
  const stats = byWd.map((b, i) => ({
    wd: i,
    label: WD_LABEL[i],
    full: WD_FULL[i],
    avg: b.days.size > 0 ? b.total / b.days.size : 0,
    cnt: b.days.size,
  }));

  // Volgorde Ma–Zo (i=1..6,0)
  const ordered = [1,2,3,4,5,6,0].map(i => stats[i]);
  const maxAvg  = Math.max(...ordered.map(s => s.avg), 1);
  const best    = ordered.reduce((a, b) => b.avg > a.avg ? b : a, ordered[0]);
  const worked  = ordered.filter(s => s.cnt > 0);
  if (!worked.length) return '';

  return `
    <div class="stats-section-wrap" style="--i:1">
      <div class="stats-card">
        <div class="stats-card-title">Beste rijdagen</div>
        <div class="wd-best-pill">🏆 ${best.full} — gem. ${fmtMoney(Math.round(best.avg))}/dag</div>
        <div class="wd-bars">
          ${ordered.map((s, i) => `
            <div class="wd-col${s.wd === best.wd ? ' wd-best' : ''}${s.cnt === 0 ? ' wd-empty' : ''}"
                 title="${s.full}: ${s.cnt > 0 ? 'gem. ' + fmtMoney(Math.round(s.avg)) + ' (' + s.cnt + ' dagen)' : 'Niet gereden'}">
              <div class="wd-bar-wrap">
                <div class="wd-bar" style="--h:${s.cnt > 0 ? Math.max(Math.round(s.avg / maxAvg * 100), 3) : 0}%;--i:${i}"></div>
              </div>
              <div class="wd-lbl">${s.label}</div>
              ${s.cnt > 0 ? `<div class="wd-amt">${fmtMoney(Math.round(s.avg))}</div>` : '<div class="wd-amt wd-amt-none">—</div>'}
            </div>`).join('')}
        </div>
        <div class="wd-note">Gemiddeld inkomen per dag gewerkt, per weekdag</div>
      </div>
    </div>`;
}

// ── KORAN RING ────────────────────────────────────────────────────────────────

function renderKoranRing(log) {
  const doneSet = new Set(log.map(l => l.date));

  // Current streak
  let streak = 0;
  const cur = new Date();
  while (doneSet.has(ymd(cur))) { streak++; cur.setDate(cur.getDate() - 1); }

  // Longest streak
  let longest = 0, running = 0;
  const sorted = [...doneSet].sort();
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) running = 1;
    else {
      const diff = Math.round((new Date(sorted[i] + 'T12:00:00') - new Date(sorted[i-1] + 'T12:00:00')) / 86400000);
      running = diff === 1 ? running + 1 : 1;
    }
    if (running > longest) longest = running;
  }

  // 30-day completion ratio
  const thirtyAgo = (() => { const d = new Date(); d.setDate(d.getDate() - 30); return ymd(d); })();
  let done30 = 0, total30 = 0;
  for (let d = new Date(thirtyAgo + 'T12:00:00'); d <= new Date(); d.setDate(d.getDate() + 1)) {
    total30++;
    if (doneSet.has(ymd(d))) done30++;
  }
  const ratio = total30 ? done30 / total30 : 0;
  const R = 60, circ = +(2 * Math.PI * R).toFixed(1);
  const targetOffset = +(circ * (1 - ratio)).toFixed(1);

  // Last 7 days dots (Mon–Sun order relative to today)
  const WD = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
  const today = new Date();
  const weekDots = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - 6 + i);
    return { label: WD[(d.getDay() + 6) % 7], done: doneSet.has(ymd(d)) };
  });

  return `
    <div class="stats-section-wrap" style="--i:1">
      <div class="stats-card">
        <div class="stats-card-title">Koran & Hizb</div>
        <div class="koran-ring-layout">
          <div class="koran-ring-wrap">
            <svg class="koran-ring-svg" viewBox="0 0 160 160" width="140" height="140">
              <circle class="sring-track" cx="80" cy="80" r="${R}" />
              <circle class="sring-circle" cx="80" cy="80" r="${R}"
                stroke-dasharray="${circ}"
                stroke-dashoffset="${circ}"
                data-offset="${targetOffset}" />
            </svg>
            <div class="koran-ring-inner">
              <div class="koran-streak-num" data-count="${streak}">${streak}</div>
              <div class="koran-streak-lbl">🔥 streak</div>
            </div>
          </div>
          <div class="koran-ring-stats">
            <div class="kring-pill">
              <div class="kring-val" data-count="${done30}">${done30}</div>
              <div class="kring-lbl">Laatste 30 dagen</div>
            </div>
            <div class="kring-pill">
              <div class="kring-val" data-count="${longest}">${longest}</div>
              <div class="kring-lbl">Beste streak ooit</div>
            </div>
            <div class="kring-pill">
              <div class="kring-val">${Math.round(ratio * 100)}%</div>
              <div class="kring-lbl">Voltooiingsratio</div>
            </div>
          </div>
        </div>
        <div class="koran-week-dots">
          ${weekDots.map(d => `
            <div class="kwd-item">
              <div class="kwd-dot ${d.done ? 'done' : ''}"></div>
              <div class="kwd-lbl">${d.label}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>
  `;
}

// ── ARABISCH MASTERY ──────────────────────────────────────────────────────────

function renderArabicMastery(cards) {
  if (!cards.length) return `
    <div class="stats-section-wrap" style="--i:2">
      <div class="stats-card">
        <div class="stats-card-title">Arabisch</div>
        <div class="stats-empty-state">Nog geen kaarten toegevoegd</div>
      </div>
    </div>`;

  const total    = cards.length;
  const learned  = cards.filter(c => c.repetitions > 0).length;
  const mastered = cards.filter(c => (c.repetitions || 0) >= 3 && (c.ease || 0) >= 2.5).length;
  const todayStr = ymd(new Date());
  const dueNow   = cards.filter(c => c.dueDate && c.dueDate <= todayStr).length;

  const learnPct  = total ? Math.round(learned / total * 100) : 0;
  const masterPct = total ? Math.round(mastered / total * 100) : 0;

  const worst = cards.filter(c => c.ease && (c.repetitions || 0) > 0)
    .sort((a, b) => a.ease - b.ease).slice(0, 5);

  return `
    <div class="stats-section-wrap" style="--i:2">
      <div class="stats-card">
        <div class="stats-card-title">Arabisch</div>
        <div class="arabic-mini-grid">
          <div class="arabic-mini-stat">
            <div class="ams-val" data-count="${total}">${total}</div>
            <div class="ams-lbl">Totaal kaarten</div>
          </div>
          <div class="arabic-mini-stat">
            <div class="ams-val" data-count="${learned}">${learned}</div>
            <div class="ams-lbl">Geleerd</div>
          </div>
          <div class="arabic-mini-stat accent">
            <div class="ams-val" data-count="${dueNow}">${dueNow}</div>
            <div class="ams-lbl">Te herhalen</div>
          </div>
          <div class="arabic-mini-stat">
            <div class="ams-val" data-count="${mastered}">${mastered}</div>
            <div class="ams-lbl">Beheerst</div>
          </div>
        </div>
        <div class="arabic-bars">
          <div class="abar-row">
            <div class="abar-label">Geleerd</div>
            <div class="abar-track">
              <div class="abar-fill" style="--w:${learnPct}%;--i:0"></div>
            </div>
            <div class="abar-pct">${learnPct}%</div>
          </div>
          <div class="abar-row">
            <div class="abar-label">Beheerst</div>
            <div class="abar-track">
              <div class="abar-fill gold" style="--w:${masterPct}%;--i:1"></div>
            </div>
            <div class="abar-pct">${masterPct}%</div>
          </div>
        </div>
        ${worst.length ? `
        <div class="arabic-hard-title">Moeilijkste woorden</div>
        <div class="arabic-hard-list">
          ${worst.map((c, i) => `
            <div class="ahl-row" style="--i:${i}">
              <span class="ahl-arabic">${escapeHTML(c.front || '')}</span>
              <span class="ahl-back">${escapeHTML(c.back || '')}</span>
              <span class="ahl-ease">ease ${(c.ease || 2.5).toFixed(1)}</span>
            </div>`).join('')}
        </div>` : ''}
      </div>
    </div>
  `;
}

// ── TAKEN DONUT ───────────────────────────────────────────────────────────────

function renderTakenDonut(todos, cutoff) {
  const filtered = todos.filter(t => !cutoff || (t.createdAt && t.createdAt.slice(0, 10) >= cutoff));
  const done  = filtered.filter(t => t.done).length;
  const total = filtered.length;
  const pct   = total ? Math.round(done / total * 100) : 0;

  const R = 50, circ = +(2 * Math.PI * R).toFixed(1);
  const dashFill = +((pct / 100) * circ).toFixed(1);

  const tagCounts = {};
  filtered.forEach(t => (t.tags || []).forEach(g => { tagCounts[g] = (tagCounts[g] || 0) + 1; }));
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const tagMax  = topTags.length ? topTags[0][1] : 1;

  const withTime = todos.filter(t => t.done && t.createdAt && t.completedAt);
  const avgDays  = withTime.length
    ? (withTime.reduce((s, t) => s + (new Date(t.completedAt) - new Date(t.createdAt)) / 86400000, 0) / withTime.length).toFixed(1)
    : null;

  return `
    <div class="stats-section-wrap" style="--i:3">
      <div class="stats-card">
        <div class="stats-card-title">Taken</div>
        <div class="taken-donut-layout">
          <div class="donut-wrap">
            <svg class="donut-svg" viewBox="0 0 120 120" width="110" height="110">
              <circle class="donut-track" cx="60" cy="60" r="${R}" />
              <circle class="donut-seg" cx="60" cy="60" r="${R}"
                stroke-dasharray="0 ${circ}"
                data-dash="${dashFill} ${circ}" />
            </svg>
            <div class="donut-center">
              <div class="donut-pct">${pct}%</div>
              <div class="donut-pct-lbl">gedaan</div>
            </div>
          </div>
          <div class="taken-stats-col">
            <div class="taken-stat ok">
              <div class="ts-val" data-count="${done}">${done}</div>
              <div class="ts-lbl">Voltooid</div>
            </div>
            <div class="taken-stat">
              <div class="ts-val" data-count="${total - done}">${total - done}</div>
              <div class="ts-lbl">Open</div>
            </div>
            ${avgDays !== null ? `
            <div class="taken-stat">
              <div class="ts-val">${avgDays}d</div>
              <div class="ts-lbl">Gem. doorlooptijd</div>
            </div>` : ''}
          </div>
        </div>
        ${topTags.length ? `
        <div class="taken-tags-title">Top tags</div>
        <div class="taken-tags-list">
          ${topTags.map(([tag, cnt], i) => `
            <div class="ttl-row" style="--i:${i}">
              <span class="ttl-tag">#${escapeHTML(tag)}</span>
              <div class="ttl-bar-wrap">
                <div class="ttl-bar" style="--w:${Math.round(cnt / tagMax * 100)}%;--i:${i}"></div>
              </div>
              <span class="ttl-cnt">${cnt}</span>
            </div>`).join('')}
        </div>` : ''}
      </div>
    </div>
  `;
}

// ── ACTIVITY GRID ─────────────────────────────────────────────────────────────

function renderActivityGrid(rides) {
  const WEEKS = 12;
  const today = new Date();
  // Start from the Monday of 12 weeks ago
  const dayOfWeek = (today.getDay() + 6) % 7; // 0=Mon
  const startD = new Date(today);
  startD.setDate(today.getDate() - dayOfWeek - (WEEKS - 1) * 7);

  const byDay = {};
  rides.forEach(r => {
    if (r.date) { const dk = r.date.slice(0, 10); byDay[dk] = (byDay[dk] || 0) + (r.amount || 0); }
  });

  const allVals = Object.values(byDay).filter(v => v > 0);
  const maxVal  = allVals.length ? Math.max(...allVals) : 1;

  // grid[w][d] = { key, amt, level }
  const grid = Array.from({ length: WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = new Date(startD);
      date.setDate(startD.getDate() + w * 7 + d);
      const key  = ymd(date);
      const amt  = byDay[key] || 0;
      const future = key > ymd(today);
      const level = future ? -1 : amt === 0 ? 0 : amt < maxVal * .25 ? 1 : amt < maxVal * .5 ? 2 : amt < maxVal * .75 ? 3 : 4;
      return { key, amt, level };
    })
  );

  const WD = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

  return `
    <div class="stats-section-wrap" style="--i:4">
      <div class="stats-card">
        <div class="stats-card-title">Activiteit — 12 weken</div>
        <div class="activity-grid-wrap">
          <div class="activity-wd-labels">
            ${WD.map(l => `<div class="awd-lbl">${l}</div>`).join('')}
          </div>
          <div class="activity-grid">
            ${grid.map((col, w) => `
              <div class="ag-col">
                ${col.map((cell, d) => cell.level < 0
                  ? `<div class="activity-cell future" style="--row:${d};--col:${w}"></div>`
                  : `<div class="activity-cell level-${cell.level}" style="--row:${d};--col:${w}"
                          title="${cell.key}${cell.amt ? ': ' + fmtMoney(cell.amt) : ''}"></div>`
                ).join('')}
              </div>`).join('')}
          </div>
        </div>
        <div class="activity-legend">
          <span class="al-label">Minder</span>
          ${[0, 1, 2, 3, 4].map(l => `<div class="al-cell level-${l}"></div>`).join('')}
          <span class="al-label">Meer</span>
        </div>
      </div>
    </div>
  `;
}
