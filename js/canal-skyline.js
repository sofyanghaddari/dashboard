// 🏙️ Amsterdam grachten-skyline: jouw stukje stad licht op / wordt volgebouwd
// naarmate je je maanddoel nadert. Donkere panden = nog te verdienen, verlichte
// grachtenpanden met brandende ramen = behaald. Dag/nacht-lucht volgt de klok,
// een bootje vaart over de gracht met weerspiegeling in het water.
// Puur CSS transform/opacity; respecteert prefers-reduced-motion (zie styles.css).
export function canalSkyline(pct, now = new Date()) {
  const hr = now.getHours() + now.getMinutes() / 60;
  let phase;
  if      (hr < 5.5 || hr >= 21) phase = 'night';
  else if (hr < 8)               phase = 'dawn';
  else if (hr < 18.5)            phase = 'day';
  else if (hr < 20)              phase = 'dusk';
  else                           phase = 'night';

  const palette = ['#7d3b2e', '#8a4636', '#6b4a2f', '#3f5a3a', '#5a4334', '#774033', '#46506a', '#86553a'];
  const gables  = ['trap', 'punt', 'klok', 'hals'];
  const N = 8;
  const p = Math.max(0, Math.min(100, pct));
  const litCount = Math.round(p / 100 * N);

  let row = '';
  for (let i = 0; i < N; i++) {
    const h = 44 + ((i * 37) % 5) * 6;        // 44..68px
    const w = 26 + ((i * 53) % 4) * 4;        // 26..38px
    const color = palette[i % palette.length];
    const gable = gables[(i * 7) % gables.length];
    const lit = i < litCount;
    const rows = Math.max(2, Math.min(4, Math.round(h / 18)));
    let wins = '';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < 2; c++) {
        const on = lit && (((i + r * 2 + c) * 13) % 5 !== 0);
        wins += `<i class="cw${on ? ' on' : ''}"></i>`;
      }
    }
    row += `<div class="ch ch-${gable}${lit ? ' lit' : ''}" style="--w:${w}px;--h:${h}px;--c:${color}"><div class="ch-windows">${wins}</div></div>`;
  }

  const orb = phase === 'night' ? '<div class="cs-moon"></div>' : '<div class="cs-sun"></div>';
  const stars = (phase === 'night' || phase === 'dusk')
    ? Array.from({ length: 7 }, (_, i) => `<i class="cs-star" style="left:${(i * 14 + 6) % 92}%;top:${(i * 23 + 5) % 34}px;animation-delay:${(i % 4) * 0.6}s"></i>`).join('')
    : '';

  return `<div class="canal-scene cs-${phase}" role="img" aria-label="${p}% van je maanddoel — ${litCount} van ${N} grachtenpanden verlicht">
    ${orb}${stars}
    <div class="cs-houses">${row}</div>
    <div class="cs-quay"></div>
    <div class="cs-water">
      <div class="cs-reflection"><div class="cs-houses">${row}</div></div>
      <div class="cs-shimmer"></div>
      <div class="cs-boat"><span class="cs-boat-light"></span></div>
    </div>
  </div>`;
}
