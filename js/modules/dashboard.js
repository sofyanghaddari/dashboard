import { all, put } from '../db.js';
import { fmtMoney, startOfWeek, startOfMonth, ymd, sameDay, escapeHTML, orderedHabits, effectiveNow, effectiveDate } from '../utils.js';
import { getNumber, getSetting } from '../settings.js';
import { icon } from '../icons.js';
import { celebrateGoalHit, celebrateStreak, celebrateTask, celebrateBadge } from '../components/celebrate.js';
import { checkNewBadges } from '../achievements.js';
import { toast } from '../components/toast.js';
import { getWeather, codeInfo, rideOpportunities } from '../weather.js';
import { getMascotState, shouldShame, pickShame } from '../mascot.js';
import { detectInsights, goalFeasibility, goalTrajectoryPath } from '../insights.js';
import { initPrivacyToggle } from '../privacy.js';
import { initCountUps } from '../animate.js';
import { qiblaCard, initQiblaCard } from '../qibla.js';
import { mountTodayPanel } from '../today-panel.js';

let weatherAbortCtrl = null;

// Hadith/Woord-van-de-dag: offset 0 = vandaag, -1 = gisteren, enz.
// Arrays worden door de widget-functies in deze module-vars gezet zodat de
// navigatie- en voorlees-knoppen er ook bij kunnen.
let _HADITHS = null, _WOORDEN = null;
let _hadithOffset = 0, _woordOffset = 0;
let _ttsActiveBtn = null;

// Grote, realistische geanimeerde weer-scène (banner). Past zich aan op de
// actuele weercode + dag/nacht. Alleen transform/opacity-animaties (vloeiend).
function weatherScene(code, info, cur, day) {
  const h = new Date().getHours();
  const isNight = h < 6 || h >= 21;

  let type;
  if      (code === 0)              type = isNight ? 'clear-night' : 'clear';
  else if (code <= 2)               type = isNight ? 'partly-night' : 'partly';
  else if (code === 3)              type = 'cloudy';
  else if (code <= 48)              type = 'fog';
  else if (code <= 57)              type = 'drizzle';
  else if (code <= 67)              type = 'rain';
  else if (code <= 77)              type = 'snow';
  else if (code <= 82)              type = 'rain';
  else                              type = 'storm';

  const sun   = `<div class="wx-sun"><div class="wx-sun-glow"></div><div class="wx-sun-core"></div></div>`;
  const moon  = `<div class="wx-moon2"><div class="wx-moon-crater" style="top:30%;left:55%"></div><div class="wx-moon-crater" style="top:55%;left:35%;width:5px;height:5px"></div></div>`;
  const stars = Array.from({ length: 14 }, (_, i) =>
    `<span class="wx-star2" style="--x:${(i * 37 + 7) % 96}%;--y:${(i * 53 + 5) % 60}%;--d:${(i % 5) * 0.6}s;--s:${i % 3 === 0 ? 2.2 : 1.5}px"></span>`).join('');
  const cloud = (cls, x, y, scale, dur, delay) =>
    `<div class="wx-cloud2 ${cls}" style="--x:${x}%;--y:${y}%;--s:${scale};--dur:${dur}s;--delay:${delay}s"></div>`;
  const rain = (n, cls) => Array.from({ length: n }, (_, i) =>
    `<span class="wx-rain ${cls}" style="--x:${(i * 100 / n + (i % 3) * 4)}%;--d:${((i * 0.13) % 1).toFixed(2)}s;--dur:${cls === 'heavy' ? 0.55 : 0.85}s"></span>`).join('');
  const snow = (n) => Array.from({ length: n }, (_, i) =>
    `<span class="wx-snow" style="--x:${(i * 100 / n)}%;--d:${((i * 0.31) % 2).toFixed(2)}s;--dur:${(3 + (i % 3))}s;--sway:${(i % 2 ? 8 : -8)}px"></span>`).join('');
  const bolt  = `<div class="wx-flash"></div><svg class="wx-bolt" viewBox="0 0 24 48" fill="none"><path d="M14 2 L5 26 H12 L9 46 L20 20 H13 Z" fill="#fde68a" stroke="#fff" stroke-width="0.5"/></svg>`;
  const fog   = `<span class="wx-fogband" style="top:38%;--d:0s"></span><span class="wx-fogband" style="top:54%;--d:1.3s"></span><span class="wx-fogband" style="top:70%;--d:2.6s"></span>`;

  let layers = '';
  switch (type) {
    case 'clear':        layers = sun; break;
    case 'clear-night':  layers = stars + moon; break;
    case 'partly':       layers = sun + cloud('soft', 52, 52, 1, 26, 0); break;
    case 'partly-night': layers = stars + moon + cloud('soft dim', 52, 55, 1, 28, 0); break;
    case 'cloudy':       layers = cloud('soft', 22, 40, 1.15, 30, 0) + cloud('soft', 60, 58, 1, 34, 2); break;
    case 'fog':          layers = cloud('soft dim', 40, 36, 1.2, 32, 0) + fog; break;
    case 'drizzle':      layers = cloud('grey', 38, 34, 1.15, 30, 0) + rain(8, 'light'); break;
    case 'rain':         layers = cloud('grey', 28, 32, 1.2, 30, 0) + cloud('grey', 62, 44, 1, 34, 2) + rain(14, ''); break;
    case 'snow':         layers = cloud('grey', 38, 34, 1.15, 32, 0) + snow(12); break;
    case 'storm':        layers = cloud('dark', 28, 30, 1.25, 28, 0) + cloud('dark', 62, 42, 1.05, 32, 2) + rain(16, 'heavy') + bolt; break;
  }

  const min = Math.round(day.temperature_2m_min[0]);
  const max = Math.round(day.temperature_2m_max[0]);
  const rainPct = day.precipitation_probability_max[0];

  return `
    <div class="wx-stage wx-${type}">
      ${layers}
      <div class="wx-stage-info">
        <div class="wx-stage-temp">${Math.round(cur.temperature_2m)}°</div>
        <div class="wx-stage-sub">
          <div class="wx-stage-desc">${info.d}</div>
          <div class="wx-stage-range">${min}° / ${max}°${rainPct != null ? ` · Regen ${rainPct}%` : ''}</div>
        </div>
      </div>
    </div>`;
}

// 🌅 Dag/nacht-lucht achter de begroeting: zon overdag, maan + twinkelende sterren 's nachts.
function skyScene(now) {
  const hr = now.getHours() + now.getMinutes() / 60;
  let phase;
  if (hr < 5.5 || hr >= 21) phase = 'night';
  else if (hr < 8) phase = 'dawn';
  else if (hr < 18) phase = 'day';
  else if (hr < 19.5) phase = 'dusk';
  else phase = 'night';
  const orb = phase === 'night' ? '<div class="sky-moon"></div>' : '<div class="sky-sun"></div>';
  let stars = '';
  if (phase === 'night' || phase === 'dusk') {
    const pts = [[12,22],[26,12],[38,30],[52,16],[64,26],[76,12],[88,28],[20,40],[70,42]];
    stars = pts.map((p, i) => `<i class="sky-star" style="left:${p[0]}%;top:${p[1]}%;animation-delay:${(i % 5) * 0.7}s"></i>`).join('');
  }
  let cloud = '';
  if (phase === 'day' || phase === 'dawn') cloud = '<div class="sky-cloud sky-cloud-1"></div><div class="sky-cloud sky-cloud-2"></div>';
  return `<div class="sky-scene sky-${phase}" aria-hidden="true">${orb}${stars}${cloud}</div>`;
}

export async function render(container) {
  const [rides, hizb, todos, cards, goals, habits, habitLog, taxiExpenses] = await Promise.all([
    all('rides'), all('hizb_log'), all('todos'), all('cards'), all('goals'),
    all('habits').catch(() => []), all('habit_log').catch(() => []),
    all('taxi_expenses').catch(() => []),
  ]);
  const now = effectiveNow(); // Dag begint om DAY_CUTOFF_HOUR, niet om 00:00
  const today = ymd(now);

  const sum = (arr) => arr.reduce((s, r) => s + Number(r.amount || 0), 0);
  const todayIncome  = sum(rides.filter(r => sameDay(effectiveDate(new Date(r.date)), now)));
  const weekIncome   = sum(rides.filter(r => effectiveDate(new Date(r.date)) >= startOfWeek(now)));
  const monthIncome  = sum(rides.filter(r => effectiveDate(new Date(r.date)) >= startOfMonth(now)));

  const dailyGoal   = getNumber('dailyIncomeGoal');
  const monthlyGoal = getNumber('monthlyIncomeGoal');
  const goalPct      = dailyGoal > 0 ? Math.min(100, Math.round(todayIncome / dailyGoal * 100)) : 0;

  // Netto vandaag via IndexedDB taxi_expenses (eenmalige kosten tellen niet mee als vaste last)
  const dailyCost = taxiExpenses.reduce((s, e) => {
    const a = Number(e.amount) || 0;
    if (e.frequency === 'eenmalig') return s;
    return s + (e.frequency === 'weekly' ? a * (52 / 12) : a);
  }, 0) / 30;
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

  // Gewoontes vandaag
  const doneHabitIds = new Set(habitLog.filter(l => l.date === today && l.done).map(l => l.habitId));
  const habitsDoneToday = habits.filter(h => doneHabitIds.has(h.id)).length;

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
      ${skyScene(now)}
      <div class="dagstart-top">
        <div>
          <div class="dagstart-greeting">${begroeting}, ${escapeHTML(userName)}</div>
          <div class="dagstart-date">${datumStr}</div>
        </div>
        <button class="privacy-toggle" title="Toon bedragen" aria-label="Toon bedragen"></button>
      </div>
      <div class="dagstart-stats">
        <div class="dagstart-stat">
          <div class="dagstart-stat-val money blurred-amount" data-countup="${todayIncome}">${fmtMoney(todayIncome)}</div>
          <div class="dagstart-stat-lbl">Vandaag${dailyGoal > 0 ? ` · ${goalPct}%` : ''}</div>
        </div>
        <div class="dagstart-stat">
          <div class="dagstart-stat-val money blurred-amount" data-countup="${monthIncome}">${fmtMoney(monthIncome)}</div>
          <div class="dagstart-stat-lbl">Maand${monthlyGoal > 0 ? ` · ${monthGoalPct}%` : ''}</div>
        </div>
        <div class="dagstart-stat">
          <div class="dagstart-stat-val" style="color:${todayHizb ? 'var(--ok)' : 'var(--text-faint)'}">${todayHizb ? '✓' : '–'}</div>
          <div class="dagstart-stat-lbl">Hizb</div>
        </div>
      </div>
    </div>

    ${tip ? `
    <div class="card tip-card">
      <div class="tip-card-header">
        <span class="tip-label">${tip.isShame ? (tip.mascot || '') : 'Tip van de dag'}</span>
        ${!tip.isShame && !tip.smart ? `<button class="tip-next" id="tip-next-btn" title="Volgende tip">›</button>` : ''}
      </div>
      <div class="tip-text" id="tip-text-content">${tip.isShame ? escapeHTML(tip.text) : tip.text}</div>
    </div>` : ''}

    <!-- VANDAAG — taken + agenda van vandaag, snel toevoegen & afvinken -->
    <div id="today-panel-mount"></div>

    <!-- HADITH VAN DE DAG -->
    ${hadithWidget()}

    <!-- WOORD VAN DE DAG -->
    ${woordWidget(now)}

    <!-- QUICK ACTIONS -->
    <div class="quick-actions">
      <button class="quick-action-btn" data-tab="taxi">
        <div class="quick-action-icon">${icon('money')}</div>
        <div class="quick-action-label">Inkomen<span class="quick-action-sub">Vandaag noteren</span></div>
      </button>
      <button class="quick-action-btn" data-tab="todo">
        <div class="quick-action-icon">${icon('check')}</div>
        <div class="quick-action-label">Taken<span class="quick-action-sub">${openTodos.length} open${todayTodos.length ? `, ${todayTodos.length} vandaag` : ''}</span></div>
      </button>
      <button class="quick-action-btn" data-tab="geloof">
        <div class="quick-action-icon">${icon('book')}</div>
        <div class="quick-action-label">Koran<span class="quick-action-sub">${todayHizb ? 'Vandaag ✓' : 'Nog open'}${streak > 0 ? ` · ${streak}d streak` : ''}</span></div>
      </button>
      <button class="quick-action-btn" data-tab="arabic">
        <div class="quick-action-icon">${icon('books')}</div>
        <div class="quick-action-label">Arabisch<span class="quick-action-sub">${dueCards > 0 ? `${dueCards} te herhalen` : 'Alles bij'}</span></div>
      </button>
    </div>

    <!-- QIBLA -->
    ${qiblaCard()}

    <!-- KALENDER KNOPPEN -->
    <div class="db-cal-btns">
      <button class="btn secondary" id="open-calendar">${icon('calendar')} Kalender</button>
      <button class="btn secondary" id="open-yr">${icon('stats')} Jaar</button>
    </div>

    <!-- WEGWERKZAAMHEDEN -->
    ${wegWidget()}

    <!-- WEER -->
    <div class="card" id="weather-card">
      <h2 class="card-title">Weer &amp; rittenradar Amsterdam</h2>
      <div id="weather-body"><p class="muted" style="font-size:.875rem">Laden…</p></div>
    </div>

    <!-- NS TREIN-STORINGEN -->
    <div class="card" id="ns-card">
      <div class="daycard-head">
        <h2 class="card-title">NS · treinverkeer</h2>
        <button class="daycard-btn" id="ns-refresh" title="Vernieuwen" aria-label="Vernieuwen">⟳</button>
      </div>
      <div id="ns-body"><p class="muted" style="font-size:.875rem">Laden…</p></div>
    </div>

    ${taxiGoals.length ? `
    <div class="card">
      <h2 class="card-title">Spaardoelen</h2>
      ${taxiGoals.map(g => {
        const saved = totalRides * (Number(g.taxiPercent) / 100);
        const pct   = Math.min(100, Math.round(saved / Number(g.target) * 100));
        const remaining = Math.max(0, Number(g.target) - saved);
        return `
          <div class="db-goal-item">
            <div class="db-goal-hd">
              <b class="db-goal-title">${escapeHTML(g.title)}</b>
              <span class="db-goal-pct">${pct}%</span>
            </div>
            <div class="db-goal-detail"><span class="blurred-amount">${fmtMoney(saved)}</span> van <span class="blurred-amount">${fmtMoney(Number(g.target))}</span>${remaining>0?` · nog <span class="blurred-amount">${fmtMoney(remaining)}</span>`:' · behaald 🎉'}</div>
            <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
          </div>`;
      }).join('')}
    </div>` : ''}

    <!-- GEWOONTES VANDAAG -->
    ${habits.length ? `
    <div class="card">
      <h2 class="card-title" style="display:flex;justify-content:space-between;align-items:center">
        Gewoontes vandaag
        <span style="font-weight:500;font-size:.8rem;color:${habitsDoneToday===habits.length?'var(--ok)':'var(--text-dim)'}">${habitsDoneToday}/${habits.length}</span>
      </h2>
      ${orderedHabits(habits).map(h => {
        const done = doneHabitIds.has(h.id);
        const strip = Array.from({length:14},(_,d) => {
          const date = ymd(new Date(Date.now() - (13-d)*86400000));
          const dd = habitLog.some(l => l.habitId===h.id && l.date===date && l.done);
          return `<span class="hab-day ${dd?'done':''}" title="${date}"></span>`;
        }).join('');
        return `<div class="db-habit-row">
          <button class="db-habit-check ${done?'done':''}" data-htoggle="${h.id}">${done?'✓':''}</button>
          <div class="db-habit-body">
            <div class="db-habit-name">${h.emoji||'✨'} ${escapeHTML(h.name)}</div>
            <div class="habit-strip">${strip}</div>
          </div>
        </div>`;
      }).join('')}
      <button class="btn secondary block" style="margin-top:12px;font-size:.85rem" data-tab="doelen">Alle gewoontes →</button>
    </div>` : ''}

    ${insights.length ? `
    <div class="card">
      <h2 class="card-title">Patroonanalyse</h2>
      ${insights.map(i => `<div class="insight-row"><span class="insight-icon">${icon(i.icon) || i.icon}</span><span>${i.text}</span></div>`).join('')}
    </div>` : ''}

    ${isEmpty ? `
    <div class="card empty-cta">
      <h3>Welkom bij je dashboard</h3>
      <p class="muted">Begin met het bijhouden van je eerste inkomen, hizb of taak via de tabs onderaan.</p>
    </div>` : ''}
  `;

  // Habit toggle handlers — partial update only (no full re-render)
  container.querySelectorAll('[data-htoggle]').forEach(btn => {
    btn.onclick = async () => {
      if (btn.disabled) return;
      btn.disabled = true;
      const id = btn.dataset.htoggle;
      const key = today + ':' + id;
      const cur = await all('habit_log');
      const existing = cur.find(l => l.id === key);
      const newDone = existing ? !existing.done : true;
      if (existing) await put('habit_log', { ...existing, done: newDone });
      else          await put('habit_log', { id: key, date: today, habitId: id, done: true });

      // Partial DOM update — only mutate this button and the counter
      btn.classList.toggle('done', newDone);
      btn.textContent = newDone ? '✓' : '';
      btn.disabled = false;
      if (newDone) celebrateTask();

      const allBtns = [...container.querySelectorAll('[data-htoggle]')];
      const doneCount = allBtns.filter(b => b.classList.contains('done')).length;
      const total = allBtns.length;
      const countEl = btn.closest('.card')?.querySelector('.card-title span');
      if (countEl) {
        countEl.textContent = `${doneCount}/${total}`;
        countEl.style.color = doneCount === total ? 'var(--ok)' : 'var(--text-dim)';
      }
    };
  });

  // Schedule weekly income summary (Sunday 18:00) via service worker
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SCHEDULE_WEEKLY_SUMMARY', income: weekIncome });
  }

  loadWeather(container);
  loadNs(container);
  initCountUps(container);
  initQiblaCard(container);
  mountTodayPanel(container);
  bindDayWidgets(container);
  _injectArabicVoiceTip(container);
  container.querySelector('#open-calendar').onclick = () => window.openCalendar && window.openCalendar();
  container.querySelector('#open-yr').onclick = () => window.openYearReview && window.openYearReview();

  container.querySelectorAll('[data-tab]').forEach(btn => {
    btn.onclick = () => {
      const val = btn.dataset.tab;
      if (val === 'arabic') {
        // Geloof-tab openen op de Arabisch sub-tab
        document.getElementById('view').dataset.geloofSub = 'arabic';
        document.querySelector('.tab[data-route="geloof"]')?.click();
      } else if (isNaN(+val)) {
        // Route-naam: navigeer via tabbar
        document.querySelector(`.tab[data-route="${val}"]`)?.click();
      } else {
        // Numerieke index (legacy)
        document.querySelectorAll('.tab')[+val]?.click();
      }
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
      setTimeout(() => celebrateBadge(b), 700 + i * 3600);
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

  const todayDue = todos.filter(t => !t.done && !t.savedForLater && t.dueDate === ymd(now));
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
    { ar: 'الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ', nl: 'De moslim is degene van wiens tong en handen de moslims veilig zijn.', bron: 'Overgeleverd door Muslim · nr. 41' },
    { ar: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ', nl: 'De beste van jullie is wie de Koran leert en hem onderwijst.', bron: 'Overgeleverd door al-Bukhari · nr. 5027' },
    { ar: 'يَسِّرُوا وَلَا تُعَسِّرُوا وَبَشِّرُوا وَلَا تُنَفِّرُوا', nl: 'Maak het gemakkelijk en maak het niet moeilijk; breng goed nieuws en jaag mensen niet weg.', bron: 'Overgeleverd door al-Bukhari · nr. 69' },
    { ar: 'مَنْ صَمَتَ نَجَا', nl: 'Wie zwijgt, is behouden.', bron: 'Overgeleverd door at-Tirmidhi · nr. 2501' },
    { ar: 'الرَّاحِمُونَ يَرْحَمُهُمُ الرَّحْمَنُ، ارْحَمُوا مَنْ فِي الأَرْضِ يَرْحَمْكُمْ مَنْ فِي السَّمَاءِ', nl: 'De barmhartigen, met hen is de Erbarmer barmhartig. Wees barmhartig voor wie op aarde zijn, dan is Hij die in de hemel is barmhartig voor jullie.', bron: 'Overgeleverd door at-Tirmidhi · nr. 1924' },
    { ar: 'أَعْطُوا الأَجِيرَ أَجْرَهُ قَبْلَ أَنْ يَجِفَّ عَرَقُهُ', nl: 'Geef de arbeider zijn loon voordat zijn zweet opdroogt.', bron: 'Overgeleverd door Ibn Majah · nr. 2443' },
    { ar: 'الْمُؤْمِنُ الْقَوِيُّ خَيْرٌ وَأَحَبُّ إِلَى اللَّهِ مِنَ الْمُؤْمِنِ الضَّعِيفِ وَفِي كُلٍّ خَيْرٌ', nl: 'De sterke gelovige is beter en geliefder bij Allah dan de zwakke gelovige — en in beide is er goed.', bron: 'Overgeleverd door Muslim · nr. 2664' },
    { ar: 'ادْعُوا اللَّهَ وَأَنْتُمْ مُوقِنُونَ بِالإِجَابَةِ', nl: 'Smeek Allah terwijl jullie overtuigd zijn van verhoring.', bron: 'Overgeleverd door at-Tirmidhi · nr. 3479' },
    { ar: 'إِنَّ اللَّهَ رَفِيقٌ يُحِبُّ الرِّفْقَ فِي الأَمْرِ كُلِّهِ', nl: 'Allah is zachtmoedig en houdt van zachtheid in alle zaken.', bron: 'Overgeleverd door al-Bukhari · nr. 6024' },
    { ar: 'إِنَّ الصِّدْقَ يَهْدِي إِلَى الْبِرِّ وَإِنَّ الْبِرَّ يَهْدِي إِلَى الْجَنَّةِ', nl: 'Waarachtigheid leidt naar het goede, en het goede leidt naar het Paradijs.', bron: 'Overgeleverd door al-Bukhari · nr. 6094' },
    { ar: 'خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ', nl: 'De beste mens is degene die het meest van nut is voor de mensen.', bron: 'Overgeleverd door at-Tabarani · al-Mu\'jam al-Awsat (nr. 5787)' },
    { ar: 'اجْتَمِعُوا عَلَى طَعَامِكُمْ وَاذْكُرُوا اسْمَ اللَّهِ عَلَيْهِ يُبَارَكْ لَكُمْ فِيهِ', nl: 'Komt samen bij jullie eten en noemt de naam van Allah erover, dan wordt het voor jullie gezegend.', bron: 'Overgeleverd door Abu Dawud · nr. 3764' },
    { ar: 'مَا نَقَصَتْ صَدَقَةٌ مِنْ مَالٍ وَمَا زَادَ اللَّهُ عَبْدًا بِعَفْوٍ إِلَّا عِزًّا', nl: 'Liefdadigheid vermindert geen bezit, en Allah vermeerdert een dienaar die vergeeft slechts in aanzien.', bron: 'Overgeleverd door Muslim · nr. 2588' },
    { ar: 'مَا يُصِيبُ الْمُسْلِمَ مِنْ نَصَبٍ وَلَا وَصَبٍ وَلَا هَمٍّ وَلَا حُزْنٍ وَلَا أَذًى وَلَا غَمٍّ حَتَّى الشَّوْكَةِ يُشَاكُهَا إِلَّا كَفَّرَ اللَّهُ بِهَا مِنْ خَطَايَاهُ', nl: 'Geen vermoeidheid, ziekte, zorg, verdriet, leed of benauwdheid treft een moslim — zelfs niet een doorn die hem prikt — of Allah wist daarmee een deel van zijn fouten uit.', bron: 'Overgeleverd door al-Bukhari · nr. 5641' },
    { ar: 'سَدِّدُوا وَقَارِبُوا وَأَبْشِرُوا، فَإِنَّهُ لَا يُدْخِلُ أَحَدًا الْجَنَّةَ عَمَلُهُ، قَالُوا: وَلَا أَنْتَ يَا رَسُولَ اللَّهِ؟ قَالَ: وَلَا أَنَا، إِلَّا أَنْ يَتَغَمَّدَنِيَ اللَّهُ بِمَغْفِرَةٍ وَرَحْمَةٍ', nl: 'Wees standvastig en gematigd, en verheug je: niemand wordt door zijn daden het Paradijs binnengelaten. Zij vroegen: "Ook u niet, o Boodschapper van Allah?" Hij zei: "Ook ik niet, tenzij Allah mij omhult met vergeving en barmhartigheid."', bron: 'Overgeleverd door al-Bukhari · nr. 6467' },
    { ar: 'مَنْ يُرِدِ اللَّهُ بِهِ خَيْرًا يُفَقِّهْهُ فِي الدِّينِ', nl: 'Voor wie Allah het goede wenst, schenkt Hij begrip van de religie.', bron: 'Overgeleverd door al-Bukhari · nr. 71' },
    { ar: 'الْمَرْءُ عَلَى دِينِ خَلِيلِهِ فَلْيَنْظُرْ أَحَدُكُمْ مَنْ يُخَالِلُ', nl: 'De mens volgt het geloof van zijn boezemvriend; laat ieder van jullie dus opletten met wie hij bevriend raakt.', bron: 'Overgeleverd door Abu Dawud · nr. 4833' },
    { ar: 'أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ', nl: 'De geliefdste daden bij Allah zijn de meest standvastige, ook al zijn ze klein.', bron: 'Overgeleverd door al-Bukhari · nr. 6465' },
    { ar: 'إِنَّ مِنْ أَكْمَلِ الْمُؤْمِنِينَ إِيمَانًا أَحْسَنُهُمْ خُلُقًا وَأَلْطَفُهُمْ بِأَهْلِهِ', nl: 'Tot de gelovigen met het meest volledige geloof behoort wie het beste karakter heeft en het zachtaardigst is voor zijn gezin.', bron: 'Overgeleverd door at-Tirmidhi · nr. 2612' },
  ];
  _HADITHS = HADITHS;
  return dayCard('hadith', _hadithOffset);
}

function woordWidget(now) {
  const WOORDEN = [
    { w: 'ambivalent', def: 'Je voelt twee dingen tegelijk: je wilt het wel én niet.', tip: 'Ambi = twee kanten — je wordt twee kanten op getrokken.', zin: 'Ik ben ambivalent over dat aanbod: het geld is goed, maar de baan klinkt zwaar.' },
    { w: 'recalcitrant', def: 'Dwars en koppig; doet niet mee en werkt tegen.', tip: 'Denk aan iemand die niet meebeweegt, wat je ook zegt.', zin: 'De klant was zo recalcitrant dat geen enkele oplossing hem tevreden stelde.' },
    { w: 'sereen', def: 'Heel rustig en kalm, zonder onrust.', tip: 'Denk aan een serene zee — vlak, stil, geen golven.', zin: 'Ze keek sereen uit het raam terwijl de regen zachtjes viel.' },
    { w: 'laconiek', def: 'Kort en droog; gebruikt weinig woorden.', tip: 'Veel zeggen in heel weinig woorden, zonder drukte.', zin: 'Op de vraag hoe de rit ging, antwoordde hij laconiek: "Prima."' },
    { w: 'pertinent', def: 'Precies over het onderwerp; raakt de kern.', tip: 'Als een pijl die recht in de roos gaat.', zin: 'Dat is een pertinente vraag die ik mezelf nog niet had gesteld.' },
    { w: 'tentatief', def: 'Voorzichtig en nog niet zeker; een eerste poging.', tip: 'Een "tent" is tijdelijk — zo ook een tentatief plan.', zin: 'We hebben een tentatieve afspraak voor vrijdag, maar het is nog niet bevestigd.' },
    { w: 'eloquent', def: 'Spreekt mooi en vlot; goed met woorden.', tip: 'Denk aan iemand die makkelijk en helder praat.', zin: 'De advocaat sprak zo eloquent dat de hele zaal aandachtig luisterde.' },
    { w: 'pragmatisch', def: 'Praktisch; kijkt naar wat werkt, niet naar regels.', tip: '"Pragma" = daad in het Grieks. Doen wat werkt.', zin: 'Hij pakte het pragmatisch aan: geen lange vergadering, gewoon beginnen.' },
    { w: 'redundant', def: 'Te veel; meer dan nodig is.', tip: 'Iets wordt dubbel herhaald, dat hoeft niet.', zin: 'Die tweede uitleg was redundant — iedereen had het al begrepen.' },
    { w: 'sceptisch', def: 'Twijfelt; gelooft iets niet zomaar.', tip: 'Eerst zien, dan geloven.', zin: 'Ze was sceptisch over de belofte en vroeg eerst om bewijs.' },
    { w: 'frugaal', def: 'Zuinig; leeft eenvoudig met weinig.', tip: 'Geen luxe, alleen wat echt nodig is.', zin: 'Hij leeft frugaal: geen abonnementen, geen koffie buiten de deur.' },
    { w: 'altruïstisch', def: 'Onzelfzuchtig; doet dingen voor anderen.', tip: '"Altri" = anderen. Je denkt eerst aan een ander.', zin: 'Altruïstisch als hij is, gaf hij zijn vrije dag op om zijn buurman te helpen.' },
    { w: 'arbitrair', def: 'Willekeurig; zonder duidelijke reden gekozen.', tip: 'Zomaar gekozen, niet volgens een vaste regel.', zin: 'De keuze leek arbitrair — er was geen logische reden voor dat bedrag.' },
    { w: 'bevlogen', def: 'Vol vuur en enthousiasme voor iets.', tip: 'Bevlogen = je vliegt van enthousiasme.', zin: 'Ze is zo bevlogen door haar werk dat ze de tijd vergeet.' },
    { w: 'diffuus', def: 'Vaag en verspreid; geen duidelijke vorm.', tip: 'Diffuus licht gaat alle kanten op — geen bundel.', zin: 'Zijn plannen waren diffuus — er was geen duidelijke lijn in te ontdekken.' },
    { w: 'eminent', def: 'Heel goed; steekt boven anderen uit.', tip: 'Iemand die echt bovenaan staat in zijn vak.', zin: 'Ze is een eminent expert en wordt wereldwijd gevraagd voor lezingen.' },
    { w: 'fatalistisch', def: 'Denkt dat alles toch al vastligt; laat het lot beslissen.', tip: '"Fata" = lot. Je laat het gewoon gebeuren.', zin: 'Hij reageerde fatalistisch: "Als het zo moet gaan, dan gaat het zo."' },
    { w: 'hachelijk', def: 'Gevaarlijk en onzeker; een lastige situatie.', tip: 'Je situatie hangt aan een dun draadje.', zin: 'De situatie werd hachelijk toen de auto midden op de snelweg strandde.' },
    { w: 'intuïtief', def: 'Op gevoel; je weet het zonder na te denken.', tip: 'Je voelt gewoon dat iets klopt.', zin: 'Ik voelde intuïtief dat er iets niet klopte aan zijn verhaal.' },
    { w: 'ironisch', def: 'Je zegt het tegenovergestelde van wat je bedoelt.', tip: 'Zoals "lekker weer" zeggen als het regent.', zin: 'Ironisch genoeg won de langzaamste loper de race op punten.' },
    { w: 'latent', def: 'Wel aanwezig, maar nog niet zichtbaar; sluimert.', tip: 'Het zit er al, het wacht alleen nog.', zin: 'Het conflict was al jaren latent aanwezig, maar brak nu eindelijk open.' },
    { w: 'naïef', def: 'Goedgelovig; gelooft iets te snel door weinig ervaring.', tip: 'Als een kind dat nog niet gewaarschuwd is.', zin: 'Het was naïef om te denken dat hij het geld zomaar terug zou geven.' },
    { w: 'paradoxaal', def: 'Lijkt tegenstrijdig, maar klopt toch.', tip: 'Bijvoorbeeld: "minder is meer".', zin: 'Paradoxaal genoeg sliep hij beter naarmate hij minder uren in bed lag.' },
    { w: 'provocatief', def: 'Uitdagend; bedoeld om een reactie uit te lokken.', tip: 'Je port iemand op om te zien wat er gebeurt.', zin: 'Zijn uitspraak was zo provocatief dat de hele groep meteen reageerde.' },
    { w: 'retorisch', def: 'Een vraag die geen antwoord verwacht.', tip: 'Zoals: "Wil iedereen soms ontslagen worden?"', zin: '"Denk je dat ik gek ben?" vroeg hij retorisch en liep door.' },
    { w: 'scrupuleus', def: 'Heel nauwkeurig; let op elk klein detail.', tip: 'Je voelt elk klein steentje in je schoen.', zin: 'Ze controleerde elk getal scrupuleus voordat ze de aangifte instuurde.' },
    { w: 'triviaal', def: 'Onbelangrijk en alledaags.', tip: 'Iets kleins waar je niet wakker van ligt.', zin: 'Hij maakte zich druk om triviale details terwijl het grote plaatje wachtte.' },
    { w: 'volatiel', def: 'Wisselt snel en onverwacht.', tip: '"Volare" = vliegen. Het kan zo omslaan.', zin: 'De cryptomarkt is volatiel: gisteren plus twintig procent, vandaag min vijftien.' },
    { w: 'contraproductief', def: 'Werkt tegen je doel in; bereikt het tegenovergestelde.', tip: '"Contra" = tegen. Je werkt tégen jezelf.', zin: 'Te veel vergaderen is contraproductief — het werk blijft ondertussen liggen.' },
    { w: 'discrepantie', def: 'Een verschil tussen twee dingen die gelijk zouden moeten zijn.', tip: 'Twee dingen die niet op elkaar aansluiten.', zin: 'Er was een discrepantie tussen wat hij beloofde en wat hij leverde.' },
    { w: 'hypocrisie', def: 'Doen alsof; anders zijn dan je je voordoet.', tip: 'Het ene zeggen en het andere doen.', zin: 'Het is pure hypocrisie om duurzaamheid te prediken maar elke week te vliegen.' },
    { w: 'illusoir', def: 'Het lijkt echt, maar is het niet.', tip: 'Een truc die echt lijkt maar dat niet is.', zin: 'De idee dat je snel rijk wordt zonder risico is volledig illusoir.' },
    { w: 'juxtapositie', def: 'Twee dingen vlak naast elkaar zetten om het verschil te zien.', tip: '"Juxta" = naast. Naast elkaar valt het contrast op.', zin: 'Door de juxtapositie van de twee foto\'s zag je het verschil direct.' },
    { w: 'manifest', def: 'Heel duidelijk te zien; niet te missen.', tip: 'Het ligt er zo dik bovenop.', zin: 'Zijn ongenoegen was manifest — iedereen zag het aan zijn houding.' },
    { w: 'nuanceren', def: 'Kleine verschillen aanbrengen; niet alles zwart-wit zien.', tip: 'Niet álles, maar "het ligt eraan".', zin: 'Je moet het nuanceren: niet alle klanten zijn ontevreden, het zijn er een paar.' },
    { w: 'paradigma', def: 'Een vaste manier van kijken naar iets.', tip: 'De bril waardoor je naar de wereld kijkt.', zin: 'De smartphone heeft het paradigma van communicatie compleet veranderd.' },
    { w: 'reciprook', def: 'Over en weer; van beide kanten gelijk.', tip: 'Voor wat hoort wat.', zin: 'Respect moet reciprook zijn — je kunt het niet alleen van één kant verwachten.' },
    { w: 'subsidiair', def: 'Als extra steun; van minder belang.', tip: 'Het staat klaar voor het geval dat.', zin: 'Als plan A mislukt, hebben we subsidiair nog een andere optie achter de hand.' },
    { w: 'tangentieel', def: 'Raakt het onderwerp maar net; niet de kern.', tip: 'Je zit er net naast, niet middenin.', zin: 'Zijn opmerking was tangentieel — het raakte het onderwerp maar net zijdelings.' },
    { w: 'unaniem', def: 'Iedereen is het er helemaal over eens.', tip: '"Una" = één. Iedereen met één stem.', zin: 'De vergadering stemde unaniem voor het nieuwe voorstel.' },
    { w: 'verbatim', def: 'Woord voor woord; precies zoals het gezegd is.', tip: '"Verba" = woorden. Elke letter klopt.', zin: 'Ze citeerde de rechter verbatim in haar artikel, zonder één woord te veranderen.' },
    { w: 'aforisme', def: 'Een korte, slimme uitspraak met een waarheid.', tip: 'Een spreuk die in één zin raak is.', zin: '"Doe wat je zegt en zeg wat je doet" is een aforisme dat elke ondernemer kent.' },
    { w: 'apathisch', def: 'Lusteloos; geen gevoel of interesse.', tip: '"A" = zonder, "pathos" = gevoel. Geen reactie.', zin: 'Na de tegenvaller reageerde hij apathisch op alles om hem heen.' },
    { w: 'catharsis', def: 'Opluchting; je voelt je bevrijd na veel emotie.', tip: 'Even goed huilen en je voelt je lichter.', zin: 'Na dat eerlijke gesprek voelde ze catharsis — alle opgebouwde spanning was weg.' },
    { w: 'dogmatisch', def: 'Houdt strak vast aan regels; staat geen twijfel toe.', tip: '"Dogma" = leer. Het is zo, en daarmee uit.', zin: 'Hij is zo dogmatisch dat hij nieuwe ideeën bij voorbaat afwijst.' },
    { w: 'eclectisch', def: 'Pikt het beste uit verschillende bronnen.', tip: 'Je mixt het beste van overal.', zin: 'Haar inrichting is eclectisch: een Marokkaanse lamp naast een Scandinavisch bureau.' },
    { w: 'faceteus', def: 'Grappig bedoeld, soms net iets te brutaal.', tip: 'Een grapje dat soms net te ver gaat.', zin: 'Zijn faceteuse opmerking zette iedereen aan het lachen, maar stak ook een beetje.' },
    { w: 'gregair', def: 'Houdt van gezelschap; zoekt graag de groep op.', tip: '"Grex" = kudde. Je blijft graag bij de groep.', zin: 'Ze is erg gregair en houdt het nooit lang alleen uit.' },
    { w: 'inherent', def: 'Hoort er van nature bij; zit erin.', tip: 'Het zit er ingebakken, hoort er gewoon bij.', zin: 'Risico is inherent aan ondernemen — het hoort er nu eenmaal bij.' },
    { w: 'oordeelkundig', def: 'Verstandig; kan goed beoordelen.', tip: 'Je weegt goed af voordat je beslist.', zin: 'Hij maakte een oordeelkundige keuze door te wachten tot de prijs daalde.' },
    { w: 'kaleidoscopisch', def: 'Steeds wisselend en kleurrijk.', tip: 'Als een caleidoscoop: bij elke draai een nieuw beeld.', zin: 'De markt in Marrakech was een kaleidoscopisch spektakel van kleuren en geluiden.' },
    { w: 'lacune', def: 'Een gat; een stuk dat ontbreekt.', tip: 'Er mist een stukje.', zin: 'Er zit een lacune in de wet waardoor dit gedrag niet strafbaar is.' },
    { w: 'malafide', def: 'Met slechte bedoelingen; niet te vertrouwen.', tip: '"Mala" = slecht. Kwade bedoeling.', zin: 'De makelaar bleek malafide te zijn en had geld van klanten weggesluisd.' },
    { w: 'nominaal', def: 'Alleen in naam; niet echt in de praktijk.', tip: 'Je hebt de titel, maar niet de macht.', zin: 'Hij is nominaal de baas, maar alle beslissingen worden door zijn partner genomen.' },
    { w: 'onbewust', def: 'Zonder dat je het doorhebt.', tip: 'Je doet het vanzelf, zonder erbij na te denken.', zin: 'Onbewust tikte hij met zijn voet op de maat van het nummer.' },
    { w: 'pedant', def: 'Betweterig; let te veel op regeltjes.', tip: 'De schoolmeester die alles beter weet.', zin: 'Die pedante collega verbetert altijd je zinnen, ook als ze gewoon correct zijn.' },
    { w: 'quintessentieel', def: 'De pure kern; het meest wezenlijke van iets.', tip: 'Waar het echt om draait, en niets anders.', zin: 'Gastvrijheid is quintessentieel voor de Marokkaanse cultuur.' },
    { w: 'reprimande', def: 'Een officiële uitbrander; een berisping.', tip: 'Je krijgt er flink van langs, formeel.', zin: 'De manager gaf hem een reprimande na de fout in het klantrapport.' },
    { w: 'stoïcijns', def: 'Kalm en onaangedaan, ook als het zwaar is.', tip: 'Wat er ook gebeurt, je blijft rustig.', zin: 'Stoïcijns als hij was, reageerde hij niet op de harde kritiek.' },
    { w: 'tactvol', def: 'Met gevoel; houdt rekening met de ander.', tip: 'Iets moeilijks zeggen zonder te kwetsen.', zin: 'Ze bracht het slechte nieuws tactvol, zodat het niet te hard aankwam.' },
    { w: 'unilateraal', def: 'Eenzijdig; door één partij beslist.', tip: '"Uni" = één. Eén kant beslist alleen.', zin: 'Het bedrijf besloot unilateraal de salarissen te bevriezen zonder overleg.' },
    { w: 'vigilant', def: 'Waakzaam; let steeds goed op.', tip: '"Vigilare" = waken. Altijd alert.', zin: 'Als taxichauffeur \'s nachts moet je vigilant zijn op onveilige situaties.' },
    { w: 'wankel', def: 'Onvast en wiebelig; kan zo omvallen.', tip: 'Een wankele basis valt makkelijk om.', zin: 'De coalitie staat op wankele grond na het plotselinge vertrek van de minister.' },
    { w: 'xenofoob', def: 'Bang voor of afkerig van vreemden.', tip: '"Xenos" = vreemdeling, "phobos" = angst.', zin: 'Xenofobe opmerkingen hebben geen plek in een open en eerlijke samenleving.' },
    { w: 'zelfgenoegzaam', def: 'Te tevreden met jezelf; vindt zichzelf al goed genoeg.', tip: 'Je leunt achterover en wilt niet meer leren.', zin: 'Hij is zo zelfgenoegzaam dat hij nooit om feedback vraagt.' },
  ];
  _WOORDEN = WOORDEN;
  return dayCard('woord', _woordOffset);
}

// ── Dag-kaarten: navigatie (vorige/volgende dag) + voorlezen (TTS) ──────────
function _doy(offset) {
  const t = new Date();
  return Math.floor((t - new Date(t.getFullYear(), 0, 0)) / 86400000) + offset;
}
function _dayLabel(offset) {
  if (offset === 0) return 'Vandaag';
  if (offset === -1) return 'Gisteren';
  const d = new Date(); d.setDate(d.getDate() + offset);
  return d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });
}
function _hadithAt(offset) { const a = _HADITHS; const i = ((_doy(offset) % a.length) + a.length) % a.length; return a[i]; }
function _woordAt(offset)  { const a = _WOORDEN; const i = ((_doy(offset) % a.length) + a.length) % a.length; return a[i]; }

function _dayInner(kind, offset) {
  if (kind === 'hadith') {
    const h = _hadithAt(offset);
    return `<div class="hadith-arabic">${h.ar}</div>
      <div class="hadith-text">${escapeHTML(h.nl)}</div>
      <div class="hadith-source">${escapeHTML(h.bron)}</div>`;
  }
  const w = _woordAt(offset);
  return `<div class="woord-word">${escapeHTML(w.w)}</div>
    <div class="woord-def">${escapeHTML(w.def)}</div>
    <div class="woord-bridge">${escapeHTML(w.tip)}</div>
    ${w.zin ? `<div class="woord-zin">"${escapeHTML(w.zin)}"</div>` : ''}`;
}

function dayCard(kind, offset) {
  const cardCls    = kind === 'hadith' ? 'hadith-card' : 'woord-card';
  const title      = kind === 'hadith' ? 'Hadith van de dag' : 'Woord van de dag';
  const speakTitle = kind === 'hadith' ? 'Voorlezen (Arabisch)' : 'Voorlezen (Nederlands)';
  return `
    <div class="card ${cardCls}">
      <div class="daycard-head">
        <h2 class="card-title">${title}</h2>
        <div class="daycard-controls">
          <button class="daycard-btn" data-day-prev="${kind}" title="Vorige dag" aria-label="Vorige dag">‹</button>
          <button class="daycard-btn" data-day-speak="${kind}" title="${speakTitle}" aria-label="${speakTitle}">${icon('volume')}</button>
          <button class="daycard-btn" data-day-next="${kind}" title="Volgende dag" aria-label="Volgende dag" ${offset >= 0 ? 'disabled' : ''}>›</button>
        </div>
      </div>
      <div class="daycard-body" data-day-body="${kind}">${_dayInner(kind, offset)}</div>
      <div class="daycard-daylabel" data-day-label="${kind}">${_dayLabel(offset)}</div>
    </div>`;
}

function bindDayWidgets(container) {
  const refresh = (kind) => {
    const offset = kind === 'hadith' ? _hadithOffset : _woordOffset;
    const body  = container.querySelector(`[data-day-body="${kind}"]`);
    const label = container.querySelector(`[data-day-label="${kind}"]`);
    const next  = container.querySelector(`[data-day-next="${kind}"]`);
    if (body) {
      body.innerHTML = _dayInner(kind, offset);
      body.classList.remove('daycard-anim'); void body.offsetWidth; body.classList.add('daycard-anim');
    }
    if (label) label.textContent = _dayLabel(offset);
    if (next) next.disabled = offset >= 0;
  };
  container.querySelectorAll('[data-day-prev]').forEach(b => b.onclick = () => {
    const k = b.dataset.dayPrev;
    if (k === 'hadith') _hadithOffset -= 1; else _woordOffset -= 1;
    refresh(k);
  });
  container.querySelectorAll('[data-day-next]').forEach(b => b.onclick = () => {
    const k = b.dataset.dayNext;
    if (k === 'hadith') { if (_hadithOffset < 0) _hadithOffset += 1; }
    else                { if (_woordOffset  < 0) _woordOffset  += 1; }
    refresh(k);
  });
  container.querySelectorAll('[data-day-speak]').forEach(b => b.onclick = () => {
    const k = b.dataset.daySpeak;
    if (k === 'hadith') { const h = _hadithAt(_hadithOffset); speakText(h.ar, 'ar', b); }
    else                { const w = _woordAt(_woordOffset);  speakText(`${w.w}. ${w.def}`, 'nl', b); }
  });
}

// Kiest de meest natuurlijke beschikbare stem voor een taal. Voor Arabisch geven we
// voorrang aan "enhanced/premium/neural" en aan bekende kwaliteitsstemmen (bv. de
// iOS-stem "Majed"), en aan niet-lokale (online) stemmen — die klinken doorgaans
// natuurlijker dan de compacte ingebouwde stem.
function _pickVoice(voices, lang) {
  if (!voices || !voices.length) return null;
  if (lang === 'ar') {
    const ar = voices.filter(v => (v.lang || '').toLowerCase().startsWith('ar'));
    if (!ar.length) return null;
    const score = (v) => {
      const n = (v.name || '').toLowerCase();
      let s = 0;
      if (/(enhanced|premium|neural|natural)/.test(n)) s += 4;
      if (/(majed|maged|tarik|laila|hala|amira|salim|naayf)/.test(n)) s += 3;
      if (v.localService === false) s += 2;            // online = vaak natuurlijker
      if ((v.lang || '').toLowerCase() === 'ar-sa') s += 1;
      return s;
    };
    return ar.slice().sort((a, b) => score(b) - score(a))[0];
  }
  return voices.find(v => (v.lang || '').toLowerCase().startsWith('nl')) || null;
}

function speakText(text, lang, btn) {
  const synth = window.speechSynthesis;
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
    toast('Voorlezen wordt niet ondersteund in deze browser', { type: 'err' });
    return;
  }
  // Tweede tik op dezelfde knop = stoppen.
  if (_ttsActiveBtn === btn) { synth.cancel(); btn.classList.remove('speaking'); _ttsActiveBtn = null; return; }
  synth.cancel();
  if (_ttsActiveBtn) { _ttsActiveBtn.classList.remove('speaking'); _ttsActiveBtn = null; }

  const speakNow = () => {
    const voices = synth.getVoices ? synth.getVoices() : [];
    const u = new SpeechSynthesisUtterance(text);
    u.lang  = lang === 'ar' ? 'ar-SA' : 'nl-NL';
    // Arabisch: trager tempo (recitatie-gevoel) + iets lagere toon (autoritairdere stem)
    u.rate  = lang === 'ar' ? 0.72 : 0.98;
    u.pitch = lang === 'ar' ? 0.88 : 1;
    const match = _pickVoice(voices, lang);
    if (match) u.voice = match;
    else if (lang === 'ar') {
      toast('Geen Arabische stem gevonden. Download "Enhanced" via Instellingen → Toegankelijkheid → Gesproken inhoud → Stemmen → Arabisch.', { type: 'info', duration: 7000 });
    }
    const clear = () => { btn.classList.remove('speaking'); if (_ttsActiveBtn === btn) _ttsActiveBtn = null; };
    u.onend = clear;
    u.onerror = clear;
    _ttsActiveBtn = btn;
    btn.classList.add('speaking');
    synth.speak(u);
  };

  // Op veel toestellen is getVoices() bij de eerste aanroep nog leeg; wacht dan op
  // het voiceschanged-event zodat we tóch de juiste stem kunnen kiezen.
  const have = synth.getVoices ? synth.getVoices() : [];
  if (!have.length && 'onvoiceschanged' in synth) {
    let done = false;
    const handler = () => { if (done) return; done = true; synth.onvoiceschanged = null; speakNow(); };
    synth.onvoiceschanged = handler;
    setTimeout(() => { if (!done) { done = true; synth.onvoiceschanged = null; speakNow(); } }, 500);
  } else {
    speakNow();
  }
}

// Voegt een wegklikbare gids toe aan de hadith-kaart als de best beschikbare
// Arabische stem NIET "enhanced" is. Wacht asynchroon op stem-lijst (iOS laadt
// ze laat). Slaat dismissal op in localStorage zodat de tip maar één keer
// getoond wordt.
function _injectArabicVoiceTip(container) {
  if (localStorage.getItem('ar-voice-tip-ok')) return;
  const run = () => {
    const voices = window.speechSynthesis?.getVoices?.() || [];
    const best   = _pickVoice(voices, 'ar');
    const good   = best && (
      /(enhanced|premium|neural|natural)/.test((best.name || '').toLowerCase()) ||
      best.localService === false
    );
    if (good) return; // gebruiker heeft al een goede stem
    const card = container.querySelector('.hadith-card');
    if (!card || card.querySelector('.ar-voice-tip')) return;
    const tip = document.createElement('div');
    tip.className = 'ar-voice-tip';
    tip.innerHTML = `
      <div class="ar-voice-tip-inner">
        <span class="ar-voice-tip-icon">${icon('mic')}</span>
        <div class="ar-voice-tip-content">
          <div class="ar-voice-tip-title">Verbeter de Arabische uitspraak</div>
          <div class="ar-voice-tip-steps">
            Instellingen → Toegankelijkheid → Gesproken inhoud → Stemmen → Arabisch
            → tik op <strong>Verbeterd</strong> en download
          </div>
        </div>
        <button class="ar-voice-tip-close" aria-label="Verberg tip">×</button>
      </div>`;
    tip.querySelector('.ar-voice-tip-close').onclick = () => {
      tip.classList.add('ar-voice-tip-hiding');
      setTimeout(() => tip.remove(), 260);
      localStorage.setItem('ar-voice-tip-ok', '1');
    };
    card.appendChild(tip);
  };

  const synth = window.speechSynthesis;
  if (!synth) return;
  const current = synth.getVoices?.() || [];
  if (current.length) { run(); return; }
  if ('onvoiceschanged' in synth) {
    const handler = () => { synth.removeEventListener('voiceschanged', handler); run(); };
    synth.addEventListener('voiceschanged', handler);
    setTimeout(run, 900); // fallback als event uitblijft
  } else {
    setTimeout(run, 600);
  }
}

function wegWidget() {
  const now2 = new Date();
  const h    = now2.getHours();
  const day  = now2.getDay(); // 0=zo
  const isNacht   = h >= 22 || h < 6;
  const isWeekend = day === 0 || day === 6;

  // IJ-tunnel: nachtelijke sluitingen di/wo
  const ijGesloten = [2, 3].includes(day) && isNacht;

  const items = [
    { road: 'Coentunnel', label: 'Werkzaamheden', info: `Nachtelijke werkzaamheden${isNacht ? ' — controleer situatie.' : '.'}`, type: 'work' },
    { road: 'IJ-tunnel',  label: ijGesloten ? 'Mogelijk gesloten' : 'Werkzaamheden', info: ijGesloten ? 'Di/wo nachten soms gesloten — gebruik Piet Heintunnel.' : 'Periodieke nachtsluitingen (di/wo). Controleer actueel.', type: ijGesloten ? 'closed' : 'work' },
    { road: 'A10',        label: 'Werkzaamheden', info: 'Onderhoudswerk diverse trajecten. Controleer ANWB.', type: 'work' },
    { road: 'A1', label: 'OK', info: 'Geen bekende grote afsluitingen.', type: 'ok' },
    { road: 'A2', label: 'OK', info: 'Geen bekende grote afsluitingen.', type: 'ok' },
    { road: 'A4', label: 'OK', info: 'Geen bekende grote afsluitingen.', type: 'ok' },
    { road: 'A9', label: 'OK', info: 'Geen bekende grote afsluitingen.', type: 'ok' },
  ];

  const hasBig    = items.some(i => i.type === 'closed');
  const bigItems  = items.filter(i => i.type === 'closed');
  const workItems = items.filter(i => i.type === 'work');
  const okItems   = items.filter(i => i.type === 'ok');
  const labelFor  = { closed: 'Let op', work: 'Werkzaamheden', ok: 'OK' };

  const row = item => `
    <div class="weginfo-item">
      <span class="weginfo-road ${item.type}">${labelFor[item.type] || item.label}</span>
      <div>
        <div class="weginfo-item-road">${escapeHTML(item.road)}</div>
        <div class="weginfo-item-info">${escapeHTML(item.info)}</div>
      </div>
    </div>`;

  const dateStr = now2.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' });
  return `
    <div class="card weginfo-card">
      <h2 class="card-title">Weginfo Amsterdam</h2>
      <div class="weginfo-meta">${dateStr}${isWeekend ? ' · weekend' : ''} &nbsp;·&nbsp; <a href="https://www.anwb.nl/verkeer/amsterdam" target="_blank" rel="noopener" class="weginfo-meta-link">Actueel via ANWB →</a></div>
      ${!hasBig ? `<div class="weginfo-clear">✓ Geen grote afsluitingen op de bekende snelwegen</div>` : ''}
      ${bigItems.map(row).join('')}
      ${workItems.length ? `<details class="weginfo-details"><summary>Werkzaamheden (${workItems.length})</summary>${workItems.map(row).join('')}</details>` : ''}
      ${okItems.length ? `<details class="weginfo-details"><summary>Snelwegen zonder meldingen (${okItems.length})</summary>${okItems.map(row).join('')}</details>` : ''}
    </div>`;
}

// ── NS trein-storingen ────────────────────────────────────────
// Statische PWA → directe NS-API calls kunnen niet (CORS + de sleutel mag niet
// in client-code). Oplossing zonder Cloudflare: een GitHub Action haalt elke paar
// minuten de storingen op (met de NS-sleutel als repo-secret, server-side) en
// publiceert ze als JSON op de `ns-data`-branch. De app leest dat statische
// bestand via raw.githubusercontent.com (stuurt CORS `*`). Geavanceerd: wie een
// eigen proxy heeft kan die instellen via localStorage `nsProxyUrl` (override).
// Alle externe tekst wordt ge-escaped in renderNs().
const NS_CACHE_KEY = 'nsDisruptionsCache';
const NS_DATA_URL = 'https://raw.githubusercontent.com/sofyanghaddari/dashboard/ns-data/ns-disruptions.json';
const _setHTML = (el, html) => { el.replaceChildren(); el.insertAdjacentHTML('beforeend', html); };

async function loadNs(container) {
  const body = container.querySelector('#ns-body');
  if (!body) return;
  const refreshBtn = container.querySelector('#ns-refresh');
  if (refreshBtn) refreshBtn.onclick = () => { localStorage.removeItem(NS_CACHE_KEY); loadNs(container); };

  // Eigen proxy als override, anders de standaard GitHub-databron.
  const src = (localStorage.getItem('nsProxyUrl') || '').trim() || NS_DATA_URL;

  try {
    const cached = JSON.parse(localStorage.getItem(NS_CACHE_KEY) || 'null');
    if (cached && Date.now() - cached.ts < 5 * 60 * 1000) { renderNs(body, cached.data); return; }
  } catch (_) {}

  _setHTML(body, `<p class="muted" style="font-size:.875rem">Laden…</p>`);
  try {
    // cache-buster zodat we niet op een verouderde CDN-kopie blijven hangen
    const url = src + (src.includes('?') ? '&' : '?') + '_=' + Math.floor(Date.now() / 60000);
    const res = await fetch(url, { headers: { 'Accept': 'application/json' }, cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    localStorage.setItem(NS_CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
    renderNs(body, data);
  } catch (e) {
    _setHTML(body, `<p class="muted" style="font-size:.85rem;line-height:1.5">NS-storingen zijn nog niet beschikbaar. Voeg eenmalig je gratis NS-sleutel als <b>secret</b> (<code>NS_API_KEY</code>) toe in je GitHub-repo → dan worden ze automatisch opgehaald. Even later opnieuw kijken.</p>
      <button class="btn secondary sm" id="ns-retry" style="margin-top:8px">Opnieuw proberen</button>`);
    const r = body.querySelector('#ns-retry');
    if (r) r.onclick = () => { localStorage.removeItem(NS_CACHE_KEY); loadNs(container); };
  }
}

function renderNs(body, data) {
  const list = Array.isArray(data) ? data : (data.disruptions || data.payload || []);
  const items = (list || []).map(d => {
    const title = d.title || d.titel || d.description || 'Verstoring';
    const ts = d?.timespans?.[0] || {};
    const text = ts?.situation?.label || d.text || d.body || '';
    const cause = ts?.cause?.label || '';
    const type = String(d.type || '').toLowerCase();
    const hay = `${title} ${text} ${cause}`.toLowerCase();
    const isStrike = /staking|stakt|werkonderbreking/.test(hay);
    const isAms = /amsterdam/.test(hay);
    let cat;                                   // strike > alert (storing) > work
    if (isStrike) cat = 'strike';
    else if (/maintenance|werkzaam/.test(type)) cat = 'work';
    else cat = 'alert';                        // disruption / calamity
    return { title: title.replace(/\.\s*$/, ''), cat, isAms };
  });

  if (!items.length) {
    _setHTML(body, `<p class="ns-clear">✓ Geen storingen of stakingen nu</p>`);
    return;
  }

  const strikes = items.filter(i => i.cat === 'strike');
  const alerts  = items.filter(i => i.cat === 'alert');
  const works   = items.filter(i => i.cat === 'work');

  // Uitgelicht (1-regelig): eerst stakingen, dan Amsterdam-storingen.
  const highlight = [...strikes, ...alerts.filter(i => i.isAms && i.cat !== 'strike')];
  const hiSet = new Set(highlight);
  const rest = items.filter(i => !hiSet.has(i));

  const chip = (cls, n, label) => n ? `<span class="ns-chip ${cls}">${n} ${label}</span>` : '';
  const summary = `<div class="ns-summary">
    ${chip('ns-chip-strike', strikes.length, strikes.length === 1 ? 'staking' : 'stakingen')}
    ${chip('ns-chip-alert', alerts.length, alerts.length === 1 ? 'storing' : 'storingen')}
    ${chip('ns-chip-work', works.length, 'werk')}
  </div>`;

  const row = (i) => `<div class="ns-row">
    <span class="ns-dot ns-dot-${i.cat}"></span>
    <span class="ns-row-title">${i.cat === 'strike' ? '<b>Staking:</b> ' : ''}${escapeHTML(i.title)}</span>
  </div>`;

  const hi = highlight.length
    ? `<div class="ns-list">${highlight.slice(0, 5).map(row).join('')}</div>`
    : `<p class="ns-clear">✓ Niets rond Amsterdam</p>`;

  const more = rest.length
    ? `<details class="ns-more"><summary>Alle meldingen (${items.length})</summary>
        <div class="ns-list" style="margin-top:8px">${rest.map(row).join('')}</div></details>`
    : '';

  _setHTML(body, summary + hi + more);
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
      ${weatherScene(cur.weather_code, info, cur, day)}
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
