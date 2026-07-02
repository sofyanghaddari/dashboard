/**
 * Grammatica/stof-docent proxy (Cloudflare Worker)
 * -------------------------------------------------
 * Proxy naar de Anthropic API voor de Stof-module (Geloof → Stof).
 * De API-key blijft server-side als Worker-secret; de statische PWA praat
 * alleen met deze Worker. Twee endpoints:
 *
 *   POST /ingest-topic   — foto (base64) of getypte tekst uit het lesboek
 *                          → gestructureerd onderwerp (titel, regel, uitleg,
 *                          voorbeeldzinnen met referentie-i3rab)
 *   POST /check-grammar  — beoordeelt een i3rab-antwoord of eigen-woorden-
 *                          uitleg → correct/deels/fout + NL-uitleg + fouttype
 *
 * Model: claude-sonnet-4-6 voor beide endpoints — nauwkeurigheid bij het
 * lezen van Arabische boekpagina's en bij i3rab-beoordeling weegt zwaarder
 * dan snelheid/kosten (verkeerd beoordeelde antwoorden leren de verkeerde
 * regel aan).
 *
 * Benodigd in de Worker-instellingen:
 *   ANTHROPIC_API_KEY  (secret)         — je Anthropic API-key
 *   RATE_KV            (KV-binding)     — voor de harde daglimiet (aanbevolen;
 *                                         zonder KV valt de limiet terug op een
 *                                         best-effort teller per Worker-isolate)
 *   DAILY_LIMIT        (variabele, opt.) — max requests per dag, default 100
 *
 * Zie proxy/README-grammatica-worker.md voor stap-voor-stap deploy-uitleg.
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

// Alleen deze origins mogen de Worker gebruiken (browser-requests).
// curl/scripts zonder Origin-header mogen ook (voor handmatig testen).
const ALLOWED_ORIGINS = [
  'https://sofyanghaddari.github.io',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
];

// Best-effort fallback-teller als er geen KV gebonden is (reset per isolate).
let _memCount = { day: '', n: 0 };

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const cors = corsHeaders(origin);

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return json({ error: 'Origin niet toegestaan' }, 403, cors);
    }
    if (request.method !== 'POST') {
      return json({ error: 'Alleen POST' }, 405, cors);
    }
    if (!env.ANTHROPIC_API_KEY) {
      return json({ error: 'ANTHROPIC_API_KEY ontbreekt in de Worker-instellingen' }, 500, cors);
    }

    // ── Daglimiet (kostenvangnet tegen bugs/misbruik) ──
    const limit = parseInt(env.DAILY_LIMIT || '100', 10);
    const used = await dayCount(env);
    if (used >= limit) {
      return json({
        error: `Daglimiet bereikt (${limit} AI-aanvragen per dag). Morgen kun je weer verder.`,
        limitReached: true,
      }, 429, cors);
    }

    let body;
    try { body = await request.json(); }
    catch { return json({ error: 'Ongeldige JSON in request' }, 400, cors); }

    const path = new URL(request.url).pathname.replace(/\/+$/, '');
    try {
      let result;
      if (path.endsWith('/ingest-topic'))      result = await ingestTopic(body, env);
      else if (path.endsWith('/check-grammar')) result = await checkGrammar(body, env);
      else return json({ error: 'Onbekend endpoint. Gebruik /ingest-topic of /check-grammar' }, 404, cors);

      await bumpDayCount(env, used);
      return json(result, 200, cors);
    } catch (err) {
      const msg = String(err?.message || err);
      const status = err?.status || 502;
      return json({ error: `AI-aanvraag mislukt: ${msg}` }, status, cors);
    }
  },
};

// ── /ingest-topic ────────────────────────────────────────────────────────────
// Input: { text?: string, image?: base64string, mediaType?: string, hint?: string }
// Output: { topic: { titelAr, titelNl, uitleg:{regel, puntenNl, puntenAr}, voorbeeldzinnen:[{zin, vertaling, i3rab:[{woord, analyse}]}] } }
async function ingestTopic(body, env) {
  const { text, image, mediaType, hint } = body;
  if (!text && !image) throw httpErr(400, 'Geef "text" of "image" mee');

  const system = [
    'Je bent een docent Arabische grammatica (nahw) die lesmateriaal verwerkt voor een Nederlandstalige student',
    '(Fusha niveau 3, methode Khalid Dafiri). Je krijgt een boekpagina-foto of getypte tekst met Arabischtalige',
    'uitleg van één grammaticaal onderwerp (bijv. الأسماء الخمسة of إعراب-regels).',
    '',
    'Zet dit om naar een gestructureerd onderwerp. Antwoord UITSLUITEND met geldige JSON, zonder codeblok, exact dit schema:',
    '{',
    '  "titelAr": "Arabische naam van het onderwerp",',
    '  "titelNl": "Nederlandse naam",',
    '  "uitleg": {',
    '    "regel": "De kernregel in 1-2 heldere Nederlandse zinnen",',
    '    "puntenNl": ["uitlegpunt in gewoon Nederlands", "..."],',
    '    "puntenAr": ["bijbehorende Arabische kernterm of -zin uit het boek", "..."]',
    '  },',
    '  "voorbeeldzinnen": [',
    '    { "zin": "Arabische voorbeeldzin met harakat", "vertaling": "Nederlandse vertaling",',
    '      "i3rab": [ { "woord": "الكلمة", "analyse": "functie + naamval + teken, in het Nederlands (Arabische termen mogen ertussen)" } ] }',
    '  ]',
    '}',
    '',
    'Richtlijnen:',
    '- puntenNl in gewone taal, geen jargon zonder uitleg; puntenAr zo letterlijk mogelijk uit de bron.',
    '- 3 tot 6 voorbeeldzinnen: neem de zinnen uit de bron over; vul alleen aan met eigen zinnen als de bron er minder dan 3 heeft.',
    '- De i3rab-analyse per woord moet correct en volledig zijn — dit wordt de referentie waartegen antwoorden van de student beoordeeld worden.',
    '- Als de foto onleesbaar is of geen grammatica-uitleg bevat, antwoord dan: {"error": "korte Nederlandse uitleg wat er mis is"}',
  ].join('\n');

  const content = [];
  if (image) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: image },
    });
  }
  content.push({
    type: 'text',
    text: (hint ? `Onderwerp-hint van de student: ${hint}\n\n` : '') +
          (text ? `Getypte tekst uit het boek:\n${text}` : 'Verwerk deze boekpagina tot een onderwerp.'),
  });

  const raw = await callAnthropic(env, system, content, 4096);
  const parsed = parseJson(raw);
  if (parsed.error) throw httpErr(422, parsed.error);
  if (!parsed.titelAr || !parsed.uitleg) throw httpErr(502, 'Onvolledig antwoord van het model — probeer opnieuw');
  return { topic: parsed };
}

// ── /check-grammar ───────────────────────────────────────────────────────────
// Input: { oefentype: 'i3rab'|'uitleg', onderwerp: {titelAr, titelNl, regel, puntenNl},
//          zin?, referentie?, antwoord }
// Output: { correct: 'ja'|'deels'|'nee', uitleg: string, fouttype: 'naamval'|'functie'|'regel'|'overig'|null }
async function checkGrammar(body, env) {
  const { oefentype, onderwerp, zin, referentie, antwoord } = body;
  if (!oefentype || !antwoord || !onderwerp) throw httpErr(400, 'oefentype, onderwerp en antwoord zijn verplicht');

  const system = [
    'Je beoordeelt het antwoord van een Nederlandstalige student Arabische grammatica (Fusha niveau 3).',
    'Wees streng maar eerlijk: een verkeerd beoordeeld antwoord leert de student de verkeerde regel aan.',
    'De student mag in het Nederlands, Arabisch of een mix antwoorden; beoordeel de INHOUD, niet de formulering.',
    '',
    'Antwoord UITSLUITEND met geldige JSON, zonder codeblok:',
    '{',
    '  "correct": "ja" | "deels" | "nee",',
    '  "uitleg": "Korte feedback in het Nederlands: wat was goed, wat was fout en waarom (noem de regel).",',
    '  "fouttype": "naamval" | "functie" | "regel" | "overig" | null',
    '}',
    '',
    'Betekenis fouttypes (alleen bij deels/nee, anders null):',
    '- "naamval": functie goed herkend maar verkeerde naamval of verkeerd naamvalsteken',
    '- "functie": verkeerde grammaticale functie toegekend (bv. mubtada vs. fa\'il)',
    '- "regel": de regel van het onderwerp verkeerd toegepast of niet herkend',
    '- "overig": iets anders (onvolledig, verkeerde zin, terminologie door elkaar)',
    '',
    '"deels" = de kern klopt maar er ontbreekt iets of één onderdeel is fout. "nee" = de kern is fout.',
    'Bij twijfel over een dubbelzinnige zin: zeg dat expliciet in de uitleg en beoordeel mild.',
  ].join('\n');

  const parts = [
    `Onderwerp: ${onderwerp.titelAr} — ${onderwerp.titelNl}`,
    `Regel: ${onderwerp.regel || ''}`,
    onderwerp.puntenNl?.length ? `Uitlegpunten: ${onderwerp.puntenNl.join(' | ')}` : '',
  ];
  if (oefentype === 'i3rab') {
    parts.push('', `Oefening: geef de i3rab (ontleding) van deze zin: ${zin}`);
    if (referentie?.length) {
      parts.push('Referentie-analyse (correct):',
        ...referentie.map(r => `- ${r.woord}: ${r.analyse}`));
    }
  } else {
    parts.push('', `Oefening: leg het onderwerp "${onderwerp.titelAr}" in eigen woorden uit.`);
  }
  parts.push('', `Antwoord van de student:\n${antwoord}`);

  const raw = await callAnthropic(env, system, [{ type: 'text', text: parts.filter(Boolean).join('\n') }], 1024);
  const parsed = parseJson(raw);
  if (!parsed.correct) throw httpErr(502, 'Onvolledig antwoord van het model — probeer opnieuw');
  return {
    correct: parsed.correct,
    uitleg: parsed.uitleg || '',
    fouttype: parsed.correct === 'ja' ? null : (parsed.fouttype || 'overig'),
  };
}

// ── Anthropic API ────────────────────────────────────────────────────────────
async function callAnthropic(env, system, content, maxTokens) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90_000); // boekfoto's kunnen even duren

  let res;
  try {
    res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        thinking: { type: 'adaptive' },
        system,
        messages: [{ role: 'user', content }],
      }),
    });
  } catch (e) {
    throw httpErr(504, e.name === 'AbortError' ? 'time-out (90s) — probeer opnieuw' : `netwerkfout: ${e.message}`);
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    // 429/529 van Anthropic netjes doorzetten als tijdelijke fout
    const status = res.status === 429 || res.status >= 500 ? 503 : 502;
    throw httpErr(status, `Anthropic API ${res.status}: ${detail.slice(0, 200)}`);
  }

  const data = await res.json();
  if (data.stop_reason === 'refusal') throw httpErr(422, 'Het model weigerde deze aanvraag');
  const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  if (!text) throw httpErr(502, 'Leeg antwoord van het model');
  return text;
}

// Robuust JSON parsen: model kan ondanks instructie een codeblok of pre-tekst geven.
function parseJson(raw) {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try { return JSON.parse(cleaned); } catch (_) {}
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch (_) {}
  }
  throw httpErr(502, 'Antwoord van het model was geen geldige JSON — probeer opnieuw');
}

// ── Daglimiet-tellers ────────────────────────────────────────────────────────
function today() { return new Date().toISOString().slice(0, 10); }

async function dayCount(env) {
  const day = today();
  if (env.RATE_KV) {
    const v = await env.RATE_KV.get(`count:${day}`);
    return parseInt(v || '0', 10);
  }
  if (_memCount.day !== day) _memCount = { day, n: 0 };
  return _memCount.n;
}

async function bumpDayCount(env, current) {
  const day = today();
  if (env.RATE_KV) {
    // 2 dagen TTL zodat oude tellers zichzelf opruimen
    await env.RATE_KV.put(`count:${day}`, String(current + 1), { expirationTtl: 172800 });
  } else {
    _memCount = { day, n: current + 1 };
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
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

function httpErr(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}
