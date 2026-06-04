import { all } from '../db.js';
import { fmtMoney, ymd, escapeHTML } from '../utils.js';

export async function openYearReview() {
  const [rides, expenses, hizb, cards, todos, shifts] = await Promise.all([
    all('rides'), all('expenses'), all('hizb_log'), all('cards'), all('todos'), all('shifts'),
  ]);
  const now = new Date();
  const year = now.getFullYear();
  const isYear = (d) => new Date(d).getFullYear() === year;

  const yRides = rides.filter(r => isYear(r.date));
  const yExp = expenses.filter(e => isYear(e.date));
  const yHizb = hizb.filter(h => h.date.startsWith(year + '-'));
  const yShifts = shifts.filter(s => s.endTime && isYear(s.startTime));
  const yCards = cards.filter(c => c.createdAt && isYear(c.createdAt));
  const yTodos = todos.filter(t => t.completedAt && isYear(t.completedAt));

  const bruto = yRides.reduce((s, r) => s + Number(r.amount || 0), 0);
  const uitgaven = yExp.reduce((s, e) => s + Number(e.amount || 0), 0);
  const netto = bruto - uitgaven;
  const shiftHours = yShifts.reduce((s, sh) => s + (new Date(sh.endTime) - new Date(sh.startTime)) / 3600000, 0);
  const perHour = shiftHours > 0 ? bruto / shiftHours : 0;

  // Beste maand
  const byMonth = {};
  yRides.forEach(r => {
    const m = new Date(r.date).getMonth();
    byMonth[m] = (byMonth[m] || 0) + Number(r.amount || 0);
  });
  const bestMonth = Object.entries(byMonth).sort((a, b) => b[1] - a[1])[0];
  const months = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];

  // Beste bron
  const bySrc = {};
  yRides.forEach(r => { bySrc[r.source] = (bySrc[r.source] || 0) + Number(r.amount || 0); });
  const bestSrc = Object.entries(bySrc).sort((a, b) => b[1] - a[1])[0];

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal">
      <h2>📊 Jaaroverzicht ${year}</h2>
      <div class="card accent-card">
        <p class="muted" style="font-size:.85rem">Bruto inkomen</p>
        <p class="big-money">${fmtMoney(bruto)}</p>
        <p>Uitgaven: <b>${fmtMoney(uitgaven)}</b> · Netto: <b class="money">${fmtMoney(netto)}</b></p>
      </div>
      <div class="card">
        <h3>🚖 Taxi</h3>
        <p>Totaal ritten: <b>${yRides.length}</b></p>
        <p>Uren gewerkt: <b>${shiftHours.toFixed(1)}u</b> · €/uur: <b class="money">${fmtMoney(perHour)}</b></p>
        ${bestMonth ? `<p>🏆 Beste maand: <b>${escapeHTML(months[bestMonth[0]])}</b> (<b class="money">${fmtMoney(bestMonth[1])}</b>)</p>` : ''}
        ${bestSrc ? `<p>🥇 Beste bron: <b>${escapeHTML(bestSrc[0])}</b> (<b class="money">${fmtMoney(bestSrc[1])}</b>)</p>` : ''}
      </div>
      <div class="card">
        <h3>📖 Koran</h3>
        <p>Hizb afgevinkt: <b>${yHizb.length}</b> dag${yHizb.length===1?'':'en'}</p>
      </div>
      <div class="card">
        <h3>📚 Arabisch</h3>
        <p>Nieuwe kaarten toegevoegd: <b>${yCards.length}</b></p>
      </div>
      <div class="card">
        <h3>✅ Productiviteit</h3>
        <p>Taken afgerond: <b>${yTodos.length}</b></p>
      </div>
      <button class="btn block" id="yr-close" style="margin-top:12px">Sluiten</button>
    </div>`;
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.remove(); });
  backdrop.querySelector('#yr-close').onclick = () => backdrop.remove();
}
