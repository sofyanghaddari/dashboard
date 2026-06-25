// Verstuurt Web Push-meldingen op de juiste tijden — draait in GitHub Actions (cron).
//
// Leest de push-config gist (subscription + herinnerings-tijden), bepaalt welke
// herinneringen "due" zijn in de tijdzone van de gebruiker, en stuurt ze via
// web-push. Een "sent"-map in de gist voorkomt dubbele meldingen per dag.
//
// Vereiste env (GitHub secrets / workflow env):
//   GH_PAT              GitHub-token met `gist` scope (om de config-gist te lezen/schrijven)
//   VAPID_PRIVATE_KEY   VAPID-privésleutel (secret)
//   VAPID_PUBLIC_KEY    VAPID-publieke sleutel
//   VAPID_SUBJECT       mailto:... contact

import webpush from 'web-push';

const { GH_PAT, VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY, VAPID_SUBJECT } = process.env;

const PUSH_GIST_DESC = 'dashboard-push-config';
const PUSH_GIST_FILE = 'push-config.json';
const CATCHUP_MIN = 180; // stuur een gemiste herinnering nog tot 3u na de geplande tijd

const MESSAGES = {
  morning: (cfg) => ({ title: `Goedemorgen — doel: € ${cfg.dailyGoal || '200'}`, body: 'Zet hem op! Open de app om je dag bij te houden.', tag: 'morning-kickstart' }),
  income:  () => ({ title: 'Vergeet je inkomen niet te noteren', body: 'Tik om snel je daginkomen in te vullen.', tag: 'income-reminder' }),
  streak:  () => ({ title: 'Hizb nog niet gedaan vandaag', body: 'Je streak staat op het spel — vink hem af.', tag: 'streak-warning' }),
  hizb:    () => ({ title: 'Koran herinnering', body: 'Tijd voor je dagelijkse hizb.', tag: 'hizb-reminder' }),
  habit:   () => ({ title: 'Gewoontes voor vandaag', body: 'Vergeet je dagelijkse gewoontes niet.', tag: 'habit-reminder' }),
};

function die(msg) { console.error(msg); process.exit(0); } // exit 0 — geen failing build voor een lege config

async function gh(path, opts = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...opts,
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${GH_PAT}`,
      'Content-Type': 'application/json',
      'User-Agent': 'dashboard-push',
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${await res.text()}`);
  return res.json();
}

function nowInTz(tz) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz || 'Europe/Amsterdam',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const p = Object.fromEntries(fmt.formatToParts(new Date()).map(x => [x.type, x.value]));
  let hour = parseInt(p.hour, 10); if (hour === 24) hour = 0;
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: hour * 60 + parseInt(p.minute, 10) };
}

function toMinutes(hhmm) {
  const [h, m] = String(hhmm || '').split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

async function main() {
  if (!GH_PAT || !VAPID_PRIVATE_KEY || !VAPID_PUBLIC_KEY) {
    die(`Ontbrekende env — niets te doen. Aanwezig? GH_PAT=${!!GH_PAT} VAPID_PRIVATE_KEY=${!!VAPID_PRIVATE_KEY} VAPID_PUBLIC_KEY=${!!VAPID_PUBLIC_KEY}. ` +
        `Controleer dat de secrets onder Settings → Secrets and variables → Actions → "Secrets" (niet "Variables") staan, met exact deze namen.`);
  }
  webpush.setVapidDetails(VAPID_SUBJECT || 'mailto:sofyanghaddari@gmail.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  // 1) Vind de config-gist
  const gists = await gh('/gists?per_page=100');
  const meta = gists.find(g => g.description === PUSH_GIST_DESC || (g.files && g.files[PUSH_GIST_FILE]));
  if (!meta) die('Geen push-config gist gevonden — schakel push eerst in de app in.');

  // 2) Lees de inhoud
  const full = await gh(`/gists/${meta.id}`);
  const file = full.files[PUSH_GIST_FILE];
  if (!file) die('push-config.json ontbreekt in de gist.');
  const cfg = JSON.parse(file.content);

  const sub = cfg.subscription;
  const enabled = Array.isArray(cfg.enabledTypes) ? cfg.enabledTypes : [];
  if (!sub || !sub.endpoint || enabled.length === 0) die('Push uitgeschakeld of geen subscription — niets te sturen.');

  const { date, minutes } = nowInTz(cfg.tz);
  const sent = (cfg.sent && typeof cfg.sent === 'object') ? cfg.sent : {};

  // 3) Bepaal welke herinneringen due zijn
  const due = [];
  for (const type of enabled) {
    if (!MESSAGES[type]) continue;
    const t = toMinutes(cfg.times?.[type]);
    if (t == null) continue;
    if (sent[type] === date) continue;              // vandaag al gestuurd
    const diff = minutes - t;
    if (diff < 0 || diff > CATCHUP_MIN) continue;   // nog niet, of te laat
    due.push(type);
  }

  if (due.length === 0) { console.log(`[${date} ${minutes}m tz=${cfg.tz}] niets due.`); return; }

  // 4) Verstuur
  let anySent = false;
  for (const type of due) {
    const payload = JSON.stringify({ ...MESSAGES[type](cfg), url: './' });
    try {
      await webpush.sendNotification(sub, payload);
      sent[type] = date;
      anySent = true;
      console.log(`Gestuurd: ${type}`);
    } catch (err) {
      const code = err?.statusCode;
      console.error(`Fout bij ${type}: ${code || ''} ${err?.body || err?.message || err}`);
      if (code === 404 || code === 410) {
        // Subscription bestaat niet meer — markeer zodat de app weet dat heraanmelden nodig is.
        cfg.subscriptionExpired = true;
      }
    }
  }

  // 5) Schrijf de bijgewerkte "sent"-status terug
  if (anySent || cfg.subscriptionExpired) {
    cfg.sent = sent;
    await gh(`/gists/${meta.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ files: { [PUSH_GIST_FILE]: { content: JSON.stringify(cfg, null, 2) } } }),
    });
  }
}

main().catch(err => { console.error(err); process.exit(1); });
