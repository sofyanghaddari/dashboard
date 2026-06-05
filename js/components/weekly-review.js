import { all } from '../db.js';
import { fmtMoney, ymd, startOfWeek, sameDay } from '../utils.js';
import { quoteOfDay } from '../quotes.js';

export async function maybeShowWeeklyReview() {
  const now = new Date();
  // Toon op zondag 18:00-23:59, maar slechts één keer
  if (now.getDay() !== 0 || now.getHours() < 18) return;
  const todayKey = ymd();
  if (localStorage.getItem('lastWeeklyReview') === todayKey) return;
  localStorage.setItem('lastWeeklyReview', todayKey);
  setTimeout(() => openWeeklyReview(), 1500);
}

export async function openWeeklyReview() {
  const [rides, hizb, todos, cards] = await Promise.all([
    all('rides'), all('hizb_log'), all('todos'), all('cards'),
  ]);
  const now = new Date();
  const weekStart = startOfWeek(now);

  const inWeek = (d) => new Date(d) >= weekStart;
  const wRides = rides.filter(r => inWeek(r.date));
  const wHizb = hizb.filter(h => h.date >= ymd(weekStart));
  const wTodos = todos.filter(t => t.completedAt && inWeek(t.completedAt));
  const wCards = cards.filter(c => inWeek(c.createdAt));

  const totalIncome = wRides.reduce((s, r) => s + Number(r.amount || 0), 0);
  const dayMap = {};
  wRides.forEach(r => {
    const k = ymd(new Date(r.date));
    dayMap[k] = (dayMap[k] || 0) + Number(r.amount || 0);
  });
  const bestDay = Object.entries(dayMap).sort((a,b) => b[1] - a[1])[0];

  const q = quoteOfDay();

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal">
      <button type="button" class="modal-close" id="wr-x" aria-label="Sluiten">×</button>
      <h2>Week-overzicht</h2>
      <p class="muted" style="margin-top:-4px">Zondag — tijd voor de balans</p>

      <div class="card primary-stat">
        <div class="stat-label">Verdiend deze week</div>
        <div class="big-money">${fmtMoney(totalIncome)}</div>
      </div>

      <div class="card">
        <h2 class="card-title">Hizb</h2>
        <div><b>${wHizb.length}</b> van 7 dagen afgevinkt</div>
      </div>

      <div class="card">
        <h2 class="card-title">Productiviteit</h2>
        <div><b>${wTodos.length}</b> taken afgerond</div>
        <div class="muted">Nieuwe Arabische kaarten: ${wCards.length}</div>
      </div>

      ${bestDay ? `
        <div class="card">
          <h2 class="card-title">Beste dag</h2>
          <div><b>${new Date(bestDay[0]).toLocaleDateString('nl-NL', { weekday: 'long' })}</b> — <span class="money">${fmtMoney(bestDay[1])}</span></div>
        </div>` : ''}

      <div class="card" style="text-align:center;font-style:italic">
        "${q.t}" <div class="muted" style="margin-top:6px;font-size:.8rem">— ${q.s}</div>
      </div>

      <button class="btn block" id="wr-close" style="margin-top:12px">Sluiten</button>
    </div>`;
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.remove(); });
  backdrop.querySelector('#wr-close').onclick = () => backdrop.remove();
  backdrop.querySelector('#wr-x').onclick = () => backdrop.remove();
}
