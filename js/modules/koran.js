import { all, put, get } from '../db.js';
import { openModal } from '../components/modal.js';
import { ymd, escapeHTML } from '../utils.js';
import { celebrateTask } from '../components/celebrate.js';
import { ok, err } from '../components/toast.js';

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

  const notifPerm = ('Notification' in window) ? Notification.permission : 'unsupported';
  let notifHTML;
  if (notifPerm === 'granted') {
    notifHTML = `<p class="muted" style="margin-top:8px;font-size:.9rem">Notificaties aan ✓</p>`;
  } else if (notifPerm === 'denied') {
    notifHTML = `<p class="muted" style="margin-top:8px;font-size:.85rem">ℹ️ Notificaties geweigerd. Ga naar Instellingen → Safari → Notificaties om dit toe te staan.</p>`;
  } else if (notifPerm === 'default') {
    notifHTML = `<button class="btn secondary block" id="enable-notif" style="margin-top:8px">Notificaties inschakelen</button>`;
  } else {
    notifHTML = `<p class="muted" style="margin-top:8px;font-size:.85rem">Notificaties niet ondersteund in deze browser.</p>`;
  }

  const emptyState = log.length === 0 ? `
    <div class="empty-state" style="text-align:center;padding:2rem">
      <div style="font-size:2rem">📖</div>
      <p>Begin je hizb-streak vandaag!</p>
      <p style="opacity:0.6;font-size:14px">Vink je dagelijkse hizb af en bouw een streak op.</p>
    </div>` : '';

  container.innerHTML = `
    <h1>Koran</h1>
    ${emptyState}
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
      <button class="btn secondary block" id="repair-day" style="margin-top:8px">🛠️ Gemiste dag goedmaken (1x per maand)</button>
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
      ${notifHTML}
    </div>
  `;

  renderChart30(container, doneSet);

  container.querySelector('#check').onclick = async () => {
    await put('hizb_log', { date: today, completed: true });
    celebrateTask();
    render(container);
  };
  container.querySelector('#repair-day').onclick = async () => {
    const lastRepair = localStorage.getItem('lastStreakRepair');
    const now = new Date();
    // Key includes year so Dec 31 → Jan 1 doesn't reset prematurely
    const repairMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (lastRepair === repairMonthKey) { err('Deze maand al gebruikt'); return; }
    openModal('Gemiste dag goedmaken', `
      <p class="muted" style="font-size:.88rem;margin:0 0 12px">Kies de dag die je wilt goedmaken. Dit kan slechts één keer per maand.</p>
      <label>Datum *</label>
      <input name="date" type="date" required max="${ymd()}" />
    `, async (d) => {
      if (!d.date) throw new Error('Kies een datum');
      if (d.date > ymd()) throw new Error('Datum moet in het verleden liggen');
      // Guard: repaired date must be in a PREVIOUS calendar month AND within last 31 days
      const repairDate = new Date(d.date + 'T12:00:00');
      const isSameMonth = repairDate.getFullYear() === now.getFullYear() && repairDate.getMonth() === now.getMonth();
      if (isSameMonth) throw new Error('Je kunt alleen een dag uit een vorige maand goedmaken');
      const msAgo = now - repairDate;
      if (msAgo > 31 * 24 * 60 * 60 * 1000) throw new Error('Datum is meer dan 31 dagen geleden — te oud om goed te maken');
      await put('hizb_log', { date: d.date, completed: true, repaired: true });
      localStorage.setItem('lastStreakRepair', repairMonthKey);
      ok(`Dag ${d.date} goedgemaakt — gebruik tot volgende maand`);
      render(container);
    });
  };
  container.querySelector('#save-settings').onclick = () => {
    localStorage.setItem('hizbReminderTime', container.querySelector('#reminder').value);
    localStorage.setItem('hizbStartPoint', container.querySelector('#start').value);
    scheduleReminder();
    ok('Opgeslagen');
  };
  const enableBtn = container.querySelector('#enable-notif');
  if (enableBtn) {
    enableBtn.onclick = async () => {
      if (!('Notification' in window)) { ok('Notificaties niet ondersteund'); return; }
      const res = await Notification.requestPermission();
      if (res === 'granted') { ok('Notificaties ingeschakeld ✓'); scheduleReminder(); }
      else if (res === 'denied') { ok('Notificaties geweigerd — pas aan via Instellingen → Safari'); }
      else { ok('Notificaties niet ingeschakeld'); }
      render(container);
    };
  }

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
  // Inform the service worker so it can fire a notification when the app is closed.
  // The SW checks localStorage on fetch/activate — storing the time is sufficient.
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SCHEDULE_HIZB_REMINDER',
      time: t,
    });
  }
}

export function registerHizbPushReminder(time) {
  if (time) localStorage.setItem('hizbReminderTime', time);
  if (!('Notification' in window)) return Promise.resolve('unsupported');
  if (Notification.permission === 'granted') { scheduleReminder(); return Promise.resolve('granted'); }
  if (Notification.permission === 'denied') return Promise.resolve('denied');
  return Notification.requestPermission().then(res => {
    if (res === 'granted') scheduleReminder();
    return res;
  });
}
