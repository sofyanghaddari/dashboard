// Web Push (echte achtergrond-meldingen, ook als de app dicht is).
//
// Hoe het werkt:
//  1. De browser abonneert zich op push (pushManager.subscribe) met de VAPID-
//     publieke sleutel. Dat geeft een "subscription" (endpoint + sleutels).
//  2. Die subscription + jouw herinnerings-tijden schrijven we naar een aparte
//     GitHub-gist ("dashboard-push-config").
//  3. Een GitHub Actions cron (.github/workflows/push-notifications.yml) leest
//     die gist en verstuurt op de juiste tijden een push — óók als de app dicht
//     is. iOS toont 'm dan als gewone melding.
//
// De VAPID-PRIVÉsleutel staat NIET hier (alleen publiek). Die zit als GitHub-
// secret bij de Action. Zie docs/PUSH-SETUP.md.

import { getSetting } from './settings.js';

export const VAPID_PUBLIC_KEY = 'BIJ7ZhuzZAXmhzuq8z5uck90V1W1UIltLgiz6HaWts1HICNaGHDdEyg89oBr9Wl0hgmmClKFZxWdDT_bDlDpluc';

const PUSH_GIST_DESC = 'dashboard-push-config';
const PUSH_GIST_FILE = 'push-config.json';
const REMINDER_TYPES = ['morning', 'income', 'streak', 'hizb', 'habit'];

function urlBase64ToUint8Array(b64) {
  const padding = '='.repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function pushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function pushEnabled() {
  return localStorage.getItem('pushEnabled') === '1';
}

export async function getPushSubscription() {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

async function subscribe() {
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }
  return sub;
}

async function ghApi(path, token, opts = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...opts,
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  return res.json();
}

async function findPushGistId(token) {
  const stored = localStorage.getItem('pushConfigGistId');
  if (stored) return stored;
  const gists = await ghApi('/gists?per_page=100', token);
  const found = gists.find(g => g.description === PUSH_GIST_DESC || (g.files && g.files[PUSH_GIST_FILE]));
  if (found) { localStorage.setItem('pushConfigGistId', found.id); return found.id; }
  return null;
}

function buildConfig(subscription) {
  return {
    subscription: subscription.toJSON ? subscription.toJSON() : subscription,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Amsterdam',
    dailyGoal: getSetting('dailyIncomeGoal') || '200',
    times: {
      morning: getSetting('morningNotifTime')   || '08:00',
      income:  getSetting('incomeReminderTime')  || '20:00',
      streak:  getSetting('streakWarningTime')   || '22:00',
      hizb:    getSetting('hizbReminderTime')    || '20:00',
      habit:   getSetting('habitReminderTime')   || '21:00',
    },
    enabledTypes: getEnabledTypes(),
    updatedAt: Date.now(),
  };
}

export function getEnabledTypes() {
  try {
    const raw = JSON.parse(localStorage.getItem('pushTypes') || 'null');
    if (Array.isArray(raw)) return raw;
  } catch (_) {}
  return [...REMINDER_TYPES];
}

export function setEnabledTypes(arr) {
  localStorage.setItem('pushTypes', JSON.stringify(arr));
}

// Abonneer + schrijf config naar de gist. Geeft true bij succes.
// Roep aan vanuit een user-gesture (bv. de "Inschakelen"-knop).
export async function enablePush() {
  if (!pushSupported()) throw new Error('Dit apparaat ondersteunt geen push-meldingen');
  const token = getSetting('ghToken');
  if (!token) throw new Error('Stel eerst GitHub-sync in (Instellingen → Data) — push gebruikt diezelfde gist');
  const sub = await subscribe();
  const config = buildConfig(sub);
  const files = { [PUSH_GIST_FILE]: { content: JSON.stringify(config, null, 2) } };

  let id = await findPushGistId(token);
  if (id) {
    await ghApi(`/gists/${id}`, token, { method: 'PATCH', body: JSON.stringify({ description: PUSH_GIST_DESC, files }) });
  } else {
    const g = await ghApi('/gists', token, { method: 'POST', body: JSON.stringify({ description: PUSH_GIST_DESC, public: false, files }) });
    id = g.id;
    localStorage.setItem('pushConfigGistId', id);
  }
  localStorage.setItem('pushEnabled', '1');
  return true;
}

// Houd de config vers (nieuwe subscription/tijden) zonder opnieuw te abonneren-prompten.
// Stil falen is prima — dit draait op de achtergrond bij app-start.
export async function refreshPushConfig() {
  if (!pushEnabled() || !pushSupported()) return;
  const token = getSetting('ghToken');
  if (!token) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return; // niet meer geabonneerd — laat gebruiker opnieuw inschakelen
    const config = buildConfig(sub);
    const files = { [PUSH_GIST_FILE]: { content: JSON.stringify(config, null, 2) } };
    const id = await findPushGistId(token);
    if (id) await ghApi(`/gists/${id}`, token, { method: 'PATCH', body: JSON.stringify({ files }) });
  } catch (_) {}
}

export async function disablePush() {
  localStorage.setItem('pushEnabled', '0');
  try {
    const sub = await getPushSubscription();
    if (sub) await sub.unsubscribe();
  } catch (_) {}
  // Markeer in de gist als uitgeschakeld zodat de Action stopt met sturen.
  try {
    const token = getSetting('ghToken');
    const id = token && await findPushGistId(token);
    if (id) {
      await ghApi(`/gists/${id}`, token, {
        method: 'PATCH',
        body: JSON.stringify({ files: { [PUSH_GIST_FILE]: { content: JSON.stringify({ enabledTypes: [], disabledAt: Date.now() }, null, 2) } } }),
      });
    }
  } catch (_) {}
}
