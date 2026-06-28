// 🚕 "Rit door Amsterdam naar je doel": een zwarte Mercedes C-klasse taxi rijdt
// langs de grachtenpanden naar de finishvlag. De auto staat op pct (inkomen ÷ doel),
// de zon/maan volgt het tijdstip. Gedeeld door het Taxi-overzicht.

// Rij grachtenpanden met afwisselende gevels (trap-, klok-, punt-, halsgevel) + verlichte ramen.
function canalHouses() {
  const xs   = [2, 48, 94, 140, 186, 232, 278, 324];
  const tops = [20, 12, 24, 9, 17, 25, 13, 21];
  const w = 38, parts = [];
  for (let i = 0; i < xs.length; i++) {
    const x = xs[i], top = tops[i];
    const lx = x, rx = x + w, cx = x + w / 2, g = i % 4;
    let gable;
    if (g === 0) {        // trapgevel
      gable = `M${lx},${top+10} L${lx},${top+6} L${lx+6},${top+6} L${lx+6},${top+2} L${lx+13},${top+2} L${lx+13},${top-2} L${rx-13},${top-2} L${rx-13},${top+2} L${rx-6},${top+2} L${rx-6},${top+6} L${rx},${top+6} L${rx},${top+10} Z`;
    } else if (g === 1) { // klokgevel
      gable = `M${lx},${top+10} L${lx},${top+4} Q${lx},${top-4} ${cx},${top-4} Q${rx},${top-4} ${rx},${top+4} L${rx},${top+10} Z`;
    } else if (g === 2) { // puntgevel
      gable = `M${lx},${top+10} L${cx},${top-5} L${rx},${top+10} Z`;
    } else {              // halsgevel
      gable = `M${lx},${top+10} L${lx},${top+3} L${lx+8},${top+3} L${lx+8},${top-3} L${rx-8},${top-3} L${rx-8},${top+3} L${rx},${top+3} L${rx},${top+10} Z`;
    }
    parts.push(`<rect class="ir-house" x="${lx}" y="${top+8}" width="${w}" height="${90-(top+8)}"/>`);
    parts.push(`<path class="ir-house" d="${gable}"/>`);
    parts.push(`<circle class="ir-house-hook" cx="${cx}" cy="${top-1}" r="1"/>`);
    for (const wy of [top+15, top+30, top+45]) {
      if (wy > 78) continue;
      parts.push(`<rect class="ir-win" x="${lx+7}" y="${wy}" width="9" height="11" rx="1"/>`);
      parts.push(`<rect class="ir-win" x="${rx-16}" y="${wy}" width="9" height="11" rx="1"/>`);
    }
  }
  return `<svg class="ir-canal" viewBox="0 0 362 90" preserveAspectRatio="none" aria-hidden="true">${parts.join('')}</svg>`;
}

// Klassieke Amsterdamse lantaarnpaal (gloeit 's nachts).
const LAMP = `<svg class="ir-lamp" viewBox="0 0 12 44" aria-hidden="true">
  <rect x="5" y="9" width="2" height="33" fill="#262a30"/>
  <rect x="2.5" y="41" width="7" height="2.4" rx="1" fill="#262a30"/>
  <path d="M3 9 q3 -3 6 0 z" fill="#262a30"/>
  <path d="M3 8 L9 8 L7.6 9.4 L4.4 9.4 Z" fill="#262a30"/>
  <rect class="ir-lantern" x="3.4" y="2.4" width="5.2" height="6" rx="1"/>
  <path d="M3.4 2.6 L6 0 L8.6 2.6 Z" fill="#262a30"/>
</svg>`;

// Geparkeerde zwarte omafiets tegen de gracht.
const BIKE = `<svg class="ir-bike" viewBox="0 0 32 18" aria-hidden="true" fill="none" stroke="#20242a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="7" cy="12" r="5"/>
  <circle cx="25" cy="12" r="5"/>
  <path d="M7 12 L13 12 L19 5 L25 12 M13 12 L17.5 5.5 M15 5 L20 5 M19 5 L22 8"/>
  <path d="M7 12 L10 7" />
</svg>`;

// Zwarte Mercedes C-klasse taxi (zijaanzicht, rijdt naar rechts) met daklicht.
const MERC = `<svg viewBox="0 0 96 44" class="ir-car-svg ir-merc" aria-hidden="true">
  <defs>
    <linearGradient id="mercBody" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#474d56"/><stop offset=".48" stop-color="#272c33"/><stop offset="1" stop-color="#11141a"/>
    </linearGradient>
  </defs>
  <ellipse cx="48" cy="38.5" rx="40" ry="3.2" fill="rgba(0,0,0,.22)"/>
  <rect class="ir-taxisign" x="44" y="5.4" width="12" height="4.6" rx="1.3"/>
  <path class="ir-body" d="M8,33 L8,29 Q8,22 16,22 L80,22 Q90,22 90,29 L90,33 Z" fill="url(#mercBody)"/>
  <path class="ir-cabin" d="M30,22 L39,11 L64,11 L74,22 Z" fill="#1c2027"/>
  <path d="M30,22 L39,11 L64,11 L74,22 Z" fill="none" stroke="#5b626c" stroke-width=".6" opacity=".7"/>
  <rect x="15" y="21.3" width="76" height="1" rx=".5" fill="#cfd4da" opacity=".8"/>
  <path d="M34,20.6 L40.5,12.6 L50,12.6 L50,20.6 Z" fill="#9fc0d4"/>
  <path d="M54,12.6 L63,12.6 L71,20.6 L54,20.6 Z" fill="#9fc0d4"/>
  <path d="M34,20.6 L40.5,12.6 L43,12.6 L37,20.6 Z" fill="#c2dcec" opacity=".5"/>
  <line x1="40" y1="22.6" x2="40" y2="31" stroke="#0c0e12" stroke-width=".7"/>
  <path class="ir-head" d="M84.5,23.2 L90,24.5 L90,26.8 L84.5,26 Z" fill="#fff4c6"/>
  <rect class="ir-tail" x="8.2" y="23.6" width="3.2" height="3.2" rx=".7" fill="#e23a31"/>
  <circle cx="88" cy="29" r="2" fill="none" stroke="#d7dce2" stroke-width=".55"/>
  <path d="M88,29 L88,27.1 M88,29 L86.4,29.9 M88,29 L89.6,29.9" stroke="#d7dce2" stroke-width=".55"/>
  <circle cx="25" cy="32" r="6.4" fill="#15181d"/>
  <g class="ir-wheel">
    <circle cx="25" cy="32" r="3.6" fill="#c2c8cf"/>
    <path d="M25,28.6 L25,35.4 M22,30.3 L28,33.7 M22,33.7 L28,30.3 M21.8,32 L28.2,32" stroke="#2a2e34" stroke-width=".7"/>
    <circle cx="25" cy="32" r="1" fill="#7e848d"/>
  </g>
  <circle cx="71" cy="32" r="6.4" fill="#15181d"/>
  <g class="ir-wheel">
    <circle cx="71" cy="32" r="3.6" fill="#c2c8cf"/>
    <path d="M71,28.6 L71,35.4 M68,30.3 L74,33.7 M68,33.7 L74,30.3 M67.8,32 L74.2,32" stroke="#2a2e34" stroke-width=".7"/>
    <circle cx="71" cy="32" r="1" fill="#7e848d"/>
  </g>
</svg>`;

export function incomeRoad(pct, now = new Date()) {
  const hr = now.getHours() + now.getMinutes() / 60;
  const isNight = hr < 6 || hr >= 21;
  const dayPos = Math.min(1, Math.max(0, (hr - 6) / 15));
  const sunLeft = (8 + dayPos * 82).toFixed(1);
  const sunTop  = Math.max(5, 50 - Math.sin(dayPos * Math.PI) * 42).toFixed(0);
  const carLeft = Math.min(95, Math.max(3, pct));
  const reached = pct >= 100;
  const clouds = isNight
    ? `<span class="ir-cloud" style="--y:14px;--cs:.8;--cd:48s;--cdl:0s"></span>`
    : `<span class="ir-cloud" style="--y:12px;--cs:.9;--cd:42s;--cdl:0s"></span>
       <span class="ir-cloud" style="--y:26px;--cs:.65;--cd:60s;--cdl:-14s"></span>`;
  return `
    <div class="income-road ${isNight ? 'ir-night' : ''} ${reached ? 'ir-win' : ''}">
      <div class="${isNight ? 'ir-moon' : 'ir-sun'}" style="left:${sunLeft}%;top:${sunTop}px"></div>
      ${clouds}
      ${canalHouses()}
      ${LAMP}
      ${BIKE}
      <div class="ir-road"><div class="ir-dashes"></div></div>
      <div class="ir-flag"></div>
      <div class="ir-car" style="left:${carLeft}%"><span class="ir-exhaust"></span>${isNight ? '<span class="ir-beam"></span>' : ''}${MERC}</div>
    </div>`;
}
