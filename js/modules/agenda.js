import { uid, escapeHTML, ymd, fmtMoney } from '../utils.js';
import { ok, err } from '../components/toast.js';
import { all } from '../db.js';

const STORAGE_KEY = 'agenda_events';
const CATS = {
  werk:      { label: 'Werk',       color: '#6ec9ff' },
  leren:     { label: 'Leren',      color: '#a78bfa' },
  persoonlijk:{ label: 'Persoonlijk', color: '#fb923c' },
  sport:     { label: 'Sport',      color: '#4ade80' },
  rust:      { label: 'Rust',       color: '#94a3b8' },
};
const HOURS = Array.from({ length: 19 }, (_, i) => i + 6); // 06–24

function getEvents() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function saveEvents(arr) { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); }

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
  const weekOffset  = +(container.dataset.agendaWeek  || 0);
  const focusDay    =   container.dataset.agendaDay   || null; // e.g. '2026-06-08'
  const events      = getEvents();
  const dates       = weekDates(weekOffset);
  const today       = ymd();

  // Load ride data for income display
  const rides = await all('rides').catch(() => []);

  container.innerHTML = `
    <h1 class="page-title">Week</h1>

    <!-- WEEK NAVIGATOR -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <button class="btn secondary" id="prev-week" style="padding:8px 14px">‹</button>
      <div style="text-align:center">
        <div style="font-weight:700;font-size:.95rem">${formatWeekLabel(dates)}</div>
        ${weekOffset !== 0 ? `<button class="btn secondary" id="today-btn" style="padding:4px 10px;font-size:.78rem;margin-top:4px">Naar vandaag</button>` : ''}
      </div>
      <button class="btn secondary" id="next-week" style="padding:8px 14px">›</button>
    </div>

    <!-- DAY SELECTOR (mobile) -->
    <div class="agenda-day-tabs">
      ${dates.map((d, i) => {
        const isToday = d === today;
        const isFocus = d === focusDay || (!focusDay && d === today);
        const dayRides = rides.filter(r => r.date && r.date.startsWith(d));
        const income = dayRides.reduce((s, r) => s + (r.amount || 0), 0);
        return `<button class="agenda-day-tab ${isFocus ? 'active' : ''} ${isToday ? 'today' : ''}" data-day="${d}">
          <span class="adt-name">${DAY_NAMES[i]}</span>
          <span class="adt-date">${d.slice(8)}</span>
          ${income > 0 ? `<span class="adt-income">${fmtMoney(income)}</span>` : ''}
        </button>`;
      }).join('')}
    </div>

    <!-- WEEK GRID -->
    <div id="agenda-grid"></div>

    <!-- MODAL PLACEHOLDER -->
    <div id="agenda-event-form" style="display:none"></div>
  `;

  // Nav buttons
  container.querySelector('#prev-week').onclick = () => { container.dataset.agendaWeek = weekOffset - 1; render(container); };
  container.querySelector('#next-week').onclick = () => { container.dataset.agendaWeek = weekOffset + 1; render(container); };
  const todayBtn = container.querySelector('#today-btn');
  if (todayBtn) todayBtn.onclick = () => { container.dataset.agendaWeek = 0; container.dataset.agendaDay = today; render(container); };

  // Day tabs
  container.querySelectorAll('[data-day]').forEach(btn => {
    btn.onclick = () => { container.dataset.agendaDay = btn.dataset.day; render(container); };
  });

  const activeDays = focusDay ? [focusDay] : dates;
  const activeDayMobile = focusDay || today;

  renderGrid(container, dates, activeDayMobile, events, rides, container.dataset.agendaDay ? true : false);
}

function renderGrid(container, dates, focusDay, events, rides, isMobileMode) {
  const grid = container.querySelector('#agenda-grid');
  const today = ymd();

  // On mobile: only show the focused day
  const visibleDates = window.innerWidth < 600 ? [focusDay] : dates;

  grid.innerHTML = `
    <div class="agenda-grid" style="grid-template-columns: 44px ${visibleDates.map(() => '1fr').join(' ')}">
      <!-- Header row -->
      <div class="agenda-time-col"></div>
      ${visibleDates.map(d => {
        const i = dates.indexOf(d);
        const isToday = d === today;
        const dayRides = rides.filter(r => r.date && r.date.startsWith(d));
        const income = dayRides.reduce((s, r) => s + (r.amount || 0), 0);
        return `<div class="agenda-col-hd ${isToday ? 'today' : ''}">
          <span>${i >= 0 ? DAY_NAMES_FULL[i] : d}</span>
          ${income > 0 ? `<span style="font-size:.72rem;color:var(--gold);display:block">${fmtMoney(income)}</span>` : ''}
        </div>`;
      }).join('')}

      <!-- Time rows -->
      ${HOURS.map(h => {
        const timeStr = `${String(h).padStart(2,'0')}:00`;
        return `
          <div class="agenda-time-lbl">${timeStr}</div>
          ${visibleDates.map(d => {
            const dayEvents = events.filter(e => e.date === d && e.hour === h);
            return `<div class="agenda-cell" data-date="${d}" data-hour="${h}">
              ${dayEvents.map(e => eventChip(e)).join('')}
              <button class="agenda-add-btn" data-date="${d}" data-hour="${h}" title="Toevoegen">+</button>
            </div>`;
          }).join('')}
        `;
      }).join('')}
    </div>
  `;

  // Bind add buttons
  grid.querySelectorAll('.agenda-add-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      openEventForm(container, { date: btn.dataset.date, hour: +btn.dataset.hour }, events);
    };
  });

  // Tap anywhere in an empty cell to add (mobile has no hover for the + button)
  grid.querySelectorAll('.agenda-cell').forEach(cell => {
    cell.onclick = (e) => {
      if (e.target.closest('.agenda-chip')) return; // editing handled by chip
      if (e.target.closest('.agenda-add-btn')) return; // handled by button handler above
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
    ${ev.note ? `<span class="agenda-chip-note">${escapeHTML(ev.note)}</span>` : ''}
    <button class="agenda-chip-del" data-del="${ev.id}">✕</button>
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
    formEl.querySelector('#ev-del').onclick = () => {
      const updated = events.filter(x => x.id !== ev.id);
      saveEvents(updated);
      ok('Blok verwijderd');
      formEl.style.display = 'none';
      render(container);
    };
  }

  // Bind chip delete buttons only inside the agenda grid (not form buttons)
  const grid = container.querySelector('#agenda-grid');
  if (grid) {
    grid.querySelectorAll('[data-del]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const current = getEvents();
        const updated = current.filter(x => x.id !== btn.dataset.del);
        saveEvents(updated);
        ok('Verwijderd');
        render(container);
      };
    });
  }

  formEl.querySelector('#ev-save').onclick = () => {
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
    // Lees events opnieuw (stale-closure fix: delete-knoppen kunnen events hebben verwijderd)
    const freshEvents = getEvents();
    const updated = isEdit
      ? freshEvents.map(x => x.id === ev.id ? newEv : x)
      : [...freshEvents, newEv];
    saveEvents(updated);
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
