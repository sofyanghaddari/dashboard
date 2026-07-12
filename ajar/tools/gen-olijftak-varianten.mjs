// Genereert 6 olijftak-varianten (A t/m F) uit dezelfde bouwstenen als gen-branch.mjs,
// elk met eigen compositie en/of palet — voor de keuzeronde van Soef.
import { writeFileSync } from 'fs';

/* ---------- bouwstenen (zelfde vormtaal als gen-branch.mjs) ---------- */

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
function leaf(pal) {
  return ({ x, y, rot, L, w, grad, bend = 0, petiole = true }) => {
    const pet = petiole
      ? `<path d="M-4.5 0 L 1 0" stroke="url(#gStem)" stroke-width="1.6" stroke-linecap="round" fill="none"/>` : '';
    const veinCol = grad === 'gS' ? 'none' : (grad === 'gU' ? pal.veinU : pal.vein);
    const edge = grad === 'gU' ? pal.edgeU : pal.edge;
    return `<g transform="translate(${x} ${y}) rotate(${rot})">
      ${pet}
      <path d="${leafPath(L, w, bend)}" fill="url(#${grad})" stroke="${edge}" stroke-width=".6"/>
      <path d="${veinPath(L, bend)}" stroke="${veinCol}" stroke-width=".9" fill="none" stroke-linecap="round"/>
    </g>`;
  };
}
function olive(pal) {
  return ({ sx, sy, ox, oy, r = 10, rot = 0, ripe = false }) => {
    const g = ripe ? 'gOliveRipe' : 'gOlive';
    return `<g>
      <path d="M${sx} ${sy} Q ${(sx * .4 + ox * .6).toFixed(1)} ${(sy * .55 + oy * .45).toFixed(1)}, ${ox} ${oy - r * 1.05}"
        stroke="url(#gStem)" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      <g transform="translate(${ox} ${oy}) rotate(${rot})">
        <ellipse rx="${r * .82}" ry="${r * 1.12}" fill="url(#${g})" stroke="${pal.oliveEdge}" stroke-width=".6"/>
        <ellipse rx="${r * .2}" ry="${r * .3}" cx="${-r * .3}" cy="${-r * .48}" fill="${pal.oliveSpot}"/>
        <circle r="1.6" cy="${-r * 1.06}" fill="${pal.oliveCap}"/>
      </g>
    </g>`;
  };
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

/* ---------- paletten ---------- */

const GROEN = {
  gA: ['#5C6E46', '#6C7E52', '#59683F'],
  gB: ['#6B7C50', '#7E9060', '#66774A'],
  gU: ['#9FAA8C', '#B4BEA4', '#98A386'],
  gS: ['#49573A', '#546242'],
  stem: ['#8C9271', '#A5AB86'],
  olive: ['#C9C878', '#9BA04F', '#6E7736'],
  oliveRipe: ['#B9BC6A', '#878E42', '#5C6529'],
  vein: 'rgba(214,222,196,.5)', veinU: 'rgba(122,134,106,.55)',
  edge: 'rgba(58,72,44,.35)', edgeU: 'rgba(122,134,106,.45)',
  oliveEdge: 'rgba(74,82,40,.4)', oliveSpot: 'rgba(246,246,224,.75)', oliveCap: '#6E7A42'
};
// Goud-duotone: brons/champagne — sluit aan op de gouden accenten van de site
const GOUD = {
  gA: ['#8A6F33', '#A0823F', '#7E652C'],
  gB: ['#A0823F', '#B8984F', '#94773A'],
  gU: ['#D6C391', '#E4D4A8', '#CDB985'],
  gS: ['#6E5827', '#7C652E'],
  stem: ['#9A7D3B', '#B79A55'],
  olive: ['#E0CC8A', '#BB9C4E', '#8A6F33'],
  oliveRipe: ['#CDB26A', '#A18540', '#755D28'],
  vein: 'rgba(245,235,205,.55)', veinU: 'rgba(150,122,60,.55)',
  edge: 'rgba(96,74,30,.4)', edgeU: 'rgba(150,122,60,.45)',
  oliveEdge: 'rgba(96,74,30,.45)', oliveSpot: 'rgba(250,244,222,.8)', oliveCap: '#8A6F33'
};

function defs(pal) {
  const lin = (id, c) => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">` +
    (c.length === 3
      ? `<stop offset="0" stop-color="${c[0]}"/><stop offset=".5" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/>`
      : `<stop offset="0" stop-color="${c[0]}"/><stop offset="1" stop-color="${c[1]}"/>`) +
    `</linearGradient>`;
  const rad = (id, c) => `<radialGradient id="${id}" cx=".36" cy=".3" r=".95">` +
    `<stop offset="0" stop-color="${c[0]}"/><stop offset=".45" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></radialGradient>`;
  return `<defs>${lin('gA', pal.gA)}${lin('gB', pal.gB)}${lin('gU', pal.gU)}${lin('gS', pal.gS)}${lin('gStem', pal.stem)}${rad('gOlive', pal.olive)}${rad('gOliveRipe', pal.oliveRipe)}</defs>`;
}

function build({ viewBox, pal, twigs, shadow = [], leaves, olives }) {
  const LF = leaf(pal), OL = olive(pal);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none" role="img" aria-label="Olijftak">
  ${defs(pal)}
  <g opacity=".5">${shadow.map(s => LF({ ...s, petiole: false })).join('')}</g>
  ${twigs.map(t => twig(...t)).join('')}
  ${leaves.map(LF).join('')}
  ${olives.map(OL).join('')}
</svg>`;
}

/* ---------- A. Origineel (referentie) ---------- */
const A_leaves = [
  { x: 46,  y: 203, rot: -152, L: 56, w: 8.5, grad: 'gB', bend: 7 },
  { x: 60,  y: 198, rot: 34,   L: 64, w: 9.5, grad: 'gA', bend: 9 },
  { x: 76,  y: 193, rot: -128, L: 62, w: 9,   grad: 'gA', bend: -8 },
  { x: 94,  y: 188, rot: 52,   L: 58, w: 8.5, grad: 'gU', bend: 6 },
  { x: 112, y: 182, rot: -112, L: 58, w: 8.5, grad: 'gB', bend: -9 },
  { x: 126, y: 177, rot: 26,   L: 70, w: 10,  grad: 'gA', bend: 10 },
  { x: 158, y: 162, rot: -138, L: 66, w: 9.5, grad: 'gB', bend: -7 },
  { x: 172, y: 156, rot: 42,   L: 62, w: 9,   grad: 'gA', bend: 8 },
  { x: 206, y: 139, rot: -122, L: 60, w: 8.5, grad: 'gU', bend: 7 },
  { x: 222, y: 131, rot: 20,   L: 66, w: 9.5, grad: 'gA', bend: -6 },
  { x: 244, y: 121, rot: -105, L: 54, w: 8,   grad: 'gB', bend: -8 },
  { x: 260, y: 113, rot: 50,   L: 62, w: 9,   grad: 'gB', bend: 9 },
  { x: 290, y: 99,  rot: -142, L: 58, w: 8.5, grad: 'gA', bend: 8 },
  { x: 306, y: 92,  rot: 24,   L: 56, w: 8,   grad: 'gB', bend: -7 },
  { x: 330, y: 81,  rot: -118, L: 52, w: 7.5, grad: 'gU', bend: -6 },
  { x: 346, y: 74,  rot: 44,   L: 54, w: 7.5, grad: 'gA', bend: 7 },
  { x: 366, y: 64,  rot: -100, L: 46, w: 6.5, grad: 'gB', bend: -6 },
  { x: 380, y: 58,  rot: 16,   L: 48, w: 6.5, grad: 'gA', bend: 6 },
  { x: 394, y: 52,  rot: -30,  L: 44, w: 6,   grad: 'gB', bend: -5 },
  { x: 192, y: 116, rot: -85,  L: 52, w: 7.5, grad: 'gB', bend: -7 },
  { x: 204, y: 103, rot: -38,  L: 58, w: 8,   grad: 'gA', bend: 8 },
  { x: 216, y: 92,  rot: -120, L: 46, w: 6.5, grad: 'gU', bend: 6 },
  { x: 228, y: 84,  rot: -62,  L: 50, w: 7,   grad: 'gB', bend: -6 },
  { x: 280, y: 128, rot: 108,  L: 50, w: 7.5, grad: 'gA', bend: -7 },
  { x: 292, y: 142, rot: 62,   L: 54, w: 8,   grad: 'gB', bend: 8 },
  { x: 304, y: 153, rot: 96,   L: 46, w: 6.5, grad: 'gU', bend: 6 },
];
const A_shadow = [
  { x: 68,  y: 196, rot: -95,  L: 50, w: 7,   grad: 'gS', bend: -8 },
  { x: 118, y: 180, rot: 70,   L: 52, w: 7.5, grad: 'gS', bend: 7 },
  { x: 180, y: 150, rot: -160, L: 56, w: 8,   grad: 'gS', bend: 6 },
  { x: 250, y: 118, rot: 80,   L: 48, w: 7,   grad: 'gS', bend: -6 },
  { x: 316, y: 88,  rot: -75,  L: 44, w: 6.5, grad: 'gS', bend: 6 },
  { x: 356, y: 70,  rot: 60,   L: 42, w: 6,   grad: 'gS', bend: -5 },
];
const A_olives = [
  { sx: 146, sy: 169, ox: 140, oy: 190, r: 11,   rot: -8 },
  { sx: 150, sy: 167, ox: 158, oy: 193, r: 10,   rot: 12, ripe: true },
  { sx: 168, sy: 158, ox: 174, oy: 180, r: 10.5, rot: 4 },
  { sx: 312, sy: 88,  ox: 306, oy: 110, r: 9.5,  rot: -6 },
  { sx: 316, sy: 86,  ox: 322, oy: 112, r: 8.5,  rot: 14, ripe: true },
];
const A_twigs = [
  [28, 208, 170, 150, 398, 52, 5.4, 1.6],
  [180, 150, 196, 122, 232, 82, 3, 1.2],
  [262, 112, 282, 130, 308, 156, 2.6, 1.1],
];
const A = { viewBox: '0 0 430 240', pal: GROEN, twigs: A_twigs, shadow: A_shadow, leaves: A_leaves, olives: A_olives };

/* ---------- B. Voller & rijker (meer loof, meer olijven — dichter bij de foto) ---------- */
const B = {
  viewBox: '0 0 430 250', pal: GROEN,
  twigs: A_twigs.concat([[110, 184, 118, 208, 142, 228, 2.4, 1]]),
  shadow: A_shadow.concat([
    { x: 90,  y: 190, rot: 100,  L: 46, w: 6.5, grad: 'gS', bend: 6 },
    { x: 214, y: 134, rot: -60,  L: 50, w: 7,   grad: 'gS', bend: -6 },
    { x: 286, y: 100, rot: 55,   L: 46, w: 6.5, grad: 'gS', bend: 5 },
  ]),
  leaves: A_leaves.concat([
    { x: 52,  y: 201, rot: -75,  L: 52, w: 7.5, grad: 'gU', bend: -7 },
    { x: 104, y: 185, rot: 72,   L: 54, w: 8,   grad: 'gB', bend: 7 },
    { x: 140, y: 171, rot: -95,  L: 56, w: 8,   grad: 'gA', bend: -8 },
    { x: 188, y: 148, rot: 66,   L: 58, w: 8.5, grad: 'gB', bend: 8 },
    { x: 236, y: 125, rot: 34,   L: 60, w: 8.5, grad: 'gA', bend: -7 },
    { x: 274, y: 106, rot: -80,  L: 52, w: 7.5, grad: 'gU', bend: 6 },
    { x: 318, y: 86,  rot: 60,   L: 50, w: 7,   grad: 'gB', bend: 7 },
    { x: 120, y: 210, rot: 118,  L: 46, w: 6.5, grad: 'gA', bend: -6 },
    { x: 134, y: 222, rot: 78,   L: 44, w: 6,   grad: 'gU', bend: 5 },
  ]),
  olives: A_olives.concat([
    { sx: 162, sy: 161, ox: 190, oy: 186, r: 9.5, rot: 16 },
    { sx: 240, sy: 123, ox: 236, oy: 148, r: 10,  rot: -6, ripe: true },
    { sx: 244, sy: 121, ox: 254, oy: 150, r: 9,   rot: 10 },
  ]),
};

/* ---------- C. Rustig & minimaal (chic, veel lucht) ---------- */
const C = {
  viewBox: '0 0 390 170', pal: GROEN,
  twigs: [[26, 142, 190, 108, 366, 46, 4.2, 1.4]],
  shadow: [
    { x: 150, y: 118, rot: -140, L: 48, w: 6.5, grad: 'gS', bend: 6 },
    { x: 262, y: 82,  rot: 62,   L: 44, w: 6,   grad: 'gS', bend: -5 },
  ],
  leaves: [
    { x: 58,  y: 136, rot: -136, L: 58, w: 8,   grad: 'gB', bend: 8 },
    { x: 84,  y: 130, rot: 38,   L: 62, w: 8.5, grad: 'gA', bend: -8 },
    { x: 132, y: 120, rot: -118, L: 56, w: 7.5, grad: 'gU', bend: -7 },
    { x: 168, y: 111, rot: 28,   L: 64, w: 9,   grad: 'gA', bend: 8 },
    { x: 216, y: 98,  rot: -128, L: 58, w: 8,   grad: 'gB', bend: 7 },
    { x: 252, y: 86,  rot: 42,   L: 58, w: 8,   grad: 'gA', bend: -7 },
    { x: 300, y: 70,  rot: -108, L: 50, w: 7,   grad: 'gU', bend: 6 },
    { x: 330, y: 60,  rot: 22,   L: 52, w: 7,   grad: 'gB', bend: 6 },
    { x: 358, y: 48,  rot: -26,  L: 46, w: 6.5, grad: 'gA', bend: -5 },
  ],
  olives: [
    { sx: 196, sy: 104, ox: 192, oy: 130, r: 10.5, rot: -6 },
    { sx: 200, sy: 102, ox: 212, oy: 132, r: 9.5,  rot: 12, ripe: true },
  ],
};

/* ---------- D. Boog / guirlande (welft over de titel heen) ---------- */
const D = {
  viewBox: '0 0 460 155', pal: GROEN,
  twigs: [[20, 122, 230, 8, 440, 122, 4.6, 1.4]],
  shadow: [
    { x: 125, y: 78, rot: -68,  L: 46, w: 6.5, grad: 'gS', bend: 6 },
    { x: 230, y: 62, rot: 40,   L: 44, w: 6,   grad: 'gS', bend: -5 },
    { x: 336, y: 79, rot: 62,   L: 46, w: 6.5, grad: 'gS', bend: 5 },
  ],
  leaves: [
    // linkerhelft (tangent ≈ -23° → -6°)
    { x: 54,  y: 103, rot: -64,  L: 54, w: 7.5, grad: 'gB', bend: 8 },
    { x: 87,  y: 90,  rot: 14,   L: 56, w: 8,   grad: 'gA', bend: -8 },
    { x: 125, y: 78,  rot: -56,  L: 52, w: 7.5, grad: 'gU', bend: -6 },
    { x: 159, y: 70,  rot: 20,   L: 58, w: 8,   grad: 'gA', bend: 8 },
    { x: 196, y: 65,  rot: -44,  L: 52, w: 7.5, grad: 'gB', bend: 7 },
    // top
    { x: 230, y: 63,  rot: -22,  L: 50, w: 7,   grad: 'gA', bend: -6 },
    { x: 246, y: 63,  rot: 30,   L: 52, w: 7.5, grad: 'gU', bend: 6 },
    // rechterhelft (tangent ≈ +6° → +23°)
    { x: 280, y: 66,  rot: -18,  L: 54, w: 7.5, grad: 'gB', bend: -7 },
    { x: 301, y: 70,  rot: 52,   L: 56, w: 8,   grad: 'gA', bend: 8 },
    { x: 336, y: 79,  rot: -8,   L: 52, w: 7.5, grad: 'gU', bend: 6 },
    { x: 358, y: 85,  rot: 58,   L: 54, w: 7.5, grad: 'gB', bend: -7 },
    { x: 391, y: 96,  rot: 4,    L: 50, w: 7,   grad: 'gA', bend: 6 },
    { x: 412, y: 104, rot: 64,   L: 48, w: 7,   grad: 'gB', bend: 7 },
    { x: 432, y: 116, rot: 32,   L: 44, w: 6,   grad: 'gA', bend: -5 },
  ],
  olives: [
    { sx: 158, sy: 70,  ox: 152, oy: 96,  r: 10,  rot: -6 },
    { sx: 162, sy: 69,  ox: 172, oy: 98,  r: 9,   rot: 10, ripe: true },
    { sx: 302, sy: 70,  ox: 296, oy: 96,  r: 10,  rot: -8 },
    { sx: 306, sy: 69,  ox: 316, oy: 98,  r: 9,   rot: 12, ripe: true },
  ],
};

/* ---------- E. Hangende tak (valt van boven het beeld in) ---------- */
const E = {
  viewBox: '0 0 250 265', pal: GROEN,
  twigs: [[118, 4, 108, 120, 158, 238, 4.6, 1.4], [116, 62, 88, 92, 66, 132, 2.6, 1]],
  shadow: [
    { x: 116, y: 60,  rot: 120, L: 46, w: 6.5, grad: 'gS', bend: 6 },
    { x: 122, y: 128, rot: 30,  L: 44, w: 6,   grad: 'gS', bend: -5 },
    { x: 136, y: 190, rot: 110, L: 42, w: 6,   grad: 'gS', bend: 5 },
  ],
  leaves: [
    { x: 117, y: 30,  rot: 152, L: 52, w: 7.5, grad: 'gB', bend: -7 },
    { x: 117, y: 46,  rot: 28,  L: 56, w: 8,   grad: 'gA', bend: 8 },
    { x: 117, y: 74,  rot: 132, L: 54, w: 7.5, grad: 'gU', bend: 6 },
    { x: 118, y: 92,  rot: 44,  L: 58, w: 8,   grad: 'gA', bend: -8 },
    { x: 121, y: 118, rot: 148, L: 52, w: 7.5, grad: 'gB', bend: 7 },
    { x: 124, y: 136, rot: 36,  L: 56, w: 8,   grad: 'gA', bend: 7 },
    { x: 129, y: 162, rot: 126, L: 50, w: 7,   grad: 'gU', bend: -6 },
    { x: 134, y: 178, rot: 52,  L: 52, w: 7.5, grad: 'gB', bend: 8 },
    { x: 141, y: 202, rot: 142, L: 46, w: 6.5, grad: 'gA', bend: 6 },
    { x: 147, y: 218, rot: 60,  L: 46, w: 6.5, grad: 'gB', bend: -6 },
    { x: 154, y: 236, rot: 96,  L: 42, w: 6,   grad: 'gA', bend: 5 },
    // zijtwijgje linksonder
    { x: 92,  y: 88,  rot: 178, L: 48, w: 7,   grad: 'gB', bend: -6 },
    { x: 78,  y: 112, rot: 128, L: 46, w: 6.5, grad: 'gU', bend: 6 },
    { x: 68,  y: 128, rot: 158, L: 44, w: 6,   grad: 'gA', bend: -5 },
  ],
  olives: [
    { sx: 120, sy: 100, ox: 104, oy: 122, r: 10.5, rot: -10 },
    { sx: 122, sy: 104, ox: 122, oy: 128, r: 9.5,  rot: 8, ripe: true },
    { sx: 138, sy: 186, ox: 128, oy: 208, r: 9.5,  rot: -8 },
  ],
};

/* ---------- F. Goud-duotone (zelfde compositie als A, brons/champagne) ---------- */
const F = { ...A, pal: GOUD };

/* ---------- schrijven + preview ---------- */

const variants = { A, B, C, D, E, F };
const labels = {
  A: 'A — Origineel (vorige voorbeeld)',
  B: 'B — Voller & rijker (meer loof, 8 olijven)',
  C: 'C — Rustig & minimaal (veel lucht)',
  D: 'D — Boog (welft over de titel)',
  E: 'E — Hangende tak (valt van boven in)',
  F: 'F — Goud-duotone (past bij de gouden accenten)',
};
for (const [k, v] of Object.entries(variants)) writeFileSync(`variant-${k}.svg`, build(v));

const row = (k) => {
  const wide = { A: 300, B: 300, C: 300, D: 330, E: 150, F: 300 }[k];
  return `<div class="vrow">
    <div class="vlabel">${labels[k]}</div>
    <div class="cells">
      <div class="cell cream"><img src="variant-${k}.svg" style="width:${wide}px"></div>
      <div class="cell dark"><img src="variant-${k}.svg" style="width:${wide * .8}px"></div>
    </div>
  </div>`;
};

writeFileSync('variants-preview.html', `<!doctype html><meta charset="utf-8">
<style>
  body { margin:0; font-family: Georgia, serif; background:#fff; }
  .vrow { border-bottom: 1px solid #ddd; }
  .vlabel { padding: 14px 20px 8px; font-size: 17px; color:#333; }
  .cells { display:flex; }
  .cell { flex:1; display:grid; place-items:center; padding: 22px 12px; min-height: 200px; }
  .cream { background:#F7F5F0; }
  .dark { background: linear-gradient(160deg,#3E4B2E,#333F26); }
</style>
${['A','B','C','D','E','F'].map(row).join('')}`);
console.log('variants generated');
