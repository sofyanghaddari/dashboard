import { all, put, get } from '../db.js';
import { openModal } from '../components/modal.js';
import { ymd, escapeHTML, effectiveNow } from '../utils.js';
import { celebrateTask } from '../components/celebrate.js';
import { ok, err } from '../components/toast.js';
import { HIZBS } from '../data/hizbs.js';
import { initCountUps } from '../animate.js';
import { openQibla } from '../qibla.js';

let _reminderTimer = null;
const CIRCUMFERENCE = 2 * Math.PI * 50;

// ── Hizb voortgang helpers ──────────────────────────────────────────────────
function getHizbVoortgang() {
  try { return JSON.parse(localStorage.getItem('hizb_voortgang') || '{}'); }
  catch { return {}; }
}
function toggleHizbVoortgang(n) {
  const v = getHizbVoortgang();
  if (v[n]) delete v[n]; else v[n] = true;
  localStorage.setItem('hizb_voortgang', JSON.stringify(v));
  return !!v[n];
}

export async function render(container) {
  const tab = container.dataset.koranTab || 'hizb';
  container.innerHTML = `
    <h1 class="page-title">Koran</h1>
    <button id="koran-qibla-btn" style="display:flex;align-items:center;gap:10px;width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:13px 16px;margin-bottom:16px;cursor:pointer;color:#f5f0e8;text-align:left">
      <span style="font-size:1.4rem">🧭</span>
      <div style="flex:1">
        <div style="font-size:.88rem;font-weight:600;letter-spacing:-.01em">Qibla kompas</div>
        <div style="font-size:.74rem;color:#686868;margin-top:2px">Richting naar Mekka</div>
      </div>
      <svg width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M1 1l5 5-5 5" stroke="#555" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <div class="todo-seg" style="margin-bottom:16px">
      <button class="todo-seg-btn ${tab==='hizb'?'active':''}" id="ktab-hizb">📖 Hizb</button>
      <button class="todo-seg-btn ${tab==='soeras'?'active':''}" id="ktab-soeras">📋 Soera's</button>
    </div>
    <div id="koran-content"></div>
  `;

  container.querySelector('#koran-qibla-btn').onclick = () => openQibla();
  container.querySelector('#ktab-hizb').onclick   = () => { container.dataset.koranTab = 'hizb';   render(container); };
  container.querySelector('#ktab-soeras').onclick = () => { container.dataset.koranTab = 'soeras'; render(container); };

  if (tab === 'hizb') await renderHizb(container);
  else renderSoeras(container);
}

// ── HIZB TAB ─────────────────────────────────────────────────────────────────
async function renderHizb(container) {
  const now       = effectiveNow(); // Dag begint om DAY_CUTOFF_HOUR, niet om 00:00
  const today     = ymd(now);
  const yesterday = ymd(new Date(now.getTime() - 86400000));
  const todayRec  = await get('hizb_log', today);
  const yestRec   = await get('hizb_log', yesterday);
  const log       = await all('hizb_log');
  const doneSet   = new Set(log.map(l => l.date));

  // Streak calc (also counts catchup days)
  // Start from yesterday if today isn't done yet — otherwise streak shows 0 all day
  let streak = 0;
  const cur = new Date(now);
  if (!doneSet.has(today)) cur.setDate(cur.getDate() - 1);
  while (doneSet.has(ymd(cur))) { streak++; cur.setDate(cur.getDate() - 1); }

  const reminderTime = localStorage.getItem('hizbReminderTime') || '20:00';
  const startPoint   = localStorage.getItem('hizbStartPoint') || 'Surah Al-Fath, 10 hizb';

  const daysIntoMonth  = now.getDate();
  const doneThisMonth  = log.filter(l => {
    const d = new Date(l.date + 'T12:00:00');
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
  const monthPct = daysIntoMonth > 0 ? Math.round((doneThisMonth / daysIntoMonth) * 100) : 0;
  const fillPct  = todayRec ? 100 : Math.min(98, monthPct);
  const dashFill = (fillPct / 100) * CIRCUMFERENCE;
  const fillClass = todayRec ? 'cp-fill done' : 'cp-fill';

  // Feature 12: inhaal conditions — show banner whenever yesterday was missed
  const canCatchup = !yestRec;
  const todayCount = todayRec?.count || 1;
  const alreadyCaughtUp = yestRec?.catchup;

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

  // Stats: perfect streaks vs. met inhaal
  const { perfectStreaks, catchupStreaks } = calcStreakStats(log);
  const longestStreak = calcLongestStreak(log);

  const el = container.querySelector('#koran-content');
  el.innerHTML = `
    <!-- INHAAL BANNER -->
    ${canCatchup && !alreadyCaughtUp ? `
      <div class="catchup-banner" id="catchup-banner">
        <div style="font-size:1.1rem">⚠️</div>
        <div>
          <div style="font-weight:600;font-size:.92rem">Gisteren gemist!</div>
          <div style="font-size:.8rem;color:var(--text-dim);margin-top:2px">Doe vandaag nog een hizb om je streak te bewaren</div>
        </div>
        <button class="btn" id="catchup-btn" style="padding:8px 14px;font-size:.85rem;flex-shrink:0">Inhalen ↩</button>
      </div>` : ''}

    <!-- PROGRESS + STREAK -->
    <div class="card">
      <div style="display:flex;align-items:center;gap:20px;padding:8px 0 16px">
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
            <div class="cp-label">${todayRec ? (todayCount >= 2 ? '2× gedaan' : 'Voltooid') : (doneThisMonth + '/' + daysIntoMonth)}</div>
          </div>
        </div>
        <div>
          <div class="streak-num" data-countup="${streak}" data-decimals="0" data-prefix="">${streak}</div>
          <div class="streak-unit">dag${streak === 1 ? '' : 'en'}</div>
          <div class="streak-sub">op rij${streak > 0 ? ' 🔥' : ''}</div>
          ${monthPct >= 80 ? `<div style="font-size:.72rem;color:var(--ok);margin-top:6px;font-weight:600">${monthPct}% deze maand ✓</div>` : ''}
        </div>
      </div>

      ${todayRec
        ? `<button class="hizb-check-btn done" ${todayCount >= 2 ? 'disabled' : ''} id="double-hizb" type="button">
            ${todayCount >= 2 ? '✓ Dubbel hizb gedaan' : '📖 Nog een hizb doen (inhaal)'}
           </button>`
        : `<button class="hizb-check-btn" id="check" type="button">📖 Afvinken voor vandaag</button>`}

      <p class="muted" style="font-size:.8rem;text-align:center;margin:12px 0 0">${escapeHTML(startPoint)}</p>
    </div>

    <!-- 30 DAGEN GRID -->
    <div class="card">
      <h2 class="card-title">Laatste 30 dagen</h2>
      <div class="hizb-cal" id="chart30"></div>
      <div style="display:flex;gap:12px;margin-top:10px;font-size:.72rem;color:var(--text-faint);flex-wrap:wrap">
        <span style="display:flex;align-items:center;gap:5px"><span style="width:12px;height:12px;border-radius:3px;background:linear-gradient(135deg,var(--ok),rgba(93,212,154,.7));display:inline-block"></span>Gedaan</span>
        <span style="display:flex;align-items:center;gap:5px"><span style="width:12px;height:12px;border-radius:3px;background:linear-gradient(135deg,var(--gold),var(--gold-bright));display:inline-block"></span>Hersteld</span>
        <span style="display:flex;align-items:center;gap:5px"><span style="width:12px;height:12px;border-radius:3px;background:linear-gradient(135deg,#f97316,#fb923c);display:inline-block"></span>Ingehaald ↩</span>
      </div>
    </div>

    <!-- STREAK STATISTIEKEN -->
    <div class="card">
      <h2 class="card-title">Streak statistieken</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="stat-mini-card">
          <div class="stat-mini-num" data-countup="${streak}" data-decimals="0" data-prefix="">${streak}</div>
          <div class="stat-mini-lbl">Huidige streak</div>
        </div>
        <div class="stat-mini-card">
          <div class="stat-mini-num" data-countup="${longestStreak}" data-decimals="0" data-prefix="">${longestStreak}</div>
          <div class="stat-mini-lbl">Langste streak ooit</div>
        </div>
        <div class="stat-mini-card">
          <div class="stat-mini-num" style="color:var(--ok)">${perfectStreaks}</div>
          <div class="stat-mini-lbl">Perfecte streaks</div>
        </div>
        <div class="stat-mini-card">
          <div class="stat-mini-num" style="color:#f97316">${catchupStreaks}</div>
          <div class="stat-mini-lbl">Streaks met inhaal</div>
        </div>
      </div>
    </div>

    <!-- ACTIES + INSTELLINGEN -->
    <div class="card">
      <h2 class="card-title">Instellingen</h2>
      ${(() => {
        const now2 = effectiveNow();
        const mk = `${now2.getFullYear()}-${String(now2.getMonth() + 1).padStart(2, '0')}`;
        const used = localStorage.getItem('lastStreakRepair') === mk;
        return used
          ? `<div class="repair-used-badge">✓ Goedmaken al gebruikt deze maand</div>`
          : `<button class="btn secondary block" id="repair-day" style="margin-bottom:14px">🛠️ Gemiste dag goedmaken <span class="muted" style="font-size:.8em">(1× per maand)</span></button>`;
      })()}
      <label>Herinneringstijd</label>
      <input type="time" id="reminder" value="${reminderTime}" />
      <label style="margin-top:12px">Startpunt</label>
      <input id="start" value="${escapeHTML(startPoint)}" />
      <button class="btn block" id="save-settings" style="margin-top:12px">Opslaan</button>
      ${notifHTML}
    </div>
  `;

  renderChart30(el, doneSet, log);
  initCountUps(el);

  // Feature 12: Inhaal banner button
  const catchupBtn = el.querySelector('#catchup-btn');
  if (catchupBtn) {
    catchupBtn.onclick = async () => {
      if (todayRec) {
        // Today already done — mark today count:2 and yesterday as catchup
        await put('hizb_log', { date: today, completed: true, count: 2 });
        await put('hizb_log', { date: yesterday, completed: true, catchup: true });
        ok('↩ Ingehaald! Streak blijft intact. 🔥');
      } else {
        // Today not done yet — mark today done and yesterday as catchup
        await put('hizb_log', { date: today, completed: true, count: 1 });
        await put('hizb_log', { date: yesterday, completed: true, catchup: true });
        ok('↩ Gisteren ingehaald én vandaag afgevinkt! 🔥');
      }
      render(container);
    };
  }

  // Double hizb button (when already done once, show option to do a second)
  const doubleBtn = el.querySelector('#double-hizb');
  if (doubleBtn && todayCount < 2) {
    doubleBtn.onclick = async () => {
      if (!yestRec && !alreadyCaughtUp) {
        // yesterday not done — this is the catchup action
        await put('hizb_log', { date: today, completed: true, count: 2 });
        await put('hizb_log', { date: yesterday, completed: true, catchup: true });
        ok('↩ Dubbel gedaan — gisteren ingehaald! 🔥');
      } else {
        await put('hizb_log', { date: today, completed: true, count: 2 });
        ok('📖 Dubbel hizb gedaan vandaag! 🌟');
      }
      render(container);
    };
  }

  const checkBtn = el.querySelector('#check');
  if (checkBtn) {
    checkBtn.onclick = async () => {
      await put('hizb_log', { date: today, completed: true, count: 1 });
      celebrateTask();
      render(container);
    };
  }

  el.querySelector('#repair-day')?.addEventListener('click', async () => {
    const now2 = effectiveNow();
    const repairMonthKey = `${now2.getFullYear()}-${String(now2.getMonth() + 1).padStart(2, '0')}`;
    if (localStorage.getItem('lastStreakRepair') === repairMonthKey) { err('Deze maand al gebruikt'); return; }
    openModal('Gemiste dag goedmaken', `
      <p class="muted" style="font-size:.875rem;margin:0 0 14px">Kies de dag die je wilt goedmaken. Dit kan slechts één keer per maand.</p>
      <label>Datum *</label>
      <input name="date" type="date" required max="${ymd(new Date(now2.getTime() - 86400000))}" />
    `, async (d) => {
      if (!d.date) throw new Error('Kies een datum');
      const repairDate = new Date(d.date + 'T12:00:00');
      const isSameMonth = repairDate.getFullYear() === now2.getFullYear() && repairDate.getMonth() === now2.getMonth();
      if (isSameMonth) throw new Error('Je kunt alleen een dag uit een vorige maand goedmaken');
      if (repairDate >= now2) throw new Error('Datum moet in het verleden liggen');
      await put('hizb_log', { date: d.date, completed: true, repaired: true });
      localStorage.setItem('lastStreakRepair', repairMonthKey);
      ok(`Dag ${d.date} goedgemaakt`);
      render(container);
    });
  });

  el.querySelector('#save-settings').onclick = () => {
    localStorage.setItem('hizbReminderTime', el.querySelector('#reminder').value);
    localStorage.setItem('hizbStartPoint', el.querySelector('#start').value);
    scheduleReminder();
    ok('Opgeslagen');
  };

  const enableBtn = el.querySelector('#enable-notif');
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

// ── HIZB VOORTGANGSKAART ──────────────────────────────────────────────────────
function renderSoeras(container) {
  const voortgang = getHizbVoortgang();
  const doneCount = Object.keys(voortgang).length;
  const pct = Math.round(doneCount / 60 * 100);

  const el = container.querySelector('#koran-content');
  el.innerHTML = `
    <!-- VOORTGANGSBALK -->
    <div class="card" style="padding:16px;margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px">
        <h2 class="card-title" style="margin:0">Koran voortgang</h2>
        <span style="font-size:.88rem;color:var(--text-dim);font-weight:600">${doneCount}/60 hizbs</span>
      </div>
      <div class="soera-progress-bar-wrap">
        <div class="soera-progress-read" style="width:${pct}%"></div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:.75rem;color:var(--text-faint)">
        <span>${pct}% voltooid</span>
        <span>${60 - doneCount} hizbs resterend</span>
      </div>
    </div>

    <!-- HIZB LIJST -->
    <div class="hizb-voortgang-list" id="hv-list"></div>
  `;

  renderHizbList(el.querySelector('#hv-list'), voortgang, container);
}

function renderHizbList(listEl, voortgang, container) {
  let currentJuz = null;
  let html = '';

  HIZBS.forEach(h => {
    if (h.juz !== currentJuz) {
      currentJuz = h.juz;
      html += `<div class="hv-juz-header">Juz ${h.juz}</div>`;
    }
    const done = !!voortgang[h.n];
    const partsHTML = h.parts.map(p =>
      `<span class="hv-part ${done ? 'done' : ''}">${p.tl}${p.v ? ` <span class="hv-verses">${p.v}</span>` : ''}</span>`
    ).join('');

    html += `
      <div class="hv-card ${done ? 'done' : ''}" data-hn="${h.n}">
        <div class="hv-left">
          <div class="hv-num">Hizb ${h.n}</div>
          <div class="hv-parts">${partsHTML}</div>
        </div>
        <button class="hv-check ${done ? 'done' : ''}" data-hn="${h.n}" aria-label="${done ? 'Markering verwijderen' : 'Markeer als gelezen'}">
          ${done ? '✓' : ''}
        </button>
      </div>`;
  });

  listEl.innerHTML = html;

  listEl.querySelectorAll('.hv-check').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const n = +btn.dataset.hn;
      const nowDone = toggleHizbVoortgang(n);
      ok(nowDone ? `✓ Hizb ${n} gelezen` : `Hizb ${n} verwijderd`);
      renderSoeras(container);
    };
  });

  // Also tap anywhere on card
  listEl.querySelectorAll('.hv-card').forEach(card => {
    card.onclick = () => {
      const n = +card.dataset.hn;
      const nowDone = toggleHizbVoortgang(n);
      ok(nowDone ? `✓ Hizb ${n} gelezen` : `Hizb ${n} verwijderd`);
      renderSoeras(container);
    };
  });
}

// ── Calendar rendering ────────────────────────────────────────────────────────
function renderChart30(container, doneSet, log) {
  const el    = container.querySelector('#chart30');
  if (!el) return;
  const today = ymd(effectiveNow());
  const cells = [];
  for (let i = 29; i >= 0; i--) {
    const d   = new Date(effectiveNow());
    d.setDate(d.getDate() - i);
    const key = ymd(d);
    const done     = doneSet.has(key);
    const entry    = done && log.find(l => l.date === key);
    const repaired = done && entry?.repaired;
    const catchup  = done && entry?.catchup;
    const isToday  = key === today;

    const classes = ['hizb-day'];
    if (done) classes.push(repaired ? 'repaired' : catchup ? 'catchup' : 'done');
    if (isToday) classes.push('today');

    const indicator = catchup ? '↩' : done ? '✓' : '';
    cells.push(`<div class="${classes.join(' ')}" title="${key}${done ? ' ✓' : ''}">
      ${indicator ? `<span style="color:rgba(0,0,0,.55);font-size:.62rem;line-height:1">${indicator}</span>` : ''}
    </div>`);
  }
  el.innerHTML = cells.join('');
}

// ── Streak stat helpers ───────────────────────────────────────────────────────
function calcLongestStreak(log) {
  if (!log.length) return 0;
  const dates = new Set(log.map(l => l.date));
  let longest = 0, current = 0;
  const sorted = [...dates].sort();
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) { current = 1; }
    else {
      const prev = new Date(sorted[i-1] + 'T12:00:00');
      const cur  = new Date(sorted[i]   + 'T12:00:00');
      const diff = Math.round((cur - prev) / 86400000);
      current = diff === 1 ? current + 1 : 1;
    }
    if (current > longest) longest = current;
  }
  return longest;
}

function calcStreakStats(log) {
  const dates = new Set(log.map(l => l.date));
  const catchupDates = new Set(log.filter(l => l.catchup).map(l => l.date));
  const sorted = [...dates].sort();
  let perfectStreaks = 0, catchupStreaks = 0;
  let curLen = 0, curHasCatchup = false;

  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) {
      curLen = 1;
      curHasCatchup = catchupDates.has(sorted[i]);
    } else {
      const prev = new Date(sorted[i-1] + 'T12:00:00');
      const cur  = new Date(sorted[i]   + 'T12:00:00');
      const diff = Math.round((cur - prev) / 86400000);
      if (diff === 1) {
        curLen++;
        if (catchupDates.has(sorted[i])) curHasCatchup = true;
      } else {
        if (curLen >= 3) { if (curHasCatchup) catchupStreaks++; else perfectStreaks++; }
        curLen = 1;
        curHasCatchup = catchupDates.has(sorted[i]);
      }
    }
  }
  if (curLen >= 3) { if (curHasCatchup) catchupStreaks++; else perfectStreaks++; }
  return { perfectStreaks, catchupStreaks };
}

// ── Reminder ──────────────────────────────────────────────────────────────────
function scheduleReminder() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (_reminderTimer) clearTimeout(_reminderTimer);
  const t = localStorage.getItem('hizbReminderTime') || '20:00';
  const parts = t.split(':');
  const h = Number(parts[0]), m = Number(parts[1]);
  if (!isFinite(h) || !isFinite(m)) return; // ongeldige tijdstring — sla over
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
