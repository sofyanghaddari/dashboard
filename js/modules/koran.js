import { all, put, get } from '../db.js';
import { openModal } from '../components/modal.js';
import { ymd, escapeHTML } from '../utils.js';
import { celebrateTask } from '../components/celebrate.js';
import { ok, err } from '../components/toast.js';
import { SURAS } from '../data/suras.js';

let _reminderTimer = null;
const CIRCUMFERENCE = 2 * Math.PI * 50;

// ── Soera progress helpers ──────────────────────────────────────────────────
function getSoeraProgress() {
  try { return JSON.parse(localStorage.getItem('soera_progress') || '{}'); }
  catch { return {}; }
}
function saveSoeraProgress(p) {
  localStorage.setItem('soera_progress', JSON.stringify(p));
}
function setSoeraStatus(n, status) {
  const p = getSoeraProgress();
  if (status === null) delete p[n];
  else p[n] = status;
  saveSoeraProgress(p);
}

export async function render(container) {
  const tab = container.dataset.koranTab || 'hizb';
  container.innerHTML = `
    <h1 class="page-title">Koran</h1>
    <div class="todo-seg" style="margin-bottom:16px">
      <button class="todo-seg-btn ${tab==='hizb'?'active':''}" id="ktab-hizb">📖 Hizb</button>
      <button class="todo-seg-btn ${tab==='soeras'?'active':''}" id="ktab-soeras">📋 Soera's</button>
    </div>
    <div id="koran-content"></div>
  `;

  container.querySelector('#ktab-hizb').onclick   = () => { container.dataset.koranTab = 'hizb';   render(container); };
  container.querySelector('#ktab-soeras').onclick = () => { container.dataset.koranTab = 'soeras'; render(container); };

  if (tab === 'hizb') await renderHizb(container);
  else renderSoeras(container);
}

// ── HIZB TAB ─────────────────────────────────────────────────────────────────
async function renderHizb(container) {
  const today     = ymd();
  const yesterday = ymd(new Date(Date.now() - 86400000));
  const todayRec  = await get('hizb_log', today);
  const yestRec   = await get('hizb_log', yesterday);
  const log       = await all('hizb_log');
  const doneSet   = new Set(log.map(l => l.date));

  // Streak calc (also counts catchup days)
  let streak = 0;
  const cur = new Date();
  while (doneSet.has(ymd(cur))) { streak++; cur.setDate(cur.getDate() - 1); }

  const reminderTime = localStorage.getItem('hizbReminderTime') || '20:00';
  const startPoint   = localStorage.getItem('hizbStartPoint') || 'Surah Al-Fath, 10 hizb';

  const now = new Date();
  const daysIntoMonth  = now.getDate();
  const doneThisMonth  = log.filter(l => {
    const d = new Date(l.date + 'T12:00:00');
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
  const monthPct = daysIntoMonth > 0 ? Math.round((doneThisMonth / daysIntoMonth) * 100) : 0;
  const fillPct  = todayRec ? 100 : Math.min(98, monthPct);
  const dashFill = (fillPct / 100) * CIRCUMFERENCE;
  const fillClass = todayRec ? 'cp-fill done' : 'cp-fill';

  // Feature 12: inhaal conditions
  const canCatchup = todayRec && !yestRec && yesterday >= ymd(new Date(Date.now() - 2 * 86400000));
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
          <div class="streak-num">${streak}</div>
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
          <div class="stat-mini-num">${streak}</div>
          <div class="stat-mini-lbl">Huidige streak</div>
        </div>
        <div class="stat-mini-card">
          <div class="stat-mini-num">${calcLongestStreak(log)}</div>
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
      <button class="btn secondary block" id="repair-day" style="margin-bottom:14px">🛠️ Gemiste dag goedmaken <span class="muted" style="font-size:.8em">(1× per maand)</span></button>
      <label>Herinneringstijd</label>
      <input type="time" id="reminder" value="${reminderTime}" />
      <label style="margin-top:12px">Startpunt</label>
      <input id="start" value="${escapeHTML(startPoint)}" />
      <button class="btn block" id="save-settings" style="margin-top:12px">Opslaan</button>
      ${notifHTML}
    </div>
  `;

  renderChart30(el, doneSet, log);

  // Feature 12: Inhaal banner button
  const catchupBtn = el.querySelector('#catchup-btn');
  if (catchupBtn) {
    catchupBtn.onclick = async () => {
      if (!todayRec) { err('Doe vandaag eerst je hizb'); return; }
      await put('hizb_log', { date: today, completed: true, count: 2 });
      await put('hizb_log', { date: yesterday, completed: true, catchup: true });
      ok('↩ Ingehaald! Streak blijft intact.');
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

  el.querySelector('#repair-day').onclick = async () => {
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

// ── SOERA'S TAB ───────────────────────────────────────────────────────────────
function renderSoeras(container) {
  const progress  = getSoeraProgress();
  const groupByJuz = container.dataset.koranSoeraGroup === '1';
  const search    = container.dataset.koranSoeraSearch || '';

  const readCount = Object.values(progress).filter(v => v === 'read' || v === 'memorized').length;
  const memCount  = Object.values(progress).filter(v => v === 'memorized').length;
  const totalRead = readCount;

  let filtered = SURAS;
  if (search) {
    const q = search.toLowerCase();
    filtered = SURAS.filter(s =>
      s.tl.toLowerCase().includes(q) ||
      s.nl.toLowerCase().includes(q) ||
      s.ar.includes(q) ||
      String(s.n).includes(q)
    );
  }

  const el = container.querySelector('#koran-content');
  el.innerHTML = `
    <!-- VOORTGANGSBALK -->
    <div class="card" style="padding:16px">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px">
        <h2 class="card-title" style="margin:0">Voortgang</h2>
        <span style="font-size:.8rem;color:var(--text-dim)">${totalRead}/114 gelezen</span>
      </div>
      <div class="soera-progress-bar-wrap">
        <div class="soera-progress-read" style="width:${(readCount/114*100).toFixed(1)}%"></div>
        <div class="soera-progress-mem" style="width:${(memCount/114*100).toFixed(1)}%"></div>
      </div>
      <div style="display:flex;gap:14px;margin-top:8px;font-size:.75rem;color:var(--text-dim)">
        <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:var(--accent);margin-right:4px;vertical-align:middle"></span>Gelezen (${readCount})</span>
        <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:var(--ok);margin-right:4px;vertical-align:middle"></span>Gememoriseerd (${memCount})</span>
      </div>
    </div>

    <!-- ZOEK + GROEPEER -->
    <div style="display:flex;gap:8px;margin-bottom:12px">
      <input id="soera-search" placeholder="Zoek soera..." value="${escapeHTML(search)}" style="flex:1" />
      <button class="btn secondary ${groupByJuz ? '' : 'active'}" id="toggle-group" style="padding:10px 12px;font-size:.82rem;white-space:nowrap">
        ${groupByJuz ? '📋 Per juz' : '🔢 Alles'}
      </button>
    </div>

    <!-- SOERA GRID -->
    <div id="soera-grid"></div>

    <!-- DETAIL KAARTJE -->
    <div id="soera-detail" style="display:none"></div>
  `;

  // Search binding
  const searchInput = el.querySelector('#soera-search');
  let searchTimer;
  searchInput.oninput = () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      container.dataset.koranSoeraSearch = searchInput.value;
      renderSoeras(container);
    }, 250);
  };

  el.querySelector('#toggle-group').onclick = () => {
    container.dataset.koranSoeraGroup = groupByJuz ? '0' : '1';
    renderSoeras(container);
  };

  const grid = el.querySelector('#soera-grid');
  if (groupByJuz && !search) {
    renderSoerasByJuz(grid, filtered, progress, container, el);
  } else {
    renderSoerasFlat(grid, filtered, progress, container, el);
  }
}

function renderSoerasFlat(grid, suras, progress, container, el) {
  grid.innerHTML = `<div class="soera-grid">${suras.map(s => soeraBlock(s, progress)).join('')}</div>`;
  bindSoeraClicks(grid, container, el, progress);
}

function renderSoerasByJuz(grid, suras, progress, container, el) {
  const byJuz = {};
  suras.forEach(s => { if (!byJuz[s.juz]) byJuz[s.juz] = []; byJuz[s.juz].push(s); });
  grid.innerHTML = Object.keys(byJuz).sort((a,b) => +a - +b).map(j => `
    <div style="margin-bottom:16px">
      <div class="card-title" style="margin-bottom:8px;font-size:.7rem;color:var(--text-faint)">Juz ${j}</div>
      <div class="soera-grid">${byJuz[j].map(s => soeraBlock(s, progress)).join('')}</div>
    </div>
  `).join('');
  bindSoeraClicks(grid, container, el, progress);
}

function soeraBlock(s, progress) {
  const status = progress[s.n] || null;
  const cls = status === 'memorized' ? 'soera-blk memorized'
             : status === 'read'     ? 'soera-blk read'
             : 'soera-blk';
  return `<div class="${cls}" data-sn="${s.n}" title="${s.tl}">
    <span class="soera-num">${s.n}</span>
  </div>`;
}

function bindSoeraClicks(grid, container, el, progress) {
  grid.querySelectorAll('[data-sn]').forEach(blk => {
    blk.onclick = () => {
      const n = +blk.dataset.sn;
      const s = SURAS[n - 1];
      showSoeraDetail(el, s, progress, container);
    };
  });
}

function showSoeraDetail(el, s, progress, container) {
  const status = progress[s.n] || null;
  const detail = el.querySelector('#soera-detail');
  detail.style.display = 'block';
  detail.innerHTML = `
    <div class="card soera-detail-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
        <div>
          <div style="font-size:1.6rem;font-family:serif;direction:rtl;margin-bottom:4px">${s.ar}</div>
          <div style="font-weight:700;font-size:1rem">${s.tl}</div>
          <div style="font-size:.84rem;color:var(--text-dim)">${s.nl}</div>
        </div>
        <button class="task-btn" id="close-detail" style="font-size:1rem;padding:6px">✕</button>
      </div>
      <div style="display:flex;gap:12px;margin-bottom:14px;font-size:.82rem;color:var(--text-dim)">
        <span>Soera ${s.n}</span><span>•</span>
        <span>${s.ay} ayaat</span><span>•</span>
        <span>Juz ${s.juz}</span>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn soera-status-btn ${status===null?'active':''}" data-set="null" style="flex:1;font-size:.82rem">Niet begonnen</button>
        <button class="btn soera-status-btn ${status==='read'?'active':''}" data-set="read" style="flex:1;font-size:.82rem;background:${status==='read'?'var(--accent)':''}">Gelezen</button>
        <button class="btn soera-status-btn ${status==='memorized'?'active':''}" data-set="memorized" style="flex:1;font-size:.82rem;background:${status==='memorized'?'var(--ok)':''}">Gememoriseerd</button>
      </div>
    </div>
  `;
  detail.querySelector('#close-detail').onclick = () => { detail.style.display = 'none'; };
  detail.querySelectorAll('[data-set]').forEach(btn => {
    btn.onclick = () => {
      const v = btn.dataset.set === 'null' ? null : btn.dataset.set;
      setSoeraStatus(s.n, v);
      ok(v === null ? 'Status verwijderd' : v === 'read' ? '📖 Gemarkeerd als gelezen' : '⭐ Gememoriseerd!');
      renderSoeras(container);
      detail.style.display = 'none';
    };
  });
  detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── Calendar rendering ────────────────────────────────────────────────────────
function renderChart30(container, doneSet, log) {
  const el    = container.querySelector('#chart30');
  if (!el) return;
  const today = ymd();
  const cells = [];
  for (let i = 29; i >= 0; i--) {
    const d   = new Date();
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
