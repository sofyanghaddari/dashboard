import { all } from '../db.js';
import { fmtMoney, startOfWeek, startOfMonth, ymd, sameDay, escapeHTML } from '../utils.js';

export async function render(container) {
  const [rides, hizb, todos, cards] = await Promise.all([
    all('rides'), all('hizb_log'), all('todos'), all('cards'),
  ]);
  const now = new Date();
  const todayRides = rides.filter(r => sameDay(new Date(r.date), now));
  const weekRides  = rides.filter(r => new Date(r.date) >= startOfWeek(now));
  const monthRides = rides.filter(r => new Date(r.date) >= startOfMonth(now));
  const sum = (arr) => arr.reduce((s, r) => s + Number(r.amount || 0), 0);

  const today = ymd();
  const todayHizb = hizb.some(h => h.date === today);
  const doneSet = new Set(hizb.map(h => h.date));
  let streak = 0;
  const cur = new Date();
  while (doneSet.has(ymd(cur))) { streak++; cur.setDate(cur.getDate() - 1); }

  const dueCards = cards.filter(c => c.dueDate <= today).length;
  const topTodos = todos.filter(t => !t.done && t.priority === 'high').slice(0, 3);

  container.innerHTML = `
    <h1>Dashboard</h1>
    <div class="card">
      <h2>🚖 Taxi</h2>
      <p>Vandaag: <b>${fmtMoney(sum(todayRides))}</b></p>
      <p class="muted">Deze week: ${fmtMoney(sum(weekRides))} · Deze maand: ${fmtMoney(sum(monthRides))}</p>
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
    <div class="card">
      <h2>✅ Top prioriteiten</h2>
      ${topTodos.length
        ? topTodos.map(t => `<p>• ${escapeHTML(t.title)}</p>`).join('')
        : '<p class="muted">Geen prioriteit-taken.</p>'}
    </div>
  `;
}
