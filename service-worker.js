const CACHE = 'dashboard-v132';





const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/app.js',
  './js/db.js',
  './js/router.js',
  './js/utils.js',
  './js/icons.js',
  './js/push.js',
  './js/srs.js',
  './js/settings.js',
  './js/theme.js',
  './js/achievements.js',
  './js/activity.js',
  './js/nlp.js',
  './js/voice.js',
  './js/privacy.js',
  './js/notifications.js',
  './js/lock.js',
  './js/github-sync.js',
  './js/export-ical.js',
  './js/weather.js',
  './js/mascot.js',
  './js/quotes.js',
  './js/animate.js',
  './js/motion.js',
  './js/crypto.js',
  './js/biometric.js',
  './js/haptic.js',
  './js/gestures.js',
  './js/longpress.js',
  './js/components/island.js',
  './js/insights.js',
  './js/app-badge.js',
  './js/components/sync-pill.js',
  './js/auto-realtime-sync.js',
  './js/auto-export.js',
  './js/pdf-export.js',
  './js/components/weekly-review.js',
  './js/components/modal.js',
  './js/components/settings.js',
  './js/components/toast.js',
  './js/components/celebrate.js',
  './js/components/swipe.js',
  './js/components/pullrefresh.js',
  './js/components/cmdk.js',
  './js/components/undo.js',
  './js/modules/dashboard.js',
  './js/modules/taxi.js',
  './js/modules/agenda.js',
  './js/modules/stats.js',
  './js/modules/koran.js',
  './js/modules/arabic.js',
  './js/modules/arabic-srs.js',
  './js/modules/goals.js',
  './js/modules/todo.js',
  './js/modules/notes.js',
  './js/modules/boekhouding.js',
  './js/invoice-nlp.js',
  './js/gmail.js',
  './js/qibla.js',
  './js/components/calendar.js',
  './js/components/year-review.js',
  './js/data/arabic-words.js',
  './js/data/hizbs.js',
  './js/vendor/motion.min.js',
  './js/modules/geloof.js',
  './js/receipt-ocr.js',
  './js/markitdown.js',
  './icons/icon-96.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ includeUncontrolled: true, type: 'window' }))
      // Stuur update-melding alleen als er al bestaande clients zijn (niet bij eerste installatie)
      .then(clients => { if (clients.length > 0) clients.forEach(c => c.postMessage({ type: 'SW_UPDATED' })); })
  );
});

// Weekly income summary alarm (SW-side).
let _weeklyTimer = null;
function scheduleWeeklySummary(income) {
  if (_weeklyTimer) clearTimeout(_weeklyTimer);
  const now = new Date();
  const target = new Date(now);
  // Next Sunday 18:00 (day 0 = Sunday)
  const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
  target.setDate(target.getDate() + daysUntilSunday);
  target.setHours(18, 0, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 7);
  const ms = target - now;
  _weeklyTimer = setTimeout(async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const anyFocused = clients.some(c => c.focused);
    if (!anyFocused) {
      self.registration.showNotification('Week overzicht', {
        body: `Je verdiende deze week € ${(income || 0).toFixed(2).replace('.', ',')}. Goed gedaan!`,
        icon: './icons/icon-192.png',
        tag: 'weekly-summary',
        renotify: true,
      });
    }
    scheduleWeeklySummary(income); // reschedule for next week
  }, ms);
}

// Hizb reminder alarm (SW-side). Stored per-SW-install in memory; rehydrated on activate.
let _hizbAlarmTimer = null;
function scheduleHizbAlarm(time) {
  if (_hizbAlarmTimer) clearTimeout(_hizbAlarmTimer);
  if (!time) return;
  const [h, m] = time.split(':').map(Number);
  const now = new Date();
  const target = new Date(now); target.setHours(h, m, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  const ms = target - now;
  _hizbAlarmTimer = setTimeout(async () => {
    // Only fire if the page client doesn't already have focus (best-effort)
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const anyFocused = clients.some(c => c.focused);
    if (!anyFocused) {
      self.registration.showNotification('Koran herinnering', {
        body: 'Tijd voor je dagelijkse hizb.',
        icon: './icons/icon-192.png',
        tag: 'hizb-reminder',
        renotify: true,
      });
    }
    scheduleHizbAlarm(time); // reschedule for tomorrow
  }, ms);
}

// #2: Ochtend-kickstart — dagelijkse doelherinnering
let _morningTimer = null;
function scheduleMorningNotification(dailyGoal, hour, minute) {
  if (_morningTimer) clearTimeout(_morningTimer);
  const now = new Date();
  const target = new Date(now); target.setHours(hour, minute, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  const ms = target - now;
  _morningTimer = setTimeout(async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (!clients.some(c => c.focused)) {
      self.registration.showNotification('Goedemorgen — vandaag doel: € ' + (dailyGoal || 200), {
        body: 'Zet hem op! Open de app om je dag bij te houden.',
        icon: './icons/icon-192.png', tag: 'morning-kickstart', renotify: true,
      });
    }
    scheduleMorningNotification(dailyGoal, hour, minute);
  }, ms);
}

// #3: Inkomen-herinnering — nog geen rit ingevoerd?
let _incomeReminderTimer = null;
function scheduleIncomeReminder(hour, minute) {
  if (_incomeReminderTimer) clearTimeout(_incomeReminderTimer);
  const now = new Date();
  const target = new Date(now); target.setHours(hour, minute, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  const ms = target - now;
  _incomeReminderTimer = setTimeout(async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (!clients.some(c => c.focused)) {
      self.registration.showNotification('Vergeet je inkomen niet te noteren', {
        body: 'Tik hier om snel je daginkomen in te vullen.',
        icon: './icons/icon-192.png', tag: 'income-reminder', renotify: true,
      });
    }
    scheduleIncomeReminder(hour, minute);
  }, ms);
}

// #6: Streak-waarschuwing — hizb nog niet gedaan
let _streakWarningTimer = null;
function scheduleStreakWarning(hour, minute) {
  if (_streakWarningTimer) clearTimeout(_streakWarningTimer);
  const now = new Date();
  const target = new Date(now); target.setHours(hour, minute, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  const ms = target - now;
  _streakWarningTimer = setTimeout(async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (!clients.some(c => c.focused)) {
      self.registration.showNotification('Hizb nog niet gedaan vandaag!', {
        body: 'Je streak staat op het spel — open de app en vink hem af.',
        icon: './icons/icon-192.png', tag: 'streak-warning', renotify: true,
      });
    }
    scheduleStreakWarning(hour, minute);
  }, ms);
}

// #25: Gewoonte-herinnering
let _habitReminderTimer = null;
function scheduleHabitReminder(time) {
  if (_habitReminderTimer) clearTimeout(_habitReminderTimer);
  if (!time) return;
  const [h, m] = time.split(':').map(Number);
  const now = new Date();
  const target = new Date(now); target.setHours(h, m, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  const ms = target - now;
  _habitReminderTimer = setTimeout(async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (!clients.some(c => c.focused)) {
      self.registration.showNotification('Gewoontes voor vandaag', {
        body: 'Heb je je dagelijkse gewoontes al afgevinkt?',
        icon: './icons/icon-192.png', tag: 'habit-reminder', renotify: true,
      });
    }
    scheduleHabitReminder(time);
  }, ms);
}

// #29: Inactiviteitsalarm — app lang niet geopend
let _inactivityTimer = null;
function scheduleInactivityAlarm(delayMs) {
  if (_inactivityTimer) clearTimeout(_inactivityTimer);
  if (!delayMs || delayMs <= 0) return;
  _inactivityTimer = setTimeout(async () => {
    _inactivityTimer = null;
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (!clients.some(c => c.focused)) {
      self.registration.showNotification('Lang niet gezien!', {
        body: 'Open de app om je voortgang bij te houden.',
        icon: './icons/icon-192.png', tag: 'inactivity', renotify: true,
      });
    }
  }, delayMs);
}

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (e.data && e.data.type === 'SCHEDULE_HIZB_REMINDER') {
    scheduleHizbAlarm(e.data.time);
  }
  if (e.data && e.data.type === 'SCHEDULE_WEEKLY_SUMMARY') {
    scheduleWeeklySummary(e.data.income || 0);
  }
  if (e.data && e.data.type === 'SCHEDULE_MORNING') {
    scheduleMorningNotification(e.data.dailyGoal, e.data.hour, e.data.minute);
  }
  if (e.data && e.data.type === 'SCHEDULE_INCOME_REMINDER') {
    scheduleIncomeReminder(e.data.hour, e.data.minute);
  }
  if (e.data && e.data.type === 'SCHEDULE_STREAK_WARNING') {
    scheduleStreakWarning(e.data.hour, e.data.minute);
  }
  if (e.data && e.data.type === 'SCHEDULE_HABIT_REMINDER') {
    scheduleHabitReminder(e.data.time);
  }
  if (e.data && e.data.type === 'SCHEDULE_INACTIVITY') {
    scheduleInactivityAlarm(e.data.delayMs);
  }
  if (e.data && e.data.type === 'CANCEL_INCOME_REMINDER') {
    if (_incomeReminderTimer) { clearTimeout(_incomeReminderTimer); _incomeReminderTimer = null; }
  }
  if (e.data && e.data.type === 'CANCEL_STREAK_WARNING') {
    if (_streakWarningTimer) { clearTimeout(_streakWarningTimer); _streakWarningTimer = null; }
  }
});

self.addEventListener('sync', (e) => {
  if (e.tag === 'github-sync') {
    e.waitUntil(
      self.clients.matchAll({ includeUncontrolled: true, type: 'window' })
        .then(clients => clients.forEach(c => c.postMessage({ type: 'BACKGROUND_SYNC_TRIGGER' })))
    );
  }
});

self.addEventListener('push', (e) => {
  let data = { title: 'Dashboard', body: 'Vergeet je hizb niet!', tag: 'dashboard-push', url: './' };
  if (e.data) {
    try {
      const d = e.data.json();
      data = { ...data, ...d };
    } catch (_) {
      data.body = e.data.text() || data.body;
    }
  }
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: './icons/icon-192.png',
      badge: './icons/icon-96.png',
      tag: data.tag,
      renotify: true,
      data: { url: data.url },
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const c of clients) {
        if (c.url && 'focus' in c) return c.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // GitHub API + raw content: NOOIT cachen, altijd direct naar netwerk
  // (auth-headers, tijdgebonden tokens, private gists)
  const isGitHub = url.hostname === 'api.github.com' || url.hostname.endsWith('.githubusercontent.com');
  if (isGitHub) return;

  // Stale-while-revalidate voor overige externe API-calls (weer, etc.)
  const isExternal = url.origin !== self.location.origin;
  if (isExternal) {
    e.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          const fetchPromise = fetch(e.request).then(resp => {
            if (resp && resp.ok) { try { cache.put(e.request, resp.clone()); } catch (_) {} }
            return resp;
          }).catch(() => cached || new Response('', { status: 503, statusText: 'Offline' }));
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // Cache-first voor eigen assets
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE).then(c => { try { c.put(e.request, copy); } catch (_) {} });
      return resp;
    }).catch(() => caches.match('./index.html')))
  );
});
