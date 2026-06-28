// 🚕 "Weg naar je dagdoel": autootje schuift naar inkomen-tot-nu-toe / dagdoel,
// met de zonnestand van het moment. Schuift mee zodra je inkomen bijvult.
// Gedeeld door het Taxi-overzicht (en eerder het dashboard).
export function incomeRoad(pct, now = new Date()) {
  const hr = now.getHours() + now.getMinutes() / 60;
  const isNight = hr < 6 || hr >= 21;
  const dayPos = Math.min(1, Math.max(0, (hr - 6) / 15));
  const sunLeft = (8 + dayPos * 82).toFixed(1);
  const sunTop  = Math.max(5, 50 - Math.sin(dayPos * Math.PI) * 42).toFixed(0);
  const carLeft = Math.min(95, Math.max(3, pct));
  const reached = pct >= 100;
  const taxi = `<svg viewBox="0 0 60 34" class="ir-car-svg" aria-hidden="true">
    <path d="M9 21 L15 11 H37 L47 21 Z" fill="#f7c948"/>
    <rect x="3" y="19" width="54" height="10" rx="3" fill="#f7c948"/>
    <rect x="24" y="6" width="12" height="5" rx="1.5" fill="#1f2937"/>
    <rect x="16" y="12.5" width="9" height="6.5" rx="1" fill="#cfe8ff"/>
    <rect x="27" y="12.5" width="9" height="6.5" rx="1" fill="#cfe8ff"/>
    <rect x="2.5" y="22" width="6" height="3" rx="1" fill="#e9b104"/>
    <g class="ir-wheel"><circle cx="17" cy="29" r="5" fill="#1f2937"/><circle cx="17" cy="29" r="2" fill="#9aa3ad"/><line x1="17" y1="25" x2="17" y2="33" stroke="#9aa3ad" stroke-width="1"/><line x1="13" y1="29" x2="21" y2="29" stroke="#9aa3ad" stroke-width="1"/></g>
    <g class="ir-wheel"><circle cx="43" cy="29" r="5" fill="#1f2937"/><circle cx="43" cy="29" r="2" fill="#9aa3ad"/><line x1="43" y1="25" x2="43" y2="33" stroke="#9aa3ad" stroke-width="1"/><line x1="39" y1="29" x2="47" y2="29" stroke="#9aa3ad" stroke-width="1"/></g>
  </svg>`;
  const clouds = isNight
    ? `<span class="ir-cloud" style="--y:14px;--cs:.8;--cd:48s;--cdl:0s"></span>`
    : `<span class="ir-cloud" style="--y:12px;--cs:.9;--cd:42s;--cdl:0s"></span>
       <span class="ir-cloud" style="--y:26px;--cs:.65;--cd:60s;--cdl:-14s"></span>`;
  return `
    <div class="income-road ${isNight ? 'ir-night' : ''} ${reached ? 'ir-win' : ''}">
      <div class="${isNight ? 'ir-moon' : 'ir-sun'}" style="left:${sunLeft}%;top:${sunTop}px"></div>
      ${clouds}
      <div class="ir-hills"></div>
      <div class="ir-road"><div class="ir-dashes"></div></div>
      <div class="ir-flag"></div>
      <div class="ir-car" style="left:${carLeft}%"><span class="ir-exhaust"></span>${isNight ? '<span class="ir-beam"></span>' : ''}${taxi}</div>
    </div>`;
}
