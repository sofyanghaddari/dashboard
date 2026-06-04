import { all } from '../db.js';
import { fmtMoney, startOfWeek, startOfMonth, ymd, sameDay, escapeHTML } from '../utils.js';
import { getNumber } from '../settings.js';
import { celebrateGoalHit, celebrateStreak } from '../components/celebrate.js';
import { checkNewBadges, BADGES } from '../achievements.js';
import { toast } from '../components/toast.js';
import { getWeather, codeInfo, rideOpportunities } from '../weather.js';
import { getMascotState, shouldShame, pickShame } from '../mascot.js';
import { quoteOfDay } from '../quotes.js';

let _tickTimer = null;

export async function render(container) {
  if (_tickTimer) { clearInterval(_tickTimer); _tickTimer = null; }

  const [rides, hizb, todos, cards, goals, shifts] = await Promise.all([
    all('rides'), all('hizb_log'), all('todos'), all('cards'), all('goals'), all('shifts'),
  ]);
  const now = new Date();
  const todayRides = rides.filter(r => sameDay(new Date(r.date), now));
  const weekRides  = rides.filter(r => new Date(r.date) >= startOfWeek(now));
  const monthRides = rides.filter(r => new Date(r.date) >= startOfMonth(now));
  const sum = (arr) => arr.reduce((s, r) => s + Number(r.amount || 0), 0);
  const todayIncome = sum(todayRides);
  const monthIncome = sum(monthRides);

  const dailyGoal = getNumber('dailyIncomeGoal');
  const goalPct = dailyGoal > 0 ? Math.min(100, Math.round(todayIncome / dailyGoal * 100)) : 0;
  const taxPct = getNumber('taxReservePercent');
  const monthTax = monthIncome * (taxPct / 100);

  const today = ymd();
  const todayHizb = hizb.some(h => h.date === today);
  const doneSet = new Set(hizb.map(h => h.date));
  let streak = 0;
  const cur = new Date();
  while (doneSet.has(ymd(cur))) { streak++; cur.setDate(cur.getDate() - 1); }

  const dueCards = cards.filter(c => c.dueDate <= today).length;
  const topTodos = todos.filter(t => !t.done && t.priority === 'high').slice(0, 3);

  const totalRides = sum(rides);
  const taxiGoals = goals.filter(g => Number(g.taxiPercent) > 0 && Number(g.target) > 0);

  const activeShift = shifts.find(s => !s.endTime);

  // Maand-vs-vorige maand
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const lastMonthRides = rides.filter(r => {
    const d = new Date(r.date);
    return d >= lastMonthStart && d <= lastMonthEnd;
  });
  const lastMonthIncome = sum(lastMonthRides);
  const daysIntoMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const projectedMonth = daysIntoMonth > 0 ? (monthIncome / daysIntoMonth) * daysInMonth : 0;
  const lastMonthAtSamePoint = daysIntoMonth > 0 ? (lastMonthIncome / lastMonthEnd.getDate()) * daysIntoMonth : 0;
  const monthDelta = lastMonthAtSamePoint > 0 ? ((monthIncome - lastMonthAtSamePoint) / lastMonthAtSamePoint) * 100 : 0;

  const mascot = await getMascotState();
  const shame = await shouldShame();
  const quote = quoteOfDay();

  const suggestions = [];
  if (activeShift) {
    const shiftHours = (new Date() - new Date(activeShift.startTime)) / 3600000;
    if (shiftHours > 10) suggestions.push('☕ Je werkt al meer dan 10 uur — even pauze?');
  }
  if (!todayHizb && new Date().getHours() >= 20) suggestions.push('📖 Vandaag nog geen hizb — voor je gaat slapen?');
  const dayName = ['zo','ma','di','wo','do','vr','za'][new Date().getDay()];
  const sameDayRides = rides.filter(r => ['zo','ma','di','wo','do','vr','za'][new Date(r.date).getDay()] === dayName);
  if (sameDayRides.length >= 5) {
    const avgSameDay = sameDayRides.reduce((s, r) => s + Number(r.amount || 0), 0) / new Set(sameDayRides.map(r => ymd(new Date(r.date)))).size;
    if (avgSameDay > 0 && todayIncome < avgSameDay * 0.5 && new Date().getHours() >= 14) {
      suggestions.push(`📊 Op ${['zondag','maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag'][new Date().getDay()]} verdien je gem ${fmtMoney(avgSameDay)}. Vandaag pas ${fmtMoney(todayIncome)}.`);
    }
  }

  container.innerHTML = `
    <div class="hero">
      <div class="mascot">${mascot.e}</div>
      <div class="hero-text">
        <div class="hero-msg">${shame ? pickShame() : escapeHTML(mascot.msg)}</div>
        <div class="hero-quote">"${escapeHTML(quote.t)}" <span class="muted">— ${escapeHTML(quote.s)}</span></div>
      </div>
    </div>

    ${activeShift ? `
      <div class="card accent-card">
        <h2>⏱️ Dienst actief</h2>
        <p class="big-money" id="dash-shift-timer">--:--:--</p>
        <p class="muted">Sinds ${new Date(activeShift.startTime).toLocaleTimeString('nl-NL', {hour:'2-digit',minute:'2-digit'})}</p>
      </div>` : ''}

    <div class="row" style="margin-bottom:12px">
      <button class="btn secondary" id="open-calendar">📅 Kalender</button>
      <button class="btn secondary" id="open-yr">📊 Jaaroverzicht</button>
    </div>

    <div class="card" id="weather-card">
      <h2>🌤️ Weer & ritten-radar</h2>
      <p class="muted" id="weather-body">Laden…</p>
    </div>

    ${suggestions.length ? `
      <div class="card suggestion-card">
        <h2>💡 Suggesties</h2>
        ${suggestions.map(s => `<p>${s}</p>`).join('')}
      </div>` : ''}

    <div class="card">
      <h2>🚖 Vandaag</h2>
      <p class="big-money">${fmtMoney(todayIncome)}</p>
      ${dailyGoal > 0 ? `
        <div class="progress-bar" style="margin-top:8px"><div class="progress-fill" style="width:${goalPct}%"></div></div>
        <p class="muted" style="font-size:.85rem;margin-top:4px">${goalPct}% van doel (${fmtMoney(dailyGoal)})</p>
      ` : ''}
      <p class="muted" style="margin-top:8px">Deze week: ${fmtMoney(sum(weekRides))} · Deze maand: ${fmtMoney(monthIncome)}</p>
      ${lastMonthIncome > 0 ? `
        <p class="muted" style="font-size:.85rem">
          📊 Vergeleken met vorige maand op dag ${daysIntoMonth}:
          ${monthDelta >= 0 ? '🟢 +' : '🔴 '}${monthDelta.toFixed(0)}%
          <span class="muted">(toen ${fmtMoney(lastMonthAtSamePoint)})</span>
        </p>` : ''}
      ${projectedMonth > monthIncome ? `<p class="muted" style="font-size:.85rem">🔮 Projectie einde maand: <b class="money">${fmtMoney(projectedMonth)}</b></p>` : ''}
      ${taxPct > 0 ? `<p class="muted" style="font-size:.85rem">💰 Belasting deze maand: ${fmtMoney(monthTax)} (${taxPct}%)</p>` : ''}
    </div>

    <div class="card">
      <h2>📖 Koran</h2>
      <p>Vandaag: <b>${todayHizb ? 'Afgevinkt ✓' : 'Nog niet afgevinkt'}</b></p>
      <p class="muted">Streak: ${streak} dag${streak===1?'':'en'}</p>
    </div>

    <div class="card">
      <h2>📚 Arabisch</h2>
      <p><b>${dueCards}</b> kaart${dueCards===1?'':'en'} vandaag te leren</p>
    </div>

    ${taxiGoals.length ? `
      <div class="card">
        <h2>🎯 Taxi-spaardoelen</h2>
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
      <h2>✅ Top prioriteiten</h2>
      ${topTodos.length
        ? topTodos.map(t => `<p>• ${escapeHTML(t.title)}</p>`).join('')
        : '<p class="muted">Geen prioriteit-taken.</p>'}
    </div>
  `;

  container.querySelector('#open-calendar').onclick = () => window.openCalendar && window.openCalendar();
  container.querySelector('#open-yr').onclick = () => window.openYearReview && window.openYearReview();

  // Weer ophalen + opportunities tonen
  loadWeather(container);

  // Dagdoel-viering
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
      setTimeout(() => toast(`${b.emoji} <b>Badge verdiend:</b> ${b.name}`, { type: 'ok', duration: 5000 }), 800 + i * 1200);
    });
  });

  if (activeShift) {
    const tick = () => {
      const el = container.querySelector('#dash-shift-timer');
      if (!el) return;
      const sec = Math.floor((new Date() - new Date(activeShift.startTime)) / 1000);
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = sec % 60;
      el.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    };
    tick();
    _tickTimer = setInterval(tick, 1000);
  }
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
      <p style="font-size:1.3rem;margin:4px 0">${info.e} ${Math.round(cur.temperature_2m)}° · ${info.d}</p>
      <p class="muted" style="font-size:.85rem">Vandaag: ${Math.round(today.temperature_2m_min[0])}° / ${Math.round(today.temperature_2m_max[0])}° · regen ${today.precipitation_probability_max[0]}%</p>
      ${opps.length ? `<div style="margin-top:8px">
        <div class="muted" style="font-size:.78rem;text-transform:uppercase;letter-spacing:.04em">Kansen</div>
        ${opps.map(o => `<p style="font-size:.9rem;margin:4px 0">${o.msg}</p>`).join('')}
      </div>` : ''}
      <p style="margin-top:10px"><a href="https://www.schiphol.nl/nl/aankomsten/" target="_blank" style="color:var(--accent)">🛬 Live Schiphol-aankomsten</a></p>
    `;
  } catch (e) {
    body.innerHTML = `<p class="muted">Weer niet beschikbaar (${e.message || e}). Geef toestemming voor locatie in je browser-instellingen.</p>`;
  }
}
