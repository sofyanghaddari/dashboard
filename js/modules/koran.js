import { all, put, get } from '../db.js';
import { openModal } from '../components/modal.js';
import { ymd, escapeHTML } from '../utils.js';
import { celebrateTask } from '../components/celebrate.js';
import { ok, err } from '../components/toast.js';

let _reminderTimer = null;

const CIRCUMFERENCE = 2 * Math.PI * 50; // r=50

export async function render(container) {
  const today  = ymd();
  const todayRec = await get('hizb_log', today);
  const log    = await all('hizb_log');
  const doneSet = new Set(log.map(l => l.date));

  let streak = 0;
  const cur = new Date();
  while (doneSet.has(ymd(cur))) { streak++; cur.setDate(cur.getDate() - 1); }

  const reminderTime = localStorage.getItem('hizbReminderTime') || '20:00';
  const startPoint   = localStorage.getItem('hizbStartPoint') || 'Surah Al-Fath, 10 hizb';

  // Maand-voltooiing: hoeveel van de dagen tot nu toe deze maand afgevinkt
  const now = new Date();
  const daysIntoMonth = now.getDate();
  const doneThisMonth = log.filter(l => {
    const d = new Date(l.date + 'T12:00:00');
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
  const monthPct = daysIntoMonth > 0 ? Math.round((doneThisMonth / daysIntoMonth) * 100) : 0;

  // Circulaire progress: 100% als vandaag gedaan, anders maand-pct (max 98%)
  const fillPct    = todayRec ? 100 : Math.min(98, monthPct);
  const dashFill   = (fillPct / 100) * CIRCUMFERENCE;
  const fillClass  = todayRec ? 'cp-fill done' : 'cp-fill';

  const notifPerm = ('Notification' in window) ? Notification.permission : 'unsupported';
  let notifHTML;
  if (notifPerm === 'granted') {
    notifHTML = `<p class="muted" style="font-size:.875rem;margin-top:10px">Notificaties aan ✓</p>`;
  } else if (notifPerm === 'denied') {
    notifHTML = `<p class="muted" style="font-size:.82rem;margin-top:10px">ℹ️ Notificaties geweigerd — pas aan via Instellingen → Safari.</p>`;
  } else if (notifPerm === 'default') {
    notifHTML = `<button class="btn secondary block" id="enable-notif" style="margin-top:10px">Notificaties inschakelen</button>`;
  } else {
    notifHTML = `<p class="muted" style="font-size:.82rem;margin-top:10px">Notificaties niet ondersteund in deze browser.</p>`;
  }

  container.innerHTML = `
    <h1 class="page-title">Koran</h1>

    <!-- PROGRESS + STREAK -->
    <div class="card">
      <div style="display:flex;align-items:center;gap:20px;padding:8px 0 16px">

        <!-- Circulaire progress -->
        <div class="circular-progress">
          <svg width="140" height="140" viewBox="0 0 120 120" aria-hidden="true">
            <circle class="cp-track" cx="60" cy="60" r="50"/>
            <circle class="${fillClass}" cx="60" cy="60" r="50"
              stroke-dasharray="${dashFill.toFixed(1)} ${CIRCUMFERENCE.toFixed(1)}"
              stroke-dashoffset="0"/>
          </svg>
          <div class="cp-inner">
            ${todayRec
              ? `<div class="cp-done-check" style="color:var(--ok)">✓</div>`
              : `<div class="cp-emoji">${streak > 0 ? '🔥' : '📖'}</div>`}
            <div class="cp-label">${todayRec ? 'Voltooid' : (doneThisMonth + '/' + daysIntoMonth)}</div>
          </div>
        </div>

        <!-- Streak teller -->
        <div>
          <div class="streak-num">${streak}</div>
          <div class="streak-unit">dag${streak === 1 ? '' : 'en'}</div>
          <div class="streak-sub">op rij${streak > 0 ? ' 🔥' : ''}</div>
          ${monthPct >= 80 ? `<div style="font-size:.72rem;color:var(--ok);margin-top:6px;font-weight:600">${monthPct}% deze maand ✓</div>` : ''}
        </div>
      </div>

      <!-- AFVINK KNOP -->
      ${todayRec
        ? `<div class="hizb-check-btn done" role="status">✓ Hizb afgevinkt voor vandaag</div>`
        : `<button class="hizb-check-btn" id="check">📖 Afvinken voor vandaag</button>`}

      <p class="muted" style="font-size:.8rem;text-align:center;margin:12px 0 0">${escapeHTML(startPoint)}</p>
    </div>

    <!-- 30 DAGEN GRID -->
    <div class="card">
      <h2 class="card-title">Laatste 30 dagen</h2>
      <div class="hizb-cal" id="chart30"></div>
      <div style="display:flex;gap:12px;margin-top:10px;font-size:.72rem;color:var(--text-faint)">
        <span style="display:flex;align-items:center;gap:5px"><span style="width:12px;height:12px;border-radius:3px;background:linear-gradient(135deg,var(--ok),rgba(93,212,154,.7));display:inline-block"></span>Gedaan</span>
        <span style="display:flex;align-items:center;gap:5px"><span style="width:12px;height:12px;border-radius:3px;background:linear-gradient(135deg,var(--gold),var(--gold-bright));display:inline-block"></span>Hersteld</span>
      </div>
    </div>

    <!-- ACTIES + INSTELLINGEN -->
    <div class="card">
      <h2 class="card-title">Instellingen</h2>
      <button class="btn secondary block" id="repair-day" style="margin-bottom:14px">🛠️ Gemiste dag goedmaken <span class="muted" style="font-size:.8em">(1× per maand)</span></button>
      <label>Herinneringstijd</label>
      <input type="time" id="reminder" value="${reminderTime}" />
      <label style="margin-top:12px">Startpunt</label>
      <input id="start" value="${escapeHTML(startPoint)}" />
      <button class="btn block" id="save-settings" style="margin-top:12px">Opslaan</button>
      ${notifHTML}
    </div>
  `;

  renderChart30(container, doneSet, log);

  const checkBtn = container.querySelector('#check');
  if (checkBtn) {
    checkBtn.onclick = async () => {
      await put('hizb_log', { date: today, completed: true });
      celebrateTask();
      render(container);
    };
  }

  container.querySelector('#repair-day').onclick = async () => {
    const now2 = new Date();
    const repairMonthKey = `${now2.getFullYear()}-${String(now2.getMonth() + 1).padStart(2, '0')}`;
    if (localStorage.getItem('lastStreakRepair') === repairMonthKey) { err('Deze maand al gebruikt'); return; }
    openModal('Gemiste dag goedmaken', `
      <p class="muted" style="font-size:.875rem;margin:0 0 14px">Kies de dag die je wilt goedmaken. Dit kan slechts één keer per maand.</p>
      <label>Datum *</label>
      <input name="date" type="date" required max="${ymd()}" />
    `, async (d) => {
      if (!d.date) throw new Error('Kies een datum');
      if (d.date > ymd()) throw new Error('Datum moet in het verleden liggen');
      const repairDate = new Date(d.date + 'T12:00:00');
      const isSameMonth = repairDate.getFullYear() === now2.getFullYear() && repairDate.getMonth() === now2.getMonth();
      if (isSameMonth) throw new Error('Je kunt alleen een dag uit een vorige maand goedmaken');
      if (now2 - repairDate > 31 * 24 * 60 * 60 * 1000) throw new Error('Datum is meer dan 31 dagen geleden — te oud');
      await put('hizb_log', { date: d.date, completed: true, repaired: true });
      localStorage.setItem('lastStreakRepair', repairMonthKey);
      ok(`Dag ${d.date} goedgemaakt`);
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
      else if (res === 'denied') ok('Notificaties geweigerd — pas aan via Instellingen → Safari');
      else ok('Notificaties niet ingeschakeld');
      render(container);
    };
  }

  scheduleReminder();
}

function renderChart30(container, doneSet, log) {
  const el    = container.querySelector('#chart30');
  const today = ymd();
  const cells = [];

  for (let i = 29; i >= 0; i--) {
    const d   = new Date();
    d.setDate(d.getDate() - i);
    const key = ymd(d);
    const done = doneSet.has(key);
    const repaired = done && log.some(l => l.date === key && l.repaired);
    const isToday  = key === today;

    const classes = ['hizb-day'];
    if (done) classes.push(repaired ? 'repaired' : 'done');
    if (isToday) classes.push('today');

    cells.push(`<div class="${classes.join(' ')}" title="${key}${done ? ' ✓' : ''}">
      ${done ? '<span style="color:rgba(0,0,0,.5);font-size:.65rem;line-height:1">✓</span>' : ''}
    </div>`);
  }
  el.innerHTML = cells.join('');
}

function scheduleReminder() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (_reminderTimer) clearTimeout(_reminderTimer);
  const t = localStorage.getItem('hizbReminderTime') || '20:00';
  const [h, m] = t.split(':').map(Number);
  const now = new Date();
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  _reminderTimer = setTimeout(() => {
    new Notification('Koran herinnering', { body: 'Tijd voor je dagelijkse hizb.' });
    scheduleReminder();
  }, target - now);
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SCHEDULE_HIZB_REMINDER', time: t });
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
