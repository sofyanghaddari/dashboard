// Lichte in-browser activity log (laatste 200 events).
const KEY = 'activityLog';
const MAX = 200;

export function logActivity(type, summary, meta = {}) {
  const log = JSON.parse(localStorage.getItem(KEY) || '[]');
  log.unshift({ ts: new Date().toISOString(), type, summary, meta });
  if (log.length > MAX) log.length = MAX;
  localStorage.setItem(KEY, JSON.stringify(log));
}

export function getActivity() {
  return JSON.parse(localStorage.getItem(KEY) || '[]');
}

export function clearActivity() {
  localStorage.removeItem(KEY);
}
