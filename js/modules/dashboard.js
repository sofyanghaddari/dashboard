import { all, put } from '../db.js';
import { fmtMoney, startOfWeek, startOfMonth, ymd, sameDay, escapeHTML, uid, todayISO } from '../utils.js';
import { getNumber, getSetting } from '../settings.js';
import { celebrateGoalHit, celebrateStreak } from '../components/celebrate.js';
import { checkNewBadges } from '../achievements.js';
import { toast, ok, err, info } from '../components/toast.js';
import { getWeather, codeInfo, rideOpportunities } from '../weather.js';
import { getMascotState, shouldShame, pickShame } from '../mascot.js';
import { quoteOfDay } from '../quotes.js';
import { voiceAvailable, startVoice } from '../voice.js';
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
  const topTodos = todos.filter(t => !t.done && t.priority === 'high').slice(0, 3);
  const totalRides = sum(rides);
  const taxiGoals = goals.filter(g => Number(g.taxiPercent) > 0 && Number(g.target) > 0);

  const mascot = await getMascotState();
  const shame = await shouldShame();
  const insights = detectInsights(rides, hizb);
  const feas = goalFeasibility(monthIncome, monthlyGoal);
  const traj = monthlyGoal > 0 ? goalTrajectoryPath(rides, monthlyGoal) : null;

  // Empty state-detectie
  const isEmpty = rides.length === 0 && todos.length === 0 && cards.length === 0;

  container.innerHTML = `
    <div class="hero">
      <div class="mascot">${mascot.e}</div>
      <div class="hero-text">
        <div class="hero-msg">${shame ? pickShame() : escapeHTML(mascot.msg)}</div>
      </div>
    </div>

    <div class="row" style="margin-bottom:14px">
      <button class="btn secondary" id="open-calendar">Kalender</button>
      <button class="btn secondary" id="open-yr">Jaar</button>
      ${voiceAvailable() ? `<button class="btn" id="quick-voice" title="Inkomen inspreken">🎙️ Stem</button>` : ''}
    </div>

    <div class="card" id="weather-card">
      <h2 class="card-title">Weer & ritten-radar Amsterdam</h2>
      <div id="weather-body"><p class="muted">Laden…</p></div>
    </div>

    <div class="card primary-stat">
      <div class="stat-label">Vandaag</div>
      <div class="big-money">${fmtMoney(todayIncome)}</div>
      ${dailyGoal > 0 ? `
        <div class="progress-bar"><div class="progress-fill" style="width:${goalPct}%"></div></div>
        <div class="stat-sub">${goalPct}% van dagdoel (${fmtMoney(dailyGoal)})</div>
      ` : ''}
    </div>

    <div class="card">
      <h2 class="card-title">Deze maand</h2>
      <div class="big-money">${fmtMoney(monthIncome)}</div>
      ${monthlyGoal > 0 ? `
        <div class="progress-bar"><div class="progress-fill" style="width:${monthGoalPct}%"></div></div>
        <div class="stat-sub">${monthGoalPct}% van maanddoel (${fmtMoney(monthlyGoal)})</div>
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
            ? `<div><b>Op koers</b> — projectie: ${fmtMoney(feas.projectedFinal)} (${Math.round((feas.projectedFinal/monthlyGoal-1)*100)}% boven doel)</div>
               ${feas.daysNeeded && feas.daysNeeded < feas.daysLeft ? `<div class="muted" style="font-size:.8rem;margin-top:2px">Doel haal je over ~${feas.daysNeeded} dagen in dit tempo</div>` : ''}`
            : `<div><b>Tekort</b> — projectie: ${fmtMoney(feas.projectedFinal)} <span class="muted">(€${Math.round(feas.shortage)} tekort)</span></div>
               <div class="muted" style="font-size:.8rem;margin-top:2px">Nodig per resterende dag: <b>${fmtMoney(feas.dailyNeeded)}</b> (jij doet nu ${fmtMoney(feas.currentDaily)}/dag)</div>`}
        </div>` : ''}
      <div class="row" style="margin-top:10px;gap:18px">
        <div>
          <div class="stat-label">Week</div>
          <div class="stat-value-sm">${fmtMoney(weekIncome)}</div>
        </div>
        <div>
          <div class="stat-label">Projectie maand</div>
          <div class="stat-value-sm">${fmtMoney(projectedMonth)}</div>
        </div>
        ${monthDelta !== null ? `<div>
          <div class="stat-label">vs vorige maand</div>
          <div class="stat-value-sm ${monthDelta>=0?'trend-up':'trend-down'}">${monthDelta>=0?'↑':'↓'} ${Math.abs(monthDelta)}%</div>
        </div>` : ''}
      </div>
    </div>

    ${insights.length ? `
      <div class="card">
        <h2 class="card-title">Patronen</h2>
        ${insights.map(i => `<div class="insight-row"><span class="insight-icon">${i.icon}</span><span>${i.text}</span></div>`).join('')}
      </div>` : ''}

    ${isEmpty ? `
      <div class="card empty-cta">
        <h3>Welkom 👋</h3>
        <p class="muted">Begin met je eerste inkomen, hizb of taak. Tik op de tabs onderaan.</p>
      </div>` : ''}

    <div class="card">
      <h2 class="card-title">Laatste 30 dagen</h2>
      <div class="heatmap">
        ${last30.map(d => {
          const i = d.total > 0 ? Math.max(0.18, d.total / heatMax) : 0;
          return `<div class="heat-cell" style="${i>0?`background:linear-gradient(135deg,rgba(212,176,107,${i}),rgba(212,176,107,${i*0.6}))`:''}" title="${d.key}: ${fmtMoney(d.total)}"></div>`;
        }).join('')}
      </div>
      <div class="heat-legend"><span class="muted">minder</span><span class="heat-spec"></span><span class="muted">meer</span></div>
    </div>

    <div class="card">
      <h2 class="card-title">Koran</h2>
      <div>Vandaag: <b>${todayHizb ? 'afgevinkt ✓' : 'nog niet afgevinkt'}</b></div>
      <div class="muted">Streak: ${streak} dag${streak===1?'':'en'}</div>
    </div>

    <div class="card">
      <h2 class="card-title">Arabisch</h2>
      <div><b>${dueCards}</b> kaart${dueCards===1?'':'en'} vandaag te leren</div>
    </div>

    ${taxiGoals.length ? `
      <div class="card">
        <h2 class="card-title">Spaardoelen</h2>
        ${taxiGoals.map(g => {
          const saved = totalRides * (Number(g.taxiPercent) / 100);
          const pct = Math.min(100, Math.round(saved / Number(g.target) * 100));
          return `
            <div style="margin-bottom:10px">
              <div style="display:flex;justify-content:space-between"><b>${escapeHTML(g.title)}</b><span class="muted">${pct}%</span></div>
              <div class="muted" style="font-size:.8rem">${fmtMoney(saved)} / ${fmtMoney(Number(g.target))}</div>
              <div class="progress-bar" style="margin-top:4px"><div class="progress-fill" style="width:${pct}%"></div></div>
            </div>`;
        }).join('')}
      </div>` : ''}

    <div class="card">
      <h2 class="card-title">Top prioriteiten</h2>
      ${topTodos.length
        ? topTodos.map(t => `<div>• ${escapeHTML(t.title)}</div>`).join('')
        : '<div class="muted">Geen prioriteit-taken.</div>'}
    </div>
  `;

  loadWeather(container);
  container.querySelector('#open-calendar').onclick = () => window.openCalendar && window.openCalendar();
  container.querySelector('#open-yr').onclick = () => window.openYearReview && window.openYearReview();
  const voiceBtn = container.querySelector('#quick-voice');
  if (voiceBtn) voiceBtn.onclick = () => quickVoiceIncome(container, voiceBtn);

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

function quickVoiceIncome(container, btn) {
  info('Spreek bedrag, bv. "25 euro" of "vijfentwintig"');
  btn.classList.add('listening');
  startVoice({
    onResult: async (text) => {
      btn.classList.remove('listening');
      const m = text.toLowerCase().match(/(\d+([.,]\d+)?)/);
      const amount = m ? parseFloat(m[1].replace(',', '.')) : null;
      if (!amount || amount <= 0) { err('Geen bedrag herkend: "' + text + '"'); return; }
      await put('rides', { id: uid(), date: todayISO(), amount, source: 'daily', km: null, note: 'Voice: ' + text });
      ok(`${amount.toFixed(2)} toegevoegd`);
      render(container);
    },
    onError: (e) => { btn.classList.remove('listening'); err('Mislukt: ' + e); },
  });
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
      <div class="muted" style="font-size:.85rem">Vandaag: ${Math.round(today.temperature_2m_min[0])}° / ${Math.round(today.temperature_2m_max[0])}° · regen ${today.precipitation_probability_max[0]}%</div>
      ${opps.length ? `<div style="margin-top:10px">
        <div class="muted" style="font-size:.72rem;text-transform:uppercase;letter-spacing:.06em">Kansen</div>
        ${opps.map(o => `<div style="font-size:.88rem;margin:4px 0">${o.msg}</div>`).join('')}
      </div>` : ''}
    `;
  } catch (e) {
    body.innerHTML = `<p class="muted">Weer niet beschikbaar.</p>`;
  }
}
