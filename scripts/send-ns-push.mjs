// Verstuurt een ACHTERGROND-push bij een nieuwe NS-staking (overal) of een nieuwe
// trein-storing in Noord-Holland — ook als de app dicht is. Draait in de
// ns-disruptions workflow (elke ~10 min), ná het ophalen van de verse storingen.
//
// Hergebruikt dezelfde push-config gist + VAPID-sleutels als send-push.mjs.
// Dedup is server-side via cfg.nsSeen (lijst id's), los van de telefoon. Eerste run
// seedt alleen (geen melding-explosie).
//
// Vereiste env:
//   GH_PAT              GitHub-token met `gist` scope (lezen/schrijven config-gist)
//   VAPID_PRIVATE_KEY / VAPID_PUBLIC_KEY / VAPID_SUBJECT
//   NS_FILE             pad naar de net opgehaalde ns-disruptions.json

import { readFileSync } from 'node:fs';
import webpush from 'web-push';

const { GH_PAT, VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY, VAPID_SUBJECT, NS_FILE } = process.env;

const PUSH_GIST_DESC = 'dashboard-push-config';
const PUSH_GIST_FILE = 'push-config.json';

// Noord-Holland plaatsen/stations — storing hier = kans op ritten.
const NH_RE = /amsterdam|haarlem|schiphol|hoofddorp|nieuw-vennep|zaandam|zaanstad|wormerveer|krommenie|castricum|uitgeest|heemskerk|beverwijk|santpoort|driehuis|velsen|ijmuiden|bloemendaal|overveen|zandvoort|heemstede|halfweg|weesp|diemen|naarden|bussum|hilversum|purmerend|hoorn|enkhuizen|bovenkarspel|alkmaar|heiloo|heerhugowaard|obdam|schagen|anna paulowna|den helder|texel|edam|volendam|monnickendam/;

function die(msg) { console.error(msg); process.exit(0); } // exit 0 → geen failing build

function hay(d) {
  const ts = (d.timespans && d.timespans[0]) || {};
  return [d.title, d.titel, ts.situation && ts.situation.label, ts.cause && ts.cause.label, d.text, d.body]
    .filter(Boolean).join(' ').toLowerCase();
}
const isStrike = (d) => /staking|stakt|werkonderbreking/.test(hay(d));
const isRelevant = (d) => {
  if (isStrike(d)) return true;
  const t = String(d.type || '').toLowerCase();
  const isDisruption = /storing|disruption|calamit/.test(t);
  return isDisruption && NH_RE.test(hay(d));
};
const cleanTitle = (d) => String(d.title || d.titel || 'Trein-storing').replace(/\.\s*$/, '');

async function gh(path, opts = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...opts,
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${GH_PAT}`,
      'Content-Type': 'application/json',
      'User-Agent': 'dashboard-ns-push',
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${await res.text()}`);
  return res.json();
}

async function main() {
  if (!GH_PAT || !VAPID_PRIVATE_KEY || !VAPID_PUBLIC_KEY) {
    die(`Ontbrekende env — niets te doen. GH_PAT=${!!GH_PAT} VAPID_PRIVATE_KEY=${!!VAPID_PRIVATE_KEY} VAPID_PUBLIC_KEY=${!!VAPID_PUBLIC_KEY}`);
  }
  webpush.setVapidDetails(VAPID_SUBJECT || 'mailto:sofyanghaddari@gmail.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  // 1) Verse storingen inlezen
  let list;
  try {
    const raw = JSON.parse(readFileSync(NS_FILE || 'ns-disruptions.json', 'utf8'));
    list = Array.isArray(raw) ? raw : (raw.disruptions || raw.payload || []);
  } catch (e) { die(`Kan ${NS_FILE} niet lezen: ${e.message}`); }
  if (!Array.isArray(list)) die('Onverwacht NS-formaat.');

  const withId = list.filter(d => d && d.id != null);
  const allIds = withId.map(d => String(d.id));

  // 2) Config-gist (subscription + nsSeen)
  const gists = await gh('/gists?per_page=100');
  const meta = gists.find(g => g.description === PUSH_GIST_DESC || (g.files && g.files[PUSH_GIST_FILE]));
  if (!meta) die('Geen push-config gist — schakel push eerst in de app in.');
  const full = await gh(`/gists/${meta.id}`);
  const file = full.files[PUSH_GIST_FILE];
  if (!file) die('push-config.json ontbreekt in de gist.');
  const cfg = JSON.parse(file.content);

  const sub = cfg.subscription;
  if (!sub || !sub.endpoint) die('Geen subscription — push niet ingeschakeld.');
  if (cfg.nsPush === false) die('NS-push staat uit (cfg.nsPush=false).');

  // 3) Nieuw t.o.v. wat we al gezien hebben
  const firstRun = !Array.isArray(cfg.nsSeen);
  const seen = new Set(Array.isArray(cfg.nsSeen) ? cfg.nsSeen : []);
  cfg.nsSeen = allIds.slice(0, 300);

  if (firstRun) {
    await saveCfg(meta.id, cfg);
    console.log('Eerste run — alleen geseed, geen melding.');
    return;
  }

  const fresh = withId.filter(d => isRelevant(d) && !seen.has(String(d.id)));
  if (!fresh.length) { await saveCfg(meta.id, cfg); console.log('Niets nieuws relevants.'); return; }

  // 4) Payload — staking krijgt voorrang
  const strike = fresh.find(isStrike);
  let payload;
  if (strike) {
    payload = { title: 'NS-staking — extra drukte', body: `${cleanTitle(strike)} — topdag voor ritten!`, tag: 'ns-strike', url: './' };
  } else if (fresh.length === 1) {
    payload = { title: 'Trein-storing Noord-Holland', body: `${cleanTitle(fresh[0])} — kans op ritten!`, tag: 'ns-disruption', url: './' };
  } else {
    payload = { title: `${fresh.length} trein-storingen Noord-Holland`, body: `${cleanTitle(fresh[0])} e.a. — kans op ritten!`, tag: 'ns-disruption', url: './' };
  }

  try {
    await webpush.sendNotification(sub, JSON.stringify(payload));
    console.log(`NS-push verstuurd: ${payload.title}`);
  } catch (err) {
    const code = err?.statusCode;
    console.error(`NS-push fout: ${code || ''} ${err?.body || err?.message || err}`);
    if (code === 404 || code === 410) cfg.subscriptionExpired = true;
  }

  await saveCfg(meta.id, cfg);
}

async function saveCfg(id, cfg) {
  await gh(`/gists/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ files: { [PUSH_GIST_FILE]: { content: JSON.stringify(cfg, null, 2) } } }),
  });
}

main().catch(err => { console.error(err); process.exit(1); });
