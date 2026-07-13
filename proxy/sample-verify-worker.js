/**
 * AJAR sample-verificatie-proxy (Cloudflare Worker)
 * -------------------------------------------------
 * Doel: automatisch controleren of een gratis-sample-aanvraag van een ECHT bedrijf komt,
 * en of datzelfde bedrijf niet al een sample heeft gehad — zodat de afhandeling op termijn
 * zonder handmatige check kan (fase 2 van het sample-verificatieplan).
 *
 * Werking (één POST-endpoint):
 *   1. Neemt een BTW-nummer aan  ->  { "btw": "NL123456789B01" }  (of zonder NL-prefix)
 *   2. Valideert het live bij VIES (de officiële EU-validatiedienst — gratis, geen sleutel)
 *   3. Houdt in Cloudflare KV bij welke bedrijven al een sample kregen (dedup)
 *   4. Antwoordt met één status:
 *        { "status": "verified",   "name": "...", "address": "..." }   -> geldig + nog niet gehad
 *        { "status": "invalid" }                                        -> BTW-nummer niet geldig/niet gevonden
 *        { "status": "duplicate" }                                      -> dit bedrijf had al een sample
 *        { "status": "unavailable" }                                    -> VIES onbereikbaar -> front-end valt terug op handmatig
 *
 * AVG: in KV komt alléén een SHA-256-HASH van het BTW-nummer + een datum. Het BTW-nummer zelf
 * en de VIES-naam/-adres worden NIET in KV bewaard — de hash is genoeg om een duplicaat te
 * herkennen, maar is niet terug te rekenen naar een bedrijf.
 *
 * Benodigd in de Worker:
 *   SAMPLES        (KV-binding)   — de dedup-opslag. Zonder KV verifieert de Worker nog wél,
 *                                   maar kan hij duplicaten niet tegenhouden (fail-open, met warning).
 * Optioneel:
 *   VIES_URL       (variable)     — override van de VIES-endpoint (default hieronder), voor het
 *                                   geval de EU de URL wijzigt — dan geen code-wijziging nodig.
 *   DAILY_LIMIT    (variable)     — max. VIES-aanvragen per dag (default 300), kostenloos vangnet
 *                                   tegen een bug/misbruik dat VIES zou hameren.
 *
 * Zie proxy/README-sample-verify-worker.md voor de stap-voor-stap deploy-uitleg.
 */

// Alleen deze origins mogen de Worker aanroepen vanuit de browser.
// (Requests zonder Origin-header — curl/scripts — mogen ook, voor handmatig testen.)
const ALLOWED_ORIGINS = [
  'https://sofyanghaddari.github.io',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
];

const DEFAULT_VIES_URL = 'https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number';

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const cors = corsHeaders(origin);

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (origin && !ALLOWED_ORIGINS.includes(origin)) return json({ error: 'Origin niet toegestaan' }, 403, cors);
    if (request.method !== 'POST') return json({ error: 'Alleen POST' }, 405, cors);

    let body;
    try { body = await request.json(); }
    catch { return json({ error: 'Ongeldige JSON' }, 400, cors); }

    // ── BTW normaliseren + formaat-check (NL: 9 cijfers + B + 2 cijfers) ──
    const btw = normalizeNlBtw(body.btw);
    if (!btw) return json({ status: 'invalid', reason: 'format' }, 200, cors);

    // ── Kostenloos vangnet: max. X VIES-aanvragen per dag ──
    const limit = parseInt(env.DAILY_LIMIT || '300', 10);
    if (env.SAMPLES && (await dayCount(env)) >= limit) {
      // Niet hard weigeren: front-end valt terug op handmatig, geen lead verloren.
      return json({ status: 'unavailable', reason: 'daily_limit' }, 200, cors);
    }

    // ── VIES-validatie ──
    const viesUrl = env.VIES_URL || DEFAULT_VIES_URL;
    let data;
    try {
      const res = await fetch(viesUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ countryCode: 'NL', vatNumber: btw }),
      });
      if (!res.ok) return json({ status: 'unavailable', reason: 'vies_http_' + res.status }, 200, cors);
      data = await res.json();
    } catch (e) {
      return json({ status: 'unavailable', reason: 'vies_unreachable' }, 200, cors);
    }
    if (env.SAMPLES) await bumpDayCount(env);

    // Defensief parsen: alleen een expliciete true/false telt. Onbekende vorm -> 'unavailable'
    // (nooit gokken: een fout-positief zou een niet-bestaand bedrijf goedkeuren, een fout-negatief
    //  een echte klant weigeren — beide erger dan even handmatig laten checken).
    const valid = (data && (data.isValid ?? data.valid));
    if (valid === false) return json({ status: 'invalid', reason: 'not_found' }, 200, cors);
    if (valid !== true) return json({ status: 'unavailable', reason: 'vies_shape' }, 200, cors);

    const name = String(data.name || data.traderName || '').trim();
    const address = String(data.address || data.traderAddress || '').trim().replace(/\n+/g, ', ');

    // ── Dedup via KV (hash van het BTW-nummer) ──
    if (!env.SAMPLES) {
      // Geen KV gebonden: wél verifiëren, maar duplicaten niet kunnen tegenhouden.
      return json({ status: 'verified', name, address, warning: 'no-dedup-store' }, 200, cors);
    }
    const key = 'btw:' + (await sha256Hex(btw));
    const seen = await env.SAMPLES.get(key);
    if (seen) return json({ status: 'duplicate' }, 200, cors);

    // dryRun: valideren zónder de claim vast te leggen (voor testen — zie README).
    if (!body.dryRun) {
      await env.SAMPLES.put(key, JSON.stringify({ claimedAt: Date.now() }));
    }
    return json({ status: 'verified', name, address }, 200, cors);
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

// "nl 0030.42226 b35" / "NL003042226B35" / "003042226B35" -> "003042226B35" (of '' bij ongeldig)
function normalizeNlBtw(raw) {
  const s = String(raw == null ? '' : raw).toUpperCase().replace(/[\s.\-]/g, '').replace(/^NL/, '');
  return /^\d{9}B\d{2}$/.test(s) ? s : '';
}

async function sha256Hex(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function today() { return new Date().toISOString().slice(0, 10); }

async function dayCount(env) {
  const v = await env.SAMPLES.get('viesday:' + today());
  return v ? parseInt(v, 10) || 0 : 0;
}
async function bumpDayCount(env) {
  const day = today();
  const cur = await dayCount(env);
  // 2 dagen TTL: de teller ruimt zichzelf op.
  await env.SAMPLES.put('viesday:' + day, String(cur + 1), { expirationTtl: 172800 });
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}
