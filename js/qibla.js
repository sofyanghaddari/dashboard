// Qibla kompas v3 — precise direction to the Kaaba with smooth rAF animation
const KAABA = { lat: 21.4225, lon: 39.8262 };
const R2D   = 180 / Math.PI;
const D2R   = Math.PI / 180;

function bearingLabel(deg) {
  const dirs = ['N','NO','O','ZO','Z','ZW','W','NW'];
  return dirs[Math.round(deg / 45) % 8];
}

function storedLocation() {
  try {
    const l = JSON.parse(localStorage.getItem('userLocation') || 'null');
    if (l && typeof l.lat === 'number' && typeof l.lon === 'number') return l;
  } catch {}
  return { lat: 52.3676, lon: 4.9041 }; // Amsterdam centrum fallback
}

// ── Dashboard-kaart ────────────────────────────────────────────────────────
// Compacte, statische voorvertoning die het volledige kompas opent bij tik.

function buildCardDial() {
  const C = 50, OR = 46;
  let ticks = '';
  for (let i = 0; i < 360; i += 15) {
    const card = i % 90 === 0;
    const len  = card ? 7 : 4;
    const sw   = card ? 1.6 : 0.8;
    const col  = card ? '#d8b86a' : '#46423a';
    const rad  = (i - 90) * D2R;
    const x1 = C + OR * Math.cos(rad),         y1 = C + OR * Math.sin(rad);
    const x2 = C + (OR - len) * Math.cos(rad), y2 = C + (OR - len) * Math.sin(rad);
    ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${col}" stroke-width="${sw}" stroke-linecap="round"/>`;
  }
  return `<svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="qlc-bg" cx="40%" cy="34%" r="80%">
        <stop offset="0%" stop-color="#26241f"/><stop offset="60%" stop-color="#161513"/><stop offset="100%" stop-color="#0a0a09"/>
      </radialGradient>
      <linearGradient id="qlc-needle" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#9a7820"/><stop offset="48%" stop-color="#f2dca0"/><stop offset="100%" stop-color="#9a7820"/>
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="49" fill="url(#qlc-bg)" stroke="#3a352b" stroke-width="1"/>
    ${ticks}
    <text x="50" y="17" text-anchor="middle" fill="#ecd49a" font-size="9" font-weight="700" font-family="-apple-system,sans-serif">N</text>
    <g id="qlc-needle-g" style="transform-box:view-box;transform-origin:50px 50px;transition:transform 1s cubic-bezier(.2,.7,.2,1)">
      <polygon points="50,12 45,50 55,50" fill="url(#qlc-needle)"/>
      <polygon points="50,88 46,50 54,50" fill="#3a362f"/>
      <rect x="44.5" y="6" width="11" height="9.5" rx="1.4" fill="#0b0a09" stroke="#d8b86a" stroke-width="1"/>
      <rect x="44.5" y="8.4" width="11" height="1.5" fill="#d8b86a" opacity=".8"/>
    </g>
    <circle cx="50" cy="50" r="5.5" fill="#0d0c0b" stroke="#2a2722" stroke-width="1"/>
    <circle cx="50" cy="50" r="3.4" fill="#dcb464"/>
  </svg>`;
}

export function qiblaCard() {
  return `
    <div class="card qibla-card" id="qibla-card" role="button" tabindex="0">
      <div class="ql-card-dial" id="ql-card-dial">${buildCardDial()}</div>
      <div class="ql-card-info">
        <h2 class="card-title">Qibla — richting Mekka</h2>
        <div class="ql-card-dir"><span id="ql-card-deg">—</span><span id="ql-card-name" class="ql-card-name"></span></div>
        <div class="ql-card-dist" id="ql-card-dist"></div>
        <div class="ql-card-hint">Tik om je te richten met het kompas <span class="ql-card-arrow">→</span></div>
      </div>
    </div>`;
}

export function initQiblaCard(container) {
  const card = container.querySelector('#qibla-card');
  if (!card) return;

  const apply = (lat, lon) => {
    const q    = calcQibla(lat, lon);
    const dist = calcDistance(lat, lon);
    const degEl  = card.querySelector('#ql-card-deg');
    const nameEl = card.querySelector('#ql-card-name');
    const distEl = card.querySelector('#ql-card-dist');
    const needle = card.querySelector('#qlc-needle-g');
    if (degEl)  degEl.textContent  = Math.round(q) + '°';
    if (nameEl) nameEl.textContent = bearingLabel(q);
    if (distEl) distEl.textContent = dist.toLocaleString('nl-NL') + ' km hemelsbreed';
    if (needle) requestAnimationFrame(() => { needle.style.transform = `rotate(${q}deg)`; });
  };

  const loc = storedLocation();
  apply(loc.lat, loc.lon);
  // Ververs de locatie alléén stil als toestemming al eerder is gegeven —
  // nooit een permissie-prompt bij het laden van het dashboard.
  if (navigator.geolocation && navigator.permissions?.query) {
    navigator.permissions.query({ name: 'geolocation' }).then(p => {
      if (p.state !== 'granted') return;
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          localStorage.setItem('userLocation', JSON.stringify({ lat: coords.latitude, lon: coords.longitude }));
          apply(coords.latitude, coords.longitude);
        },
        () => {}, { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
      );
    }).catch(() => {});
  }

  const open = () => openQibla();
  card.onclick = open;
  card.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } };
}

function calcQibla(lat, lon) {
  const φ1 = lat * D2R, φ2 = KAABA.lat * D2R;
  const Δλ = (KAABA.lon - lon) * D2R;
  const y  = Math.sin(Δλ) * Math.cos(φ2);
  const x  = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * R2D) + 360) % 360;
}

function calcDistance(lat, lon) {
  const φ1 = lat * D2R, φ2 = KAABA.lat * D2R;
  const Δφ = (KAABA.lat - lat) * D2R;
  const Δλ = (KAABA.lon  - lon) * D2R;
  const a  = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// ── SVG builders ─────────────────────────────────────────────────────────────

function buildRingSVG() {
  const C = 150, OR = 143;
  let ticks = '';
  for (let i = 0; i < 360; i += 2) {
    const isCard = i % 90 === 0;
    const is30   = i % 30 === 0;
    const is10   = i % 10 === 0;
    const is5    = i % 5 === 0;
    const len    = isCard ? 16 : is30 ? 12 : is10 ? 8 : is5 ? 5 : 3;
    const sw     = isCard ? 2   : is30 ? 1.4 : is10 ? 1 : 0.6;
    const col    = isCard ? '#d8b86a' : is30 ? '#54504a' : is10 ? '#3a3833' : '#262420';
    const rad    = (i - 90) * D2R;
    const x1 = C + OR * Math.cos(rad),         y1 = C + OR * Math.sin(rad);
    const x2 = C + (OR - len) * Math.cos(rad), y2 = C + (OR - len) * Math.sin(rad);
    ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${col}" stroke-width="${sw}" stroke-linecap="round"/>`;
  }

  const labels = [
    { a:0,   t:'N',  r:OR-30, sz:20, fw:600, c:'#ecd49a' },
    { a:45,  t:'NO', r:OR-25, sz:9.5, fw:500, c:'#615c54' },
    { a:90,  t:'O',  r:OR-26, sz:13, fw:500, c:'#938d83' },
    { a:135, t:'ZO', r:OR-25, sz:9.5, fw:500, c:'#54504a' },
    { a:180, t:'Z',  r:OR-26, sz:13, fw:500, c:'#938d83' },
    { a:225, t:'ZW', r:OR-25, sz:9.5, fw:500, c:'#54504a' },
    { a:270, t:'W',  r:OR-26, sz:13, fw:500, c:'#938d83' },
    { a:315, t:'NW', r:OR-25, sz:9.5, fw:500, c:'#54504a' },
  ];
  const lblSVG = labels.map(({ a, t, r, sz, fw, c }) => {
    const rad = (a - 90) * D2R;
    const x = C + r * Math.cos(rad), y = C + r * Math.sin(rad) + sz * 0.36;
    return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" fill="${c}" font-size="${sz}" font-weight="${fw}" font-family="-apple-system,BlinkMacSystemFont,sans-serif" letter-spacing=".5">${t}</text>`;
  }).join('');

  const degNums = [30,60,120,150,210,240,300,330].map(deg => {
    const rad = (deg - 90) * D2R;
    const x = C + (OR - 30) * Math.cos(rad), y = C + (OR - 30) * Math.sin(rad) + 3.4;
    return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" fill="#3b3933" font-size="7.5" font-weight="500" font-family="-apple-system,sans-serif">${deg}</text>`;
  }).join('');

  // Noord-markering: subtiel gouden bolletje net binnen de ring
  const nRad = (0 - 90) * D2R;
  const nx = C + (OR - 9) * Math.cos(nRad), ny = C + (OR - 9) * Math.sin(nRad);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
    <defs>
      <radialGradient id="ql-rg" cx="42%" cy="36%" r="78%">
        <stop offset="0%"   stop-color="#24221e"/>
        <stop offset="55%"  stop-color="#161513"/>
        <stop offset="88%"  stop-color="#0d0c0b"/>
        <stop offset="100%" stop-color="#070706"/>
      </radialGradient>
      <radialGradient id="ql-sheen" cx="50%" cy="50%" r="50%">
        <stop offset="0%"  stop-color="rgba(0,0,0,0)"/>
        <stop offset="78%" stop-color="rgba(0,0,0,0)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,.55)"/>
      </radialGradient>
    </defs>
    <circle cx="${C}" cy="${C}" r="${OR+3}" fill="url(#ql-rg)"/>
    <circle cx="${C}" cy="${C}" r="${OR+2.5}" fill="none" stroke="#3a352b" stroke-width="1" opacity=".6"/>
    <circle cx="${C}" cy="${C}" r="${OR-23}" fill="none" stroke="#1d1b17" stroke-width="1"/>
    ${ticks}${degNums}${lblSVG}
    <circle cx="${nx.toFixed(1)}" cy="${ny.toFixed(1)}" r="2.4" fill="#d8b86a"/>
    <circle cx="${C}" cy="${C}" r="${OR+3}" fill="url(#ql-sheen)"/>
  </svg>`;
}

function buildNeedleSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
    <defs>
      <linearGradient id="ql-blade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stop-color="#8a6a18"/>
        <stop offset="46%"  stop-color="#f2dca0"/>
        <stop offset="54%"  stop-color="#e6c878"/>
        <stop offset="100%" stop-color="#9a7820"/>
      </linearGradient>
      <linearGradient id="ql-spine" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="#fff4d6"/>
        <stop offset="100%" stop-color="#e6c878" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="ql-tail" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stop-color="#2c2a26"/>
        <stop offset="50%"  stop-color="#46423a"/>
        <stop offset="100%" stop-color="#2c2a26"/>
      </linearGradient>
      <radialGradient id="ql-hub" cx="40%" cy="35%" r="70%">
        <stop offset="0%"   stop-color="#fff2cf"/>
        <stop offset="55%"  stop-color="#dcb464"/>
        <stop offset="100%" stop-color="#9a7820"/>
      </radialGradient>
    </defs>

    <!-- Zuid-staart (gedempt, voor balans) -->
    <polygon points="150,150 142,150 150,214 158,150" fill="url(#ql-tail)"/>

    <!-- Noord-blad (gouden naald naar Mekka) -->
    <polygon points="150,40 141,150 159,150" fill="url(#ql-blade)"/>
    <polygon points="150,46 150,150 154.5,150" fill="#7a5c12" opacity=".35"/>
    <polygon points="150,40 147,150 150,150" fill="url(#ql-spine)" opacity=".9"/>

    <!-- Kaäba-embleem boven de punt -->
    <g>
      <rect x="139" y="16" width="22" height="19" rx="2.4" fill="#0b0a09" stroke="#d8b86a" stroke-width="1.6"/>
      <rect x="139" y="20.5" width="22" height="2.4" fill="#d8b86a" opacity=".85"/>
      <rect x="146.5" y="26" width="7" height="9" rx="1" fill="#1c1306" stroke="#b89248" stroke-width=".8"/>
      <circle cx="150" cy="13" r="1.6" fill="#f2dca0"/>
    </g>

    <!-- Draaipunt (gelaagde hub) -->
    <circle cx="150" cy="150" r="13" fill="#0d0c0b" stroke="#2a2722" stroke-width="1.5"/>
    <circle cx="150" cy="150" r="8.5" fill="url(#ql-hub)"/>
    <circle cx="150" cy="150" r="8.5" fill="none" stroke="#fff2cf" stroke-width=".6" opacity=".5"/>
    <circle cx="147.5" cy="147.5" r="2.4" fill="#fff7e4" opacity=".75"/>
  </svg>`;
}

// ── CSS keyframes (injected once per session) ─────────────────────────────────

function injectStyles() {
  if (document.getElementById('ql-styles')) return;
  const s = document.createElement('style');
  s.id = 'ql-styles';
  s.textContent = `
    #ql-modal  { animation: ql-open .3s cubic-bezier(.2,0,.1,1) both; }
    #ql-inner  { animation: ql-rise .38s cubic-bezier(.25,0,.1,1) .06s both; }
    #ql-infobar { animation: ql-rise .38s cubic-bezier(.25,0,.1,1) .18s both; }
    @keyframes ql-open { from{opacity:0} to{opacity:1} }
    @keyframes ql-rise { from{opacity:0;transform:translateY(26px) scale(.97)} to{opacity:1;transform:none} }

    @keyframes ql-needle-pulse {
      0%,100%{ filter:drop-shadow(0 0 7px rgba(232,201,122,.85)) }
      50%    { filter:drop-shadow(0 0 26px rgba(232,201,122,1)) drop-shadow(0 0 44px rgba(201,168,76,.6)) }
    }
    @keyframes ql-glow-breathe { 0%,100%{opacity:.65} 50%{opacity:1} }
    @keyframes ql-status-in    { from{opacity:0;transform:translateY(5px)scale(.97)} to{opacity:1;transform:none} }
    @keyframes ql-spark        { 0%{opacity:0;transform:scale(0)rotate(0deg)} 28%{opacity:1} 100%{opacity:0;transform:scale(2.2)rotate(200deg)} }
    @keyframes ql-approach-glow{
      0%,100%{ filter:drop-shadow(0 0 5px rgba(232,201,122,.55)) }
      50%    { filter:drop-shadow(0 0 13px rgba(232,201,122,.85)) }
    }

    #ql-needle { transition: filter .4s ease; }
    .ql-aligned  #ql-needle { animation: ql-needle-pulse 1.8s ease-in-out infinite !important; transition:none; }
    .ql-aligned  #ql-glow   { animation: ql-glow-breathe 1.8s ease-in-out infinite; }
    .ql-approach #ql-needle { animation: ql-approach-glow 1.4s ease-in-out infinite; }
    .ql-status-anim { animation: ql-status-in .28s ease both; }
    .ql-spark-el {
      position:absolute; pointer-events:none; color:#e8c97a;
      animation: ql-spark .95s ease-out forwards;
    }
    #ql-calib { animation: ql-open .6s ease 5s both; opacity:0; }

    /* ── Lichtstraal naar Mekka (verschijnt bij uitlijning) ── */
    #ql-beam {
      position:absolute; left:50%; top:-26px; width:46px; height:188px;
      transform:translateX(-50%) scaleY(0); transform-origin:bottom center;
      background:linear-gradient(to top, rgba(232,201,122,.55), rgba(232,201,122,.14) 55%, transparent);
      filter:blur(7px); opacity:0; pointer-events:none; border-radius:50% 50% 0 0;
      transition:opacity .5s ease, transform .6s cubic-bezier(.2,.7,.2,1);
    }
    .ql-aligned #ql-beam { opacity:1; transform:translateX(-50%) scaleY(1); animation:ql-beam-flicker 2.2s ease-in-out infinite; }
    @keyframes ql-beam-flicker { 0%,100%{opacity:.85} 50%{opacity:1} }

    /* ── Lock-ringen die naar buiten uitdijen op het moment van uitlijning ── */
    .ql-lock-ring {
      position:absolute; inset:0; border-radius:50%; pointer-events:none;
      border:1.5px solid rgba(232,201,122,.7);
      animation:ql-lock-ring 1.1s cubic-bezier(.15,.6,.25,1) forwards;
    }
    @keyframes ql-lock-ring {
      0%   { transform:scale(.82); opacity:.9 }
      100% { transform:scale(1.42); opacity:0 }
    }
    /* gouden stofdeeltjes (drijven op i.p.v. weg-spinnen) */
    @keyframes ql-dust {
      0%   { opacity:0; transform:translateY(0) scale(.4) }
      22%  { opacity:1 }
      100% { opacity:0; transform:translateY(-46px) scale(1.05) }
    }
    .ql-dust-el { position:absolute; pointer-events:none; color:#f2dca0; animation:ql-dust 1.6s ease-out forwards; }
    .ql-target-tri { transition:filter .5s ease, transform .4s ease; }
    .ql-aligned-tri .ql-target-tri { filter:drop-shadow(0 0 16px rgba(126,207,126,.9)) !important; transform:translateY(2px) scale(1.12); }

    @media (prefers-reduced-motion: reduce) {
      #ql-needle, .ql-aligned #ql-needle, .ql-aligned #ql-glow, .ql-approach #ql-needle,
      #ql-beam, .ql-lock-ring, .ql-dust-el { animation:none !important; }
    }
  `;
  document.head.appendChild(s);
}

function spawnSparkles(container) {
  // Gouden stofdeeltjes die zacht opstijgen rond het kompas.
  const C = 150;
  const chars = ['✦','✧','·','⟡','✶'];
  for (let i = 0; i < 10; i++) {
    const sp = document.createElement('div');
    sp.className = 'ql-dust-el';
    const angle = (i / 10) * 360 + Math.random() * 30;
    const r = 60 + Math.random() * 60;
    sp.style.cssText = `left:${(C + r * Math.cos(angle * D2R) - 6).toFixed(1)}px;top:${(C + r * Math.sin(angle * D2R) - 6).toFixed(1)}px;animation-delay:${(i * 0.06).toFixed(2)}s;font-size:${(8+Math.random()*8).toFixed(0)}px`;
    sp.textContent = chars[i % chars.length];
    container.appendChild(sp);
    setTimeout(() => sp.remove(), 1800 + i * 70);
  }
}

function spawnLockRings(wrap) {
  // Twee concentrische ringen die naar buiten uitdijen op het moment van uitlijning.
  for (let i = 0; i < 2; i++) {
    const ring = document.createElement('div');
    ring.className = 'ql-lock-ring';
    ring.style.animationDelay = `${i * 0.16}s`;
    wrap.appendChild(ring);
    setTimeout(() => ring.remove(), 1400 + i * 160);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

export async function openQibla() {
  // iOS 13+: vraag kompas-permissie aan vóór DOM-manipulatie (user-gesture context)
  let compassOk = true;
  if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
    try {
      compassOk = (await DeviceOrientationEvent.requestPermission()) === 'granted';
    } catch { compassOk = false; }
  }

  injectStyles();

  const backdrop = document.createElement('div');
  backdrop.id = 'ql-modal';
  backdrop.style.cssText = 'position:fixed;inset:0;z-index:9999;background:radial-gradient(120% 80% at 50% 8%,#1a1814 0%,#0e0d0b 46%,#060605 100%);display:flex;flex-direction:column;align-items:center;padding-top:env(safe-area-inset-top,0);overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,sans-serif';

  backdrop.innerHTML = `
    <div id="ql-inner" style="width:100%;max-width:420px;height:100%;display:flex;flex-direction:column;padding:14px 18px env(safe-area-inset-bottom,22px);box-sizing:border-box">

      <!-- Header -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;flex-shrink:0">
        <div>
          <div style="font-size:1.05rem;font-weight:700;color:#f5f0e8;letter-spacing:-.01em;display:flex;align-items:center;gap:7px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><circle cx="12" cy="12" r="8.4"/><path d="M15.2 8.8l-1.7 4.7-4.7 1.7 1.7-4.7z"/></svg>Qibla kompas</div>
          <div id="ql-loc" style="font-size:.71rem;color:#404040;margin-top:3px">Locatie bepalen…</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
          <!-- Nauwkeurigheids-indicator (iOS webkitCompassAccuracy) -->
          <div id="ql-acc" style="display:flex;align-items:center;gap:4px;opacity:0;transition:opacity .6s">
            <div id="ql-acc-dot" style="width:7px;height:7px;border-radius:50%;background:#333;transition:background .5s,box-shadow .5s"></div>
            <span id="ql-acc-txt" style="font-size:.65rem;color:#444"></span>
          </div>
          <button id="ql-x" style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.08);color:#999;width:32px;height:32px;border-radius:50%;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;flex-shrink:0">×</button>
        </div>
      </div>

      <!-- Kompas -->
      <div style="display:flex;flex-direction:column;align-items:center;flex:1;justify-content:center;gap:5px">

        <!-- Doeldriehoek (vast boven) -->
        <div class="ql-target-tri" style="width:0;height:0;border-left:11px solid transparent;border-right:11px solid transparent;border-top:17px solid #c9a84c;filter:drop-shadow(0 0 10px rgba(201,168,76,.65));margin-bottom:-4px;flex-shrink:0"></div>

        <!-- Kompas container -->
        <div id="ql-wrap" style="position:relative;width:300px;height:300px;flex-shrink:0">
          <!-- Lichtstraal naar Mekka -->
          <div id="ql-beam"></div>
          <!-- Glow ring -->
          <div id="ql-glow" style="position:absolute;inset:-24px;border-radius:50%;pointer-events:none;opacity:0;transition:opacity .7s ease;background:radial-gradient(circle,transparent 55%,rgba(201,168,76,.2) 100%);box-shadow:0 0 70px 12px rgba(201,168,76,.14)"></div>

          <div id="ql-ring"   style="position:absolute;inset:0;will-change:transform">${buildRingSVG()}</div>
          <div id="ql-needle" style="position:absolute;inset:0;will-change:transform">${buildNeedleSVG()}</div>

          <!-- Sparkle container -->
          <div id="ql-sparks" style="position:absolute;inset:0;overflow:hidden;border-radius:50%;pointer-events:none"></div>

          <!-- Midden-label -->
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;gap:1px">
            <div id="ql-center" style="font-size:1.95rem;font-weight:200;color:#e8c97a;letter-spacing:-.03em;font-variant-numeric:tabular-nums;line-height:1">—</div>
            <div style="font-size:.58rem;color:#333;letter-spacing:.16em;text-transform:uppercase">Qibla</div>
          </div>
        </div>

        <!-- Status -->
        <div id="ql-status" style="font-size:.8rem;color:#555;text-align:center;min-height:22px;padding:0 16px;margin-top:2px"></div>

        <!-- Kalibratietip (verschijnt na 5s) -->
        <div id="ql-calib" style="font-size:.7rem;color:#343434;text-align:center;line-height:1.6;padding:0 20px">
          Kompas niet stabiel? Beweeg je telefoon in een <strong style="color:#484848">∞ figuur</strong>
        </div>
      </div>

      <!-- Info balk -->
      <div id="ql-infobar" style="flex-shrink:0;margin-top:8px">
        <div style="display:grid;grid-template-columns:1fr 1px 1fr 1px 1fr;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.055);border-radius:18px;overflow:hidden;margin-bottom:8px">
          <div style="text-align:center;padding:12px 4px">
            <div id="ql-dist" style="font-size:.95rem;font-weight:600;color:#f5f0e8;font-variant-numeric:tabular-nums">—</div>
            <div style="font-size:.59rem;color:#3e3e3e;margin-top:2px;letter-spacing:.06em;text-transform:uppercase">km Mekka</div>
          </div>
          <div style="background:rgba(255,255,255,.055)"></div>
          <div style="text-align:center;padding:12px 4px">
            <div id="ql-qval" style="font-size:.95rem;font-weight:600;color:#c9a84c;font-variant-numeric:tabular-nums">—</div>
            <div style="font-size:.59rem;color:#3e3e3e;margin-top:2px;letter-spacing:.06em;text-transform:uppercase">Qibla richting</div>
          </div>
          <div style="background:rgba(255,255,255,.055)"></div>
          <div style="text-align:center;padding:12px 4px">
            <div id="ql-hval" style="font-size:.95rem;font-weight:600;color:#f5f0e8;font-variant-numeric:tabular-nums">—</div>
            <div style="font-size:.59rem;color:#3e3e3e;margin-top:2px;letter-spacing:.06em;text-transform:uppercase">Richting jij</div>
          </div>
        </div>
        <p style="font-size:.67rem;color:#2a2a2a;text-align:center;line-height:1.6;margin:0">
          Draai je totdat de gouden pijl omhoog wijst naar het driehoekje ▲
        </p>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);

  const ringEl   = backdrop.querySelector('#ql-ring');
  const needleEl = backdrop.querySelector('#ql-needle');
  const statusEl = backdrop.querySelector('#ql-status');
  const locEl    = backdrop.querySelector('#ql-loc');
  const distEl   = backdrop.querySelector('#ql-dist');
  const qvalEl   = backdrop.querySelector('#ql-qval');
  const hvalEl   = backdrop.querySelector('#ql-hval');
  const centerEl = backdrop.querySelector('#ql-center');
  const glowEl   = backdrop.querySelector('#ql-glow');
  const accEl    = backdrop.querySelector('#ql-acc');
  const accDot   = backdrop.querySelector('#ql-acc-dot');
  const accTxt   = backdrop.querySelector('#ql-acc-txt');
  const sparksEl = backdrop.querySelector('#ql-sparks');
  const wrapEl   = backdrop.querySelector('#ql-wrap');

  // ── State ──────────────────────────────────────────────────
  let qibla        = null;
  let prevH        = null;
  let targetRing   = 0;
  let targetNeedle = 0;
  let curRing      = 0;
  let curNeedle    = 0;
  let rafId        = null;
  let watchId      = null;
  let orientHnd    = null;
  let absHeard     = false;
  let wasAligned   = false;
  let wasApproach  = false;
  let lastSparkTime = 0;

  function setStatus(text, color = '#555') {
    if (statusEl.textContent === text) return;
    statusEl.style.color = color;
    statusEl.textContent = text;
    statusEl.classList.remove('ql-status-anim');
    void statusEl.offsetWidth;
    statusEl.classList.add('ql-status-anim');
  }

  function cleanup() {
    backdrop.remove();
    document.getElementById('ql-styles')?.remove();
    if (rafId)          cancelAnimationFrame(rafId);
    if (watchId != null) navigator.geolocation.clearWatch(watchId);
    if (orientHnd) {
      window.removeEventListener('deviceorientationabsolute', orientHnd, true);
      window.removeEventListener('deviceorientation',         orientHnd, true);
    }
  }
  backdrop.querySelector('#ql-x').onclick = cleanup;

  // ── rAF animation loop (smooth lerp at 60fps) ─────────────
  function rafLoop() {
    const LERP = 0.175;
    curRing    += (targetRing    - curRing)    * LERP;
    curNeedle  += (targetNeedle  - curNeedle)  * LERP;

    ringEl.style.transform   = `rotate(${curRing.toFixed(3)}deg)`;
    needleEl.style.transform = `rotate(${curNeedle.toFixed(3)}deg)`;

    if (qibla !== null && prevH !== null) {
      const mod  = ((curNeedle % 360) + 360) % 360;
      const diff = mod > 180 ? 360 - mod : mod;

      const aligned  = diff < 5;
      const approach = diff < 20 && !aligned;

      if (aligned !== wasAligned) {
        wasAligned = aligned;
        if (aligned) {
          wrapEl.classList.add('ql-aligned');
          wrapEl.classList.remove('ql-approach');
          backdrop.classList.add('ql-aligned-tri');
          glowEl.style.opacity = '1';
          spawnLockRings(wrapEl);
          setStatus('Je wijst naar Mekka', '#7ecf7e');
          if (navigator.vibrate) navigator.vibrate([35, 55, 110]);
        } else {
          wrapEl.classList.remove('ql-aligned');
          backdrop.classList.remove('ql-aligned-tri');
          glowEl.style.opacity = '0';
          setStatus('Draai jezelf totdat de pijl omhoog wijst', '#555');
        }
      }

      if (!aligned && approach !== wasApproach) {
        wasApproach = approach;
        if (approach) wrapEl.classList.add('ql-approach');
        else          wrapEl.classList.remove('ql-approach');
      }

      if (aligned && Date.now() - lastSparkTime > 2000) {
        lastSparkTime = Date.now();
        spawnSparkles(sparksEl);
      }
    }

    rafId = requestAnimationFrame(rafLoop);
  }
  rafId = requestAnimationFrame(rafLoop);

  // ── Heading update ─────────────────────────────────────────
  function onHeading(rawH, accuracy) {
    const h = ((rawH % 360) + 360) % 360;
    hvalEl.textContent = Math.round(h) + '°';

    if (accuracy != null && accuracy >= 0) {
      accEl.style.opacity = '1';
      const good = accuracy <= 15, mid = accuracy <= 30;
      accDot.style.background = good ? '#5cb85c' : mid ? '#e8a020' : '#c0392b';
      accDot.style.boxShadow  = good ? '0 0 5px #5cb85c' : mid ? '0 0 5px #e8a020' : '0 0 5px #c0392b';
      accTxt.textContent = `±${Math.round(accuracy)}°`;
    } else if (accuracy === -1) {
      setStatus('Kalibreer kompas: beweeg je telefoon in een ∞ figuur', '#e8a020');
      return;
    }

    if (prevH === null) {
      prevH         = h;
      targetRing    = -h;
      targetNeedle  = qibla !== null ? qibla - h : 0;
      curRing       = targetRing;
      curNeedle     = targetNeedle;
    } else {
      let delta = h - prevH;
      if (delta > 180)  delta -= 360;
      if (delta < -180) delta += 360;
      if (Math.abs(delta) < 0.35) return;
      prevH         = h;
      targetRing   -= delta;
      targetNeedle -= delta;
    }
  }

  // ── Start orientation listeners ────────────────────────────
  function startListening() {
    orientHnd = (e) => {
      if (e.type === 'deviceorientationabsolute') absHeard = true;
      if (e.type === 'deviceorientation' && absHeard) return;

      let h, acc = null;
      if (typeof e.webkitCompassHeading === 'number' && e.webkitCompassHeading >= 0) {
        // iOS: true-north compensated heading (0=N, 90=E, increases CW)
        h   = e.webkitCompassHeading;
        acc = typeof e.webkitCompassAccuracy === 'number' ? e.webkitCompassAccuracy : null;
      } else if (e.alpha != null) {
        // Android: alpha rotates CCW from above → heading = (360 - alpha) % 360
        h = (360 - e.alpha) % 360;
      } else {
        return;
      }
      onHeading(h, acc);
    };
    window.addEventListener('deviceorientationabsolute', orientHnd, true);
    window.addEventListener('deviceorientation',         orientHnd, true);
  }

  if (!compassOk) {
    setStatus('Kompas geweigerd — sta Motion & Orientation toe via iOS Instellingen → Safari', '#c0392b');
  } else if (typeof DeviceOrientationEvent === 'undefined') {
    setStatus('Kompas niet ondersteund in deze browser', '#c0392b');
  } else {
    startListening();
    setStatus('Wacht op kompas en locatie…', '#555');
  }

  // ── Geolocation ────────────────────────────────────────────
  if (!navigator.geolocation) {
    setStatus('Locatie niet beschikbaar — check browser-instellingen', '#c0392b');
    return;
  }

  watchId = navigator.geolocation.watchPosition(
    ({ coords: { latitude: lat, longitude: lon } }) => {
      const prevQ = qibla;
      qibla = calcQibla(lat, lon);

      if (prevQ === null && prevH !== null) {
        targetNeedle = qibla - prevH;
        curNeedle    = targetNeedle;
      } else if (prevQ !== null && prevQ !== qibla) {
        targetNeedle += qibla - prevQ;
      }

      const dist = calcDistance(lat, lon);
      distEl.textContent   = dist.toLocaleString('nl-NL');
      qvalEl.textContent   = Math.round(qibla) + '°';
      centerEl.textContent = Math.round(qibla) + '°';
      locEl.textContent    = `${lat.toFixed(3)}°N · ${lon.toFixed(3)}°O`;

      if (prevH === null) setStatus('Locatie gevonden — houd je telefoon rechtop voor kompas', '#555');
    },
    (e) => {
      locEl.textContent = 'Geen locatie';
      setStatus(
        e.code === 1 ? 'Locatie geweigerd — sta toe via Safari Instellingen' : 'Locatie niet beschikbaar',
        '#c0392b'
      );
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
  );
}
