// Qibla kompas — richting naar de Kaäba (21.4225°N, 39.8262°E)
const KAABA = { lat: 21.4225, lon: 39.8262 };
const R2D   = 180 / Math.PI;
const D2R   = Math.PI / 180;

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

function buildRingSVG() {
  const C = 140, OR = 133;
  let ticks = '';
  for (let i = 0; i < 360; i += 5) {
    const rad = (i - 90) * D2R;
    const isMain = i % 30 === 0, isMed = i % 10 === 0;
    const len = isMain ? 13 : isMed ? 8 : 4;
    const sw  = isMain ? 1.5 : isMed ? 1 : 0.7;
    const col = isMain ? '#575757' : isMed ? '#444' : '#2e2e2e';
    const x1 = C + OR * Math.cos(rad), y1 = C + OR * Math.sin(rad);
    const x2 = C + (OR - len) * Math.cos(rad), y2 = C + (OR - len) * Math.sin(rad);
    ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${col}" stroke-width="${sw}"/>`;
  }

  const labels = [
    { a: 0,   t: 'N',  r: 115, sz: 16, fw: 700, c: '#e8c97a' },
    { a: 45,  t: 'NO', r: 111, sz: 10, fw: 400, c: '#666' },
    { a: 90,  t: 'O',  r: 113, sz: 13, fw: 500, c: '#777' },
    { a: 135, t: 'ZO', r: 111, sz: 10, fw: 400, c: '#555' },
    { a: 180, t: 'Z',  r: 113, sz: 13, fw: 500, c: '#777' },
    { a: 225, t: 'ZW', r: 111, sz: 10, fw: 400, c: '#555' },
    { a: 270, t: 'W',  r: 113, sz: 13, fw: 500, c: '#777' },
    { a: 315, t: 'NW', r: 111, sz: 10, fw: 400, c: '#555' },
  ];

  const lblSVG = labels.map(({ a, t, r, sz, fw, c }) => {
    const rad = (a - 90) * D2R;
    const x = C + r * Math.cos(rad), y = C + r * Math.sin(rad) + sz * 0.37;
    return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" fill="${c}" font-size="${sz}" font-weight="${fw}" font-family="-apple-system,BlinkMacSystemFont,sans-serif">${t}</text>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 280" width="280" height="280">
    <defs>
      <radialGradient id="ql-bg" cx="50%" cy="50%">
        <stop offset="0%" stop-color="#1f1f1f"/>
        <stop offset="100%" stop-color="#0d0d0d"/>
      </radialGradient>
    </defs>
    <circle cx="${C}" cy="${C}" r="${OR+1}" fill="url(#ql-bg)"/>
    <circle cx="${C}" cy="${C}" r="${OR+1}" fill="none" stroke="#252525" stroke-width="2"/>
    ${ticks}${lblSVG}
    <circle cx="${C}" cy="${C}" r="5" fill="#1a1a1a" stroke="#3a3a3a" stroke-width="1"/>
  </svg>`;
}

function buildNeedleSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 280" width="280" height="280">
    <!-- Gouden pijl (boven = richting Mekka) -->
    <polygon points="140,16 131,50 149,50" fill="#e8c97a"/>
    <rect x="137.5" y="49" width="5" height="85" fill="#c9a84c" rx="1"/>
    <!-- Kaäba-icoon aan de punt -->
    <rect x="134" y="10" width="12" height="11" rx="2" fill="#111" stroke="#e8c97a" stroke-width="1.3"/>
    <line x1="138" y1="10" x2="138" y2="21" stroke="#e8c97a" stroke-width=".7" opacity=".6"/>
    <line x1="142" y1="10" x2="142" y2="21" stroke="#e8c97a" stroke-width=".7" opacity=".6"/>
    <!-- Draaipunt -->
    <circle cx="140" cy="140" r="7" fill="#1a1a1a" stroke="#3a3a3a" stroke-width="1.2"/>
    <circle cx="140" cy="140" r="3" fill="#8a7e6f"/>
    <!-- Contragewicht (grijs, omlaag) -->
    <rect x="137.5" y="143" width="5" height="52" fill="#383838" rx="1"/>
    <polygon points="140,202 131,176 149,176" fill="#383838"/>
  </svg>`;
}

export async function openQibla() {
  // iOS 13+: vraag kompasrechten aan vóór DOM-manipulatie (user gesture context)
  let compassOk = true;
  if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
    try {
      compassOk = (await DeviceOrientationEvent.requestPermission()) === 'granted';
    } catch { compassOk = false; }
  }

  const backdrop = document.createElement('div');
  backdrop.id = 'ql-modal';
  backdrop.style.cssText = 'position:fixed;inset:0;z-index:9999;background:linear-gradient(160deg,#111 0%,#0a0a0a 100%);display:flex;flex-direction:column;align-items:center;padding-top:env(safe-area-inset-top,0);overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,sans-serif';

  backdrop.innerHTML = `
    <div style="width:100%;max-width:420px;height:100%;display:flex;flex-direction:column;padding:16px 20px env(safe-area-inset-bottom,20px);box-sizing:border-box">

      <!-- Header -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;flex-shrink:0">
        <div>
          <div style="font-size:1.05rem;font-weight:700;color:#f5f0e8;letter-spacing:-.01em">🧭 Qibla kompas</div>
          <div id="ql-loc" style="font-size:.74rem;color:#484848;margin-top:3px">Locatie bepalen…</div>
        </div>
        <button id="ql-x" style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.09);color:#bbb;width:34px;height:34px;border-radius:50%;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;padding:0">×</button>
      </div>

      <!-- Kompas -->
      <div style="display:flex;flex-direction:column;align-items:center;flex:1;justify-content:center;gap:10px">

        <!-- Driehoek bovenin = doelwijzer (vast) -->
        <div style="width:0;height:0;border-left:9px solid transparent;border-right:9px solid transparent;border-top:14px solid #c9a84c;filter:drop-shadow(0 0 5px rgba(201,168,76,.55));position:relative;z-index:3;margin-bottom:-6px"></div>

        <!-- Kompas-ring + naald container -->
        <div style="position:relative;width:280px;height:280px">

          <div id="ql-ring" style="position:absolute;inset:0;will-change:transform">
            ${buildRingSVG()}
          </div>

          <div id="ql-needle" style="position:absolute;inset:0;will-change:transform;transition:filter .3s ease">
            ${buildNeedleSVG()}
          </div>

          <!-- Midden-label -->
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;gap:2px">
            <div id="ql-center" style="font-size:2.2rem;font-weight:200;color:#e8c97a;letter-spacing:-.03em;font-variant-numeric:tabular-nums;line-height:1">—</div>
            <div style="font-size:.6rem;color:#444;letter-spacing:.12em;text-transform:uppercase">Qibla</div>
          </div>

        </div>

        <!-- Status -->
        <div id="ql-status" style="font-size:.78rem;color:#555;text-align:center;min-height:18px;margin-top:4px"></div>

      </div>

      <!-- Info balk -->
      <div style="flex-shrink:0;margin-top:12px">
        <div style="display:grid;grid-template-columns:1fr 1px 1fr 1px 1fr;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:16px;overflow:hidden;margin-bottom:12px">
          <div style="text-align:center;padding:13px 6px">
            <div id="ql-dist" style="font-size:1rem;font-weight:600;color:#f5f0e8;font-variant-numeric:tabular-nums">—</div>
            <div style="font-size:.64rem;color:#484848;margin-top:3px;letter-spacing:.05em;text-transform:uppercase">km tot Mekka</div>
          </div>
          <div style="background:rgba(255,255,255,.07)"></div>
          <div style="text-align:center;padding:13px 6px">
            <div id="ql-qval" style="font-size:1rem;font-weight:600;color:#c9a84c;font-variant-numeric:tabular-nums">—</div>
            <div style="font-size:.64rem;color:#484848;margin-top:3px;letter-spacing:.05em;text-transform:uppercase">Qibla richting</div>
          </div>
          <div style="background:rgba(255,255,255,.07)"></div>
          <div style="text-align:center;padding:13px 6px">
            <div id="ql-hval" style="font-size:1rem;font-weight:600;color:#f5f0e8;font-variant-numeric:tabular-nums">—</div>
            <div style="font-size:.64rem;color:#484848;margin-top:3px;letter-spacing:.05em;text-transform:uppercase">Jouw richting</div>
          </div>
        </div>
        <p style="font-size:.7rem;color:#3a3a3a;text-align:center;line-height:1.5;margin:0">
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

  let qibla       = null;   // bearing to Mecca in degrees
  let prevH       = null;   // previous compass heading
  let ringAccum   = 0;
  let needleAccum = 0;
  let watchId     = null;
  let orientHandler = null;

  function cleanup() {
    backdrop.remove();
    if (watchId != null) navigator.geolocation.clearWatch(watchId);
    if (orientHandler) {
      window.removeEventListener('deviceorientationabsolute', orientHandler, true);
      window.removeEventListener('deviceorientation', orientHandler, true);
    }
  }
  backdrop.querySelector('#ql-x').onclick = cleanup;

  function onHeading(rawHeading) {
    const h = ((rawHeading % 360) + 360) % 360;
    hvalEl.textContent = Math.round(h) + '°';

    if (prevH === null) {
      // First reading: initialise accumulators
      prevH       = h;
      ringAccum   = -h;
      needleAccum = qibla !== null ? qibla - h : 0;
    } else {
      // Shortest angular delta to avoid wrap-around spin
      let delta = h - prevH;
      if (delta > 180)  delta -= 360;
      if (delta < -180) delta += 360;
      prevH        = h;
      ringAccum   -= delta;
      needleAccum -= delta;
    }

    ringEl.style.transform   = `rotate(${ringAccum.toFixed(2)}deg)`;
    needleEl.style.transform = `rotate(${needleAccum.toFixed(2)}deg)`;

    if (qibla !== null) {
      const diff    = ((needleAccum % 360) + 360) % 360;
      const aligned = diff < 8 || diff > 352;
      needleEl.style.filter = aligned ? 'drop-shadow(0 0 12px rgba(232,208,128,.85))' : 'none';
      statusEl.textContent  = aligned ? '🕋 Je wijst naar Mekka' : 'Draai jezelf totdat de pijl omhoog wijst';
      statusEl.style.color  = aligned ? '#6abf6a' : '#555';
    }
  }

  function startListening() {
    orientHandler = (e) => {
      let h;
      if (typeof e.webkitCompassHeading === 'number') {
        h = e.webkitCompassHeading;           // iOS Safari (absolute magnetic)
      } else if (e.alpha != null) {
        h = (360 - e.alpha) % 360;            // Android (absolute)
      } else {
        return;
      }
      onHeading(h);
    };
    window.addEventListener('deviceorientationabsolute', orientHandler, true);
    window.addEventListener('deviceorientation', orientHandler, true);
  }

  if (!compassOk) {
    statusEl.textContent = 'Kompas geweigerd — sta Motion & Orientation toe in iOS instellingen';
  } else if (typeof DeviceOrientationEvent === 'undefined') {
    statusEl.textContent = 'Kompas niet ondersteund in deze browser';
  } else {
    startListening();
    statusEl.textContent = 'Kompas actief — wacht op locatie…';
  }

  // Geolocation
  if (!navigator.geolocation) {
    statusEl.textContent = 'Locatie niet beschikbaar';
    return;
  }

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude: lat, longitude: lon } = pos.coords;
      const prevQibla = qibla;
      qibla = calcQibla(lat, lon);

      // Sync needle on first/changed qibla
      if (prevQibla === null && prevH !== null) {
        needleAccum = qibla - prevH;
      } else if (prevQibla !== null) {
        needleAccum += qibla - prevQibla;
      }

      const dist          = calcDistance(lat, lon);
      distEl.textContent  = dist.toLocaleString('nl-NL');
      qvalEl.textContent  = Math.round(qibla) + '°';
      centerEl.textContent = Math.round(qibla) + '°';
      locEl.textContent   = `${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E`;

      if (prevH === null) statusEl.textContent = 'Locatie gevonden — beweeg je telefoon voor kompas';
    },
    (e) => {
      locEl.textContent   = 'Geen locatie';
      statusEl.textContent = e.code === 1
        ? 'Locatie geweigerd — sta toe in Safari instellingen'
        : 'Locatie niet beschikbaar';
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
  );
}
