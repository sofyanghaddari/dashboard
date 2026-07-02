#!/usr/bin/env node
/**
 * Handmatige test voor de grammatica-worker (Fase 2-gate).
 *
 * Gebruik:
 *   node proxy/test-grammatica-worker.mjs <worker-url>                  — test met getypte tekst
 *   node proxy/test-grammatica-worker.mjs <worker-url> <foto.jpg>       — test met een echte boekfoto
 *
 * Test beide endpoints: /ingest-topic en daarna /check-grammar met een
 * bewust half-goed antwoord (om de fouttype-classificatie te zien).
 */
import { readFile } from 'node:fs/promises';

const [url, fotoPad] = process.argv.slice(2);
if (!url) {
  console.error('Gebruik: node proxy/test-grammatica-worker.mjs <worker-url> [foto.jpg]');
  process.exit(1);
}
const base = url.replace(/\/+$/, '');

const VOORBEELD_TEKST = `الأسماء الخمسة هي: أبٌ، أخٌ، حمٌ، فو، ذو.
ترفع بالواو، وتنصب بالألف، وتجر بالياء.
بشرط أن تكون مفردة مكبرة مضافة إلى غير ياء المتكلم.
مثال: جاءَ أبو بكرٍ. رأيتُ أخاكَ. مررتُ بذي علمٍ.`;

async function post(path, body) {
  const res = await fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}: ${data.error || JSON.stringify(data)}`);
  return data;
}

console.log(`\n▶ Test 1: /ingest-topic (${fotoPad ? 'foto: ' + fotoPad : 'getypte tekst'})`);
let ingest;
if (fotoPad) {
  const buf = await readFile(fotoPad);
  const mediaType = fotoPad.match(/\.png$/i) ? 'image/png' : 'image/jpeg';
  ingest = await post('/ingest-topic', { image: buf.toString('base64'), mediaType });
} else {
  ingest = await post('/ingest-topic', { text: VOORBEELD_TEKST });
}
const t = ingest.topic;
console.log(`  ✓ Titel: ${t.titelAr} — ${t.titelNl}`);
console.log(`  ✓ Regel: ${t.uitleg.regel}`);
console.log(`  ✓ ${t.uitleg.puntenNl?.length || 0} uitlegpunten, ${t.voorbeeldzinnen?.length || 0} voorbeeldzinnen`);
for (const z of t.voorbeeldzinnen || []) {
  console.log(`    · ${z.zin}  (${z.vertaling})`);
  for (const w of z.i3rab || []) console.log(`        ${w.woord}: ${w.analyse}`);
}

console.log('\n▶ Test 2: /check-grammar (i3rab, bewust half-goed antwoord)');
const zin = t.voorbeeldzinnen?.[0];
const check = await post('/check-grammar', {
  oefentype: 'i3rab',
  onderwerp: { titelAr: t.titelAr, titelNl: t.titelNl, regel: t.uitleg.regel, puntenNl: t.uitleg.puntenNl },
  zin: zin?.zin,
  referentie: zin?.i3rab,
  antwoord: 'Het eerste woord is het werkwoord. Het tweede woord is het onderwerp (fa\'il) en staat in nasb.',
});
console.log(`  ✓ correct: ${check.correct}   fouttype: ${check.fouttype}`);
console.log(`  ✓ uitleg: ${check.uitleg}`);

console.log('\n▶ Test 3: /check-grammar (eigen-woorden-uitleg)');
const check2 = await post('/check-grammar', {
  oefentype: 'uitleg',
  onderwerp: { titelAr: t.titelAr, titelNl: t.titelNl, regel: t.uitleg.regel, puntenNl: t.uitleg.puntenNl },
  antwoord: 'Dit zijn vijf speciale naamwoorden die hun naamval tonen met letters in plaats van klinkers: waw voor raf, alif voor nasb, ya voor jarr.',
});
console.log(`  ✓ correct: ${check2.correct}   fouttype: ${check2.fouttype}`);
console.log(`  ✓ uitleg: ${check2.uitleg}`);

console.log('\n✅ Alle tests geslaagd.');
