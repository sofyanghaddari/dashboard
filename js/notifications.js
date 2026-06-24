// Notificaties: taak-deadlines + slimme app-open checks + SW-timers

import { all } from './db.js';
import { getSetting } from './settings.js';
import { getWeather } from './weather.js';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function notificationsEnabled() {
  return localStorage.getItem('taskNotifications') !== '0'
    && 'Notification' in window
    && Notification.permission === 'granted';
}

function _notify(tag, title, body) {
  if (!notificationsEnabled()) return;
  try {
    new Notification(title, { body, tag, icon: './icons/icon-192.png', renotify: true });
  } catch (_) {}
}

function _today() { return new Date().toISOString().slice(0, 10); }

function _notifiedToday(key) {
  return localStorage.getItem('notif_' + key) === _today();
}
function _markNotifiedToday(key) {
  localStorage.setItem('notif_' + key, _today());
}

// ─── TAAK-DEADLINE NOTIFICATIES (bestaand) ────────────────────────────────────

const STORAGE_KEY = 'scheduled_notifications';
function getScheduled() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function saveScheduled(arr) { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); }

export async function scheduleTaskNotification(task) {
  if (!task.dueDate) return;
  cancelTaskNotification(task.id);
  const scheduled = getScheduled();
  scheduled.push({ id: task.id, title: task.title, dueDate: task.dueDate });
  saveScheduled(scheduled);
  _setTimer(task.id, task.title, task.dueDate);
}

export function cancelTaskNotification(taskId) {
  saveScheduled(getScheduled().filter(n => n.id !== taskId));
  _clearTimer(taskId);
}

const _timers = {};
function _clearTimer(id) {
  if (_timers[id]) { clearTimeout(_timers[id]); delete _timers[id]; }
}
function _setTimer(id, title, dueDate) {
  _clearTimer(id);
  if (!notificationsEnabled()) return;
  const delay = new Date(dueDate + 'T08:00:00') - Date.now();
  if (delay <= 0 || delay > 7 * 86400000) return;
  _timers[id] = setTimeout(() => {
    _notify('task-' + id, 'Deadline vandaag', title);
    delete _timers[id];
  }, delay);
}

// ─── APP-OPEN CHECKS ─────────────────────────────────────────────────────────

// #4: Arabische kaarten klaar voor herhaling
async function checkArabicCards() {
  if (_notifiedToday('arabic_due')) return;
  const cards = await all('cards').catch(() => []);
  const due = cards.filter(c => !c.dueDate || c.dueDate <= _today());
  if (!due.length) return;
  _markNotifiedToday('arabic_due');
  _notify('arabic_due', 'Arabische herhaling klaar',
    `${due.length} kaart${due.length === 1 ? '' : 'en'} staat klaar — open Arabisch om te oefenen.`);
}

// #5: Taken met deadline vandaag of morgen
async function checkTaskDeadlinesNow() {
  if (_notifiedToday('task_upcoming')) return;
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const todos = await all('todos').catch(() => []);
  const urgent = todos.filter(t => !t.done && t.dueDate && (t.dueDate === _today() || t.dueDate === tomorrow));
  if (!urgent.length) return;
  _markNotifiedToday('task_upcoming');
  const todayN = urgent.filter(t => t.dueDate === _today()).length;
  const tomN = urgent.filter(t => t.dueDate === tomorrow).length;
  const parts = [];
  if (todayN) parts.push(`${todayN} vandaag`);
  if (tomN) parts.push(`${tomN} morgen`);
  _notify('task_upcoming', 'Taken met deadline', parts.join(', ') + ' — open de app om te checken.');
}

// #10: Halverwege de maand (15e)
async function checkMonthHalfway() {
  if (new Date().getDate() !== 15) return;
  const monthKey = _today().slice(0, 7);
  if (localStorage.getItem('notif_halfway_' + monthKey)) return;
  const monthGoal = parseFloat(getSetting('monthlyIncomeGoal') || '5000');
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const rides = await all('rides').catch(() => []);
  const total = rides.filter(r => r.date >= startOfMonth).reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const tekort = monthGoal / 2 - total;
  localStorage.setItem('notif_halfway_' + monthKey, '1');
  if (tekort <= 0) {
    _notify('month_halfway', 'Halverwege — je loopt voor!',
      `€ ${total.toFixed(0)} van € ${monthGoal.toFixed(0)}`);
  } else {
    _notify('month_halfway', 'Halverwege de maand',
      `€ ${total.toFixed(0)} van € ${monthGoal.toFixed(0)} — € ${tekort.toFixed(0)} tekort, gas erbij!`);
  }
}

// #12 + #22: Factuur vervallen + follow-up
async function checkInvoices() {
  if (_notifiedToday('invoice_check')) return;
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const invoices = await all('invoices').catch(() => []);
  const overdue = invoices.filter(inv => inv.status !== 'paid' && inv.dueDate && inv.dueDate < _today());
  if (!overdue.length) return;
  _markNotifiedToday('invoice_check');
  const followup = overdue.filter(inv => inv.dueDate < weekAgo);
  if (followup.length) {
    _notify('invoice_check', 'Factuur follow-up nodig',
      `${followup.length} factuur${followup.length === 1 ? '' : 'en'} al 7+ dagen onbetaald — stuur een herinnering.`);
  } else {
    _notify('invoice_check', 'Factuur vervallen',
      `${overdue.length} openstaande factuur${overdue.length === 1 ? '' : 'en'} — herinner de klant.`);
  }
}

// #27: Doel loopt achter op schema
async function checkGoalsBehind() {
  if (_notifiedToday('goal_behind')) return;
  const now = new Date();
  const goals = await all('goals').catch(() => []);
  const behind = goals.filter(g => {
    if (!g.deadline || !g.target || g.progress == null) return false;
    const deadline = new Date(g.deadline);
    if (deadline <= now) return false;
    const start = new Date(g.createdAt || (Date.now() - 30 * 86400000));
    const totalMs = deadline - start;
    if (totalMs <= 0) return false;
    const expected = ((now - start) / totalMs) * Number(g.target);
    return Number(g.progress) < expected * 0.8;
  });
  if (!behind.length) return;
  _markNotifiedToday('goal_behind');
  _notify('goal_behind', 'Doel loopt achter',
    `"${behind[0].title}" loopt achter op schema — tijd om bij te sturen.`);
}

// #28: Backup ouder dan 7 dagen
function checkBackupAge() {
  if (_notifiedToday('backup_old')) return;
  const lastSync = getSetting('lastGhSync');
  if (!lastSync) return;
  if ((Date.now() - new Date(lastSync).getTime()) < 7 * 86400000) return;
  _markNotifiedToday('backup_old');
  _notify('backup_old', 'Backup al 7 dagen oud',
    'Tik op de sync-knop bovenin om je data veilig te stellen.');
}

// #18: Weersalert — regen/storm = goede taxikansen
async function checkWeatherAlert() {
  if (_notifiedToday('weather_alert')) return;
  try {
    const weather = await getWeather();
    if (!weather?.current) return;
    const code = weather.current.weather_code;
    const isWet = (code >= 51 && code <= 82) || code >= 95;
    if (!isWet) return;
    const descs = {
      51: 'Motregen', 53: 'Motregen', 55: 'Motregen',
      61: 'Regen', 63: 'Regen', 65: 'Hevige regen',
      80: 'Buien', 81: 'Buien', 82: 'Zware buien',
      95: 'Onweer', 96: 'Onweer + hagel', 99: 'Onweer + hagel',
    };
    const desc = descs[code] || 'Slecht weer';
    _markNotifiedToday('weather_alert');
    _notify('weather_alert', `Perfect taxiweer — ${desc}!`,
      'Mensen willen liever niet lopen. Goede kansen in Amsterdam!');
  } catch (_) {}
}

// ─── SERVICE WORKER SCHEDULING ────────────────────────────────────────────────

async function _sendToSw(msg) {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage(msg);
  } catch (_) {}
}

// Cancel SW-timers als taak al gedaan is vandaag
async function _cancelDoneReminders() {
  const rides = await all('rides').catch(() => []);
  if (rides.some(r => r.date === _today())) {
    await _sendToSw({ type: 'CANCEL_INCOME_REMINDER' });
  }
  const hizbLog = await all('hizb_log').catch(() => []);
  if (hizbLog.some(l => l.date === _today() && l.completed)) {
    await _sendToSw({ type: 'CANCEL_STREAK_WARNING' });
  }
}

export async function scheduleSwNotifications() {
  if (!notificationsEnabled()) return;
  localStorage.setItem('lastAppOpen', Date.now().toString());
  const dailyGoal = parseFloat(getSetting('dailyIncomeGoal') || '200');
  const [morH, morM] = (getSetting('morningNotifTime') || '08:00').split(':').map(Number);
  const [incH, incM] = (getSetting('incomeReminderTime') || '20:00').split(':').map(Number);
  const [strH, strM] = (getSetting('streakWarningTime') || '22:00').split(':').map(Number);
  await _sendToSw({ type: 'SCHEDULE_MORNING', dailyGoal, hour: morH, minute: morM });
  await _sendToSw({ type: 'SCHEDULE_INCOME_REMINDER', hour: incH, minute: incM });
  await _sendToSw({ type: 'SCHEDULE_STREAK_WARNING', hour: strH, minute: strM });
  await _sendToSw({ type: 'SCHEDULE_HABIT_REMINDER', time: getSetting('habitReminderTime') || '21:00' });
  await _sendToSw({ type: 'SCHEDULE_INACTIVITY', delayMs: 3 * 24 * 60 * 60 * 1000 });
  await _cancelDoneReminders();
}

// ─── HOOFD-EXPORTS ───────────────────────────────────────────────────────────

export function checkPendingNotifications() {
  const today = _today();
  const valid = getScheduled().filter(n => n.dueDate >= today);
  saveScheduled(valid);
  const todayTasks = valid.filter(n => n.dueDate === today);
  if (notificationsEnabled() && todayTasks.length) {
    const lastFired = localStorage.getItem('lastTaskNotifDate');
    if (lastFired !== today) {
      localStorage.setItem('lastTaskNotifDate', today);
      setTimeout(() => todayTasks.forEach(n =>
        _notify('task-' + n.id, 'Deadline vandaag', n.title)), 3000);
    }
  }
  valid.forEach(n => _setTimer(n.id, n.title, n.dueDate));
}

export async function checkAllNotifications() {
  checkPendingNotifications();
  if (!notificationsEnabled()) return;
  setTimeout(async () => {
    await checkArabicCards();
    await checkTaskDeadlinesNow();
    await checkMonthHalfway();
    await checkInvoices();
    await checkGoalsBehind();
    checkBackupAge();
    await checkWeatherAlert();
  }, 5000);
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}
