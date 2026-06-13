const CACHE = 'dashboard-v61';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/app.js',
  './js/db.js',
  './js/router.js',
  './js/utils.js',
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
  './js/components/calendar.js',
  './js/components/year-review.js',
  './js/data/arabic-words.js',
  './js/data/hizbs.js',
  './js/vendor/motion.min.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ includeUncontrolled: true, type: 'window' }))
      .then(clients => clients.forEach(c => c.postMessage({ type: 'SW_UPDATED' })))
  );
});

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
        body: 'Tijd voor je dagelijkse hizb. 📖',
        icon: './icons/icon-192.png',
        tag: 'hizb-reminder',
        renotify: false,
      });
    }
    scheduleHizbAlarm(time); // reschedule for tomorrow
  }, ms);
}

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (e.data && e.data.type === 'SCHEDULE_HIZB_REMINDER') {
    scheduleHizbAlarm(e.data.time);
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
  let title = 'Dashboard';
  let body = 'Vergeet je hizb niet! 📖';
  if (e.data) {
    try {
      const d = e.data.json();
      title = d.title || title;
      body = d.body || body;
    } catch (_) {
      body = e.data.text() || body;
    }
  }
  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: './icons/icon-192.png',
      badge: './icons/icon-96.png',
      tag: 'dashboard-push',
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const c of clients) {
        if (c.url && 'focus' in c) return c.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('./');
    })
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Stale-while-revalidate voor API-calls (weer, externe data)
  const isExternal = url.origin !== self.location.origin;
  if (isExternal) {
    e.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          const fetchPromise = fetch(e.request).then(resp => {
            if (resp && resp.ok) { try { cache.put(e.request, resp.clone()); } catch (_) {} }
            return resp;
          }).catch(() => cached);
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
