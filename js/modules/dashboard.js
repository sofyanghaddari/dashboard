import { all } from '../db.js';
import { fmtMoney, startOfWeek, startOfMonth, ymd, sameDay, escapeHTML } from '../utils.js';
import { getNumber, getSetting } from '../settings.js';
import { celebrateGoalHit, celebrateStreak } from '../components/celebrate.js';
import { checkNewBadges } from '../achievements.js';
import { toast } from '../components/toast.js';
import { getWeather, codeInfo, rideOpportunities } from '../weather.js';
import { getMascotState, shouldShame, pickShame } from '../mascot.js';
import { detectInsights, goalFeasibility, goalTrajectoryPath } from '../insights.js';

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
        <div class="mascot-sm" title="${escapeHTML(mascot.msg)}">${mascot.e}</div>
      </div>
      <div class="dagstart-stats">
        <div class="dagstart-stat">
          <div class="dagstart-stat-val">${fmtMoney(todayIncome)}</div>
          <div class="dagstart-stat-lbl">Vandaag</div>
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
      <div class="income-hero-label">Inkomen vandaag</div>
      <div class="income-hero-amount big-money">${fmtMoney(todayIncome)}</div>
      ${dailyGoal > 0 ? `
        <div class="income-hero-progress">
          <div class="progress-bar"><div class="progress-fill" style="width:${goalPct}%"></div></div>
        </div>
        <div class="income-hero-meta">
          <span>${goalPct}% van dagdoel</span>
          <span>Doel: <span class="money">${fmtMoney(dailyGoal)}</span></span>
        </div>
      ` : ''}
    </div>

    <!-- MAANDOVERZICHT -->
    <div class="card">
      <h2 class="card-title">Maand — ${maandNamen[now.getMonth()]} ${now.getFullYear()}</h2>
      <div class="big-money">${fmtMoney(monthIncome)}</div>
      ${monthlyGoal > 0 ? `
        <div class="progress-bar" style="margin-bottom:8px"><div class="progress-fill" style="width:${monthGoalPct}%"></div></div>
      ` : ''}
      <div class="kpi-grid" style="margin-bottom:${traj?'12px':'0'}">
        <div class="kpi-card">
          <div class="kpi-label">Week</div>
          <div class="kpi-value">${fmtMoney(weekIncome)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Verwacht</div>
          <div class="kpi-value">${fmtMoney(projectedMonth)}</div>
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
            ? `<div style="font-weight:600;font-size:.9rem">Op koers — verwacht: ${fmtMoney(feas.projectedFinal)}</div>
               ${feas.daysNeeded && feas.daysNeeded < feas.daysLeft ? `<div class="muted" style="font-size:.8rem;margin-top:3px">Doel bereikt over ~${feas.daysNeeded} dagen in dit tempo</div>` : ''}`
            : `<div style="font-weight:600;font-size:.9rem">Achter — verwacht: ${fmtMoney(feas.projectedFinal)} <span class="muted">(€${Math.round(feas.shortage)} tekort)</span></div>
               <div class="muted" style="font-size:.8rem;margin-top:3px">Benodigd per dag: <b>${fmtMoney(feas.dailyNeeded)}</b> · huidig: ${fmtMoney(feas.currentDaily)}/dag</div>`}
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
            <div class="muted" style="font-size:.8rem;margin-bottom:6px">${fmtMoney(saved)} van ${fmtMoney(Number(g.target))}${remaining>0?` · nog ${fmtMoney(remaining)}`:' · behaald 🎉'}</div>
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
  const HADITHS = [
    { nl: 'Spreek goed of zwijg.', bron: 'Sahih al-Bukhari 6018' },
    { nl: 'Glimlachen naar je broeder is een daad van liefdadigheid.', bron: 'Jami at-Tirmidhi 1956' },
    { nl: 'De sterkste man is niet degene die anderen verslaat, maar degene die zichzelf beheerst in woede.', bron: 'Sahih al-Bukhari 6114' },
    { nl: 'Wie een pad bewandelt op zoek naar kennis, Allah maakt voor hem een pad naar het Paradijs.', bron: 'Sahih Muslim 2699' },
    { nl: 'Allah houdt van iemand die wanneer hij iets doet, het met toewijding doet.', bron: 'al-Bayhaqi' },
    { nl: 'Geen van jullie gelooft waarlijk totdat hij voor zijn broeder wil wat hij voor zichzelf wil.', bron: 'Sahih al-Bukhari 13' },
    { nl: 'Degene die \'s ochtends wakker wordt met een veilig huis, een gezond lichaam en voedsel voor die dag, is als iemand die de hele wereld heeft verkregen.', bron: 'Jami at-Tirmidhi 2346' },
    { nl: 'Wees in de wereld als een vreemdeling of een reiziger.', bron: 'Sahih al-Bukhari 6416' },
    { nl: 'Dankbaarheid aan mensen is dankbaarheid aan Allah.', bron: 'Jami at-Tirmidhi 1954' },
    { nl: 'Schaad niet en laat je niet schaden.', bron: 'Ibn Majah 2340' },
    { nl: 'Vertrouw op Allah, maar bind ook je kameel vast.', bron: 'Jami at-Tirmidhi 2517' },
    { nl: 'De beste van jullie zijn degenen die de Koran leren en anderen onderwijzen.', bron: 'Sahih al-Bukhari 5027' },
    { nl: 'Maak het makkelijk en maak het niet moeilijk; breng goed nieuws en sla mensen niet af.', bron: 'Sahih al-Bukhari 69' },
    { nl: 'Wie zwijgt is gered.', bron: 'Jami at-Tirmidhi 2501' },
    { nl: 'Allah heeft meelij met degenen die meelij tonen aan anderen.', bron: 'Jami at-Tirmidhi 1924' },
    { nl: 'Betaal de arbeider zijn loon voordat zijn zweet opdroogt.', bron: 'Ibn Majah 2443' },
    { nl: 'De sterke gelovige is beter en meer geliefd bij Allah dan de zwakke gelovige — en in beide is er goed.', bron: 'Sahih Muslim 2664' },
    { nl: 'Bid tot Allah met de zekerheid dat Hij zal antwoorden.', bron: 'Jami at-Tirmidhi 3479' },
    { nl: 'Allah is zacht en houdt van zachtheid in alle zaken.', bron: 'Sahih al-Bukhari 6528' },
    { nl: 'Wie niet dankbaar is aan mensen, is niet dankbaar aan Allah.', bron: 'Abu Dawud 4811' },
    { nl: 'Het beste van de mensen is degene die het meest nuttig is voor anderen.', bron: 'al-Mu\'jam al-Awsat' },
    { nl: 'Eet samen en noem de naam van Allah; er zal zegen in zijn.', bron: 'Abu Dawud 3764' },
    { nl: 'Vergeving is een van de beste eigenschappen van de gelovige.', bron: 'Sahih Muslim 2588' },
    { nl: 'Geen ziekte treft een moslim zonder dat Allah daarmee zonden vergeeft.', bron: 'Sahih al-Bukhari 5641' },
    { nl: 'Doe goede daden, en weet dat geen van jullie door zijn daden gered wordt — maar door de genade van Allah.', bron: 'Sahih al-Bukhari 6467' },
    { nl: 'Allah schenkt kennis aan wie Hij wil. Wie kennis krijgt, heeft een groot goed gekregen.', bron: 'Sahih al-Bukhari 73' },
    { nl: 'De mens is op het geloof van zijn vrienden — kijk dus met wie je omgaat.', bron: 'Abu Dawud 4833' },
    { nl: 'Wie Allah vreest, voor hem maakt Allah een uitweg en voorziet hem van waar hij het niet verwacht.', bron: 'Qur\'an 65:2-3' },
    { nl: 'Kleine consistente daden zijn geliefder bij Allah dan grote maar sporadische daden.', bron: 'Sahih al-Bukhari 6465' },
    { nl: 'De barmhartigste mensen worden het meest begenadigd. Wees barmhartig voor wie op aarde is.', bron: 'Jami at-Tirmidhi 1924' },
  ];
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  const h = HADITHS[dayOfYear % HADITHS.length];
  return `
    <div class="card hadith-card">
      <h2 class="card-title">Hadith van de dag</h2>
      <div class="hadith-text">${escapeHTML(h.nl)}</div>
      <div class="hadith-source">${escapeHTML(h.bron)}</div>
    </div>`;
}

function woordWidget(now) {
  const WOORDEN = [
    { w: 'ambivalent', def: 'Tegenstrijdige gevoelens koesteren tegenover iets of iemand.', tip: 'Ambi = twee kanten — je neigt naar twee richtingen tegelijk.' },
    { w: 'recalcitrant', def: 'Weerspannig en moeilijk in de omgang; verzet biedend.', tip: 'Recal = "terugdrukken" — iemand die niet meebeweegt.' },
    { w: 'sereen', def: 'Volledig kalm en rustig; ongestoord en helder.', tip: 'Denk aan een serene zee — vlak, stil, geen golven.' },
    { w: 'laconiek', def: 'Weinig woorden gebruikend; beknopt en nuchter van aard.', tip: 'De Spartanen (Lacedaemoniërs) waren berucht om hun korte antwoorden.' },
    { w: 'pertinent', def: 'Nauw verband houdend met het onderwerp; precies ter zake.', tip: '"Per tinent" — precies raak, als een pijl die het doel raakt.' },
    { w: 'tentatief', def: 'Voorlopig of aarzelend; nog niet definitief vastgesteld.', tip: 'Een "tent" is tijdelijk — zo ook een tentatief voorstel.' },
    { w: 'eloquent', def: 'Welbespraakt en vloeiend sprekend; overtuigend en helder.', tip: 'Denk aan "eloquence" in het Engels — een gave van spreken.' },
    { w: 'pragmatisch', def: 'Gericht op praktische resultaten; zonder ideologische starheid.', tip: '"Pragma" = daad in het Grieks. Pragmatisch = daadgericht.' },
    { w: 'redundant', def: 'Overbodig; meer dan nodig is voor de betekenis of functie.', tip: '"Re" + "dund" — iets wordt dubbel herhaald, te veel.' },
    { w: 'sceptisch', def: 'Twijfelend en kritisch tegenover beweringen of aannames.', tip: 'Een scepticus ontsnapt ("scape") aan blinde aanname.' },
    { w: 'frugaal', def: 'Spaarzaam en bescheiden in levenswijze of gebruik van middelen.', tip: '"Fruit" en eenvoudig voedsel — simpel en weinig.' },
    { w: 'altruïstisch', def: 'Onzelfzuchtig; handelen in het belang van anderen boven jezelf.', tip: '"Altri" = anderen in het Italiaans. Je leeft voor anderen.' },
    { w: 'arbitrair', def: 'Op willekeur gebaseerd; zonder logische of vaste regel.', tip: '"Arbiter" is een rechter die ook willekeurig kan beslissen.' },
    { w: 'bevlogen', def: 'Sterk geïnspireerd en enthousiast; gedreven door passie.', tip: 'Bevlogen = vliegen van enthousiasme, de lucht in.' },
    { w: 'diffuus', def: 'Wazig en verspreid; zonder duidelijke focus of begrenzing.', tip: 'Diffuus licht verspreidt zich alle kanten op — geen bundel.' },
    { w: 'emininent', def: 'Vooraanstaand en uitstekend in zijn vakgebied of positie.', tip: '"Emineren" = boven anderen uitsteken, letterlijk en figuurlijk.' },
    { w: 'fatalistisch', def: 'Gelovend dat alles onvermijdelijk is; berusting in het lot.', tip: '"Fata" = lot in het Latijn. De fatalist laat het lot beslissen.' },
    { w: 'hachelijk', def: 'Gevaarlijk en precair; een situatie met grote risico\'s.', tip: 'Je hangt aan een "haak" — je situatie is onzeker en benard.' },
    { w: 'intuïtief', def: 'Op gevoel geleid; zonder bewuste redenering tot een conclusie.', tip: '"Tueri" = bewaken in het Latijn. Je bewaakt iets zonder het te zien.' },
    { w: 'ironisch', def: 'Het tegendeel meenend van wat gezegd wordt; dubbelzinnig.', tip: '"Eiroon" in het Grieks = iemand die minder doet lijken dan is.' },
    { w: 'latent', def: 'Aanwezig maar nog niet zichtbaar of actief; sluimerend.', tip: 'Iets laten sluimeren — het wacht op activering.' },
    { w: 'naïef', def: 'Onbezonnen gelovig; ontbrekend aan ervaring of kritische blik.', tip: 'Nat en onervaren — als een kind dat nog niet gewaarschuwd is.' },
    { w: 'paradoxaal', def: 'Schijnbaar tegenstrijdig maar toch waar; verrassend en logisch.', tip: '"Para" = naast, "doxa" = mening — naast de verwachte mening.' },
    { w: 'provocatief', def: 'Bewust uitdagend of ophitsend; bedoeld om reactie te krijgen.', tip: '"Provocare" = oproepen. Je roept een reactie op bij de ander.' },
    { w: 'retorisch', def: 'Betrekking op overreding door taal; een vraag die geen antwoord verwacht.', tip: '"Rhetor" = redenaar in het Grieks. Retoriek is de kunst van overtuigen.' },
    { w: 'scrupuleus', def: 'Nauwgezet en gewetenvol; aandacht voor de kleinste details.', tip: '"Scrupel" = klein steentje dat in je schoen wringt — je voelt elk detail.' },
    { w: 'triviaal', def: 'Onbeduidend en alledaags; weinig belang of diepgang hebbend.', tip: '"Trivium" = driesprong. Gewone ontmoetingsplek van gewone mensen.' },
    { w: 'volatiel', def: 'Vluchtig en wispelturig; snel en onverwacht van toestand wisselend.', tip: '"Volare" = vliegen in het Latijn. Vluchtig als iets dat wegvliegt.' },
    { w: 'contraproductief', def: 'Het tegenovergestelde bereikend van het beoogde doel.', tip: '"Contra" = tegen. Je werkt tégen je eigen doel.' },
    { w: 'discrepantie', def: 'Tegenstrijdigheid of verschil tussen twee dingen die overeen zouden moeten komen.', tip: '"Crepare" = kraken. De twee kanten knarsen tegen elkaar aan.' },
    { w: 'hypocrisie', def: 'Geveinsdheid; het voordoen van deugden die men zelf niet bezit.', tip: '"Hypo" = onder, "krisis" = oordeel. Je verbergt je ware oordeel.' },
    { w: 'illusoir', def: 'Op illusie berustend; niet werkelijk maar slechts schijnbaar.', tip: '"Illusio" = begoocheling. Het lijkt echt maar is een truc.' },
    { w: 'juxtapositie', def: 'Het naast elkaar plaatsen van twee contrasterende elementen.', tip: '"Juxta" = naast in het Latijn. Je zet twee dingen naast elkaar.' },
    { w: 'manifest', def: 'Duidelijk en onmiskenbaar zichtbaar; openbaar en helder.', tip: '"Manifesta" = handgreep. Iets wat je letterlijk in de hand kunt houden.' },
    { w: 'nuanceren', def: 'Bijstellen of verfijnen; onderscheid maken in subtiele verschillen.', tip: '"Nuance" = kleine tintschakering. Je ziet de kleine kleurverschillen.' },
    { w: 'paradigma', def: 'Denkkader of referentiemodel dat de visie op een vakgebied bepaalt.', tip: '"Para" + "deigma" = naast het voorbeeld. Een manier van kijken.' },
    { w: 'reciprook', def: 'Wederzijds en gelijkwaardig; van beide kanten gelijkelijk geldend.', tip: '"Reciprocare" = heen en terug bewegen — gelijke uitwisseling.' },
    { w: 'subsidiair', def: 'Als aanvulling dienend; van ondergeschikt of bijkomend belang.', tip: '"Subsidium" = hulp van achteren. Je staat klaar als steun.' },
    { w: 'tangentieel', def: 'Slechts zijdelings rakend aan het onderwerp; niet centraal.', tip: '"Tangere" = raken. Een tangens raakt de cirkel slechts licht.' },
    { w: 'unanim', def: 'Eenstemmig; met volledige instemming van iedereen.', tip: '"Una" = één, "anima" = geest. Iedereen spreekt met één stem.' },
    { w: 'verbatim', def: 'Woord voor woord geciteerd; letterlijk overgenomen.', tip: '"Verba" = woorden in het Latijn. Je herhaalt elke letter precies.' },
    { w: 'aforisme', def: 'Kernachtige uitspraak die een waarheid bondig formuleert.', tip: '"Aphorismós" = afgrenzen. Een aforisme begrenst een gedachte scherp.' },
    { w: 'apathisch', def: 'Gevoelsloos en onverschillig; zonder energie of betrokkenheid.', tip: '"A" = zonder, "pathos" = gevoel. Geen gevoel, geen reactie.' },
    { w: 'catharsis', def: 'Emotionele zuivering of bevrijding; opluchting na intense ervaring.', tip: '"Katharos" = zuiver in het Grieks. Je reinigt je ziel door emotie.' },
    { w: 'dogmatisch', def: 'Vasthoudend aan onbetwistbare stellingen; geen twijfel toelaten.', tip: '"Dogma" = leer. Een dogmaticus trekt de leer nooit in twijfel.' },
    { w: 'eclectisch', def: 'Selecterend uit diverse bronnen en stijlen; niet gebonden aan één school.', tip: '"Eklektikos" = uitlezen. Je pikt het beste uit elke denkrichting.' },
    { w: 'faceteus', def: 'Geestig en humoristisch; speels in toon maar soms ongepast.', tip: '"Facetus" = elegant in het Latijn. Geestig maar soms te vrijpostig.' },
    { w: 'gregair', def: 'Sociaal en houdend van gezelschap; van nature op groep gericht.', tip: '"Grex" = kudde in het Latijn. Een gregair persoon zoekt de kudde.' },
    { w: 'inherent', def: 'Van nature aanwezig; onlosmakelijk verbonden met iets.', tip: '"Inhaerere" = vast zitten aan. Het zit er ingebakken in.' },
    { w: 'judicieux', def: 'Verstandig en met goed oordeel; wijs en beoordelingsvaardig.', tip: '"Judex" = rechter. Je oordeelt slim, als een goede rechter.' },
    { w: 'kaleidoscopisch', def: 'Snel en kleurrijk wisselend beeld; veelzijdig en gevarieerd.', tip: '"Kalos" = mooi, "skopos" = kijker. Je kijkt naar eindeloze mooi variaties.' },
    { w: 'lacune', def: 'Leemte of ontbrekend deel; gat in kennis of completeness.', tip: '"Lacuna" = kuil in het Latijn. Er ontbreekt een stuk.' },
    { w: 'malafide', def: 'Kwader trouw; handelend met slechte bedoelingen.', tip: '"Mala" = slecht, "fide" = geloof. Je handelt met slechte bedoeling.' },
    { w: 'nominatief', def: 'Enkel in naam aanwezig; slechts als titel, zonder echte inhoud.', tip: '"Nomen" = naam. Je bent slechts bij naam aanwezig.' },
    { w: 'oblivious', def: 'Vergeetachtig of onbewust van de omgeving; niet oplettend.', tip: '"Oblivio" = vergetelheid. Je bent je nauwelijks bewust van wat er is.' },
    { w: 'pedant', def: 'Overmatig nadruk leggend op regels en formaliteiten; schoolmeesterachtig.', tip: '"Pédant" in het Frans = schoolmeester. Regels boven begrip.' },
    { w: 'quintessentieel', def: 'De kern of het meest wezenlijke element van iets vertegenwoordigend.', tip: '"Quinta essentia" = het vijfde element — de puurste vorm van iets.' },
    { w: 'reprimande', def: 'Officiële berisping of terechtwijzing; formeel verwijt.', tip: '"Reprimere" = terugdrukken. Je wordt teruggeduwd in je plek.' },
    { w: 'stoïcijns', def: 'Gelaten en beheerst in moeilijke omstandigheden; onaangedaan.', tip: 'De Stoïci geloofden dat je emoties kunt beheersen — en dat toonden ze.' },
    { w: 'tactvol', def: 'Met fijngevoeligheid omgaan met anderen; rekening houdend met gevoelens.', tip: '"Tactus" = aanraking. Tactvol aanraken zonder te stoten.' },
    { w: 'unilateraal', def: 'Eenzijdig; slechts door één partij genomen of bepaald.', tip: '"Uni" = één, "latus" = kant. Beslissing van één kant genomen.' },
    { w: 'vigilant', def: 'Waakzaam en oplettend; steeds alert op gevaar of verandering.', tip: '"Vigilare" = waken. Je slaapt nooit helemaal — altijd alert.' },
    { w: 'wankel', def: 'Niet stevig en onstabiel; kwetsbaar voor omvallen of mislukken.', tip: 'Wankelen = schommelen. Een wankele basis bezwijkt makkelijk.' },
    { w: 'xenofoob', def: 'Angst of afkeer van het vreemde, buitenlandse of onbekende.', tip: '"Xenos" = vreemdeling, "phobos" = angst. Bang voor wat anders is.' },
    { w: 'zelfgenoegzaam', def: 'Tevreden met zichzelf zonder oog voor verbetering; arrogant passief.', tip: '"Genoeg" + "zelf" — je vindt jezelf al genoeg zoals je bent.' },
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
  const A10_WEST = new Date().getMonth() >= 4 && new Date().getMonth() <= 8; // mei-aug
  const items = [
    { road: 'A10', label: 'Coentunnel', info: 'Werkzaamheden nacht 22:00-06:00. Rijstrookversmalling richting west.', type: 'warn' },
    { road: 'S108', label: 'Wibautstraat', info: 'Rioolwerkzaamheden. Gebruik Amstel of Weesperstraat als alternatief.', type: 'warn' },
    { road: 'A10', label: 'Ring Zuid', info: A10_WEST ? 'Intensieve werkzaamheden tot september. Vermijd spitsuur.' : 'Normaal rijden mogelijk.', type: A10_WEST ? 'warn' : 'ok' },
    { road: 'IJ-tnl', label: 'IJtunnel', info: 'Nachtsluiting di/wo 23:00-05:00. Gebruik Noord-Zuidlijn als alternatief.', type: 'warn' },
  ];
  return `
    <div class="card weginfo-card">
      <h2 class="card-title">Weginfo Amsterdam</h2>
      ${items.map(item => `
        <div class="weginfo-item">
          <span class="weginfo-road ${item.type}">${escapeHTML(item.road)}</span>
          <div>
            <div style="font-weight:600;font-size:.83rem;color:var(--text)">${escapeHTML(item.label)}</div>
            <div style="font-size:.8rem;color:var(--text-dim);margin-top:2px">${escapeHTML(item.info)}</div>
          </div>
        </div>`).join('')}
      <a class="weginfo-link" href="https://www.anwb.nl/verkeer/omleidingen/amsterdam" target="_blank" rel="noopener">
        Actuele info ANWB →
      </a>
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
