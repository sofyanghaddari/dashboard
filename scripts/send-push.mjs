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
  if (!sub || !sub.endpoint) die('Geen subscription in config — schakel push eerst in de app in.');

  // Geforceerde testmelding via "Run workflow" (input force=true) — negeert het schema.
  if (process.env.FORCE_TEST === 'true') {
    const payload = JSON.stringify({ title: 'Testmelding — werkt!', body: 'Je achtergrond-meldingen komen binnen via de server.', tag: 'force-test', url: './' });
    try {
      await webpush.sendNotification(sub, payload);
      console.log('Force-test verstuurd.');
    } catch (err) {
      console.error(`Force-test fout: ${err?.statusCode || ''} ${err?.body || err?.message || err}`);
      process.exit(1);
    }
    return;
  }

  const enabled = Array.isArray(cfg.enabledTypes) ? cfg.enabledTypes : [];
  if (enabled.length === 0) die('Push uitgeschakeld of geen herinneringen aan — niets te sturen.');

  const { date, minutes } = nowInTz(cfg.tz);
  const sent = (cfg.sent && typeof cfg.sent === 'object') ? cfg.sent : {};
  const data = cfg.data || {};

  // Helper: is een herinnering "due" op een bepaalde tijd, en nog niet gestuurd vandaag?
  const isDue = (type, hhmm) => {
    if (!enabled.includes(type) || sent[type] === date) return false;
    const t = toMinutes(hhmm);
    if (t == null) return false;
    const diff = minutes - t;
    return diff >= 0 && diff <= CATCHUP_MIN;
  };

  // 3) Bepaal welke herinneringen due zijn → { type, payload }
  const due = [];

  // Tijd-gebaseerde herinneringen
  for (const type of Object.keys(MESSAGES)) {
    if (isDue(type, cfg.times?.[type])) {
      due.push({ type, payload: { ...MESSAGES[type](cfg), url: './' } });
    }
  }

  // Data-gedreven: taak-deadlines vandaag (op de ochtend-tijd)
  if (isDue('deadlines', cfg.times?.morning) && Array.isArray(data.tasks)) {
    const today = data.tasks.filter(x => x.d === date);
    if (today.length) {
      const n = today.length;
      due.push({ type: 'deadlines', payload: {
        title: `${n} ${n === 1 ? 'taak' : 'taken'} met deadline vandaag`,
        body: n === 1 ? `"${today[0].t}" — open de app.` : `Open de app om je taken te checken.`,
        tag: 'task-deadline', url: './',
      }});
    }
  }

  // Data-gedreven: vervallen facturen (op de inkomen-tijd, 's avonds)
  if (isDue('invoices', cfg.times?.income) && Array.isArray(data.invoices)) {
    const overdue = data.invoices.filter(x => x.d < date);
    if (overdue.length) {
      const n = overdue.length;
      due.push({ type: 'invoices', payload: {
        title: `${n} ${n === 1 ? 'factuur' : 'facturen'} vervallen`,
        body: 'Herinner de klant aan de openstaande betaling.',
        tag: 'invoice-overdue', url: './',
      }});
    }
  }

  if (due.length === 0) { console.log(`[${date} ${minutes}m tz=${cfg.tz}] niets due.`); return; }

  // 4) Verstuur
  let anySent = false;
  for (const { type, payload } of due) {
    try {
      await webpush.sendNotification(sub, JSON.stringify(payload));
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
