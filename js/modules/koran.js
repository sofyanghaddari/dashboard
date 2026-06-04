import { all, put, get } from '../db.js';
import { ymd, escapeHTML } from '../utils.js';

let _reminderTimer = null;

export async function render(container) {
  const today = ymd();
  const todayRec = await get('hizb_log', today);
  const log = await all('hizb_log');
  const doneSet = new Set(log.map(l => l.date));

  let streak = 0;
  const cur = new Date();
  while (doneSet.has(ymd(cur))) { streak++; cur.setDate(cur.getDate() - 1); }

  const reminderTime = localStorage.getItem('hizbReminderTime') || '20:00';
  const startPoint = localStorage.getItem('hizbStartPoint') || 'Surah Al-Fath, 10 hizb';

  container.innerHTML = `
    <h1>Koran</h1>
    <div class="card">
      <h2>Vandaag</h2>
      <p class="muted">${escapeHTML(startPoint)}</p>
      <button class="btn block" id="check" ${todayRec ? 'disabled' : ''}>
        ${todayRec ? 'Afgevinkt ✓' : 'Afvinken voor vandaag'}
      </button>
    </div>
    <div class="card">
      <h2>Streak</h2>
      <p><b style="font-size:2rem">${streak}</b> dag${streak===1?'':'en'} achter elkaar</p>
    </div>
    <div class="card">
      <h2>Laatste 30 dagen</h2>
      <div id="chart30"></div>
    </div>
    <div class="card">
      <h2>Instellingen</h2>
      <label>Herinneringstijd</label>
      <input type="time" id="reminder" value="${reminderTime}" />
      <label>Startpunt</label>
      <input id="start" value="${escapeHTML(startPoint)}" />
      <button class="btn block" id="save-settings" style="margin-top:8px">Opslaan</button>
      <button class="btn secondary block" id="enable-notif" style="margin-top:8px">Notificaties inschakelen</button>
    </div>
  `;

  renderChart30(container, doneSet);

  container.querySelector('#check').onclick = async () => {
    await put('hizb_log', { date: today, completed: true });
    render(container);
  };
  container.querySelector('#save-settings').onclick = () => {
    localStorage.setItem('hizbReminderTime', container.querySelector('#reminder').value);
    localStorage.setItem('hizbStartPoint', container.querySelector('#start').value);
    scheduleReminder();
    alert('Opgeslagen');
  };
  container.querySelector('#enable-notif').onclick = async () => {
    if (!('Notification' in window)) { alert('Notificaties niet ondersteund'); return; }
    const res = await Notification.requestPermission();
    alert('Status: ' + res);
    if (res === 'granted') scheduleReminder();
  };

  scheduleReminder();
}

function renderChart30(container, doneSet) {
  const cells = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const done = doneSet.has(ymd(d));
    cells.push(`<div title="${ymd(d)}" style="
      width:18px;height:18px;border-radius:4px;
      background:${done ? 'var(--ok)' : 'var(--bg-elev-2)'};
      border:1px solid var(--border)"></div>`);
  }
  container.querySelector('#chart30').innerHTML =
    `<div style="display:grid;grid-template-columns:repeat(15,1fr);gap:4px">${cells.join('')}</div>`;
}

function scheduleReminder() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (_reminderTimer) clearTimeout(_reminderTimer);
  const t = localStorage.getItem('hizbReminderTime') || '20:00';
  const [h, m] = t.split(':').map(Number);
  const now = new Date();
  const target = new Date(now); target.setHours(h, m, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  const ms = target - now;
  _reminderTimer = setTimeout(() => {
    new Notification('Koran herinnering', { body: 'Tijd voor je dagelijkse hizb.' });
    scheduleReminder();
  }, ms);
}
