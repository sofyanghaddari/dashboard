// Bouwt het footer-merk als inline SVG: witte "AJAR" (Fraunces) + groen vector-olijfje op de J.
// Vervangt de platgeslagen wit-gefilterde bitmap. Palet = zelfde olijf als de CTA-tak.
import { writeFileSync } from 'fs';

// tuneables
const OX = 74, OY = 25, S = 1.02, ROT = 0;      // olijf-positie/schaal boven de J
const wordX = 2, wordY = 58, fs = 52;

const oliveDefs = `
  <radialGradient id="fbmOlive" cx=".36" cy=".28" r=".95">
    <stop offset="0" stop-color="#C9C878"/><stop offset=".45" stop-color="#9BA04F"/><stop offset="1" stop-color="#6E7736"/>
  </radialGradient>
  <linearGradient id="fbmLeafA" x1="0" y1="1" x2=".3" y2="0">
    <stop offset="0" stop-color="#5A6E3B"/><stop offset="1" stop-color="#8CA05E"/>
  </linearGradient>
  <linearGradient id="fbmLeafB" x1="0" y1="1" x2=".3" y2="0">
    <stop offset="0" stop-color="#6E8340"/><stop offset="1" stop-color="#9AAD6A"/>
  </linearGradient>`;

// olijf-cluster in lokaal stelsel (basis 0,0), naar boven-rechts wijzend zoals in het merk
const olive = `<g class="fbm-olive" transform="translate(${OX} ${OY}) scale(${S}) rotate(${ROT})">
  <path d="M 3.6 -0.3 C 9.6 -0.9 16.4 0.4 22.4 3.4 Q 23.9 4.3 22.6 5.3 C 15.6 2.0 8.8 0.6 3.6 0.3 Z" fill="#B8934A" opacity=".92"/>
  <path d="M 15.1 -0.3 C 9.9 -6.0 6.8 -14.8 7.4 -24.1 C 12.5 -16.8 14.8 -8.0 15.1 -0.3 Z" fill="url(#fbmLeafA)"/>
  <path d="M 14.6 -2.0 Q 9.9 -10.7 8.0 -22.4" fill="none" stroke="#B8C48A" stroke-width="0.6" stroke-linecap="round" opacity=".75"/>
  <path d="M 15.1 -0.3 C 15.6 -8.8 17.3 -18.2 21.3 -27.0 C 22.7 -15.9 19.9 -6.0 15.1 -0.3 Z" fill="url(#fbmLeafB)"/>
  <path d="M 15.2 -2.0 Q 17.6 -12.8 20.6 -25.3" fill="none" stroke="#C3D096" stroke-width="0.6" stroke-linecap="round" opacity=".75"/>
  <g transform="rotate(-14)">
    <ellipse cx="0" cy="0" rx="8.2" ry="6.8" fill="url(#fbmOlive)"/>
    <ellipse cx="-3.0" cy="-2.6" rx="2.1" ry="1.3" fill="#F3F0E0" opacity=".7"/>
  </g>
</g>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" class="footer-brand-mark" viewBox="0 0 214 72" role="img" aria-label="AJAR">
  <defs>${oliveDefs}</defs>
  <text x="${wordX}" y="${wordY}" class="fbm-word" fill="#F3F0E8" font-size="${fs}">AJAR</text>
  ${olive}
</svg>`;

writeFileSync('footer-mark.svg', svg);
// inline (één regel, apostrof-vrij zodat het in main.js in enkele quotes past)
writeFileSync('footer-mark-inline.txt', svg.replace(/\n\s*/g, ''));

// preview op de echte footer-gradient
writeFileSync('footer-mark-preview.html', `<!doctype html><meta charset="utf-8">
<style>
  @font-face { font-family:'Fraunces'; src:url('http://localhost:8000/ajar/assets/fonts/fraunces-latin.woff2') format('woff2'); font-weight:100 900; }
  body{margin:0;background:linear-gradient(170deg,#3E4B2E,#333F26);padding:60px}
  .footer-brand-mark{height:52px;width:auto;display:block}
  .fbm-word{font-family:'Fraunces',serif;font-weight:500;letter-spacing:.5px}
  .lbl{color:#999;font-family:sans-serif;font-size:12px;margin-top:8px}
</style>
${svg}
<div class="lbl">footer-merk (nieuw)</div>`);
console.log('mark built OX', OX, 'OY', OY, 'S', S);
