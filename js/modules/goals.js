import { all, put, del } from '../db.js';
import { openModal } from '../components/modal.js';
import { uid, fmtMoney, escapeHTML } from '../utils.js';

export async function render(container) {
  const goals = await all('goals');
  const rides = await all('rides');
  const totalRides = rides.reduce((s, r) => s + Number(r.amount || 0), 0);

  const long = goals.filter(g => g.term === 'long');
  const short = goals.filter(g => g.term === 'short');

  container.innerHTML = `
    <h1>Doelen</h1>
    <button class="btn block" id="add-long">+ Lange termijn doel</button>
    <button class="btn secondary block" id="add-short" style="margin-top:8px">+ Korte termijn doel</button>

    <h2 style="margin-top:16px">Lange termijn</h2>
    <div class="list" id="long-list"></div>
    <h2 style="margin-top:16px">Korte termijn</h2>
    <div class="list" id="short-list"></div>
  `;

  renderSection(container, '#long-list', long, totalRides);
  renderSection(container, '#short-list', short, totalRides);

  container.querySelector('#add-long').onclick = () => openGoalModal(container, null, 'long');
  container.querySelector('#add-short').onclick = () => openGoalModal(container, null, 'short');
}

function renderSection(container, sel, items, totalRides) {
  const el = container.querySelector(sel);
  if (!items.length) { el.innerHTML = '<p class="muted">Nog geen doelen.</p>'; return; }
  el.innerHTML = items.map(g => {
    const target = Number(g.target || 0);
    const taxiPct = Number(g.taxiPercent || 0);
    const savedFromTaxi = taxiPct > 0 ? totalRides * (taxiPct / 100) : 0;
    const progress = target > 0
      ? Math.min(100, Math.round(savedFromTaxi / target * 100))
      : Number(g.progress || 0);
    const showTaxi = taxiPct > 0 && target > 0;

    return `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:start;gap:8px">
        <div>
          <b>${escapeHTML(g.title)}</b>
          ${g.deadline ? `<div class="muted" style="font-size:.8rem">deadline ${g.deadline}</div>` : ''}
          ${g.description ? `<div class="muted" style="margin-top:4px">${escapeHTML(g.description)}</div>` : ''}
          ${showTaxi ? `<div class="muted" style="font-size:.85rem;margin-top:6px">🚖 ${taxiPct}% van elke rit · gespaard: <b class="money">${fmtMoney(savedFromTaxi)}</b> / ${fmtMoney(target)}</div>` : ''}
        </div>
        <div class="row" style="flex:0 0 auto;gap:4px">
          <button class="btn secondary" data-edit="${g.id}">✎</button>
          <button class="btn danger" data-del="${g.id}">×</button>
        </div>
      </div>
      ${showTaxi
        ? `<div class="progress-bar" style="margin-top:10px"><div class="progress-fill" style="width:${progress}%"></div></div>
           <div class="muted" style="font-size:.8rem;margin-top:4px">${progress}%</div>`
        : `<label>Voortgang: <b>${progress}%</b></label>
           <input type="range" min="0" max="100" value="${progress}" data-progress="${g.id}" />`}
    </div>`;
  }).join('');
  el.querySelectorAll('[data-del]').forEach(b => {
    b.onclick = async () => { await del('goals', b.dataset.del); render(container); };
  });
  el.querySelectorAll('[data-edit]').forEach(b => {
    b.onclick = () => {
      const g = items.find(x => x.id === b.dataset.edit);
      openGoalModal(container, g, g.term);
    };
  });
  el.querySelectorAll('[data-progress]').forEach(input => {
    input.onchange = async () => {
      const g = items.find(x => x.id === input.dataset.progress);
      await put('goals', { ...g, progress: parseInt(input.value, 10) });
      render(container);
    };
  });
}

function openGoalModal(container, existing, term) {
  openModal(existing ? 'Doel bewerken' : 'Nieuw doel', `
    <label>Titel *</label><input name="title" required value="${existing ? escapeHTML(existing.title) : ''}" />
    <label>Beschrijving</label><textarea name="description" rows="2">${existing && existing.description ? escapeHTML(existing.description) : ''}</textarea>
    <label>Deadline</label><input name="deadline" type="date" value="${existing && existing.deadline ? existing.deadline : ''}" />
    <label>Streefbedrag (€) — optioneel, voor taxi-koppeling</label>
    <input name="target" type="number" step="1" value="${existing && existing.target ? existing.target : ''}" />
    <label>% van elke taxi-rit — optioneel (auto-voortgang)</label>
    <input name="taxiPercent" type="number" step="0.5" min="0" max="100" value="${existing && existing.taxiPercent ? existing.taxiPercent : ''}" />
  `, async (d) => {
    if (!d.title) throw new Error('Titel verplicht');
    const base = existing || { id: uid(), term, progress: 0 };
    await put('goals', {
      ...base,
      title: d.title,
      description: d.description || '',
      deadline: d.deadline || null,
      target: d.target ? parseFloat(d.target) : null,
      taxiPercent: d.taxiPercent ? parseFloat(d.taxiPercent) : null,
    });
    render(container);
  });
}
