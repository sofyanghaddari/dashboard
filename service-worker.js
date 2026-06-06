const CACHE = 'dashboard-v29';
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
  './js/lock.js',
  './js/github-sync.js',
  './js/export-ical.js',
  './js/weather.js',
  './js/mascot.js',
  './js/quotes.js',
  './js/animate.js',
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
  './js/modules/koran.js',
  './js/modules/arabic.js',
  './js/modules/goals.js',
  './js/modules/todo.js',
  './js/modules/notes.js',
  './js/components/calendar.js',
  './js/components/year-review.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE).then(c => { try { c.put(e.request, copy); } catch (_) {} });
      return resp;
    }).catch(() => caches.match('./index.html')))
  );
});
