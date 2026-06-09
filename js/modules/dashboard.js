import { all } from '../db.js';
import { fmtMoney, startOfWeek, startOfMonth, ymd, sameDay, escapeHTML } from '../utils.js';
import { getNumber, getSetting } from '../settings.js';
import { celebrateGoalHit, celebrateStreak } from '../components/celebrate.js';
import { checkNewBadges } from '../achievements.js';
import { toast } from '../components/toast.js';
import { getWeather, codeInfo, rideOpportunities } from '../weather.js';
import { getMascotState, shouldShame, pickShame } from '../mascot.js';
import { detectInsights, goalFeasibility, goalTrajectoryPath } from '../insights.js';
import { initPrivacyToggle } from '../privacy.js';

let weatherAbortCtrl = null;

function weatherIcon(code) {
  const h = new Date().getHours();
  const isNight = h < 6 || h >= 21;

  const cloud = `<path class="wx-cloud" d="M10 33 C6 33 3 29 5 24 C7 19 12 18 16 19 C17 15 21 12 26 12 C32 12 37 16 37 22 C41 22 45 25 45 30 C45 35 41 37 37 37 L10 37 Z" fill="currentColor"/>`;
  const cloudSmall = `<path class="wx-cloud-back" d="M6 32 C3 32 1 29 3 25 C5 21 9 20 12 21 C13 18 16 16 20 16 C25 16 29 19 29 24 C32 24 35 27 35 30 C35 33 32 34 29 34 L6 34 Z" fill="currentColor" opacity=".55"/>`;

  const sunCircle = `<circle class="wx-sun-disk" cx="24" cy="24" r="10" fill="#FFC107"/>`;
  const sunRays = `<g class="wx-sun-rays"><line x1="24" y1="4" x2="24" y2="10" stroke="#FFC107" stroke-width="2.5" stroke-linecap="round"/><line x1="24" y1="38" x2="24" y2="44" stroke="#FFC107" stroke-width="2.5" stroke-linecap="round"/><line x1="4" y1="24" x2="10" y2="24" stroke="#FFC107" stroke-width="2.5" stroke-linecap="round"/><line x1="38" y1="24" x2="44" y2="24" stroke="#FFC107" stroke-width="2.5" stroke-linecap="round"/><line x1="9.5" y1="9.5" x2="13.7" y2="13.7" stroke="#FFC107" stroke-width="2.5" stroke-linecap="round"/><line x1="34.3" y1="34.3" x2="38.5" y2="38.5" stroke="#FFC107" stroke-width="2.5" stroke-linecap="round"/><line x1="38.5" y1="9.5" x2="34.3" y2="13.7" stroke="#FFC107" stroke-width="2.5" stroke-linecap="round"/><line x1="9.5" y1="38.5" x2="13.7" y2="34.3" stroke="#FFC107" stroke-width="2.5" stroke-linecap="round"/></g>`;

  const rainDrops = (cls='wx-raindrop', n=3, c='#6ec9ff') => Array.from({length:n},(_,i)=>`<line class="${cls}" x1="${18+i*7}" y1="40" x2="${16+i*7}" y2="47" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`).join('');
  const snowFlakes = (n=3) => Array.from({length:n},(_,i)=>{const x=16+i*7;return `<g class="wx-snowflake"><line x1="${x}" y1="40" x2="${x}" y2="47" stroke="#9dd9ff" stroke-width="1.5" stroke-linecap="round"/><line x1="${x-3}" y1="42" x2="${x+3}" y2="45" stroke="#9dd9ff" stroke-width="1.5" stroke-linecap="round"/><line x1="${x+3}" y1="42" x2="${x-3}" y2="45" stroke="#9dd9ff" stroke-width="1.5" stroke-linecap="round"/></g>`;}).join('');

  const icons = {
    sunny: `<svg class="wx-icon" viewBox="0 0 48 48" width="48" height="48" fill="none">${sunRays}${sunCircle}</svg>`,
    night: `<svg class="wx-icon" viewBox="0 0 48 48" width="48" height="48" fill="none"><circle class="wx-star" cx="36" cy="10" r="1.8" fill="#e8eef4"/><circle class="wx-star" cx="40" cy="20" r="1.2" fill="#e8eef4"/><circle class="wx-star" cx="34" cy="26" r="1.5" fill="#e8eef4"/><path class="wx-moon" d="M28 8 C18 8 12 16 14 26 C16 36 25 41 35 38 C26 38 18 31 18 22 C18 13 22 8 28 8Z" fill="#9dd9ff"/></svg>`,
    'partly-cloudy': `<svg class="wx-icon" viewBox="0 0 48 48" width="48" height="48" fill="none"><g transform="translate(-10,-8) scale(.65)">${sunRays}${sunCircle}</g><g color="#b0b8c4">${cloud}</g></svg>`,
    'night-cloud': `<svg class="wx-icon" viewBox="0 0 48 48" width="48" height="48" fill="none"><path class="wx-moon" d="M38 6 C32 6 28 11 30 17 C32 23 38 26 44 24 C38 25 33 21 33 16 C33 11 35 6 38 6Z" fill="#9dd9ff" opacity=".7"/><g color="#8892a0">${cloud}</g></svg>`,
    cloudy: `<svg class="wx-icon" viewBox="0 0 48 48" width="48" height="48" fill="none"><g color="#888e9e">${cloudSmall}</g><g color="#b0b8c4">${cloud}</g></svg>`,
    fog: `<svg class="wx-icon" viewBox="0 0 48 48" width="48" height="48" fill="none"><line class="wx-fog-line" x1="6" y1="16" x2="42" y2="16" stroke="#9aa0ad" stroke-width="3" stroke-linecap="round"/><line class="wx-fog-line" x1="10" y1="24" x2="38" y2="24" stroke="#9aa0ad" stroke-width="3" stroke-linecap="round"/><line class="wx-fog-line" x1="14" y1="32" x2="34" y2="32" stroke="#9aa0ad" stroke-width="3" stroke-linecap="round"/></svg>`,
    drizzle: `<svg class="wx-icon" viewBox="0 0 48 56" width="48" height="48" fill="none"><g color="#9aa0ad">${cloud}</g>${rainDrops('wx-drizzle',3,'#9dd9ff')}</svg>`,
    rain: `<svg class="wx-icon" viewBox="0 0 48 56" width="48" height="48" fill="none"><g color="#6e7480">${cloud}</g>${rainDrops('wx-raindrop',3,'#6ec9ff')}</svg>`,
    snow: `<svg class="wx-icon" viewBox="0 0 48 56" width="48" height="48" fill="none"><g color="#9aa0ad">${cloud}</g>${snowFlakes(3)}</svg>`,
    storm: `<svg class="wx-icon" viewBox="0 0 48 56" width="48" height="48" fill="none"><g color="#555e6e">${cloud}</g><path class="wx-lightning" d="M24 36 L20 44 L25 44 L21 52 L30 40 L25 40 Z" fill="#FFC107"/>${rainDrops('wx-raindrop',2,'#6ec9ff')}</svg>`,
  };

  let type;
  if      (code === 0)              type = isNight ? 'night' : 'sunny';
  else if (code <= 2)               type = isNight ? 'night-cloud' : 'partly-cloudy';
  else if (code === 3)              type = 'cloudy';
  else if (code <= 48)              type = 'fog';
  else if (code <= 57)              type = 'drizzle';
  else if (code <= 67)              type = 'rain';
  else if (code <= 77)              type = 'snow';
  else if (code <= 82)              type = 'rain';
  else                              type = 'storm';

  return icons[type] || icons.cloudy;
}

export async function render(container) {
  const [rides, hizb, todos, cards, goals] = await Promise.all([
    all('rides'), all('hizb_log'), all('todos'), all('cards'), all('goals'),
  ]);
  const now = new Date();
  const today = ymd();

  const sum = (arr) => arr.reduce((s, r) => s + Number(r.amount || 0), 0);
  const todayIncome  = sum(rides.filter(r => sameDay(new Date(r.date), now)));
  const weekIncome   = sum(rides.filter(r => new Date(r.date) >= startOfWeek(now)));
  const monthIncome  = sum(rides.filter(r => new Date(r.date) >= startOfMonth(now)));

  const dailyGoal   = getNumber('dailyIncomeGoal');
  const monthlyGoal = getNumber('monthlyIncomeGoal');
  const goalPct      = dailyGoal > 0 ? Math.min(100, Math.round(todayIncome / dailyGoal * 100)) : 0;

  // Netto vandaag berekenen via taxiExpenses
  let dailyCost = 0;
  try {
    const expenses = JSON.parse(localStorage.getItem('taxiExpenses') || '[]');
    const monthly = expenses.reduce((s, e) => {
      const a = Number(e.amount) || 0;
      return s + (e.frequency === 'weekly' ? a * (52 / 12) : a);
    }, 0);
    dailyCost = monthly / 30;
  } catch (_) {}
  const nettoToday = todayIncome - dailyCost;
  const monthGoalPct = monthlyGoal > 0 ? Math.min(100, Math.round(monthIncome / monthlyGoal * 100)) : 0;

  const daysInMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysIntoMonth = now.getDate();
  const daysLeft      = daysInMonth - daysIntoMonth;
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0);
  const lastMonthAtPoint = rides.filter(r => {
    const d = new Date(r.date);
    return d >= lastMonthStart && d <= lastMonthEnd && d.getDate() <= daysIntoMonth;
  }).reduce((s, r) => s + Number(r.amount || 0), 0);
  const monthDelta    = lastMonthAtPoint > 0 ? Math.round((monthIncome - lastMonthAtPoint) / lastMonthAtPoint * 100) : null;
  const projectedMonth = daysIntoMonth > 0 ? Math.round((monthIncome / daysIntoMonth) * daysInMonth) : 0;

  // 30-dagen heatmap
  const last30 = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    const key = ymd(d);
    const total = sum(rides.filter(r => ymd(new Date(r.date)) === key));
    last30.push({ key, day: d.getDate(), total });
  }
  const heatMax = Math.max(1, ...last30.map(d => d.total));

  // Hizb streak
  const todayHizb = hizb.some(h => h.date === today);
  const doneSet   = new Set(hizb.map(h => h.date));
  let streak = 0;
  {
    const STREAK_TTL = 5 * 60_000;
    const lastEntry = hizb.length > 0 ? hizb[hizb.length - 1].date : '';
    let fromCache = false;
    try {
      const raw = localStorage.getItem('streakCache');
      if (raw) {
        const sc = JSON.parse(raw);
        if (sc.logLength === hizb.length && sc.lastEntry === lastEntry && Date.now() - sc.ts < STREAK_TTL) {
          streak = sc.streak; fromCache = true;
        }
      }
    } catch (_) {}
    if (!fromCache) {
      const cur = new Date();
      while (doneSet.has(ymd(cur))) { streak++; cur.setDate(cur.getDate() - 1); }
      try { localStorage.setItem('streakCache', JSON.stringify({ ts: Date.now(), streak, logLength: hizb.length, lastEntry })); } catch (_) {}
    }
  }

  const dueCards   = cards.filter(c => c.dueDate <= today).length;
  const openTodos  = todos.filter(t => !t.done);
  const highTodos  = openTodos.filter(t => t.priority === 'high');
  const todayTodos = openTodos.filter(t => t.dueDate === today);
  const totalRides = sum(rides);
  const taxiGoals  = goals.filter(g => Number(g.taxiPercent) > 0 && Number(g.target) > 0);

  const mascot = await getMascotState();
  const shame  = await shouldShame();

  // Insights (memoized)
  const INSIGHTS_TTL = 600_000;
  let insights = [];
  {
    let fromCache = false;
    try {
      const raw = localStorage.getItem('insightsCache');
      if (raw) {
        const ic = JSON.parse(raw);
        if (ic.rideCount === rides.length && Date.now() - ic.ts < INSIGHTS_TTL) {
          insights = ic.data; fromCache = true;
        }
      }
    } catch (_) {}
    if (!fromCache) {
      insights = detectInsights(rides, hizb);
      try { localStorage.setItem('insightsCache', JSON.stringify({ ts: Date.now(), data: insights, rideCount: rides.length })); } catch (_) {}
    }
  }
  const feas = goalFeasibility(monthIncome, monthlyGoal);
  const traj = monthlyGoal > 0 ? goalTrajectoryPath(rides, monthlyGoal) : null;

  const isEmpty = rides.length === 0 && todos.length === 0 && cards.length === 0;

  const uur      = now.getHours();
  const userName = getSetting('userName') || 'Sofyan';
  const begroeting = uur < 12 ? 'Goedemorgen' : uur < 18 ? 'Goedemiddag' : 'Goedenavond';
  const dagNamen   = ['Zondag','Maandag','Dinsdag','Woensdag','Donderdag','Vrijdag','Zaterdag'];
  const maandNamen = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
  const datumStr   = `${dagNamen[now.getDay()]} ${now.getDate()} ${maandNamen[now.getMonth()]}`;

  const tip = getTip({ rides, hizb, todos, todayHizb, todayIncome, dailyGoal, monthIncome, monthlyGoal, daysLeft, dueCards, now, shame, mascot });

  container.innerHTML = `

    <!-- HERO GREETING -->
    <div class="card dagstart-card">
      <div class="dagstart-top">
        <div>
          <div class="dagstart-greeting">${begroeting}, ${escapeHTML(userName)}</div>
          <div class="dagstart-date">${datumStr}</div>
        </div>
      </div>
      <div class="dagstart-stats">
        <div class="dagstart-stat">
          <div class="dagstart-stat-val blurred-amount">${fmtMoney(todayIncome)}</div>
          <div class="dagstart-stat-lbl">Vandaag</div>
          ${dailyCost > 0 ? `<div class="dagstart-stat-netto blurred-amount" style="color:${nettoToday>=0?'var(--ok)':'var(--danger)'}">netto ${fmtMoney(nettoToday)}</div>` : ''}
        </div>
        <div class="dagstart-stat">
          <div class="dagstart-stat-val" style="color:${todayHizb ? 'var(--ok)' : 'var(--text-faint)'}">${todayHizb ? '✓' : '–'}</div>
          <div class="dagstart-stat-lbl">Hizb</div>
        </div>
        <div class="dagstart-stat">
          <div class="dagstart-stat-val">${openTodos.length}</div>
          <div class="dagstart-stat-lbl">Taken</div>
        </div>
      </div>
    </div>

    ${tip ? `
    <div class="card tip-card">
      <div class="tip-card-header">
        <span class="tip-label">${tip.isShame ? (tip.mascot || '') : 'Tip van de dag'}</span>
        ${!tip.isShame && !tip.smart ? `<button class="tip-next" id="tip-next-btn" title="Volgende tip">›</button>` : ''}
      </div>
      <div class="tip-text" id="tip-text-content">${tip.text}</div>
    </div>` : ''}

    <!-- HADITH VAN DE DAG -->
    ${hadithWidget()}

    <!-- WOORD VAN DE DAG -->
    ${woordWidget(now)}

    <!-- QUICK ACTIONS -->
    <div class="quick-actions">
      <button class="quick-action-btn" data-tab="1">
        <div class="quick-action-icon">💰</div>
        <div class="quick-action-label">Inkomen<span class="quick-action-sub">Vandaag noteren</span></div>
      </button>
      <button class="quick-action-btn" data-tab="5">
        <div class="quick-action-icon">✅</div>
        <div class="quick-action-label">Taken<span class="quick-action-sub">${openTodos.length} open${todayTodos.length ? `, ${todayTodos.length} vandaag` : ''}</span></div>
      </button>
      <button class="quick-action-btn" data-tab="2">
        <div class="quick-action-icon">📖</div>
        <div class="quick-action-label">Koran<span class="quick-action-sub">${todayHizb ? 'Vandaag ✓' : 'Nog open'}</span></div>
      </button>
      <button class="quick-action-btn" data-tab="3">
        <div class="quick-action-icon">📚</div>
        <div class="quick-action-label">Arabisch<span class="quick-action-sub">${dueCards > 0 ? `${dueCards} te herhalen` : 'Alles bij'}</span></div>
      </button>
    </div>

    <!-- KALENDER KNOPPEN -->
    <div class="row" style="margin-bottom:14px;gap:8px">
      <button class="btn secondary" id="open-calendar" style="flex:1;font-size:.875rem">📅 Kalender</button>
      <button class="btn secondary" id="open-yr" style="flex:1;font-size:.875rem">📊 Jaar</button>
    </div>

    <!-- WEGWERKZAAMHEDEN -->
    ${wegWidget()}

    <!-- WEER -->
    <div class="card" id="weather-card">
      <h2 class="card-title">Weer &amp; rittenradar Amsterdam</h2>
      <div id="weather-body"><p class="muted" style="font-size:.875rem">Laden…</p></div>
    </div>

    <!-- INKOMEN VANDAAG -->
    <div class="income-hero">
      <div class="income-hero-label" style="display:flex;justify-content:space-between;align-items:center">
        <span>Inkomen vandaag</span>
        <button class="privacy-toggle" title="Toon bedragen" aria-label="Toon bedragen"></button>
      </div>
      <div class="income-hero-amount big-money blurred-amount">${fmtMoney(todayIncome)}</div>
      ${dailyGoal > 0 ? `
        <div class="income-hero-progress">
          <div class="progress-bar"><div class="progress-fill" style="width:${goalPct}%"></div></div>
        </div>
        <div class="income-hero-meta">
          <span>${goalPct}% van dagdoel</span>
          <span>Doel: <span class="money blurred-amount">${fmtMoney(dailyGoal)}</span></span>
        </div>
      ` : ''}
    </div>

    <!-- MAANDOVERZICHT -->
    <div class="card">
      <h2 class="card-title">Maand — ${maandNamen[now.getMonth()]} ${now.getFullYear()}</h2>
      <div class="big-money blurred-amount">${fmtMoney(monthIncome)}</div>
      ${monthlyGoal > 0 ? `
        <div class="progress-bar" style="margin-bottom:8px"><div class="progress-fill" style="width:${monthGoalPct}%"></div></div>
      ` : ''}
      <div class="kpi-grid" style="margin-bottom:${traj?'12px':'0'}">
        <div class="kpi-card">
          <div class="kpi-label">Week</div>
          <div class="kpi-value blurred-amount">${fmtMoney(weekIncome)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Verwacht</div>
          <div class="kpi-value blurred-amount">${fmtMoney(projectedMonth)}</div>
        </div>
        ${monthDelta !== null ? `<div class="kpi-card">
          <div class="kpi-label">Vs vorige</div>
          <div class="kpi-value ${monthDelta>=0?'ok':'danger'}">${monthDelta>=0?'↑':'↓'}${Math.abs(monthDelta)}%</div>
        </div>` : ''}
      </div>
      ${traj ? `
        <svg viewBox="0 0 ${traj.width} ${traj.height}" style="width:100%;height:${traj.height}px;margin-top:4px;opacity:.9" preserveAspectRatio="none">
          <path d="${traj.idealPath}" stroke="var(--text-faint)" stroke-width="1" stroke-dasharray="4,4" fill="none" opacity=".7"/>
          <path d="${traj.actualPath}" stroke="var(--gold)" stroke-width="2.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
        </svg>
        <div class="muted" style="font-size:.7rem;display:flex;justify-content:space-between;margin-top:2px;opacity:.7"><span>dag 1</span><span>— doel · ━ werkelijk</span><span>dag ${daysInMonth}</span></div>
      ` : ''}
      ${feas && !feas.reached ? `
        <div class="card feasibility ${feas.onTrack ? 'on-track' : 'off-track'}" style="margin-top:12px;padding:12px 14px">
          ${feas.onTrack
            ? `<div style="font-weight:600;font-size:.9rem">Op koers — verwacht: <span class="blurred-amount">${fmtMoney(feas.projectedFinal)}</span></div>
               ${feas.daysNeeded && feas.daysNeeded < feas.daysLeft ? `<div class="muted" style="font-size:.8rem;margin-top:3px">Doel bereikt over ~${feas.daysNeeded} dagen in dit tempo</div>` : ''}`
            : `<div style="font-weight:600;font-size:.9rem">Achter — verwacht: <span class="blurred-amount">${fmtMoney(feas.projectedFinal)}</span> <span class="muted">(<span class="blurred-amount">€${Math.round(feas.shortage)}</span> tekort)</span></div>
               <div class="muted" style="font-size:.8rem;margin-top:3px">Benodigd per dag: <b class="blurred-amount">${fmtMoney(feas.dailyNeeded)}</b> · huidig: <span class="blurred-amount">${fmtMoney(feas.currentDaily)}</span>/dag</div>`}
        </div>` : ''}
    </div>

    <!-- TAKEN PREVIEW -->
    ${highTodos.length || todayTodos.length ? `
    <div class="card">
      <h2 class="card-title">Prioriteiten</h2>
      ${highTodos.slice(0, 4).map(t => `
        <div class="todo-preview-item">
          <span class="todo-priority-dot"></span>
          <div>
            <div class="todo-preview-title">${escapeHTML(t.title)}</div>
            ${t.dueDate ? `<div class="todo-preview-meta">Deadline: ${t.dueDate}</div>` : ''}
            ${t.note ? `<div class="todo-preview-meta">${escapeHTML(t.note.substring(0, 80))}${t.note.length > 80 ? '…' : ''}</div>` : ''}
          </div>
        </div>`).join('')}
      ${todayTodos.length ? `<div class="muted" style="font-size:.82rem;padding-top:4px"><b>${todayTodos.length}</b> taak${todayTodos.length>1?'en':''} gepland voor vandaag</div>` : ''}
      <button class="btn secondary block" style="margin-top:12px;font-size:.85rem" data-tab="5">Alle taken →</button>
    </div>` : ''}

    <!-- KORAN PREVIEW -->
    <div class="module-preview-card">
      <div class="mpc-icon">📖</div>
      <div class="mpc-left">
        <div class="mpc-title">Koran hizb${todayHizb ? ' <span style="color:var(--ok)">✓</span>' : ''}</div>
        <div class="mpc-sub">Streak: <b>${streak} dag${streak===1?'':'en'}</b>${streak>0?' 🔥':''}</div>
      </div>
      <button class="mpc-action${todayHizb?' primary':''}" data-tab="2">${todayHizb?'Open':'Afvinken'}</button>
    </div>

    <!-- ARABISCH PREVIEW -->
    <div class="module-preview-card">
      <div class="mpc-icon">📚</div>
      <div class="mpc-left">
        <div class="mpc-title">Arabisch</div>
        <div class="mpc-sub">${dueCards>0?`<b>${dueCards}</b> kaart${dueCards>1?'en':''} klaar voor herhaling`:'Geen kaarten vandaag — je bent bij'}</div>
      </div>
      <button class="mpc-action${dueCards>0?' primary':''}" data-tab="3">${dueCards>0?'Starten':'Open'}</button>
    </div>

    ${taxiGoals.length ? `
    <div class="card">
      <h2 class="card-title">Spaardoelen</h2>
      ${taxiGoals.map(g => {
        const saved = totalRides * (Number(g.taxiPercent) / 100);
        const pct   = Math.min(100, Math.round(saved / Number(g.target) * 100));
        const remaining = Math.max(0, Number(g.target) - saved);
        return `
          <div style="margin-bottom:14px">
            <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">
              <b style="font-size:.95rem">${escapeHTML(g.title)}</b>
              <span class="muted" style="font-size:.8rem">${pct}%</span>
            </div>
            <div class="muted" style="font-size:.8rem;margin-bottom:6px"><span class="blurred-amount">${fmtMoney(saved)}</span> van <span class="blurred-amount">${fmtMoney(Number(g.target))}</span>${remaining>0?` · nog <span class="blurred-amount">${fmtMoney(remaining)}</span>`:' · behaald 🎉'}</div>
            <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
          </div>`;
      }).join('')}
    </div>` : ''}

    <!-- 30-DAGEN HEATMAP -->
    <div class="card">
      <h2 class="card-title">Inkomen — laatste 30 dagen</h2>
      <div class="heatmap">
        ${last30.map(d => {
          const i = d.total > 0 ? Math.max(0.18, d.total / heatMax) : 0;
          return `<div class="heat-cell" style="${i>0?`background:linear-gradient(135deg,rgba(212,176,107,${i.toFixed(2)}),rgba(212,176,107,${(i*.6).toFixed(2)}))`:''}background-attachment:local" title="${d.key}: ${fmtMoney(d.total)}"></div>`;
        }).join('')}
      </div>
      <div class="heat-legend" style="margin-top:6px"><span class="muted" style="font-size:.72rem">minder</span><span class="heat-spec"></span><span class="muted" style="font-size:.72rem">meer</span></div>
    </div>

    ${insights.length ? `
    <div class="card">
      <h2 class="card-title">Patroonanalyse</h2>
      ${insights.map(i => `<div class="insight-row"><span class="insight-icon">${i.icon}</span><span>${i.text}</span></div>`).join('')}
    </div>` : ''}

    ${isEmpty ? `
    <div class="card empty-cta">
      <h3>Welkom bij je dashboard 👋</h3>
      <p class="muted">Begin met het bijhouden van je eerste inkomen, hizb of taak via de tabs onderaan.</p>
    </div>` : ''}
  `;

  loadWeather(container);
  container.querySelector('#open-calendar').onclick = () => window.openCalendar && window.openCalendar();
  container.querySelector('#open-yr').onclick = () => window.openYearReview && window.openYearReview();

  container.querySelectorAll('[data-tab]').forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.dataset.tab);
      const tabs = document.querySelectorAll('.tab');
      if (tabs[idx]) tabs[idx].click();
    };
  });

  // Tip next button
  const tipNextBtn = container.querySelector('#tip-next-btn');
  if (tipNextBtn) {
    let tipIdx = 0;
    tipNextBtn.onclick = () => {
      const content = container.querySelector('#tip-text-content');
      if (!content) return;
      content.classList.add('tip-animating-out');
      setTimeout(() => {
        tipIdx = (tipIdx + 1) % TIP_POOL.length;
        content.textContent = TIP_POOL[tipIdx];
        content.classList.remove('tip-animating-out');
        content.classList.add('tip-animating-in');
        setTimeout(() => content.classList.remove('tip-animating-in'), 300);
      }, 250);
    };
  }

  if (dailyGoal > 0 && todayIncome >= dailyGoal) {
    const lastHit = localStorage.getItem('lastGoalHitDate');
    if (lastHit !== today) {
      localStorage.setItem('lastGoalHitDate', today);
      setTimeout(() => celebrateGoalHit(), 400);
    }
  }
  if ([7, 30, 100].includes(streak)) {
    const key = 'streakCelebrated-' + streak;
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, today);
      setTimeout(() => celebrateStreak(), 500);
    }
  }
  checkNewBadges().then(newOnes => {
    newOnes.forEach((b, i) => {
      setTimeout(() => toast(`${b.emoji} <b>Badge:</b> ${b.name}`, { type: 'ok', duration: 5000 }), 800 + i * 1200);
    });
  });
  initPrivacyToggle(container);
}

const TIP_POOL = [
  'Amsterdam Centraal, Schiphol en het Leidseplein zijn de meest productieve ophaallocaties tijdens piekuren.',
  'Een vriendelijke begroeting en een schoon voertuig leveren betere beoordelingen op en meer fooien.',
  'Consistentie wint van pieken. Elke dag rijden, ook kort, bouwt een stabiel maandinkomen op.',
  'Controleer je weekinkomsten elke vrijdag en pas je planning aan op basis van trends.',
  'Stel een spaardoel in om automatisch een deel van elke rit opzij te zetten voor de toekomst.',
  'De vroege ochtend tussen zes en negen uur brengt betrouwbare woon-werkritten met goede beoordelingen.',
  'Vrijdagnacht en zaterdagnacht genereren de hoogste tarieven van de week in Amsterdam.',
  'Regen verhoogt de vraag naar ritten significant — plan je diensten rond weerberichten.',
  'Schiphol ritten zijn langer en betrouwbaarder. Wacht bij Terminal 2 voor de beste kans.',
  'De Pijp en Jordaan genereren veel avondritten richting het centrum en hotels.',
  'Wissel je route regelmatig om nieuwe ophaalgebieden te ontdekken buiten de standaard zones.',
  'Bewaar altijd een fles water voor passagiers — kleine moeite, grote impact op de beoordeling.',
  'Plan je pauze buiten piekuren om inkomen te maximaliseren en vermoeidheid te minimaliseren.',
  'Bijhouden hoeveel kilometer je rijdt per euro inkomen helpt je efficiëntie verbeteren.',
  'Een goed nachtritme — vroeg rijden, op tijd stoppen — voorkomt langdurige vermoeidheid.',
  'Beoordelingen boven 4.8 geven prioriteit bij de ritaanbieding in de meeste apps.',
  'Evenementen in de ArenA, Ziggo Dome en RAI trekken grote pieken in ritaanvragen.',
  'Rustige momenten in de auto zijn ideaal voor korte Arabische of Koran herhalingen.',
  'Noteer je inkomen direct na elke dienst — geheugen vervaagt snel aan het einde van de dag.',
  'Wie zijn doelen opschrijft, haalt ze twee keer zo vaak als wie ze alleen in zijn hoofd bewaart.',
];

function getTip({ rides, hizb, todos, todayHizb, todayIncome, dailyGoal, monthIncome, monthlyGoal, daysLeft, dueCards, now, shame, mascot }) {
  if (shame) return { text: pickShame(), isShame: true, mascot: mascot.e };

  const dag = now.getDay();
  const uur = now.getHours();
  const smart = [];

  if (dailyGoal > 0 && todayIncome < dailyGoal * 0.5 && uur >= 13 && uur <= 20)
    smart.push(`Nog ${fmtMoney(dailyGoal - todayIncome)} te gaan voor het dagdoel. Het spitsuur loopt nu — zet er een tandje bij.`);

  if (!todayHizb && uur >= 18)
    smart.push('Hizb van vandaag staat nog open. Pak een paar minuten rust tussen de ritten.');

  if (dueCards > 0)
    smart.push(`${dueCards} Arabische kaart${dueCards > 1 ? 'en staan' : ' staat'} klaar voor herhaling. Vijf minuten nu verdubbelt de retentie.`);

  if (dag === 5 && uur >= 16)
    smart.push('Vrijdagavond is traditioneel druk in Amsterdam. Overweeg tot na middernacht te rijden.');

  if (dag === 6 && uur >= 20)
    smart.push('Zaterdagnacht brengt de hoogste tarieven van de week in Amsterdam.');

  if (monthlyGoal > 0 && daysLeft > 0) {
    const needed = monthlyGoal - monthIncome;
    if (needed > 0 && needed / daysLeft > (dailyGoal || 200) * 1.3)
      smart.push(`Nog ${daysLeft} dagen, ${fmtMoney(needed / daysLeft)}/dag nodig. Huidig gemiddelde ligt lager — plan extra uren.`);
  }

  const todayDue = todos.filter(t => !t.done && t.dueDate === ymd(now));
  if (todayDue.length > 0)
    smart.push(`${todayDue.length} taak${todayDue.length > 1 ? 'en staan' : ' staat'} gepland voor vandaag.`);

  if (smart.length > 0) return { text: smart[0], isShame: false, smart: true };

  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  return { text: TIP_POOL[dayOfYear % TIP_POOL.length], isShame: false };
}

function hadithWidget() {
  // Vertalingen zijn eigen, getrouwe weergaven van de (publieke) Arabische matn,
  // geverifieerd tegen sunnah.com. Niets weggelaten; Arabisch volledig.
  const HADITHS = [
    { ar: 'مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ', nl: 'Wie in Allah en de Laatste Dag gelooft, laat hem goed spreken of zwijgen.', bron: 'Overgeleverd door al-Bukhari · nr. 6018' },
    { ar: 'تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ صَدَقَةٌ', nl: 'Je glimlach naar je broeder is een daad van liefdadigheid.', bron: 'Overgeleverd door at-Tirmidhi · nr. 1956' },
    { ar: 'لَيْسَ الشَّدِيدُ بِالصُّرَعَةِ، إِنَّمَا الشَّدِيدُ الَّذِي يَمْلِكُ نَفْسَهُ عِنْدَ الْغَضَبِ', nl: 'De sterke is niet degene die goed worstelt; de sterke is degene die zichzelf beheerst in woede.', bron: 'Overgeleverd door al-Bukhari · nr. 6114' },
    { ar: 'مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ طَرِيقًا إِلَى الْجَنَّةِ', nl: 'Wie een weg bewandelt op zoek naar kennis, voor hem maakt Allah een weg naar het Paradijs gemakkelijk.', bron: 'Overgeleverd door Muslim · nr. 2699' },
    { ar: 'إِنَّ اللَّهَ يُحِبُّ إِذَا عَمِلَ أَحَدُكُمْ عَمَلًا أَنْ يُتْقِنَهُ', nl: 'Allah houdt ervan dat wanneer een van jullie een werk verricht, hij het met zorg en bekwaamheid doet.', bron: 'Overgeleverd door al-Bayhaqi · Shu\'ab al-Iman' },
    { ar: 'لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ', nl: 'Niemand van jullie gelooft (volledig) totdat hij voor zijn broeder wenst wat hij voor zichzelf wenst.', bron: 'Overgeleverd door al-Bukhari · nr. 13' },
    { ar: 'مَنْ أَصْبَحَ مِنْكُمْ آمِنًا فِي سِرْبِهِ مُعَافًى فِي جَسَدِهِ عِنْدَهُ قُوتُ يَوْمِهِ فَكَأَنَّمَا حِيزَتْ لَهُ الدُّنْيَا', nl: 'Wie van jullie veilig wakker wordt in zijn huis, gezond van lichaam, met voedsel voor zijn dag — het is alsof de hele wereld voor hem is verzameld.', bron: 'Overgeleverd door at-Tirmidhi · nr. 2346' },
    { ar: 'كُنْ فِي الدُّنْيَا كَأَنَّكَ غَرِيبٌ أَوْ عَابِرُ سَبِيلٍ', nl: 'Wees in deze wereld alsof je een vreemdeling bent of een reiziger op doortocht.', bron: 'Overgeleverd door al-Bukhari · nr. 6416' },
    { ar: 'مَنْ لَمْ يَشْكُرِ النَّاسَ لَمْ يَشْكُرِ اللَّهَ', nl: 'Wie de mensen niet dankt, dankt Allah niet.', bron: 'Overgeleverd door at-Tirmidhi · nr. 1954' },
    { ar: 'لَا ضَرَرَ وَلَا ضِرَارَ', nl: 'Er is geen schade toebrengen en geen schade vergelden met schade.', bron: 'Overgeleverd door Ibn Majah · nr. 2340' },
    { ar: 'اعْقِلْهَا وَتَوَكَّلْ', nl: 'Bind haar (je kameel) vast én vertrouw op Allah.', bron: 'Overgeleverd door at-Tirmidhi · nr. 2517' },
    { ar: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ', nl: 'De beste van jullie is wie de Koran leert en hem onderwijst.', bron: 'Overgeleverd door al-Bukhari · nr. 5027' },
    { ar: 'يَسِّرُوا وَلَا تُعَسِّرُوا وَبَشِّرُوا وَلَا تُنَفِّرُوا', nl: 'Maak het gemakkelijk en maak het niet moeilijk; breng goed nieuws en jaag mensen niet weg.', bron: 'Overgeleverd door al-Bukhari · nr. 69' },
    { ar: 'مَنْ صَمَتَ نَجَا', nl: 'Wie zwijgt, is behouden.', bron: 'Overgeleverd door at-Tirmidhi · nr. 2501' },
    { ar: 'الرَّاحِمُونَ يَرْحَمُهُمُ الرَّحْمَنُ، ارْحَمُوا مَنْ فِي الأَرْضِ يَرْحَمْكُمْ مَنْ فِي السَّمَاءِ', nl: 'De barmhartigen, met hen is de Erbarmer barmhartig. Wees barmhartig voor wie op aarde zijn, dan is Hij die in de hemel is barmhartig voor jullie.', bron: 'Overgeleverd door at-Tirmidhi · nr. 1924' },
    { ar: 'أَعْطُوا الأَجِيرَ أَجْرَهُ قَبْلَ أَنْ يَجِفَّ عَرَقُهُ', nl: 'Geef de arbeider zijn loon voordat zijn zweet opdroogt.', bron: 'Overgeleverd door Ibn Majah · nr. 2443' },
    { ar: 'الْمُؤْمِنُ الْقَوِيُّ خَيْرٌ وَأَحَبُّ إِلَى اللَّهِ مِنَ الْمُؤْمِنِ الضَّعِيفِ وَفِي كُلٍّ خَيْرٌ', nl: 'De sterke gelovige is beter en geliefder bij Allah dan de zwakke gelovige — en in beide is er goed.', bron: 'Overgeleverd door Muslim · nr. 2664' },
    { ar: 'ادْعُوا اللَّهَ وَأَنْتُمْ مُوقِنُونَ بِالإِجَابَةِ', nl: 'Smeek Allah terwijl jullie overtuigd zijn van verhoring.', bron: 'Overgeleverd door at-Tirmidhi · nr. 3479' },
    { ar: 'إِنَّ اللَّهَ رَفِيقٌ يُحِبُّ الرِّفْقَ فِي الأَمْرِ كُلِّهِ', nl: 'Allah is zachtmoedig en houdt van zachtheid in alle zaken.', bron: 'Overgeleverd door al-Bukhari · nr. 6528' },
    { ar: 'لَا يَشْكُرُ اللَّهَ مَنْ لَا يَشْكُرُ النَّاسَ', nl: 'Wie de mensen niet dankt, dankt Allah niet.', bron: 'Overgeleverd door Abu Dawud · nr. 4811' },
    { ar: 'خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ', nl: 'De beste mens is degene die het meest van nut is voor de mensen.', bron: 'Overgeleverd door at-Tabarani · al-Mu\'jam al-Awsat' },
    { ar: 'اجْتَمِعُوا عَلَى طَعَامِكُمْ وَاذْكُرُوا اسْمَ اللَّهِ عَلَيْهِ يُبَارَكْ لَكُمْ فِيهِ', nl: 'Komt samen bij jullie eten en noemt de naam van Allah erover, dan wordt het voor jullie gezegend.', bron: 'Overgeleverd door Abu Dawud · nr. 3764' },
    { ar: 'مَا نَقَصَتْ صَدَقَةٌ مِنْ مَالٍ وَمَا زَادَ اللَّهُ عَبْدًا بِعَفْوٍ إِلَّا عِزًّا', nl: 'Liefdadigheid vermindert geen bezit, en Allah vermeerdert een dienaar die vergeeft slechts in aanzien.', bron: 'Overgeleverd door Muslim · nr. 2588' },
    { ar: 'مَا يُصِيبُ الْمُسْلِمَ مِنْ نَصَبٍ وَلَا وَصَبٍ وَلَا هَمٍّ وَلَا حُزْنٍ وَلَا أَذًى وَلَا غَمٍّ حَتَّى الشَّوْكَةِ يُشَاكُهَا إِلَّا كَفَّرَ اللَّهُ بِهَا مِنْ خَطَايَاهُ', nl: 'Geen vermoeidheid, ziekte, zorg, verdriet, leed of benauwdheid treft een moslim — zelfs niet een doorn die hem prikt — of Allah wist daarmee een deel van zijn fouten uit.', bron: 'Overgeleverd door al-Bukhari · nr. 5641' },
    { ar: 'سَدِّدُوا وَقَارِبُوا وَأَبْشِرُوا، فَإِنَّهُ لَا يُدْخِلُ أَحَدًا الْجَنَّةَ عَمَلُهُ، قَالُوا: وَلَا أَنْتَ يَا رَسُولَ اللَّهِ؟ قَالَ: وَلَا أَنَا، إِلَّا أَنْ يَتَغَمَّدَنِيَ اللَّهُ بِمَغْفِرَةٍ وَرَحْمَةٍ', nl: 'Wees standvastig en gematigd, en verheug je: niemand wordt door zijn daden het Paradijs binnengelaten. Zij vroegen: "Ook u niet, o Boodschapper van Allah?" Hij zei: "Ook ik niet, tenzij Allah mij omhult met vergeving en barmhartigheid."', bron: 'Overgeleverd door al-Bukhari · nr. 6467' },
    { ar: 'مَنْ يُرِدِ اللَّهُ بِهِ خَيْرًا يُفَقِّهْهُ فِي الدِّينِ', nl: 'Voor wie Allah het goede wenst, schenkt Hij begrip van de religie.', bron: 'Overgeleverd door al-Bukhari · nr. 71' },
    { ar: 'الْمَرْءُ عَلَى دِينِ خَلِيلِهِ فَلْيَنْظُرْ أَحَدُكُمْ مَنْ يُخَالِلُ', nl: 'De mens volgt het geloof van zijn boezemvriend; laat ieder van jullie dus opletten met wie hij bevriend raakt.', bron: 'Overgeleverd door Abu Dawud · nr. 4833' },
    { ar: 'أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ', nl: 'De geliefdste daden bij Allah zijn de meest standvastige, ook al zijn ze klein.', bron: 'Overgeleverd door al-Bukhari · nr. 6465' },
    { ar: 'إِنَّ مِنْ أَكْمَلِ الْمُؤْمِنِينَ إِيمَانًا أَحْسَنُهُمْ خُلُقًا وَأَلْطَفُهُمْ بِأَهْلِهِ', nl: 'Tot de gelovigen met het meest volledige geloof behoort wie het beste karakter heeft en het zachtaardigst is voor zijn gezin.', bron: 'Overgeleverd door at-Tirmidhi · nr. 2612' },
  ];
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  const h = HADITHS[dayOfYear % HADITHS.length];
  return `
    <div class="card hadith-card">
      <h2 class="card-title">Hadith van de dag</h2>
      <div class="hadith-arabic">${h.ar}</div>
      <div class="hadith-text">${escapeHTML(h.nl)}</div>
      <div class="hadith-source">${escapeHTML(h.bron)}</div>
    </div>`;
}

function woordWidget(now) {
  const WOORDEN = [
    { w: 'ambivalent', def: 'Je voelt twee dingen tegelijk: je wilt het wel én niet.', tip: 'Ambi = twee kanten — je wordt twee kanten op getrokken.' },
    { w: 'recalcitrant', def: 'Dwars en koppig; doet niet mee en werkt tegen.', tip: 'Denk aan iemand die niet meebeweegt, wat je ook zegt.' },
    { w: 'sereen', def: 'Heel rustig en kalm, zonder onrust.', tip: 'Denk aan een serene zee — vlak, stil, geen golven.' },
    { w: 'laconiek', def: 'Kort en droog; gebruikt weinig woorden.', tip: 'Veel zeggen in heel weinig woorden, zonder drukte.' },
    { w: 'pertinent', def: 'Precies over het onderwerp; raakt de kern.', tip: 'Als een pijl die recht in de roos gaat.' },
    { w: 'tentatief', def: 'Voorzichtig en nog niet zeker; een eerste poging.', tip: 'Een "tent" is tijdelijk — zo ook een tentatief plan.' },
    { w: 'eloquent', def: 'Spreekt mooi en vlot; goed met woorden.', tip: 'Denk aan iemand die makkelijk en helder praat.' },
    { w: 'pragmatisch', def: 'Praktisch; kijkt naar wat werkt, niet naar regels.', tip: '"Pragma" = daad in het Grieks. Doen wat werkt.' },
    { w: 'redundant', def: 'Te veel; meer dan nodig is.', tip: 'Iets wordt dubbel herhaald, dat hoeft niet.' },
    { w: 'sceptisch', def: 'Twijfelt; gelooft iets niet zomaar.', tip: 'Eerst zien, dan geloven.' },
    { w: 'frugaal', def: 'Zuinig; leeft eenvoudig met weinig.', tip: 'Geen luxe, alleen wat echt nodig is.' },
    { w: 'altruïstisch', def: 'Onzelfzuchtig; doet dingen voor anderen.', tip: '"Altri" = anderen. Je denkt eerst aan een ander.' },
    { w: 'arbitrair', def: 'Willekeurig; zonder duidelijke reden gekozen.', tip: 'Zomaar gekozen, niet volgens een vaste regel.' },
    { w: 'bevlogen', def: 'Vol vuur en enthousiasme voor iets.', tip: 'Bevlogen = je vliegt van enthousiasme.' },
    { w: 'diffuus', def: 'Vaag en verspreid; geen duidelijke vorm.', tip: 'Diffuus licht gaat alle kanten op — geen bundel.' },
    { w: 'eminent', def: 'Heel goed; steekt boven anderen uit.', tip: 'Iemand die echt bovenaan staat in zijn vak.' },
    { w: 'fatalistisch', def: 'Denkt dat alles toch al vastligt; laat het lot beslissen.', tip: '"Fata" = lot. Je laat het gewoon gebeuren.' },
    { w: 'hachelijk', def: 'Gevaarlijk en onzeker; een lastige situatie.', tip: 'Je situatie hangt aan een dun draadje.' },
    { w: 'intuïtief', def: 'Op gevoel; je weet het zonder na te denken.', tip: 'Je voelt gewoon dat iets klopt.' },
    { w: 'ironisch', def: 'Je zegt het tegenovergestelde van wat je bedoelt.', tip: 'Zoals "lekker weer" zeggen als het regent.' },
    { w: 'latent', def: 'Wel aanwezig, maar nog niet zichtbaar; sluimert.', tip: 'Het zit er al, het wacht alleen nog.' },
    { w: 'naïef', def: 'Goedgelovig; gelooft iets te snel door weinig ervaring.', tip: 'Als een kind dat nog niet gewaarschuwd is.' },
    { w: 'paradoxaal', def: 'Lijkt tegenstrijdig, maar klopt toch.', tip: 'Bijvoorbeeld: "minder is meer".' },
    { w: 'provocatief', def: 'Uitdagend; bedoeld om een reactie uit te lokken.', tip: 'Je port iemand op om te zien wat er gebeurt.' },
    { w: 'retorisch', def: 'Een vraag die geen antwoord verwacht.', tip: 'Zoals: "Wil iedereen soms ontslagen worden?"' },
    { w: 'scrupuleus', def: 'Heel nauwkeurig; let op elk klein detail.', tip: 'Je voelt elk klein steentje in je schoen.' },
    { w: 'triviaal', def: 'Onbelangrijk en alledaags.', tip: 'Iets kleins waar je niet wakker van ligt.' },
    { w: 'volatiel', def: 'Wisselt snel en onverwacht.', tip: '"Volare" = vliegen. Het kan zo omslaan.' },
    { w: 'contraproductief', def: 'Werkt tegen je doel in; bereikt het tegenovergestelde.', tip: '"Contra" = tegen. Je werkt tégen jezelf.' },
    { w: 'discrepantie', def: 'Een verschil tussen twee dingen die gelijk zouden moeten zijn.', tip: 'Twee dingen die niet op elkaar aansluiten.' },
    { w: 'hypocrisie', def: 'Doen alsof; anders zijn dan je je voordoet.', tip: 'Het ene zeggen en het andere doen.' },
    { w: 'illusoir', def: 'Het lijkt echt, maar is het niet.', tip: 'Een truc die echt lijkt maar dat niet is.' },
    { w: 'juxtapositie', def: 'Twee dingen vlak naast elkaar zetten om het verschil te zien.', tip: '"Juxta" = naast. Naast elkaar valt het contrast op.' },
    { w: 'manifest', def: 'Heel duidelijk te zien; niet te missen.', tip: 'Het ligt er zo dik bovenop.' },
    { w: 'nuanceren', def: 'Kleine verschillen aanbrengen; niet alles zwart-wit zien.', tip: 'Niet álles, maar "het ligt eraan".' },
    { w: 'paradigma', def: 'Een vaste manier van kijken naar iets.', tip: 'De bril waardoor je naar de wereld kijkt.' },
    { w: 'reciprook', def: 'Over en weer; van beide kanten gelijk.', tip: 'Voor wat hoort wat.' },
    { w: 'subsidiair', def: 'Als extra steun; van minder belang.', tip: 'Het staat klaar voor het geval dat.' },
    { w: 'tangentieel', def: 'Raakt het onderwerp maar net; niet de kern.', tip: 'Je zit er net naast, niet middenin.' },
    { w: 'unaniem', def: 'Iedereen is het er helemaal over eens.', tip: '"Una" = één. Iedereen met één stem.' },
    { w: 'verbatim', def: 'Woord voor woord; precies zoals het gezegd is.', tip: '"Verba" = woorden. Elke letter klopt.' },
    { w: 'aforisme', def: 'Een korte, slimme uitspraak met een waarheid.', tip: 'Een spreuk die in één zin raak is.' },
    { w: 'apathisch', def: 'Lusteloos; geen gevoel of interesse.', tip: '"A" = zonder, "pathos" = gevoel. Geen reactie.' },
    { w: 'catharsis', def: 'Opluchting; je voelt je bevrijd na veel emotie.', tip: 'Even goed huilen en je voelt je lichter.' },
    { w: 'dogmatisch', def: 'Houdt strak vast aan regels; staat geen twijfel toe.', tip: '"Dogma" = leer. Het is zo, en daarmee uit.' },
    { w: 'eclectisch', def: 'Pikt het beste uit verschillende bronnen.', tip: 'Je mixt het beste van overal.' },
    { w: 'faceteus', def: 'Grappig bedoeld, soms net iets te brutaal.', tip: 'Een grapje dat soms net te ver gaat.' },
    { w: 'gregair', def: 'Houdt van gezelschap; zoekt graag de groep op.', tip: '"Grex" = kudde. Je blijft graag bij de groep.' },
    { w: 'inherent', def: 'Hoort er van nature bij; zit erin.', tip: 'Het zit er ingebakken, hoort er gewoon bij.' },
    { w: 'oordeelkundig', def: 'Verstandig; kan goed beoordelen.', tip: 'Je weegt goed af voordat je beslist.' },
    { w: 'kaleidoscopisch', def: 'Steeds wisselend en kleurrijk.', tip: 'Als een caleidoscoop: bij elke draai een nieuw beeld.' },
    { w: 'lacune', def: 'Een gat; een stuk dat ontbreekt.', tip: 'Er mist een stukje.' },
    { w: 'malafide', def: 'Met slechte bedoelingen; niet te vertrouwen.', tip: '"Mala" = slecht. Kwade bedoeling.' },
    { w: 'nominaal', def: 'Alleen in naam; niet echt in de praktijk.', tip: 'Je hebt de titel, maar niet de macht.' },
    { w: 'onbewust', def: 'Zonder dat je het doorhebt.', tip: 'Je doet het vanzelf, zonder erbij na te denken.' },
    { w: 'pedant', def: 'Betweterig; let te veel op regeltjes.', tip: 'De schoolmeester die alles beter weet.' },
    { w: 'quintessentieel', def: 'De pure kern; het meest wezenlijke van iets.', tip: 'Waar het echt om draait, en niets anders.' },
    { w: 'reprimande', def: 'Een officiële uitbrander; een berisping.', tip: 'Je krijgt er flink van langs, formeel.' },
    { w: 'stoïcijns', def: 'Kalm en onaangedaan, ook als het zwaar is.', tip: 'Wat er ook gebeurt, je blijft rustig.' },
    { w: 'tactvol', def: 'Met gevoel; houdt rekening met de ander.', tip: 'Iets moeilijks zeggen zonder te kwetsen.' },
    { w: 'unilateraal', def: 'Eenzijdig; door één partij beslist.', tip: '"Uni" = één. Eén kant beslist alleen.' },
    { w: 'vigilant', def: 'Waakzaam; let steeds goed op.', tip: '"Vigilare" = waken. Altijd alert.' },
    { w: 'wankel', def: 'Onvast en wiebelig; kan zo omvallen.', tip: 'Een wankele basis valt makkelijk om.' },
    { w: 'xenofoob', def: 'Bang voor of afkerig van vreemden.', tip: '"Xenos" = vreemdeling, "phobos" = angst.' },
    { w: 'zelfgenoegzaam', def: 'Te tevreden met jezelf; vindt zichzelf al goed genoeg.', tip: 'Je leunt achterover en wilt niet meer leren.' },
  ];
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  const w = WOORDEN[dayOfYear % WOORDEN.length];
  return `
    <div class="card woord-card">
      <h2 class="card-title">Woord van de dag</h2>
      <div class="woord-word">${escapeHTML(w.w)}</div>
      <div class="woord-def">${escapeHTML(w.def)}</div>
      <div class="woord-bridge">${escapeHTML(w.tip)}</div>
    </div>`;
}

function wegWidget() {
  const now2 = new Date();
  const h = now2.getHours();
  const isNacht = h >= 22 || h < 6;
  const isDiWo  = [2, 3].includes(now2.getDay());

  // Sluitingsdatum A9: maandag 8 juni 2026 05:00
  const a9Einde = new Date('2026-06-08T05:00:00');
  const a9Actief = now2 < a9Einde;

  const items = [
    ...(a9Actief ? [{
      road: 'A9',
      label: 'Gesloten',
      info: 'Beide richtingen gesloten tussen knooppunt Badhoevedorp en Holendrecht. Omleiding via A2, A10 en A4. Extra reistijd 10–30 min.',
      type: 'closed',
      geldigTm: '8 juni 05:00',
    }] : []),
    { road: 'Coentunnel', label: 'Werkzaamheden', info: `Nachtelijke werkzaamheden — één rijstrook dicht.${isNacht ? ' Controleer actuele situatie.' : ''}`, type: 'work' },
    { road: 'IJ-tunnel', label: isDiWo && isNacht ? 'Gesloten' : 'Werkzaamheden', info: `Periodieke nachtsluitingen.${isDiWo && isNacht ? ' Nu mogelijk gesloten — gebruik Piet Heintunnel.' : ' Controleer actueel.'}`, type: isDiWo && isNacht ? 'closed' : 'work' },
    { road: 'A10', label: 'Werkzaamheden', info: 'Onderhoudswerkzaamheden diverse trajecten zomer 2026. Controleer actueel.', type: 'work' },
    { road: 'A1', label: 'OK', info: 'Geen grote afsluitingen.', type: 'ok' },
    { road: 'A2', label: 'OK', info: 'Geen grote afsluitingen.', type: 'ok' },
    { road: 'A4', label: 'OK', info: 'Geen grote afsluitingen.', type: 'ok' },
  ];

  const hasBig = items.some(i => i.type === 'closed');
  const bigItems  = items.filter(i => i.type === 'closed');
  const workItems = items.filter(i => i.type === 'work');
  const okItems   = items.filter(i => i.type === 'ok');

  const labelFor = { closed: 'Gesloten', detour: 'Omrijden', work: 'Werkzaamheden', ok: 'OK' };

  const row = item => `
    <div class="weginfo-item">
      <span class="weginfo-road ${item.type}">${labelFor[item.type]}</span>
      <div>
        <div class="weginfo-item-road">${escapeHTML(item.road)}${item.geldigTm ? ` <span class="weginfo-validity">t/m ${escapeHTML(item.geldigTm)}</span>` : ''}</div>
        <div class="weginfo-item-info">${escapeHTML(item.info)}</div>
      </div>
    </div>`;

  return `
    <div class="card weginfo-card">
      <h2 class="card-title">Weginfo Amsterdam</h2>
      <div class="weginfo-meta">Bijgewerkt: 7 juni 2026 &nbsp;·&nbsp; <a href="https://www.anwb.nl/verkeer/amsterdam" target="_blank" rel="noopener" class="weginfo-meta-link">actuele info ANWB →</a></div>
      ${!hasBig ? `<div class="weginfo-clear">Geen grote afsluitingen op de snelwegen rondom Amsterdam</div>` : ''}
      ${bigItems.map(row).join('')}
      ${workItems.length ? `<details class="weginfo-details"><summary>Werkzaamheden (${workItems.length})</summary>${workItems.map(row).join('')}</details>` : ''}
      ${okItems.length ? `<details class="weginfo-details"><summary>Overige snelwegen (${okItems.length})</summary>${okItems.map(row).join('')}</details>` : ''}
    </div>`;
}

async function loadWeather(container) {
  const body = container.querySelector('#weather-body');
  if (!body) return;

  if (weatherAbortCtrl) weatherAbortCtrl.abort();
  weatherAbortCtrl = new AbortController();
  const signal = weatherAbortCtrl.signal;

  try {
    const w    = await getWeather(signal);
    const cur  = w.current;
    const day  = w.daily;
    const info = codeInfo(cur.weather_code);
    const opps = rideOpportunities(w);
    body.innerHTML = `
      <div class="weather-compact">
        <div class="weather-icon-wrap" style="width:48px;height:48px;flex-shrink:0">${weatherIcon(cur.weather_code)}</div>
        <div>
          <div class="weather-temp">${Math.round(cur.temperature_2m)}°</div>
          <div class="weather-desc">${info.d}</div>
        </div>
        <div class="weather-meta">
          <div class="weather-range">${Math.round(day.temperature_2m_min[0])}° / ${Math.round(day.temperature_2m_max[0])}°</div>
          <div class="weather-range">Regen: ${day.precipitation_probability_max[0]}%</div>
        </div>
      </div>
      ${opps.length ? `
        <div class="weather-opps">
          <div class="weather-opp-label">Rittenradar</div>
          ${opps.map(o => `<div class="weather-opp">${o.msg}</div>`).join('')}
        </div>` : ''}
    `;
  } catch (e) {
    if (e?.name === 'AbortError') return;
    body.innerHTML = `<p class="muted" style="font-size:.875rem">Weerdata niet beschikbaar.</p>`;
  }
}
