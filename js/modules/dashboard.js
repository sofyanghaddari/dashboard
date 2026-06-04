import { all } from '../db.js';
import { fmtMoney, startOfWeek, startOfMonth, ymd, sameDay, escapeHTML } from '../utils.js';
import { getNumber } from '../settings.js';

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

  container.innerHTML = `
    <h1>Dashboard</h1>

    ${activeShift ? `
      <div class="card accent-card">
        <h2>⏱️ Dienst actief</h2>
        <p class="big-money" id="dash-shift-timer">--:--:--</p>
        <p class="muted">Sinds ${new Date(activeShift.startTime).toLocaleTimeString('nl-NL', {hour:'2-digit',minute:'2-digit'})}</p>
      </div>` : ''}

    <div class="card">
      <h2>🚖 Vandaag</h2>
      <p class="big-money">${fmtMoney(todayIncome)}</p>
      ${dailyGoal > 0 ? `
        <div class="progress-bar" style="margin-top:8px"><div class="progress-fill" style="width:${goalPct}%"></div></div>
        <p class="muted" style="font-size:.85rem;margin-top:4px">${goalPct}% van doel (${fmtMoney(dailyGoal)})</p>
      ` : ''}
      <p class="muted" style="margin-top:8px">Deze week: ${fmtMoney(sum(weekRides))} · Deze maand: ${fmtMoney(monthIncome)}</p>
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
