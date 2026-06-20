import { uid, escapeHTML, ymd, fmtMoney } from '../utils.js';
import { ok, err } from '../components/toast.js';
import { all, put, del } from '../db.js';

const CATS = {
  werk:      { label: 'Werk',       color: '#6ec9ff' },
  leren:     { label: 'Leren',      color: '#a78bfa' },
  persoonlijk:{ label: 'Persoonlijk', color: '#fb923c' },
  sport:     { label: 'Sport',      color: '#4ade80' },
  rust:      { label: 'Rust',       color: '#94a3b8' },
};
const HOURS = Array.from({ length: 19 }, (_, i) => i + 6); // 06–24

// Eenmalige migratie van localStorage → IndexedDB
async function migrateEvents() {
  const raw = localStorage.getItem('agenda_events');
  if (!raw) return;
  try {
    const items = JSON.parse(raw);
    const existing = await all('agenda_events');
    if (existing.length === 0 && items.length > 0) {
      for (const item of items) {
        if (!item.id) item.id = uid();
        await put('agenda_events', item);
      }
    }
    localStorage.removeItem('agenda_events');
  } catch (_) {}
}

function weekDates(offset = 0) {
  const today = new Date();
  const day = today.getDay(); // 0=Sun
  const mon = new Date(today);
  mon.setDate(today.getDate() - ((day === 0 ? 7 : day) - 1) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon); d.setDate(mon.getDate() + i);
    return ymd(d);
  });
}

const DAY_NAMES = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
const DAY_NAMES_FULL = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'];

export async function render(container) {
  await migrateEvents();
  const weekOffset  = +(container.dataset.agendaWeek  || 0);
  const focusDay    =   container.dataset.agendaDay   || null;
  const events      = await all('agenda_events');
  const dates       = weekDates(weekOffset);
  const today       = ymd();

  // Load ride data for income display
  const rides = await all('rides').catch(() => []);

  container.innerHTML = `
    <h1 class="page-title">Week</h1>

    <!-- WEEK NAVIGATOR -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <button class="btn secondary" id="prev-week" style="padding:8px 14px">‹</button>
      <div style="font-size:.85rem;color:var(--text-dim);text-align:center">${formatWeekLabel(dates)}</div>
      <button class="btn secondary" id="next-week" style="padding:8px 14px">›</button>
    </div>

    <!-- DAG SELECTOR -->
    <div class="agenda-day-row">
      ${dates.map((d, i) => {
        const isToday = d === today;
        const hasFocus = d === (focusDay || today);
        const dayRides = rides.filter(r => ymd(new Date(r.date)) === d);
        const income = dayRides.reduce((s, r) => s + Number(r.amount || 0), 0);
        return `<button class="agenda-day-btn${hasFocus ? ' active' : ''}${isToday ? ' today' : ''}" data-day="${d}">
          <span class="agenda-day-name">${DAY_NAMES[i]}</span>
          <span class="agenda-day-num">${new Date(d + 'T12:00:00').getDate()}</span>
          ${income > 0 ? `<span class="agenda-day-income">€${Math.round(income)}</span>` : ''}
        </button>`;
      }).join('')}
    </div>

    <!-- AGENDA GRID -->
    <div id="agenda-grid" class="agenda-grid"></div>

    <!-- EVENT FORM (hidden until needed) -->
    <div id="agenda-event-form" style="display:none"></div>
  `;

  container.querySelector('#prev-week').onclick = () => {
    container.dataset.agendaWeek = weekOffset - 1;
    container.dataset.agendaDay  = '';
    render(container);
  };
  container.querySelector('#next-week').onclick = () => {
    container.dataset.agendaWeek = weekOffset + 1;
    container.dataset.agendaDay  = '';
    render(container);
  };
  container.querySelectorAll('.agenda-day-btn').forEach(btn => {
    btn.onclick = () => {
      container.dataset.agendaDay = btn.dataset.day;
      render(container);
    };
  });

  renderGrid(container, events, dates, focusDay || today, today);
}

function renderGrid(container, events, dates, focusDay, today) {
  const visibleDates = [focusDay];
  const grid = container.querySelector('#agenda-grid');
  grid.innerHTML = '';

  for (const hour of HOURS) {
    const row = document.createElement('div');
    row.className = 'agenda-row';
    row.innerHTML = `<div class="agenda-hour">${String(hour).padStart(2,'0')}:00</div>`;

    for (const d of visibleDates) {
      const cell = document.createElement('div');
      cell.className = 'agenda-cell';
      cell.dataset.date = d;
      cell.dataset.hour = hour;

      const hourEvents = events.filter(e => e.date === d && e.hour === hour);
      cell.innerHTML = hourEvents.map(ev => eventChip(ev)).join('') +
        `<button class="agenda-add-btn" aria-label="Voeg blok toe om ${String(hour).padStart(2,'0')}:00">＋</button>`;
      row.appendChild(cell);
    }
    grid.appendChild(row);
  }

  // Bind add buttons
  grid.querySelectorAll('.agenda-add-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const cell = btn.closest('.agenda-cell');
      openEventForm(container, { date: cell.dataset.date, hour: +cell.dataset.hour }, events);
    };
  });
  // Bind cell click (empty area)
  grid.querySelectorAll('.agenda-cell').forEach(cell => {
    cell.onclick = (e) => {
      if (e.target.closest('.agenda-add-btn')) return;
      openEventForm(container, { date: cell.dataset.date, hour: +cell.dataset.hour }, events);
    };
  });

  // Bind event chips (click to edit)
  grid.querySelectorAll('.agenda-chip').forEach(chip => {
    chip.onclick = (e) => {
      e.stopPropagation();
      const ev = events.find(x => x.id === chip.dataset.id);
      if (ev) openEventForm(container, ev, events, true);
    };
  });

  // Quiet hint when the visible day has nothing planned yet
  const hasEvents = visibleDates.some(d => events.some(e => e.date === d));
  if (!hasEvents) {
    grid.insertAdjacentHTML('afterbegin', `<div class="day-empty-hint">
      <b>Nog niets gepland</b>
      <span>Tik op een tijdvak om een blok toe te voegen.</span>
    </div>`);
  }
}

function eventChip(ev) {
  const cat = CATS[ev.category] || CATS.persoonlijk;
  const durStr = ev.duration && ev.duration !== 60 ? ` · ${ev.duration >= 60 ? Math.round(ev.duration / 60 * 10) / 10 + 'u' : ev.duration + 'min'}` : '';
  return `<div class="agenda-chip" data-id="${ev.id}" style="background:${cat.color}22;border-left:3px solid ${cat.color}">
    <span class="agenda-chip-time">${String(ev.hour).padStart(2,'0')}:${ev.minute ? String(ev.minute).padStart(2,'0') : '00'}${durStr}</span>
    <span class="agenda-chip-title">${escapeHTML(ev.title)}</span>
    <span class="agenda-chip-edit" aria-hidden="true">✏</span>
    <button class="agenda-chip-del" data-del="${ev.id}" aria-label="Verwijder ${escapeHTML(ev.title)}">✕</button>
  </div>`;
}

function openEventForm(container, existing, events, isEdit = false) {
  const formEl = container.querySelector('#agenda-event-form');
  formEl.style.display = 'block';
  const ev = isEdit ? existing : { id: uid(), date: existing.date, hour: existing.hour, minute: 0, title: '', category: 'werk', duration: 60, note: '' };

  formEl.innerHTML = `
    <div class="card" style="margin-top:16px;border:1px solid var(--accent)">
      <h2 class="card-title">${isEdit ? 'Blok bewerken' : 'Blok toevoegen'}</h2>
      <label>Titel *</label>
      <input id="ev-title" value="${escapeHTML(ev.title || '')}" placeholder="Wat ga je doen?" />
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px">
        <div>
          <label>Tijd</label>
          <div style="display:flex;gap:6px">
            <input id="ev-hour" type="number" min="0" max="23" value="${ev.hour}" style="width:60px" />
            <span style="padding-top:10px;color:var(--text-dim)">:</span>
            <input id="ev-min" type="number" min="0" max="59" step="15" value="${ev.minute || 0}" style="width:60px" />
          </div>
        </div>
        <div>
          <label>Categorie</label>
          <select id="ev-cat">
            ${Object.entries(CATS).map(([k, v]) =>
              `<option value="${k}" ${ev.category === k ? 'selected' : ''}>${v.label}</option>`
            ).join('')}
          </select>
        </div>
      </div>
      <label style="margin-top:8px">Duur (minuten)</label>
      <input id="ev-dur" type="number" min="15" max="480" step="15" value="${ev.duration || 60}" />
      <label style="margin-top:8px">Datum</label>
      <input id="ev-date" type="date" value="${ev.date}" />
      <label style="margin-top:8px">Notitie <span style="font-weight:400;opacity:.6;text-transform:none;letter-spacing:0">(optioneel)</span></label>
      <input id="ev-note" placeholder="Extra info…" value="${escapeHTML(ev.note || '')}" />
      <div style="display:flex;gap:8px;margin-top:14px">
        <button class="btn" id="ev-save" style="flex:1">Opslaan</button>
        ${isEdit ? `<button class="btn danger" id="ev-del" style="flex:0 0 auto;padding:12px 16px">Verwijder</button>` : ''}
        <button class="btn secondary" id="ev-cancel" style="flex:0 0 auto;padding:12px 16px">Annuleren</button>
      </div>
    </div>
  `;

  formEl.querySelector('#ev-cancel').onclick = () => { formEl.style.display = 'none'; };

  if (isEdit) {
    formEl.querySelector('#ev-del').onclick = async () => {
      await del('agenda_events', ev.id);
      ok('Blok verwijderd');
      formEl.style.display = 'none';
      render(container);
    };
  }

  // Chip delete buttons inside the grid
  const grid = container.querySelector('#agenda-grid');
  if (grid) {
    grid.querySelectorAll('[data-del]').forEach(btn => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        await del('agenda_events', btn.dataset.del);
        ok('Verwijderd');
        render(container);
      };
    });
  }

  formEl.querySelector('#ev-save').onclick = async () => {
    const title = formEl.querySelector('#ev-title').value.trim();
    if (!title) { err('Titel verplicht'); return; }
    const newEv = {
      id: ev.id,
      title,
      date: formEl.querySelector('#ev-date').value,
      hour: +formEl.querySelector('#ev-hour').value,
      minute: +formEl.querySelector('#ev-min').value,
      duration: +formEl.querySelector('#ev-dur').value || 60,
      category: formEl.querySelector('#ev-cat').value,
      note: formEl.querySelector('#ev-note').value.trim(),
    };
    await put('agenda_events', newEv);
    ok(isEdit ? 'Bijgewerkt' : 'Toegevoegd');
    formEl.style.display = 'none';
    render(container);
  };

  formEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function formatWeekLabel(dates) {
  const first = new Date(dates[0] + 'T12:00:00');
  const last  = new Date(dates[6] + 'T12:00:00');
  const months = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
  if (first.getMonth() === last.getMonth()) {
    return `${first.getDate()} – ${last.getDate()} ${months[first.getMonth()]} ${first.getFullYear()}`;
  }
  return `${first.getDate()} ${months[first.getMonth()]} – ${last.getDate()} ${months[last.getMonth()]} ${first.getFullYear()}`;
}
