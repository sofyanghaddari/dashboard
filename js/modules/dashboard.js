import { all } from '../db.js';
import { fmtMoney, startOfWeek, startOfMonth, ymd, sameDay, escapeHTML } from '../utils.js';
import { getNumber, getSetting } from '../settings.js';
import { celebrateGoalHit, celebrateStreak } from '../components/celebrate.js';
import { checkNewBadges } from '../achievements.js';
import { toast } from '../components/toast.js';
import { getWeather, codeInfo, rideOpportunities } from '../weather.js';
import { getMascotState, shouldShame, pickShame } from '../mascot.js';
import { detectInsights, goalFeasibility, goalTrajectoryPath } from '../insights.js';

export async function render(container) {
  const [rides, hizb, todos, cards, goals] = await Promise.all([
    all('rides'), all('hizb_log'), all('todos'), all('cards'), all('goals'),
  ]);
  const now = new Date();
  const today = ymd();

  const sum = (arr) => arr.reduce((s, r) => s + Number(r.amount || 0), 0);
  const todayIncome = sum(rides.filter(r => sameDay(new Date(r.date), now)));
  const weekIncome  = sum(rides.filter(r => new Date(r.date) >= startOfWeek(now)));
  const monthIncome = sum(rides.filter(r => new Date(r.date) >= startOfMonth(now)));

  const dailyGoal = getNumber('dailyIncomeGoal');
  const monthlyGoal = getNumber('monthlyIncomeGoal');
  const goalPct = dailyGoal > 0 ? Math.min(100, Math.round(todayIncome / dailyGoal * 100)) : 0;
  const monthGoalPct = monthlyGoal > 0 ? Math.min(100, Math.round(monthIncome / monthlyGoal * 100)) : 0;

  // Trend & projectie
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const daysIntoMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - daysIntoMonth;
  const lastMonthAtPoint = rides.filter(r => {
    const d = new Date(r.date);
    return d >= lastMonthStart && d <= lastMonthEnd && d.getDate() <= daysIntoMonth;
  }).reduce((s, r) => s + Number(r.amount || 0), 0);
  const monthDelta = lastMonthAtPoint > 0 ? Math.round((monthIncome - lastMonthAtPoint) / lastMonthAtPoint * 100) : null;
  const projectedMonth = daysIntoMonth > 0 ? Math.round((monthIncome / daysIntoMonth) * daysInMonth) : 0;

  // 30-dagen heatmap data
  const last30 = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    const key = ymd(d);
    const total = sum(rides.filter(r => ymd(new Date(r.date)) === key));
    last30.push({ key, day: d.getDate(), total, weekday: d.getDay() });
  }
  const heatMax = Math.max(1, ...last30.map(d => d.total));

  // Hizb
  const todayHizb = hizb.some(h => h.date === today);
  const doneSet = new Set(hizb.map(h => h.date));
  let streak = 0;
  const cur = new Date();
  while (doneSet.has(ymd(cur))) { streak++; cur.setDate(cur.getDate() - 1); }

  const dueCards = cards.filter(c => c.dueDate <= today).length;
  const openTodos = todos.filter(t => !t.done);
  const highTodos = openTodos.filter(t => t.priority === 'high');
  const todayTodos = openTodos.filter(t => t.dueDate === today);
  const totalRides = sum(rides);
  const taxiGoals = goals.filter(g => Number(g.taxiPercent) > 0 && Number(g.target) > 0);

  const mascot = await getMascotState();
  const shame = await shouldShame();
  const insights = detectInsights(rides, hizb);
  const feas = goalFeasibility(monthIncome, monthlyGoal);
  const traj = monthlyGoal > 0 ? goalTrajectoryPath(rides, monthlyGoal) : null;

  const isEmpty = rides.length === 0 && todos.length === 0 && cards.length === 0;

  // Begroeting & datum
  const uur = now.getHours();
  const userName = getSetting('userName') || 'Sofyan';
  const begroeting = uur < 12 ? 'Goedemorgen' : uur < 18 ? 'Goedemiddag' : 'Goedenavond';
  const dagNamen = ['Zondag','Maandag','Dinsdag','Woensdag','Donderdag','Vrijdag','Zaterdag'];
  const maandNamen = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
  const datumStr = `${dagNamen[now.getDay()]} ${now.getDate()} ${maandNamen[now.getMonth()]} ${now.getFullYear()}`;

  const tip = dagTip({ rides, hizb, todos, todayHizb, todayIncome, dailyGoal, monthIncome, monthlyGoal, daysLeft, dueCards, now, shame, mascot });

  container.innerHTML = `
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
          <div class="dagstart-stat-val" style="color:${todayHizb ? 'var(--ok)' : 'var(--text-dim)'}">${todayHizb ? '✓' : '–'}</div>
          <div class="dagstart-stat-lbl">Hizb</div>
        </div>
        <div class="dagstart-stat">
          <div class="dagstart-stat-val">${openTodos.length}</div>
          <div class="dagstart-stat-lbl">Open taken</div>
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

    <div class="quick-actions">
      <button class="quick-action-btn" data-tab="1">
        <div class="quick-action-icon">💰</div>
        <div class="quick-action-label">Inkomen bijhouden<span class="quick-action-sub">Dagelijks inkomen noteren</span></div>
      </button>
      <button class="quick-action-btn" data-tab="5">
        <div class="quick-action-icon">✅</div>
        <div class="quick-action-label">Taken<span class="quick-action-sub">${openTodos.length} open${todayTodos.length ? `, ${todayTodos.length} vandaag` : ''}</span></div>
      </button>
      <button class="quick-action-btn" data-tab="2">
        <div class="quick-action-icon">📖</div>
        <div class="quick-action-label">Koran hizb<span class="quick-action-sub">${todayHizb ? 'Vandaag afgevinkt ✓' : 'Nog niet afgevinkt'}</span></div>
      </button>
      <button class="quick-action-btn" data-tab="3">
        <div class="quick-action-icon">📚</div>
        <div class="quick-action-label">Arabisch<span class="quick-action-sub">${dueCards > 0 ? `${dueCards} kaart${dueCards > 1 ? 'en' : ''} te herhalen` : 'Geen kaarten vandaag'}</span></div>
      </button>
    </div>

    <div class="row" style="margin-bottom:14px">
      <button class="btn secondary" id="open-calendar">📅 Kalenderoverzicht</button>
      <button class="btn secondary" id="open-yr">📊 Jaaroverzicht</button>
    </div>

    <div class="card" id="weather-card">
      <h2 class="card-title">Weer & ritten-radar Amsterdam</h2>
      <div id="weather-body"><p class="muted">Laden…</p></div>
    </div>

    <div class="card primary-stat">
      <div class="stat-label">Inkomen vandaag</div>
      <div class="big-money">${fmtMoney(todayIncome)}</div>
      ${dailyGoal > 0 ? `
        <div class="progress-bar"><div class="progress-fill" style="width:${goalPct}%"></div></div>
        <div class="stat-sub">${goalPct}% van dagdoel — ${fmtMoney(todayIncome)} van ${fmtMoney(dailyGoal)} verdiend</div>
      ` : ''}
    </div>

    <div class="card">
      <h2 class="card-title">Maandoverzicht — ${maandNamen[now.getMonth()]} ${now.getFullYear()}</h2>
      <div class="big-money">${fmtMoney(monthIncome)}</div>
      ${monthlyGoal > 0 ? `
        <div class="progress-bar"><div class="progress-fill" style="width:${monthGoalPct}%"></div></div>
        <div class="stat-sub">${monthGoalPct}% van maanddoel — ${fmtMoney(monthIncome)} van ${fmtMoney(monthlyGoal)} verdiend</div>
      ` : ''}
      ${traj ? `
        <svg viewBox="0 0 ${traj.width} ${traj.height}" style="width:100%;height:${traj.height}px;margin-top:10px" preserveAspectRatio="none">
          <path d="${traj.idealPath}" stroke="var(--text-dim)" stroke-width="1" stroke-dasharray="3,3" fill="none" opacity=".6"/>
          <path d="${traj.actualPath}" stroke="var(--gold)" stroke-width="2" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
        </svg>
        <div class="muted" style="font-size:.7rem;display:flex;justify-content:space-between;margin-top:-4px"><span>dag 1</span><span>--- doellijn · ━━ werkelijk</span><span>dag ${daysInMonth}</span></div>
      ` : ''}
      ${feas && !feas.reached ? `
        <div class="card feasibility ${feas.onTrack ? 'on-track' : 'off-track'}" style="margin-top:12px;padding:10px 12px">
          ${feas.onTrack
            ? `<div><b>Op koers</b> — verwachte eindstand: ${fmtMoney(feas.projectedFinal)} (${Math.round((feas.projectedFinal/monthlyGoal-1)*100)}% boven doel)</div>
               ${feas.daysNeeded && feas.daysNeeded < feas.daysLeft ? `<div class="muted" style="font-size:.8rem;margin-top:2px">Je haalt het doel over ~${feas.daysNeeded} dagen in dit tempo</div>` : ''}`
            : `<div><b>Achter op schema</b> — verwachte eindstand: ${fmtMoney(feas.projectedFinal)} <span class="muted">(€${Math.round(feas.shortage)} tekort)</span></div>
               <div class="muted" style="font-size:.8rem;margin-top:2px">Benodigd per dag de rest van de maand: <b>${fmtMoney(feas.dailyNeeded)}</b> — huidig gemiddelde: ${fmtMoney(feas.currentDaily)}/dag</div>`}
        </div>` : ''}
      <div class="row" style="margin-top:12px;gap:18px">
        <div>
          <div class="stat-label">Deze week</div>
          <div class="stat-value-sm">${fmtMoney(weekIncome)}</div>
        </div>
        <div>
          <div class="stat-label">Verwachte maand</div>
          <div class="stat-value-sm">${fmtMoney(projectedMonth)}</div>
        </div>
        ${monthDelta !== null ? `<div>
          <div class="stat-label">Vs vorige maand</div>
          <div class="stat-value-sm ${monthDelta>=0?'trend-up':'trend-down'}">${monthDelta>=0?'↑':'↓'} ${Math.abs(monthDelta)}%</div>
        </div>` : ''}
      </div>
    </div>

    <div class="card">
      <h2 class="card-title">Prioriteiten & open taken</h2>
      ${highTodos.length ? `
        <div style="margin-bottom:${todayTodos.length ? '12px' : '4px'}">
          <div class="muted" style="font-size:.75rem;margin-bottom:8px;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Hoge prioriteit (${highTodos.length})</div>
          ${highTodos.slice(0, 5).map(t => `
            <div class="todo-preview-item">
              <span class="todo-priority-dot"></span>
              <div>
                <div style="font-size:.93rem;font-weight:500;line-height:1.3">${escapeHTML(t.title)}</div>
                ${t.dueDate ? `<div class="muted" style="font-size:.75rem;margin-top:1px">Deadline: ${t.dueDate}</div>` : ''}
                ${t.note ? `<div class="muted" style="font-size:.75rem;margin-top:1px">${escapeHTML(t.note.substring(0, 70))}${t.note.length > 70 ? '…' : ''}</div>` : ''}
              </div>
            </div>
          `).join('')}
        </div>` : ''}
      ${todayTodos.length ? `
        <div class="muted" style="font-size:.85rem;margin-bottom:4px"><b>${todayTodos.length}</b> taak${todayTodos.length > 1 ? 'en' : ''} gepland voor vandaag</div>` : ''}
      ${!highTodos.length && !todayTodos.length ? `
        <div class="muted" style="padding:4px 0">Geen urgente taken — je bent bij.</div>` : ''}
      <button class="btn secondary block" style="margin-top:10px;font-size:.85rem" data-tab="5">Alle taken bekijken →</button>
    </div>

    <div class="card">
      <h2 class="card-title">Koran — dagelijkse hizb</h2>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
        <div>
          <div style="font-size:1rem;font-weight:500">Vandaag: <b>${todayHizb ? '✓ Afgevinkt' : 'Nog niet afgevinkt'}</b></div>
          <div class="muted" style="margin-top:3px;font-size:.85rem">Streak: <b>${streak} dag${streak===1?'':'en'}</b> op rij${streak > 0 ? ' 🔥' : ''}</div>
        </div>
        <button class="btn secondary" style="padding:8px 14px;font-size:.82rem;flex-shrink:0" data-tab="2">Open Koran →</button>
      </div>
    </div>

    <div class="card">
      <h2 class="card-title">Arabisch — woordherhaling (SRS)</h2>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
        <div>
          ${dueCards > 0
            ? `<div style="font-size:1rem;font-weight:500"><span class="money">${dueCards}</span> kaart${dueCards===1?'':'en'} klaar voor herhaling</div>
               <div class="muted" style="margin-top:3px;font-size:.85rem">Herhaal nu voor maximaal leerrendement</div>`
            : `<div style="font-size:1rem;font-weight:500">Geen kaarten vandaag</div>
               <div class="muted" style="margin-top:3px;font-size:.85rem">Je bent bij — check morgen weer</div>`}
        </div>
        <button class="btn secondary" style="padding:8px 14px;font-size:.82rem;flex-shrink:0" data-tab="3">Open Arabisch →</button>
      </div>
    </div>

    ${taxiGoals.length ? `
      <div class="card">
        <h2 class="card-title">Spaardoelen</h2>
        ${taxiGoals.map(g => {
          const saved = totalRides * (Number(g.taxiPercent) / 100);
          const pct = Math.min(100, Math.round(saved / Number(g.target) * 100));
          const remaining = Math.max(0, Number(g.target) - saved);
          return `
            <div style="margin-bottom:16px">
              <div style="display:flex;justify-content:space-between;align-items:baseline">
                <b style="font-size:.95rem">${escapeHTML(g.title)}</b>
                <span class="muted" style="font-size:.82rem">${pct}%</span>
              </div>
              <div class="muted" style="font-size:.8rem;margin:3px 0">${fmtMoney(saved)} gespaard van ${fmtMoney(Number(g.target))} doel${remaining > 0 ? ` — nog ${fmtMoney(remaining)} te gaan` : ' — doel bereikt! 🎉'}</div>
              <div class="progress-bar" style="margin-top:6px"><div class="progress-fill" style="width:${pct}%"></div></div>
            </div>`;
        }).join('')}
      </div>` : ''}

    <div class="card">
      <h2 class="card-title">Inkomen — laatste 30 dagen</h2>
      <div class="heatmap">
        ${last30.map(d => {
          const i = d.total > 0 ? Math.max(0.18, d.total / heatMax) : 0;
          return `<div class="heat-cell" style="${i>0?`background:linear-gradient(135deg,rgba(212,176,107,${i}),rgba(212,176,107,${i*0.6}))`:''}" title="${d.key}: ${fmtMoney(d.total)}"></div>`;
        }).join('')}
      </div>
      <div class="heat-legend"><span class="muted">minder</span><span class="heat-spec"></span><span class="muted">meer</span></div>
    </div>

    ${insights.length ? `
      <div class="card">
        <h2 class="card-title">Patroonanalyse</h2>
        <p class="muted" style="font-size:.82rem;margin:0 0 10px">Automatisch gedetecteerd op basis van je ritten en gewoontes</p>
        ${insights.map(i => `<div class="insight-row"><span class="insight-icon">${i.icon}</span><span>${i.text}</span></div>`).join('')}
      </div>` : ''}

    ${isEmpty ? `
      <div class="card empty-cta">
        <h3>Welkom bij je dashboard 👋</h3>
        <p class="muted">Begin met het bijhouden van je eerste inkomen, hizb of taak via de tabs onderaan. Alles wordt automatisch opgeslagen en gesynchroniseerd.</p>
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
  if (shame) {
    return { icon: mascot.e, title: null, text: pickShame(), shame: true };
  }

  const dag = now.getDay();
  const uur = now.getHours();
  const tips = [];

  if (dailyGoal > 0 && todayIncome < dailyGoal * 0.5 && uur >= 13 && uur <= 20) {
    tips.push({ icon: '⚡', title: 'Dagdoel achter', text: `Nog ${fmtMoney(dailyGoal - todayIncome)} te gaan voor je dagdoel. Het spitsuur loopt nu — zet er een tandje bij.` });
  }

  if (!todayHizb && uur >= 18) {
    tips.push({ icon: '📖', title: 'Koran hizb open', text: 'Je hizb van vandaag staat nog open. Pak een paar minuten rust tussen de ritten.' });
  }

  if (dueCards > 0) {
    tips.push({ icon: '📚', title: 'Arabisch klaar', text: `${dueCards} kaart${dueCards > 1 ? 'en staan klaar' : ' staat klaar'} voor herhaling. Vijf minuten nu verdubbelt je retentie op lange termijn.` });
  }

  if (dag === 5 && uur >= 16) {
    tips.push({ icon: '🌙', title: 'Vrijdagavond', text: 'Vrijdagavond is traditioneel druk in Amsterdam. Overweeg tot na middernacht te rijden.' });
  }

  if (dag === 6 && uur >= 20) {
    tips.push({ icon: '🎉', title: 'Zaterdagnacht', text: 'Zaterdagnacht brengt de hoogste Uber/Bolt-tarieven van de week. Uitgaansbuurten zijn nu actief.' });
  }

  if (monthlyGoal > 0 && daysLeft > 0) {
    const needed = monthlyGoal - monthIncome;
    if (needed > 0 && needed / daysLeft > dailyGoal * 1.4) {
      tips.push({ icon: '📈', title: 'Maanddoel', text: `Om je maanddoel te halen heb je de komende ${daysLeft} dagen gemiddeld ${fmtMoney(needed / daysLeft)}/dag nodig. Zet er wat extra uren in.` });
    }
  }

  const todayDue = todos.filter(t => !t.done && t.dueDate === ymd(now));
  if (todayDue.length > 0) {
    tips.push({ icon: '📅', title: 'Taken vandaag', text: `${todayDue.length} taak${todayDue.length > 1 ? 'en staan' : ' staat'} gepland voor vandaag en ${todayDue.length > 1 ? 'zijn' : 'is'} nog open.` });
  }

  if (tips.length > 0) return tips[0];

  const fallbacks = [
    { icon: '🗺️', title: 'Tip', text: 'Amsterdam Centraal, Schiphol en het Leidseplein zijn de beste ophaallocaties tijdens piekuren.' },
    { icon: '⭐', title: 'Klanttip', text: 'Een vriendelijke begroeting en schoon voertuig leveren betere beoordelingen op — en meer fooien.' },
    { icon: '🎯', title: 'Motivatie', text: 'Consistentie wint van pieken. Elke dag rijden, hoe kort ook, bouwt een stabiel maandinkomen op.' },
    { icon: '💡', title: 'Dashboard', text: 'Je data wordt automatisch opgeslagen en beveiligd gesynchroniseerd naar je GitHub backup.' },
    { icon: '🚀', title: 'Groei', text: 'Controleer je weekinkomsten elke vrijdag en pas je planning voor de volgende week aan op basis van trends.' },
    { icon: '💼', title: 'Zakelijk', text: 'Stel een spaardoel in via het Doelen-tabblad om automatisch een deel van elke rit opzij te zetten.' },
    { icon: '🌅', title: 'Ochtenddienst', text: 'De vroege ochtend (06:00–09:00) brengt betrouwbare woon-werkrittten met goede beoordelingen.' },
  ];

  return fallbacks[now.getDate() % fallbacks.length];
}

async function loadWeather(container) {
  const body = container.querySelector('#weather-body');
  if (!body) return;
  try {
    const w = await getWeather();
    const cur = w.current;
    const today = w.daily;
    const info = codeInfo(cur.weather_code);
    const opps = rideOpportunities(w);
    body.innerHTML = `
      <div style="font-size:1.35rem;margin:4px 0">${info.e} ${Math.round(cur.temperature_2m)}° · ${info.d}</div>
      <div class="muted" style="font-size:.85rem">Vandaag: ${Math.round(today.temperature_2m_min[0])}° / ${Math.round(today.temperature_2m_max[0])}° · Kans op regen: ${today.precipitation_probability_max[0]}%</div>
      ${opps.length ? `<div style="margin-top:10px">
        <div class="muted" style="font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">Rittenradar — kansen vandaag</div>
        ${opps.map(o => `<div style="font-size:.88rem;margin:5px 0">${o.msg}</div>`).join('')}
      </div>` : ''}
    `;
  } catch (e) {
    body.innerHTML = `<p class="muted">Weerdata niet beschikbaar.</p>`;
  }
}
