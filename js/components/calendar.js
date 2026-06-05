import { all } from '../db.js';
import { ymd, escapeHTML } from '../utils.js';

export async function openCalendar() {
  const [hizb, todos, goals] = await Promise.all([all('hizb_log'), all('todos'), all('goals')]);
  const hizbSet = new Set(hizb.map(h => h.date));
  const todosByDate = {};
  todos.filter(t => !t.done && t.dueDate).forEach(t => {
    (todosByDate[t.dueDate] = todosByDate[t.dueDate] || []).push(t);
  });
  const goalsByDate = {};
  goals.filter(g => g.deadline).forEach(g => {
    (goalsByDate[g.deadline] = goalsByDate[g.deadline] || []).push(g);
  });

  let viewDate = new Date();

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `<div class="modal" id="cal-modal"></div>`;
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.remove(); });

  const renderCal = () => {
    const m = backdrop.querySelector('#cal-modal');
    const year = viewDate.getFullYear(), month = viewDate.getMonth();
    const first = new Date(year, month, 1);
    const lastDate = new Date(year, month + 1, 0).getDate();
    const firstWeekday = (first.getDay() + 6) % 7; // Maandag=0

    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push('<div></div>');
    for (let d = 1; d <= lastDate; d++) {
      const date = ymd(new Date(year, month, d));
      const hasHizb = hizbSet.has(date);
      const tds = todosByDate[date] || [];
      const gls = goalsByDate[date] || [];
      const today = date === ymd();
      cells.push(`
        <div class="cal-cell ${today ? 'today' : ''}" title="${[
          ...gls.map(g => '🎯 ' + g.title),
          ...tds.map(t => '✅ ' + t.title),
        ].join(' · ')}">
          <div class="cal-day">${d}</div>
          <div class="cal-dots">
            ${hasHizb ? '<span class="dot dot-hizb"></span>' : ''}
            ${tds.length ? '<span class="dot dot-todo"></span>' : ''}
            ${gls.length ? '<span class="dot dot-goal"></span>' : ''}
          </div>
        </div>`);
    }
    m.innerHTML = `
      <button type="button" class="modal-close" id="cal-x" aria-label="Sluiten">×</button>
      <div class="cal-head">
        <button class="btn secondary" id="cal-prev">◀</button>
        <h2 style="margin:0;flex:1;text-align:center">${first.toLocaleString('nl-NL', { month: 'long', year: 'numeric' })}</h2>
        <button class="btn secondary" id="cal-next">▶</button>
      </div>
      <div class="cal-grid">
        ${['ma','di','wo','do','vr','za','zo'].map(d => `<div class="cal-head-day">${d}</div>`).join('')}
        ${cells.join('')}
      </div>
      <div class="cal-legend">
        <span><span class="dot dot-hizb"></span> Hizb</span>
        <span><span class="dot dot-todo"></span> Taak</span>
        <span><span class="dot dot-goal"></span> Doel</span>
      </div>
      <button class="btn block" id="cal-close" style="margin-top:12px">Sluiten</button>
    `;
    m.querySelector('#cal-prev').onclick = () => { viewDate = new Date(year, month - 1, 1); renderCal(); };
    m.querySelector('#cal-next').onclick = () => { viewDate = new Date(year, month + 1, 1); renderCal(); };
    m.querySelector('#cal-close').onclick = () => backdrop.remove();
    m.querySelector('#cal-x').onclick = () => backdrop.remove();
  };
  renderCal();
}
