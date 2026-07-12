// Genereert een realistische olijftak-SVG uit data — itereerbaar per blad/olijf.
// Vormtaal naar de referentiefoto: slanke lansvormige blaadjes (sage-groen boven,
// zilvergrijs onder), taps toelopende steel met zijtwijgen, hangende olijfjes.
import { writeFileSync } from 'fs';

/* ---------- bouwstenen ---------- */

// Lansvormig blad met licht asymmetrische randen + middennerf.
// Lokaal stelsel: basis (0,0), punt (L,0). w = halve breedte.
function leafPath(L, w, bend = 0) {
  const a = w, b = w * 0.88; // boven iets boller dan onder
  const c = (t) => bend * t * t;  // askromming: kwadratisch naar de punt
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

// Blad op positie: x,y = basis, rot = graden, L = lengte, w = halve breedte,
// grad = 'gA'|'gB'|'gU' (donker / midden / zilveren onderkant), flip spiegelt.
function leaf({ x, y, rot, L, w, grad, bend = 0, flip = false, petiole = true }) {
  const sy = flip ? -1 : 1;
  const pet = petiole
    ? `<path d="M-4.5 0 L 1 0" stroke="url(#gStem)" stroke-width="1.6" stroke-linecap="round" fill="none"/>` : '';
  const veinCol = grad === 'gS' ? 'none' : (grad === 'gU' ? 'rgba(122,134,106,.55)' : 'rgba(214,222,196,.5)');
  const edge = grad === 'gU' ? 'rgba(122,134,106,.45)' : 'rgba(58,72,44,.35)';
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(1 ${sy})">
    ${pet}
    <path d="${leafPath(L, w, bend)}" fill="url(#${grad})" stroke="${edge}" stroke-width=".6"/>
    <path d="${veinPath(L, bend)}" stroke="${veinCol}" stroke-width=".9" fill="none" stroke-linecap="round"/>
  </g>`;
}

// Olijf: eivormig, radiale gradiënt met spotlicht, klein kroontje + steeltje.
// sx,sy = aanhechting op de twijg; ox,oy = middelpunt olijf.
function olive({ sx, sy, ox, oy, r = 10, rot = 0, ripe = false }) {
  const g = ripe ? 'gOliveRipe' : 'gOlive';
  return `<g>
    <path d="M${sx} ${sy} Q ${(sx * .4 + ox * .6).toFixed(1)} ${(sy * .55 + oy * .45).toFixed(1)}, ${ox} ${oy - r * 1.05}"
      stroke="url(#gStem)" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <g transform="translate(${ox} ${oy}) rotate(${rot})">
      <ellipse rx="${r * .82}" ry="${r * 1.12}" fill="url(#${g})" stroke="rgba(74,82,40,.4)" stroke-width=".6"/>
      <ellipse rx="${r * .2}" ry="${r * .3}" cx="${-r * .3}" cy="${-r * .48}" fill="rgba(246,246,224,.75)"/>
      <circle r="1.6" cy="${-r * 1.06}" fill="#6E7A42"/>
    </g>
  </g>`;
}

// Taps toelopende twijg als gevuld pad langs een kwadratische curve.
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

/* ---------- compositie ----------
   Hoofdsteel van linksonder (28,208) via (170,150) naar rechtsboven (398,52).
   Twee zijtwijgen. Blaadjes in ruwe paren, afwisselend, punt van de steel af. */

const leaves = [
  // ── onderste deel hoofdsteel ──
  { x: 46,  y: 203, rot: -152, L: 56, w: 8.5, grad: 'gB', bend: 7 },
  { x: 60,  y: 198, rot: 34,   L: 64, w: 9.5, grad: 'gA', bend: 9 },
  { x: 76,  y: 193, rot: -128, L: 62, w: 9,   grad: 'gA', bend: -8 },
  { x: 94,  y: 188, rot: 52,   L: 58, w: 8.5, grad: 'gU', bend: 6 },
  { x: 112, y: 182, rot: -112, L: 58, w: 8.5, grad: 'gB', bend: -9 },
  { x: 126, y: 177, rot: 26,   L: 70, w: 10,  grad: 'gA', bend: 10 },
  // ── middendeel ──
  { x: 158, y: 162, rot: -138, L: 66, w: 9.5, grad: 'gB', bend: -7 },
  { x: 172, y: 156, rot: 42,   L: 62, w: 9,   grad: 'gA', bend: 8 },
  { x: 206, y: 139, rot: -122, L: 60, w: 8.5, grad: 'gU', bend: 7 },
  { x: 222, y: 131, rot: 20,   L: 66, w: 9.5, grad: 'gA', bend: -6 },
  { x: 244, y: 121, rot: -105, L: 54, w: 8,   grad: 'gB', bend: -8 },
  { x: 260, y: 113, rot: 50,   L: 62, w: 9,   grad: 'gB', bend: 9 },
  // ── bovenste deel ──
  { x: 290, y: 99,  rot: -142, L: 58, w: 8.5, grad: 'gA', bend: 8 },
  { x: 306, y: 92,  rot: 24,   L: 56, w: 8,   grad: 'gB', bend: -7 },
  { x: 330, y: 81,  rot: -118, L: 52, w: 7.5, grad: 'gU', bend: -6 },
  { x: 346, y: 74,  rot: 44,   L: 54, w: 7.5, grad: 'gA', bend: 7 },
  { x: 366, y: 64,  rot: -100, L: 46, w: 6.5, grad: 'gB', bend: -6 },
  { x: 380, y: 58,  rot: 16,   L: 48, w: 6.5, grad: 'gA', bend: 6 },
  { x: 394, y: 52,  rot: -30,  L: 44, w: 6,   grad: 'gB', bend: -5 },  // eindblad
  // ── zijtwijg 1 (omhoog) ──
  { x: 192, y: 116, rot: -85,  L: 52, w: 7.5, grad: 'gB', bend: -7 },
  { x: 204, y: 103, rot: -38,  L: 58, w: 8,   grad: 'gA', bend: 8 },
  { x: 216, y: 92,  rot: -120, L: 46, w: 6.5, grad: 'gU', bend: 6 },
  { x: 228, y: 84,  rot: -62,  L: 50, w: 7,   grad: 'gB', bend: -6 },
  // ── zijtwijg 2 (omlaag) ──
  { x: 280, y: 128, rot: 108,  L: 50, w: 7.5, grad: 'gA', bend: -7 },
  { x: 292, y: 142, rot: 62,   L: 54, w: 8,   grad: 'gB', bend: 8 },
  { x: 304, y: 153, rot: 96,   L: 46, w: 6.5, grad: 'gU', bend: 6 },
];

// dieptelaag: gedempte blaadjes ÁCHTER het hoofdloof (gelaagd loof zoals op de foto)
const shadowLeaves = [
  { x: 68,  y: 196, rot: -95,  L: 50, w: 7,   grad: 'gS', bend: -8, petiole: false },
  { x: 118, y: 180, rot: 70,   L: 52, w: 7.5, grad: 'gS', bend: 7,  petiole: false },
  { x: 180, y: 150, rot: -160, L: 56, w: 8,   grad: 'gS', bend: 6,  petiole: false },
  { x: 250, y: 118, rot: 80,   L: 48, w: 7,   grad: 'gS', bend: -6, petiole: false },
  { x: 316, y: 88,  rot: -75,  L: 44, w: 6.5, grad: 'gS', bend: 6,  petiole: false },
  { x: 356, y: 70,  rot: 60,   L: 42, w: 6,   grad: 'gS', bend: -5, petiole: false },
];

const olives = [
  // cluster dicht onder het middendeel — overlappend, korte steeltjes
  { sx: 146, sy: 169, ox: 140, oy: 190, r: 11,   rot: -8 },
  { sx: 150, sy: 167, ox: 158, oy: 193, r: 10,   rot: 12, ripe: true },
  { sx: 168, sy: 158, ox: 174, oy: 180, r: 10.5, rot: 4 },
  // duo hoger op de tak
  { sx: 312, sy: 88,  ox: 306, oy: 110, r: 9.5,  rot: -6 },
  { sx: 316, sy: 86,  ox: 322, oy: 112, r: 8.5,  rot: 14, ripe: true },
];

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 430 240" fill="none" role="img" aria-label="Olijftak met olijven">
  <defs>
    <linearGradient id="gA" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#5C6E46"/><stop offset=".55" stop-color="#6C7E52"/><stop offset="1" stop-color="#59683F"/>
    </linearGradient>
    <linearGradient id="gB" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#6B7C50"/><stop offset=".5" stop-color="#7E9060"/><stop offset="1" stop-color="#66774A"/>
    </linearGradient>
    <linearGradient id="gU" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#9FAA8C"/><stop offset=".5" stop-color="#B4BEA4"/><stop offset="1" stop-color="#98A386"/>
    </linearGradient>
    <linearGradient id="gStem" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#8C9271"/><stop offset="1" stop-color="#A5AB86"/>
    </linearGradient>
    <radialGradient id="gOlive" cx=".36" cy=".3" r=".95">
      <stop offset="0" stop-color="#C9C878"/><stop offset=".45" stop-color="#9BA04F"/><stop offset="1" stop-color="#6E7736"/>
    </radialGradient>
    <linearGradient id="gS" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#49573A"/><stop offset="1" stop-color="#546242"/>
    </linearGradient>
    <radialGradient id="gOliveRipe" cx=".36" cy=".3" r=".95">
      <stop offset="0" stop-color="#B9BC6A"/><stop offset=".5" stop-color="#878E42"/><stop offset="1" stop-color="#5C6529"/>
    </radialGradient>
  </defs>
  <g opacity=".5">${shadowLeaves.map(leaf).join('\n')}</g>
  ${twig(28, 208, 170, 150, 398, 52, 5.4, 1.6)}
  ${twig(180, 150, 196, 122, 232, 82, 3, 1.2)}
  ${twig(262, 112, 282, 130, 308, 156, 2.6, 1.1)}
  ${leaves.map(leaf).join('\n')}
  ${olives.map(olive).join('\n')}
</svg>`;

writeFileSync('branch-v2.svg', svg);

// Preview op crème én donker-olijf (de twee ondergronden van de site)
writeFileSync('branch-preview.html', `<!doctype html><meta charset="utf-8">
<style>
  body { margin:0; font-family: Georgia, serif; }
  .row { display:flex; }
  .cell { flex:1; display:grid; place-items:center; padding:40px 20px; }
  .cream { background:#F7F5F0; }
  .dark { background: linear-gradient(160deg, #3E4B2E, #333F26); }
  img, object { width: 400px; }
  .small img { width: 210px; }
  p { text-align:center; font-size:13px; color:#888; margin:6px 0 0; }
  .dark p { color: rgba(247,245,240,.6); }
</style>
<div class="row">
  <div class="cell cream"><div><img src="branch-v2.svg"><p>op crème (groot)</p></div></div>
  <div class="cell dark"><div><img src="branch-v2.svg"><p>op donker (groot)</p></div></div>
</div>
<div class="row" style="display:block">
  <div class="cell dark" style="padding:56px 20px 60px">
    <div style="text-align:center; max-width:640px">
      <img src="branch-v2.svg" style="width:210px; display:block; margin:0 auto 14px">
      <div style="font-size:34px; color:#F7F5F0; font-weight:600; letter-spacing:.2px">Eerst proeven, dan beslissen</div>
      <div style="font-family: -apple-system, sans-serif; font-size:15px; color:rgba(247,245,240,.82); margin-top:10px">Vraag een gratis proefflesje aan voor uw zaak — zonder verplichtingen.</div>
      <div style="display:inline-block; margin-top:22px; padding:12px 28px; border-radius:999px; background:#B8934A; color:#2C351E; font-family:-apple-system,sans-serif; font-size:14px; font-weight:600">Gratis sample aanvragen</div>
      <div style="font-family:-apple-system,sans-serif; font-size:12px; color:rgba(247,245,240,.75); margin-top:16px">✓ Gratis en zonder verplichtingen&nbsp;&nbsp;&nbsp;✓ Vanaf één doos&nbsp;&nbsp;&nbsp;✓ Direct contact met de importeur</div>
      <p>zo zou hij in de CTA-band staan</p>
    </div>
  </div>
</div>
<div class="row small">
  <div class="cell cream"><div><img src="branch-v2.svg"><p>op crème (echte grootte ± CTA-band)</p></div></div>
  <div class="cell dark"><div><img src="branch-v2.svg"><p>op donker (echte grootte)</p></div></div>
</div>`);
console.log('generated');
