// Variant D (boog) v2: onregelmatige, eivormige olijven i.p.v. "kersen" +
// markup voorbereid op de val-animatie (dubbele groep per olijf, klassen op de vallers).
import { writeFileSync } from 'fs';

function leafPath(L, w, bend = 0) {
  const a = w, b = w * 0.88;
  const c = (t) => bend * t * t;
  return `M0 0
    C ${L * .16} ${(-a * .85 + c(.16)).toFixed(1)}, ${L * .42} ${(-a + c(.42)).toFixed(1)}, ${L * .66} ${(-a * .72 + c(.66)).toFixed(1)}
    C ${L * .82} ${(-a * .5 + c(.82)).toFixed(1)}, ${L * .93} ${(-a * .22 + c(.93)).toFixed(1)}, ${L} ${bend}
    C ${L * .93} ${(b * .24 + c(.93)).toFixed(1)}, ${L * .82} ${(b * .52 + c(.82)).toFixed(1)}, ${L * .66} ${(b * .74 + c(.66)).toFixed(1)}
    C ${L * .42} ${(b + c(.42)).toFixed(1)}, ${L * .16} ${(b * .85 + c(.16)).toFixed(1)}, 0 0 Z`;
}
function veinPath(L, bend = 0) {
  const c = (t) => bend * t * t;
  return `M${L * .04} 0 C ${L * .3} ${(c(.3) - L * .012).toFixed(1)}, ${L * .65} ${(c(.65) - L * .008).toFixed(1)}, ${L * .96} ${(bend * .92).toFixed(1)}`;
}
function leaf({ x, y, rot, L, w, grad, bend = 0, petiole = true }) {
  const pet = petiole
    ? `<path d="M-4.5 0 L 1 0" stroke="url(#gStem)" stroke-width="1.6" stroke-linecap="round" fill="none"/>` : '';
  const veinCol = grad === 'gS' ? 'none' : (grad === 'gU' ? 'rgba(122,134,106,.55)' : 'rgba(214,222,196,.5)');
  const edge = grad === 'gU' ? 'rgba(122,134,106,.45)' : 'rgba(58,72,44,.35)';
  return `<g transform="translate(${x} ${y}) rotate(${rot})">${pet}<path d="${leafPath(L, w, bend)}" fill="url(#${grad})" stroke="${edge}" stroke-width=".6"/><path d="${veinPath(L, bend)}" stroke="${veinCol}" stroke-width=".9" fill="none" stroke-linecap="round"/></g>`;
}

/* Eivormige olijf: smaller bij het kroontje, voller onderin — géén kers.
   e = verhouding lengte/breedte (1.15–1.35 varieert per vrucht). */
function olivePath(r, e) {
  const w = r * .8, h = r * e;
  const f = (n) => n.toFixed(1);
  return `M0 ${f(-h)}
    C ${f(w * .58)} ${f(-h * .88)}, ${f(w)} ${f(-h * .3)}, ${f(w * .95)} ${f(h * .18)}
    C ${f(w * .88)} ${f(h * .66)}, ${f(w * .48)} ${f(h * .96)}, 0 ${f(h)}
    C ${f(-w * .48)} ${f(h * .96)}, ${f(-w * .88)} ${f(h * .66)}, ${f(-w * .95)} ${f(h * .18)}
    C ${f(-w)} ${f(-h * .3)}, ${f(-w * .58)} ${f(-h * .88)}, 0 ${f(-h)} Z`;
}

/* Olijf met kort steeltje. tone: 'green' | 'ripe' | 'blush' (rode rijpingsblos).
   behind: iets kleiner/donkerder achter het loof. dropClass: klas voor de val-animatie
   op een BINNENSTE groep zonder eigen transform-attribuut (CSS-transform overschrijft
   anders de positionering). */
function olive({ sx, sy, ox, oy, r = 9, e = 1.22, rot = 0, tone = 'green', behind = false, dropClass = '' }) {
  const g = tone === 'ripe' ? 'gOliveRipe' : 'gOlive';
  const w = r * .8, h = r * e;
  const blush = tone === 'blush'
    ? `<ellipse cx="${(w * .28).toFixed(1)}" cy="${(h * .3).toFixed(1)}" rx="${(w * .52).toFixed(1)}" ry="${(h * .48).toFixed(1)}" fill="rgba(125,62,54,.4)"/>` : '';
  const op = behind ? ' opacity=".82"' : '';
  return `<g${op}>
    <path d="M${sx} ${sy} Q ${(sx * .35 + ox * .65).toFixed(1)} ${(sy * .5 + oy * .5).toFixed(1)}, ${ox} ${(oy - h - 1.5).toFixed(1)}"
      stroke="url(#gStem)" stroke-width="1.3" fill="none" stroke-linecap="round"/>
    <g transform="translate(${ox} ${oy}) rotate(${rot})"><g${dropClass ? ' class="' + dropClass + '"' : ''}>
      <path d="${olivePath(r, e)}" fill="url(#${g})" stroke="rgba(74,82,40,.4)" stroke-width=".6"/>
      ${blush}
      <ellipse rx="${(r * .18).toFixed(1)}" ry="${(r * .3).toFixed(1)}" cx="${(-r * .28).toFixed(1)}" cy="${(-h * .42).toFixed(1)}" fill="rgba(246,246,224,.7)" transform="rotate(-18)"/>
      <circle r="1.5" cy="${(-h - .5).toFixed(1)}" fill="#6E7A42"/>
    </g></g>
  </g>`;
}

function twig(x0, y0, cx, cy, x1, y1, w0, w1) {
  const n = 14, top = [], bot = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, mt = 1 - t;
    const x = mt * mt * x0 + 2 * mt * t * cx + t * t * x1;
    const y = mt * mt * y0 + 2 * mt * t * cy + t * t * y1;
    const dx = 2 * mt * (cx - x0) + 2 * t * (x1 - cx);
    const dy = 2 * mt * (cy - y0) + 2 * t * (y1 - cy);
    const len = Math.hypot(dx, dy) || 1;
    const w = (w0 + (w1 - w0) * t) / 2;
    top.push([x - dy / len * w, y + dx / len * w]);
    bot.push([x + dy / len * w, y - dx / len * w]);
  }
  const pts = top.concat(bot.reverse());
  return `<path d="M${pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L ')} Z" fill="url(#gStem)"/>`;
}

const DEFS = `<defs>
  <linearGradient id="gA" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5C6E46"/><stop offset=".5" stop-color="#6C7E52"/><stop offset="1" stop-color="#59683F"/></linearGradient>
  <linearGradient id="gB" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6B7C50"/><stop offset=".5" stop-color="#7E9060"/><stop offset="1" stop-color="#66774A"/></linearGradient>
  <linearGradient id="gU" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9FAA8C"/><stop offset=".5" stop-color="#B4BEA4"/><stop offset="1" stop-color="#98A386"/></linearGradient>
  <linearGradient id="gS" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#49573A"/><stop offset="1" stop-color="#546242"/></linearGradient>
  <linearGradient id="gStem" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8C9271"/><stop offset="1" stop-color="#A5AB86"/></linearGradient>
  <radialGradient id="gOlive" cx=".36" cy=".28" r=".95"><stop offset="0" stop-color="#C9C878"/><stop offset=".45" stop-color="#9BA04F"/><stop offset="1" stop-color="#6E7736"/></radialGradient>
  <radialGradient id="gOliveRipe" cx=".36" cy=".28" r=".95"><stop offset="0" stop-color="#B9BC6A"/><stop offset=".5" stop-color="#878E42"/><stop offset="1" stop-color="#5C6529"/></radialGradient>
</defs>`;

/* Boog-compositie (als variant D), blaadjes ongewijzigd */
const shadow = [
  { x: 125, y: 78, rot: -68, L: 46, w: 6.5, grad: 'gS', bend: 6, petiole: false },
  { x: 230, y: 62, rot: 40,  L: 44, w: 6,   grad: 'gS', bend: -5, petiole: false },
  { x: 336, y: 79, rot: 62,  L: 46, w: 6.5, grad: 'gS', bend: 5, petiole: false },
];
const leaves = [
  { x: 54,  y: 103, rot: -64, L: 54, w: 7.5, grad: 'gB', bend: 8 },
  { x: 87,  y: 90,  rot: 14,  L: 56, w: 8,   grad: 'gA', bend: -8 },
  { x: 125, y: 78,  rot: -56, L: 52, w: 7.5, grad: 'gU', bend: -6 },
  { x: 159, y: 70,  rot: 20,  L: 58, w: 8,   grad: 'gA', bend: 8 },
  { x: 196, y: 65,  rot: -44, L: 52, w: 7.5, grad: 'gB', bend: 7 },
  { x: 230, y: 63,  rot: -22, L: 50, w: 7,   grad: 'gA', bend: -6 },
  { x: 246, y: 63,  rot: 30,  L: 52, w: 7.5, grad: 'gU', bend: 6 },
  { x: 280, y: 66,  rot: -18, L: 54, w: 7.5, grad: 'gB', bend: -7 },
  { x: 301, y: 70,  rot: 52,  L: 56, w: 8,   grad: 'gA', bend: 8 },
  { x: 336, y: 79,  rot: -8,  L: 52, w: 7.5, grad: 'gU', bend: 6 },
  { x: 358, y: 85,  rot: 58,  L: 54, w: 7.5, grad: 'gB', bend: -7 },
  { x: 391, y: 96,  rot: 4,   L: 50, w: 7,   grad: 'gA', bend: 6 },
  { x: 412, y: 104, rot: 64,  L: 48, w: 7,   grad: 'gB', bend: 7 },
  { x: 432, y: 116, rot: 32,  L: 44, w: 6,   grad: 'gA', bend: -5 },
];

/* Onregelmatige olijven: 3 + 2 + 1, elk eigen maat/rek/rotatie, korte steeltjes,
   één met rijpingsblos, één donker half achter het loof. Vallers: klassen olv-a / olv-b. */
const olives = [
  // trosje links (3, overlappend, verschillende groottes)
  { sx: 152, sy: 71, ox: 149, oy: 89,  r: 7.4,  e: 1.2,  rot: -3,  tone: 'ripe', behind: true },
  { sx: 150, sy: 72, ox: 141, oy: 95,  r: 10,   e: 1.28, rot: -13, dropClass: 'olv-drop olv-a' },
  { sx: 158, sy: 70, ox: 159, oy: 97,  r: 8.4,  e: 1.16, rot: 10,  tone: 'ripe' },
  // duo rechts (ongelijk van maat, één met blos)
  { sx: 300, sy: 72, ox: 293, oy: 94,  r: 9.2,  e: 1.32, rot: -9,  tone: 'blush', dropClass: 'olv-drop olv-b' },
  { sx: 307, sy: 71, ox: 309, oy: 90,  r: 7.8,  e: 1.18, rot: 15 },
  // eentje alleen, verder naar rechts (onregelmatig beeld)
  { sx: 362, sy: 87, ox: 356, oy: 106, r: 7.9,  e: 1.26, rot: -5,  tone: 'ripe' },
];

const inner = `${DEFS}
  <g opacity=".5">${shadow.map(leaf).join('')}</g>
  ${twig(20, 122, 230, 8, 440, 122, 4.6, 1.4)}
  ${leaves.map(leaf).join('')}
  ${olives.map(olive).join('')}`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 155" fill="none" role="img" aria-label="Olijftak">
${inner}
</svg>`;
writeFileSync('tak-d2.svg', svg);

/* Inline versie voor main.js: class + overflow visible + aria-hidden (decoratief) */
const inline = `<svg class="cta-tak" viewBox="0 0 460 155" fill="none" aria-hidden="true">${inner.replace(/\n\s*/g, '')}</svg>`;
writeFileSync('tak-d2-inline.txt', inline);

/* Preview + val-animatie-prototype in een CTA-band-mock */
writeFileSync('tak-preview.html', `<!doctype html><meta charset="utf-8">
<style>
  body { margin:0; font-family: Georgia, serif; }
  .cream { background:#F7F5F0; display:grid; place-items:center; padding:34px 0 10px; }
  .band { background: linear-gradient(160deg,#3E4B2E,#333F26); padding: 52px 20px 64px; text-align:center; }
  .cta-tak { width: 330px; display:block; margin: 0 auto 6px; overflow: visible; }
  .band h2 { font-size:34px; color:#F7F5F0; font-weight:600; margin: 8px 0 0; }
  .band p { font-family:-apple-system,sans-serif; font-size:15px; color:rgba(247,245,240,.82); margin:10px 0 0; }
  .band .btn { display:inline-block; margin-top:22px; padding:12px 28px; border-radius:999px; background:#B8934A; color:#2C351E; font-family:-apple-system,sans-serif; font-size:14px; font-weight:600; }

  /* ── Val-animatie: olijf laat los, versnelt (zwaartekracht), draait licht mee,
        vervaagt vlak boven de titel en keert daarna zachtjes terug op de tak ── */
  .cta-tak .olv-drop { transform-box: fill-box; transform-origin: center; }
  .cta-tak .olv-a { animation: olvDrop 13s linear infinite; }
  .cta-tak .olv-b { animation: olvDrop 17s linear 6s infinite; }
  @keyframes olvDrop {
    0%, 55%    { transform: none; opacity: 1; animation-timing-function: ease-in-out; }
    57%        { transform: translate(.5px, 2.5px) rotate(4deg); animation-timing-function: cubic-bezier(.5,0,.88,.42); } /* loslaten */
    64.5%      { transform: translate(6px, 106px) rotate(30deg); opacity: 1; animation-timing-function: linear; } /* vrije val, volledig zichtbaar */
    66.5%      { transform: translate(8px, 148px) rotate(36deg); opacity: 0; } /* vlak boven de titel uitfaden */
    66.6%, 80% { transform: none; opacity: 0; }  /* onzichtbaar terug op de tak */
    97%, 100%  { transform: none; opacity: 1; animation-timing-function: ease; } /* rijpt zachtjes terug aan */
  }
</style>
<div class="cream"><img src="tak-d2.svg" style="width:430px"></div>
<div class="band">
  ${inline}
  <h2>Eerst proeven, dan beslissen</h2>
  <p>Vraag een gratis proefflesje aan voor uw zaak — zonder verplichtingen.</p>
  <span class="btn">Gratis sample aanvragen</span>
</div>`);
console.log('d2 generated');
