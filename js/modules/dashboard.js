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

  const tip = dagTip({ rides, hizb, todos, todayHizb, todayIncome, dailyGoal, monthIncome, monthlyGoal, daysLeft, dueCards, now, shame, mascot });

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
      <div class="tip-content">
        <div class="tip-icon">${tip.icon}</div>
        <div>
          ${tip.title ? `<div class="tip-title">${tip.title}</div>` : ''}
          <div class="tip-text">${tip.text}</div>
        </div>
      </div>
    </div>` : ''}

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

function dagTip({ rides, hizb, todos, todayHizb, todayIncome, dailyGoal, monthIncome, monthlyGoal, daysLeft, dueCards, now, shame, mascot }) {
  if (shame) return { icon: mascot.e, title: null, text: pickShame() };

  const dag = now.getDay();
  const uur = now.getHours();
  const tips = [];

  if (dailyGoal > 0 && todayIncome < dailyGoal * 0.5 && uur >= 13 && uur <= 20)
    tips.push({ icon: '⚡', title: 'Dagdoel achter', text: `Nog ${fmtMoney(dailyGoal - todayIncome)} te gaan. Het spitsuur loopt nu — zet er een tandje bij.` });

  if (!todayHizb && uur >= 18)
    tips.push({ icon: '📖', title: 'Koran hizb open', text: 'Je hizb van vandaag staat nog open. Pak een paar minuten rust tussen de ritten.' });

  if (dueCards > 0)
    tips.push({ icon: '📚', title: 'Arabisch klaar', text: `${dueCards} kaart${dueCards>1?'en staan klaar':' staat klaar'} voor herhaling. Vijf minuten nu verdubbelt je retentie.` });

  if (dag === 5 && uur >= 16)
    tips.push({ icon: '🌙', title: 'Vrijdagavond', text: 'Vrijdagavond is traditioneel druk in Amsterdam. Overweeg tot na middernacht te rijden.' });

  if (dag === 6 && uur >= 20)
    tips.push({ icon: '🎉', title: 'Zaterdagnacht', text: 'Zaterdagnacht brengt de hoogste Uber/Bolt-tarieven van de week.' });

  if (monthlyGoal > 0 && daysLeft > 0) {
    const needed = monthlyGoal - monthIncome;
    if (needed > 0 && needed / daysLeft > dailyGoal * 1.4)
      tips.push({ icon: '📈', title: 'Maanddoel', text: `Nog ${daysLeft} dagen, ${fmtMoney(needed/daysLeft)}/dag nodig. Huidig gemiddelde ligt lager — plan extra uren.` });
  }

  const todayDue = todos.filter(t => !t.done && t.dueDate === ymd(now));
  if (todayDue.length > 0)
    tips.push({ icon: '📅', title: 'Taken vandaag', text: `${todayDue.length} taak${todayDue.length>1?'en staan':' staat'} gepland voor vandaag.` });

  if (tips.length > 0) return tips[0];

  const fallbacks = [
    { icon: '🗺️', title: 'Tip', text: 'Amsterdam Centraal, Schiphol en het Leidseplein zijn de beste ophaallocaties tijdens piekuren.' },
    { icon: '⭐', title: 'Klanttip', text: 'Een vriendelijke begroeting en schoon voertuig leveren betere beoordelingen op — en meer fooien.' },
    { icon: '🎯', title: 'Motivatie', text: 'Consistentie wint van pieken. Elke dag rijden, hoe kort ook, bouwt een stabiel maandinkomen op.' },
    { icon: '💡', title: 'Dashboard', text: 'Je data wordt automatisch opgeslagen en beveiligd gesynchroniseerd naar je GitHub backup.' },
    { icon: '🚀', title: 'Groei', text: 'Controleer je weekinkomsten elke vrijdag en pas je planning aan op basis van trends.' },
    { icon: '💼', title: 'Zakelijk', text: 'Stel een spaardoel in via Doelen om automatisch een deel van elke rit opzij te zetten.' },
    { icon: '🌅', title: 'Ochtenddienst', text: 'De vroege ochtend (06:00–09:00) brengt betrouwbare woon-werkrittten met goede beoordelingen.' },
  ];
  return fallbacks[now.getDate() % fallbacks.length];
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
        <div class="weather-icon">${info.e}</div>
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
