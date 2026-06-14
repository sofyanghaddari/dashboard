// Task deadline notifications

const STORAGE_KEY = 'scheduled_notifications';

function getScheduled() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function saveScheduled(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

function notificationsEnabled() {
  return localStorage.getItem('taskNotifications') !== '0'
    && 'Notification' in window
    && Notification.permission === 'granted';
}

// Schedule or re-schedule a notification for a task
export async function scheduleTaskNotification(task) {
  if (!task.dueDate) return;
  // Remove existing entry for this task
  cancelTaskNotification(task.id);

  const scheduled = getScheduled();
  scheduled.push({ id: task.id, title: task.title, dueDate: task.dueDate });
  saveScheduled(scheduled);

  // In-session timer
  _setTimer(task.id, task.title, task.dueDate);
}

export function cancelTaskNotification(taskId) {
  const scheduled = getScheduled().filter(n => n.id !== taskId);
  saveScheduled(scheduled);
  _clearTimer(taskId);
}

const _timers = {};
function _clearTimer(id) {
  if (_timers[id]) { clearTimeout(_timers[id]); delete _timers[id]; }
}

function _setTimer(id, title, dueDate) {
  _clearTimer(id);
  if (!notificationsEnabled()) return;
  const target = new Date(dueDate + 'T08:00:00');
  const delay  = target - Date.now();
  if (delay <= 0 || delay > 7 * 24 * 60 * 60 * 1000) return; // past or >7 days
  _timers[id] = setTimeout(() => {
    if (!notificationsEnabled()) return;
    try {
      new Notification('📅 Deadline vandaag', {
        body: title,
        tag: 'task-' + id,
        icon: './icons/icon-192.png',
      });
    } catch (_) {}
    delete _timers[id];
  }, delay);
}

// Run at app start: reschedule all stored notifications for today/near future
export function checkPendingNotifications() {
  const scheduled = getScheduled();
  const today = new Date().toISOString().slice(0, 10);
  const valid = scheduled.filter(n => n.dueDate >= today);
  saveScheduled(valid);

  // Fire immediately for today's tasks if notification permission already granted
  const todayTasks = valid.filter(n => n.dueDate === today);
  if (notificationsEnabled() && todayTasks.length > 0) {
    // Check if we already notified today
    const lastFired = localStorage.getItem('lastTaskNotifDate');
    if (lastFired !== today) {
      localStorage.setItem('lastTaskNotifDate', today);
      setTimeout(() => {
        todayTasks.forEach(n => {
          try {
            new Notification('📅 Deadline vandaag', {
              body: n.title,
              tag: 'task-' + n.id,
              icon: './icons/icon-192.png',
            });
          } catch (_) {}
        });
      }, 3000); // Small delay after app load
    }
  }

  // Schedule upcoming tasks
  valid.forEach(n => _setTimer(n.id, n.title, n.dueDate));
}

// Request permission if not yet asked
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}
