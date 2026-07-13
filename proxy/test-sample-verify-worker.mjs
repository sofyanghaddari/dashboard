/**
 * Unit-test voor sample-verify-worker.js — draait lokaal, mockt VIES + KV (raakt de
 * echte VIES-dienst niet aan). Uitvoeren:  node proxy/test-sample-verify-worker.mjs
 * Node 18+ (globale fetch + crypto.subtle). Exit-code 1 als er iets faalt.
 */
import worker from './sample-verify-worker.js';

function makeKV(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    async get(k) { return store.has(k) ? store.get(k) : null; },
    async put(k, v) { store.set(k, v); },
    _store: store,
  };
}

let viesMode = 'valid';
globalThis.fetch = async (url, opts) => {
  JSON.parse(opts.body); // valideert dat we geldige JSON sturen
  if (viesMode === 'valid') return new Response(JSON.stringify({ isValid: true, name: 'AJAR B.V.', address: 'Jephtastraat 28H\n1055 JV Amsterdam' }), { status: 200 });
  if (viesMode === 'invalid') return new Response(JSON.stringify({ isValid: false }), { status: 200 });
  if (viesMode === 'http500') return new Response('err', { status: 500 });
  if (viesMode === 'weird') return new Response(JSON.stringify({ something: 'else' }), { status: 200 });
  if (viesMode === 'throw') throw new Error('network down');
};

const post = (btw, extra = {}) => new Request('https://w.example/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Origin': 'https://sofyanghaddari.github.io' },
  body: JSON.stringify({ btw, ...extra }),
});
async function call(env, btw, extra) {
  const res = await worker.fetch(post(btw, extra), env);
  return { status: res.status, body: await res.json() };
}

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  if (cond) { pass++; console.log('  ✓ ' + label); }
  else { fail++; console.log('  ✗ ' + label + '  -> ' + JSON.stringify(detail)); }
};

viesMode = 'valid';
let r = await call({ SAMPLES: makeKV() }, 'niet-een-btw');
check('slecht formaat -> invalid(format)', r.body.status === 'invalid' && r.body.reason === 'format', r.body);

const kv = makeKV();
r = await call({ SAMPLES: kv }, 'NL003042226B35');
check('geldig eerste keer -> verified', r.body.status === 'verified', r.body);
check('verified geeft naam terug', r.body.name === 'AJAR B.V.', r.body);
check('adres: nieuwregels -> komma', r.body.address === 'Jephtastraat 28H, 1055 JV Amsterdam', r.body);
check('KV: precies 1 btw-hash', [...kv._store.keys()].filter(k => k.startsWith('btw:')).length === 1, [...kv._store.keys()]);
check('KV bewaart GEEN ruw BTW/naam', !JSON.stringify([...kv._store]).includes('003042226B35') && !JSON.stringify([...kv._store]).includes('AJAR'), [...kv._store]);

r = await call({ SAMPLES: kv }, 'NL003042226B35');
check('tweede keer -> duplicate', r.body.status === 'duplicate', r.body);
r = await call({ SAMPLES: kv }, 'nl 0030.42226 b35');
check('duplicate ongeacht notatie', r.body.status === 'duplicate', r.body);

viesMode = 'invalid';
r = await call({ SAMPLES: makeKV() }, 'NL123456789B01');
check('VIES ongeldig -> invalid(not_found)', r.body.status === 'invalid' && r.body.reason === 'not_found', r.body);

for (const [mode, label] of [['http500', '500'], ['weird', 'rare vorm'], ['throw', 'netwerkfout']]) {
  viesMode = mode;
  r = await call({ SAMPLES: makeKV() }, 'NL123456789B01');
  check(`VIES ${label} -> unavailable`, r.body.status === 'unavailable', r.body);
}

viesMode = 'valid';
r = await call({}, 'NL123456789B01');
check('geen KV -> verified + warning', r.body.status === 'verified' && r.body.warning === 'no-dedup-store', r.body);

const kv2 = makeKV();
r = await call({ SAMPLES: kv2 }, 'NL999999999B99', { dryRun: true });
check('dryRun -> verified, geen claim', r.body.status === 'verified' && [...kv2._store.keys()].filter(k => k.startsWith('btw:')).length === 0, r.body);

const res403 = await worker.fetch(new Request('https://w.example/', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Origin': 'https://evil.example' }, body: '{}' }), makeKV());
check('vreemde origin -> 403', res403.status === 403, res403.status);

console.log(`\n${pass} geslaagd, ${fail} gefaald`);
process.exit(fail ? 1 : 0);
