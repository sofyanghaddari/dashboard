import { all } from '../db.js';
import { fmtMoney, ymd, escapeHTML } from '../utils.js';

function calcYearlyTaxiCosts(year) {
  try {
    const exp = JSON.parse(localStorage.getItem('taxiExpenses') || '[]');
    return exp.reduce((s, e) => {
      const amt = Number(e.amount) || 0;
      if (e.frequency === 'eenmalig') {
        if (e.date && new Date(e.date).getFullYear() === year) return s + amt;
        return s;
      }
      if (e.frequency === 'weekly') return s + amt * 52;
      return s + amt * 12; // monthly default
    }, 0);
  } catch { return 0; }
}

export async function openYearReview() {
  const [rides, hizb, cards, todos] = await Promise.all([
    all('rides'), all('hizb_log'), all('cards'), all('todos'),
  ]);
  const now = new Date();
  const year = now.getFullYear();
  const isYear = (d) => new Date(d).getFullYear() === year;

  const yRides = rides.filter(r => isYear(r.date));
  const yHizb = hizb.filter(h => h.date.startsWith(year + '-'));
  const yCards = cards.filter(c => c.createdAt && isYear(c.createdAt));
  const yTodos = todos.filter(t => t.completedAt && isYear(t.completedAt));

  const bruto = yRides.reduce((s, r) => s + Number(r.amount || 0), 0);
  const uitgaven = calcYearlyTaxiCosts(year);
  const netto = bruto - uitgaven;

  // Beste maand
  const byMonth = {};
  yRides.forEach(r => {
    const m = new Date(r.date).getMonth();
    byMonth[m] = (byMonth[m] || 0) + Number(r.amount || 0);
  });
  const bestMonth = Object.entries(byMonth).sort((a, b) => b[1] - a[1])[0];
  const months = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];

  // Beste dag van de week
  const byWd = [0,0,0,0,0,0,0];
  yRides.forEach(r => { byWd[new Date(r.date).getDay()] += Number(r.amount || 0); });
  const wdNames = ['Zondag','Maandag','Dinsdag','Woensdag','Donderdag','Vrijdag','Zaterdag'];
  const bestWd = byWd.indexOf(Math.max(...byWd));

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal">
      <button type="button" class="modal-close" id="yr-x" aria-label="Sluiten">×</button>
      <h2>📊 Jaaroverzicht ${year}</h2>
      <div class="card accent-card">
        <p class="muted" style="font-size:.85rem">Bruto inkomen</p>
        <p class="big-money">${fmtMoney(bruto)}</p>
        <p>Kosten: <b>${fmtMoney(uitgaven)}</b> · Netto: <b class="money">${fmtMoney(netto)}</b></p>
      </div>
      <div class="card">
        <h3>🚖 Taxi</h3>
        <p>Inkomen-dagen: <b>${yRides.length}</b></p>
        ${bestMonth ? `<p>🏆 Beste maand: <b>${escapeHTML(months[+bestMonth[0]])}</b> (<b class="money">${fmtMoney(bestMonth[1])}</b>)</p>` : ''}
        ${yRides.length > 0 ? `<p>📅 Beste weekdag: <b>${wdNames[bestWd]}</b></p>` : ''}
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
  backdrop.querySelector('#yr-x').onclick = () => backdrop.remove();
}
