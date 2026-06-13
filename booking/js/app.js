/* ════════════════════════════════════════════
   GH Taxi Amsterdam — App JS
   Map · Geocoding · Tours · Booking · Anim
   ════════════════════════════════════════════ */

// ── Telefoonnummer (pas aan) ──
const PHONE = '31600000000';

// ── Tours data ──
const TOURS = [
  {
    id:'airport', cat:'luchthaven', art:'tour-art-airport',
    name:'Schiphol Airport Transfer',
    tagline:'Stressvrij van deur tot gate',
    duration:'30–60 min', priceFrom:52, priceUnit:'p/a',
    badge:'Meest geboekt', badgeClass:'badge-popular',
    highlights:['Vluchtmonitoring inbegrepen','45 min. gratis wachttijd bij vertraging','Bagagehulp bij in- en uitladen'],
  },
  {
    id:'keukenhof', cat:'daguitje', art:'tour-art-keukenhof',
    name:'Keukenhof Dag Tour',
    tagline:'De mooiste bloementuin ter wereld',
    duration:'6–8 uur', priceFrom:235, priceUnit:'p/a',
    badge:'Apr – Mei', badgeClass:'badge-seasonal',
    highlights:['Ophalen bij u thuis','Vrije tijd in de tuinen','Chauffeur wacht ter plaatse'],
  },
  {
    id:'zaanse', cat:'daguitje', art:'tour-art-zaanse',
    name:'Zaanse Schans',
    tagline:'Authentiek Hollands erfgoed',
    duration:'3–4 uur', priceFrom:155, priceUnit:'p/a',
    highlights:['Werkende historische molens','Ambachten & museumwinkels','Retour inbegrepen'],
  },
  {
    id:'volendam', cat:'daguitje', art:'tour-art-volendam',
    name:'Volendam & Marken',
    tagline:'Twee pittoreske vissersdorpen',
    duration:'4–5 uur', priceFrom:175, priceUnit:'p/a',
    highlights:['Volendam & Marken combinatie','Typisch Hollandse sfeer','Eventueel overtocht per boot'],
  },
  {
    id:'rotterdam', cat:'daguitje', art:'tour-art-rotterdam',
    name:'Rotterdam & Kinderdijk',
    tagline:'Moderne architectuur & UNESCO-molens',
    duration:'7–9 uur', priceFrom:275, priceUnit:'p/a',
    highlights:['Kubus­woningen & Markthal','19 UNESCO-erfgoed molens','Volledig flexibel programma'],
  },
  {
    id:'city', cat:'stad', art:'tour-art-city',
    name:'Amsterdam City Tour',
    tagline:'De highlights van de hoofdstad',
    duration:'2–3 uur', priceFrom:105, priceUnit:'p/a',
    highlights:['Grachten & Jordaan','Rijksmuseum & Vondelpark','Volledig aanpasbaar'],
  },
  {
    id:'business', cat:'zakelijk', art:'tour-art-business',
    name:'Zakelijk Dagpakket',
    tagline:'Uw persoonlijke chauffeur voor een dag',
    duration:'8 uur', priceFrom:445, priceUnit:'p/dag',
    badge:'Premium', badgeClass:'badge-popular',
    highlights:['Chauffeur 8 uur standby','Factuur met BTW','Representatief voertuig'],
  },
  {
    id:'haarlem', cat:'stad', art:'tour-art-haarlem',
    name:'Haarlem City Tour',
    tagline:'Historische havenstad vlakbij Amsterdam',
    duration:'3 uur', priceFrom:125, priceUnit:'p/a',
    highlights:['Grote Markt & Bavo­kerk','Stijlvolle shoppingstraten','Retour inbegrepen'],
  },
];

// ── Prijstabel (hoogseizoen tarieven) ──
const PRICES = {
  'centrum-schiphol':   {comfort:52, business:65, bus:88},
  'centrum-rai':        {comfort:22, business:30, bus:45},
  'centrum-haarlem':    {comfort:42, business:52, bus:72},
  'centrum-utrecht':    {comfort:75, business:92, bus:128},
  'centrum-denhaag':    {comfort:110,business:135,bus:188},
  'centrum-rotterdam':  {comfort:118,business:145,bus:202},
  'centrum-almere':     {comfort:52, business:65, bus:90},
  'centrum-zaandam':    {comfort:35, business:44, bus:62},
  'centrum-amstelveen': {comfort:28, business:36, bus:52},
  'centrum-diemen':     {comfort:24, business:32, bus:48},
  'centrum-lisse':      {comfort:55, business:68, bus:92},
  'centrum-volendam':   {comfort:42, business:52, bus:72},
  'centrum-zaanse':     {comfort:38, business:48, bus:65},
  'noord-schiphol':     {comfort:55, business:68, bus:92},
  'noord-centrum':      {comfort:20, business:27, bus:40},
  'noord-rai':          {comfort:30, business:40, bus:56},
  'noord-haarlem':      {comfort:48, business:60, bus:82},
  'noord-utrecht':      {comfort:82, business:100,bus:140},
  'oost-schiphol':      {comfort:58, business:72, bus:98},
  'oost-centrum':       {comfort:18, business:25, bus:38},
  'oost-rai':           {comfort:18, business:24, bus:36},
  'oost-haarlem':       {comfort:55, business:68, bus:92},
  'oost-utrecht':       {comfort:72, business:88, bus:122},
  'zuidoost-schiphol':  {comfort:55, business:68, bus:92},
  'zuidoost-centrum':   {comfort:24, business:32, bus:48},
  'zuidoost-rai':       {comfort:14, business:20, bus:32},
  'west-schiphol':      {comfort:48, business:60, bus:82},
  'west-centrum':       {comfort:16, business:22, bus:34},
  'west-haarlem':       {comfort:40, business:50, bus:70},
  'nieuwwest-schiphol': {comfort:44, business:55, bus:76},
  'nieuwwest-centrum':  {comfort:20, business:26, bus:40},
  'zuid-schiphol':      {comfort:48, business:60, bus:82},
  'zuid-centrum':       {comfort:18, business:24, bus:36},
  'zuid-rai':           {comfort:14, business:20, bus:30},
  'schiphol-haarlem':   {comfort:35, business:44, bus:62},
  'schiphol-utrecht':   {comfort:80, business:98, bus:138},
  'schiphol-denhaag':   {comfort:82, business:100,bus:140},
  'schiphol-rotterdam': {comfort:95, business:118,bus:165},
  'schiphol-almere':    {comfort:62, business:76, bus:108},
  'rai-haarlem':        {comfort:48, business:60, bus:82},
  'rai-utrecht':        {comfort:68, business:82, bus:115},
};

// ── Amsterdam locaties (autocomplete seed) ──
const LOCAL_LOCS = [
  {label:'Amsterdam Centraal Station', icon:'train', zone:'centrum'},
  {label:'Schiphol Airport, Luchthaven', icon:'plane', zone:'schiphol'},
  {label:'Amsterdam Noord (NDSM-Werf)', icon:'pin', zone:'noord'},
  {label:'Amsterdam Oost (Watergraafsmeer)', icon:'pin', zone:'oost'},
  {label:'Amsterdam Zuid (Rivierenbuurt)', icon:'pin', zone:'zuid'},
  {label:'Amsterdam West (Jordaan)', icon:'pin', zone:'west'},
  {label:'Amsterdam Nieuw-West', icon:'pin', zone:'nieuwwest'},
  {label:'Amsterdam Zuidoost (Bijlmer)', icon:'pin', zone:'zuidoost'},
  {label:'Amsterdam RAI', icon:'building', zone:'rai'},
  {label:'Ziggo Dome, Amsterdam', icon:'building', zone:'zuidoost'},
  {label:'Johan Cruyff ArenA, Amsterdam', icon:'building', zone:'zuidoost'},
  {label:'AFAS Live, Amsterdam', icon:'building', zone:'zuidoost'},
  {label:'Amsterdam UMC (AMC)', icon:'hospital', zone:'zuidoost'},
  {label:'OLVG Ziekenhuis Oost, Amsterdam', icon:'hospital', zone:'oost'},
  {label:'Haarlem Centrum', icon:'city', zone:'haarlem'},
  {label:'Utrecht Centraal', icon:'train', zone:'utrecht'},
  {label:'Den Haag Centraal', icon:'train', zone:'denhaag'},
  {label:'Rotterdam Centraal', icon:'train', zone:'rotterdam'},
  {label:'Almere Centrum', icon:'city', zone:'almere'},
  {label:'Zaandam (Zaanse Schans)', icon:'pin', zone:'zaandam'},
  {label:'Amstelveen Centrum', icon:'city', zone:'amstelveen'},
  {label:'Keukenhof, Lisse', icon:'pin', zone:'lisse'},
  {label:'Volendam Haven', icon:'pin', zone:'volendam'},
  {label:'Diemen Centrum', icon:'pin', zone:'diemen'},
];

// ── Zone detectie ──
function detectZone(text) {
  if (!text) return null;
  const t = text.toLowerCase();
  if (t.includes('schiphol') || t.includes('airport') || t.includes('luchthaven')) return 'schiphol';
  if ((t.includes('centraal') && !t.includes('haag') && !t.includes('utrecht') && !t.includes('rotterdam'))
      || t.includes('amsterdam cs')) return 'centrum';
  if (t.includes('ndsm') || (t.includes('noord') && t.includes('amsterdam'))) return 'noord';
  if (t.includes('zuidoost') || t.includes('bijlmer') || t.includes('arena') || t.includes('rai')
      || t.includes('ziggo') || t.includes('afas') || t.includes('amc') || t.includes('umc')) return 'zuidoost';
  if (t.includes('nieuw-west') || t.includes('nieuwwest') || t.includes('slotervaart')) return 'nieuwwest';
  if (t.includes('buitenveldert') || t.includes('rivierenbuurt')) return 'zuid';
  if (t.includes('jordaan') || t.includes('westerpark') || (t.includes('west') && t.includes('amsterdam'))) return 'west';
  if ((t.includes('oost') && t.includes('amsterdam')) || t.includes('watergraafsmeer') || t.includes('olvg')) return 'oost';
  if (t.includes('dam') || t.includes('leidseplein') || t.includes('rembrandtplein') || t.includes('centrum')) return 'centrum';
  if (t.includes('haarlem')) return 'haarlem';
  if (t.includes('utrecht')) return 'utrecht';
  if (t.includes('den haag') || t.includes('haag')) return 'denhaag';
  if (t.includes('rotterdam')) return 'rotterdam';
  if (t.includes('almere')) return 'almere';
  if (t.includes('zaanse') || t.includes('zaandam')) return 'zaandam';
  if (t.includes('amstelveen')) return 'amstelveen';
  if (t.includes('lisse') || t.includes('keukenhof')) return 'lisse';
  if (t.includes('volendam')) return 'volendam';
  if (t.includes('diemen')) return 'diemen';
  if (t.includes('rai')) return 'rai';
  if (t.includes('amsterdam')) return 'centrum';
  return null;
}

function lookupPrice(fromZone, toZone, vehicle) {
  if (!fromZone || !toZone || fromZone === toZone) return null;
  const k1 = `${fromZone}-${toZone}`;
  const k2 = `${toZone}-${fromZone}`;
  const entry = PRICES[k1] || PRICES[k2];
  if (!entry) return null;
  return entry[vehicle] || null;
}

// ══════════════════════════════
// MAP
// ══════════════════════════════
let map, pickupMarker, dropoffMarker, routeLine;
let mapMode = 'pickup'; // which pin mode is active

function initMap() {
  if (typeof L === 'undefined') return;

  map = L.map('map', {
    center: [52.3676, 4.9041],
    zoom: 12,
    zoomControl: false,
    attributionControl: true,
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
    subdomains: 'abcd',
  }).addTo(map);

  // Map click → set active pin
  map.on('click', async (e) => {
    const {lat, lng} = e.latlng;
    setMarker(mapMode, lat, lng);
    const addr = await reverseGeocode(lat, lng);
    if (addr) {
      document.getElementById(mapMode).value = addr;
      updatePrice();
    }
    // Switch to dropoff after pickup set
    if (mapMode === 'pickup' && !dropoffMarker) switchMapMode('dropoff');
  });

  // Custom zoom buttons
  document.getElementById('zoom-in')?.addEventListener('click', () => map.zoomIn());
  document.getElementById('zoom-out')?.addEventListener('click', () => map.zoomOut());

  // Geolocate
  document.getElementById('myloc-btn')?.addEventListener('click', () => {
    if (!navigator.geolocation) return alert('Geolocatie niet beschikbaar in uw browser.');
    const btn = document.getElementById('myloc-btn');
    btn.style.color = 'var(--gold)';
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const {latitude: lat, longitude: lng} = pos.coords;
        map.flyTo([lat, lng], 15, {duration: 1});
        setMarker('pickup', lat, lng);
        const addr = await reverseGeocode(lat, lng);
        if (addr) { document.getElementById('pickup').value = addr; updatePrice(); }
        btn.style.color = '';
        switchMapMode('dropoff');
        updateMapHint('Klik nu op de kaart om uw bestemming te pinnen');
      },
      (err) => { btn.style.color = ''; console.warn('Geolocation error:', err.message); },
      {enableHighAccuracy: true, timeout: 8000}
    );
  });

  // Mobile map toggle
  document.getElementById('map-toggle')?.addEventListener('click', () => {
    const panel = document.getElementById('map-panel');
    const lbl = document.getElementById('map-toggle-label');
    const open = panel.classList.toggle('map-open');
    lbl.textContent = open ? 'Kaart verbergen' : 'Kaart tonen';
    if (open) setTimeout(() => map.invalidateSize(), 50);
  });
}

function makeMarkerIcon(type) {
  const isPickup = type === 'pickup';
  const fillColor = isPickup ? '#C8A84C' : '#FFFFFF';
  const shadowColor = isPickup ? 'rgba(200,168,76,0.35)' : 'rgba(255,255,255,0.2)';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 30 38">
    <filter id="sh"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="${shadowColor}"/></filter>
    <path d="M15 0C8.373 0 3 5.373 3 12c0 9 12 26 12 26s12-17 12-26C27 5.373 21.627 0 15 0z" fill="${fillColor}" filter="url(#sh)"/>
    <circle cx="15" cy="12" r="4.5" fill="white" opacity="0.9"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: 'custom-pin',
    iconSize: [30, 38],
    iconAnchor: [15, 38],
    popupAnchor: [0, -38],
  });
}

function setMarker(type, lat, lng) {
  const icon = makeMarkerIcon(type);
  if (type === 'pickup') {
    if (pickupMarker) { pickupMarker.setLatLng([lat, lng]); }
    else {
      pickupMarker = L.marker([lat, lng], {icon, draggable: true, zIndexOffset: 10}).addTo(map);
      pickupMarker.on('dragend', async () => {
        const {lat, lng} = pickupMarker.getLatLng();
        const addr = await reverseGeocode(lat, lng);
        if (addr) { document.getElementById('pickup').value = addr; updatePrice(); }
      });
    }
    animateMarker(pickupMarker);
  } else {
    if (dropoffMarker) { dropoffMarker.setLatLng([lat, lng]); }
    else {
      dropoffMarker = L.marker([lat, lng], {icon, draggable: true, zIndexOffset: 5}).addTo(map);
      dropoffMarker.on('dragend', async () => {
        const {lat, lng} = dropoffMarker.getLatLng();
        const addr = await reverseGeocode(lat, lng);
        if (addr) { document.getElementById('dropoff').value = addr; updatePrice(); }
      });
    }
    animateMarker(dropoffMarker);
  }
  drawRouteLine();
  fitMarkers();
}

function animateMarker(marker) {
  const el = marker.getElement();
  if (!el) return;
  el.style.transition = 'none';
  el.style.transform += ' translateY(-12px)';
  el.style.opacity = '0';
  requestAnimationFrame(() => {
    el.style.transition = 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease';
    el.style.transform = el.style.transform.replace(' translateY(-12px)', '');
    el.style.opacity = '1';
  });
}

function drawRouteLine() {
  if (!pickupMarker || !dropoffMarker) return;
  const p1 = pickupMarker.getLatLng();
  const p2 = dropoffMarker.getLatLng();
  if (routeLine) map.removeLayer(routeLine);
  routeLine = L.polyline([p1, p2], {
    color: '#C8A84C',
    weight: 2,
    opacity: 0.6,
    dashArray: '6,5',
  }).addTo(map);
}

function fitMarkers() {
  if (!map) return;
  if (pickupMarker && dropoffMarker) {
    map.fitBounds([pickupMarker.getLatLng(), dropoffMarker.getLatLng()], {padding: [60, 60], maxZoom: 14, animate: true});
  } else if (pickupMarker) {
    map.flyTo(pickupMarker.getLatLng(), 14, {duration: .8});
  } else if (dropoffMarker) {
    map.flyTo(dropoffMarker.getLatLng(), 14, {duration: .8});
  }
}

function switchMapMode(mode) {
  mapMode = mode;
  document.querySelectorAll('.pin-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  updateMapHint(mode === 'pickup' ? 'Klik om ophaaladres te pinnen' : 'Klik om bestemming te pinnen');
}

function updateMapHint(msg) {
  const el = document.getElementById('map-hint-text');
  if (el) el.textContent = msg;
  const hint = document.getElementById('map-hint');
  if (hint) {
    hint.classList.remove('hidden-hint');
    clearTimeout(hint._hide);
    hint._hide = setTimeout(() => hint.classList.add('hidden-hint'), 3000);
  }
}

// ══════════════════════════════
// GEOCODING (Nominatim)
// ══════════════════════════════
const geocodeCache = new Map();

async function geocode(query) {
  if (geocodeCache.has(query)) return geocodeCache.get(query);
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=nl&accept-language=nl`;
    const res = await fetch(url, {headers: {'Accept-Language': 'nl', 'User-Agent': 'GHTaxiAmsterdam/1.0'}});
    if (!res.ok) return [];
    const data = await res.json();
    geocodeCache.set(query, data);
    return data;
  } catch { return []; }
}

async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=nl`;
    const res = await fetch(url, {headers: {'Accept-Language': 'nl', 'User-Agent': 'GHTaxiAmsterdam/1.0'}});
    if (!res.ok) return null;
    const d = await res.json();
    if (!d.address) return d.display_name || null;
    const {road, house_number, city, town, municipality, postcode} = d.address;
    const street = [road, house_number].filter(Boolean).join(' ');
    const place = city || town || municipality || '';
    return [street, place].filter(Boolean).join(', ') || d.display_name;
  } catch { return null; }
}

// ══════════════════════════════
// AUTOCOMPLETE
// ══════════════════════════════
function setupAutocomplete(inputId, suggestId) {
  const inp = document.getElementById(inputId);
  const box = document.getElementById(suggestId);
  if (!inp || !box) return;

  let timer, lastQuery = '', activeIdx = -1;

  function filterLocal(q) {
    const t = q.toLowerCase();
    return LOCAL_LOCS.filter(l => l.label.toLowerCase().includes(t)).slice(0, 5);
  }

  function renderSuggestions(localItems, apiItems) {
    const all = [...localItems];
    if (apiItems) {
      apiItems.forEach(r => {
        const label = shortAddress(r);
        if (label && !all.find(l => l.label.toLowerCase() === label.toLowerCase()))
          all.push({label, icon: 'pin', lat: parseFloat(r.lat), lon: parseFloat(r.lon)});
      });
    }
    if (!all.length) { hideSuggest(); return; }
    box.innerHTML = all.slice(0, 7).map((l, i) => `
      <div class="suggest-item" data-idx="${i}" data-label="${escHtml(l.label)}" ${l.lat ? `data-lat="${l.lat}" data-lon="${l.lon}"` : ''}>
        <div class="suggest-icon">${iconSvg(l.icon)}</div>
        <span>${l.label}</span>
      </div>`).join('');
    box.classList.add('open');
    activeIdx = -1;
    box.querySelectorAll('.suggest-item').forEach(el => {
      el.addEventListener('mousedown', e => {
        e.preventDefault();
        inp.value = el.dataset.label;
        hideSuggest();
        if (el.dataset.lat && map) {
          const lat = parseFloat(el.dataset.lat);
          const lon = parseFloat(el.dataset.lon);
          setMarker(inputId === 'pickup' ? 'pickup' : 'dropoff', lat, lon);
        }
        updatePrice();
        if (inputId === 'pickup') switchMapMode('dropoff');
      });
    });
  }

  function hideSuggest() { box.classList.remove('open'); box.innerHTML = ''; activeIdx = -1; }

  inp.addEventListener('input', () => {
    const q = inp.value.trim();
    if (!q || q.length < 2) { hideSuggest(); return; }
    const local = filterLocal(q);
    renderSuggestions(local, null);
    if (q === lastQuery) return;
    lastQuery = q;
    clearTimeout(timer);
    timer = setTimeout(async () => {
      box.innerHTML = '<div class="suggest-loading">Zoeken...</div>';
      box.classList.add('open');
      const api = await geocode(q);
      renderSuggestions(filterLocal(q), api);
    }, 450);
  });

  inp.addEventListener('blur', () => setTimeout(hideSuggest, 160));
  inp.addEventListener('focus', () => { if (inp.value.length >= 2) { const q = inp.value.trim(); renderSuggestions(filterLocal(q), null); } });
  inp.addEventListener('keydown', e => {
    const items = box.querySelectorAll('.suggest-item');
    if (e.key === 'ArrowDown') { e.preventDefault(); activeIdx = Math.min(activeIdx+1, items.length-1); highlightItem(items); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); activeIdx = Math.max(activeIdx-1, -1); highlightItem(items); }
    else if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); items[activeIdx]?.dispatchEvent(new MouseEvent('mousedown')); }
    else if (e.key === 'Escape') hideSuggest();
  });
  inp.addEventListener('change', updatePrice);

  function highlightItem(items) {
    items.forEach((el, i) => el.classList.toggle('active', i === activeIdx));
    items[activeIdx]?.scrollIntoView({block:'nearest'});
  }
}

function shortAddress(r) {
  if (!r) return '';
  const d = r.display_name || '';
  return d.split(',').slice(0,3).join(',').trim();
}
function escHtml(s) { return s.replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function iconSvg(type) {
  const icons = {
    pin:   '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>',
    train: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-4-4-8-4zm0 2c3.51 0 4.96.48 5.57 1H6.43C7.04 4.48 8.49 4 12 4zm-.5 11a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm.5-11a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM6 10h12v5H6z"/></svg>',
    plane: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></svg>',
    building:'<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>',
    hospital:'<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>',
    city:  '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M15 11V5l-3-3-3 3v2H3v14h18V11h-6zm-8 8H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5V9h2v2zm6 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2zm6 12h-2v-2h2v2zm0-4h-2v-2h2v2z"/></svg>',
  };
  return icons[type] || icons.pin;
}

// ══════════════════════════════
// PRICE CALCULATOR
// ══════════════════════════════
function updatePrice() {
  const pu = (document.getElementById('pickup')?.value || '').trim();
  const do_ = (document.getElementById('dropoff')?.value || '').trim();
  const vehicle = document.getElementById('vehicle')?.value || 'business';
  const box = document.getElementById('price-box');
  const amtEl = document.getElementById('price-amount');
  if (!box || !amtEl) return;

  if (pu.length < 3 || do_.length < 3) { box.classList.remove('visible'); return; }

  const fz = detectZone(pu);
  const tz = detectZone(do_);
  const price = lookupPrice(fz, tz, vehicle);

  box.classList.add('visible');
  if (price) {
    amtEl.textContent = `€ ${price}`;
    amtEl.style.fontSize = '';
  } else {
    amtEl.textContent = 'Op aanvraag';
    amtEl.style.fontSize = '1.2rem';
  }
}

// ══════════════════════════════
// WHATSAPP BOOKING
// ══════════════════════════════
function buildMsg(fields) {
  const vNames = {comfort:'Comfort (sedan)', business:'Business (E-klasse/SUV)', bus:'Minibus (max 8 pers.)'};
  let m = 'Hallo, ik wil graag een taxi boeken bij GH Taxi Amsterdam.\n\n';
  if (fields.pickup)     m += `📍 Ophaaladres: ${fields.pickup}\n`;
  if (fields.dropoff)    m += `🏁 Bestemming: ${fields.dropoff}\n`;
  if (fields.date)       m += `📅 Datum: ${fmtDate(fields.date)}\n`;
  if (fields.time)       m += `🕐 Tijdstip: ${fields.time}\n`;
  if (fields.retDate)    m += `↩ Retour: ${fmtDate(fields.retDate)} om ${fields.retTime || '...'}\n`;
  if (fields.pax)        m += `👥 Passagiers: ${fields.pax}\n`;
  if (fields.vehicle)    m += `🚗 Voertuig: ${vNames[fields.vehicle] || fields.vehicle}\n`;
  if (fields.service && fields.service !== 'transfer') m += `🏢 Dienst: ${fields.service}\n`;
  m += '\nKunt u de vaste prijs bevestigen?';
  return encodeURIComponent(m);
}

function fmtDate(s) {
  if (!s) return '';
  const [y, m, d] = s.split('-');
  return `${parseInt(d)}-${parseInt(m)}-${y}`;
}

// ══════════════════════════════
// TOURS RENDERING
// ══════════════════════════════
function renderTours(filter) {
  const grid = document.getElementById('tours-grid');
  if (!grid) return;
  const list = filter === 'all' ? TOURS : TOURS.filter(t => t.cat === filter);
  grid.innerHTML = list.map((t, i) => `
    <article class="tour-card" data-cat="${t.cat}" style="animation-delay:${i*60}ms">
      <div class="tour-art ${t.art}">
        <div class="tour-art-lines"></div>
        ${t.badge ? `<div class="tour-art-badge ${t.badgeClass||''}">${t.badge}</div>` : ''}
      </div>
      <div class="tour-body">
        <h3 class="tour-name">${t.name}</h3>
        <p class="tour-tagline">${t.tagline}</p>
        <div class="tour-meta">
          <div class="tour-meta-item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
            ${t.duration}
          </div>
        </div>
        <div style="margin-bottom:.75rem">
          <div class="tour-price-from">Vanaf</div>
          <div><span class="tour-price money">€ ${t.priceFrom}</span> <span class="tour-price-unit">${t.priceUnit}</span></div>
        </div>
        <ul class="tour-highlights">
          ${t.highlights.map(h => `<li class="tour-highlight"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>${h}</li>`).join('')}
        </ul>
        <button class="tour-book-btn" onclick="bookTour('${escHtml(t.name)}', ${t.priceFrom})">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15s-.77.97-.94 1.16c-.17.2-.35.22-.64.07a8.1 8.1 0 01-2.39-1.47 8.97 8.97 0 01-1.65-2.06c-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.14-.17.19-.3.3-.5.1-.19.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51-.17 0-.37-.01-.57-.01-.2 0-.52.07-.79.37C7.06 7.1 6.3 7.83 6.3 9.29c0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12 0C5.37 0 0 5.37 0 12a11.94 11.94 0 001.52 5.85L0 24l6.34-1.5A11.96 11.96 0 0012 24c6.63 0 12-5.37 12-12S18.63 0 12 0zm0 21.82a9.81 9.81 0 01-5.02-1.38l-.36-.21-3.76.89.94-3.67-.23-.37A9.82 9.82 0 012.18 12 9.82 9.82 0 0112 2.18 9.82 9.82 0 0121.82 12 9.82 9.82 0 0112 21.82z"/></svg>
          Boek via WhatsApp
        </button>
      </div>
    </article>
  `).join('');
}

window.bookTour = function(name, price) {
  const msg = encodeURIComponent(`Hallo, ik wil graag de volgende tour boeken:\n\n🗺 Tour: ${name}\nVanaf: € ${price}\n\nKunt u beschikbaarheid en datum bevestigen?`);
  window.open(`https://wa.me/${PHONE}?text=${msg}`, '_blank', 'noopener');
};

// ══════════════════════════════
// NAV
// ══════════════════════════════
function initNav() {
  const nav = document.getElementById('nav');
  const burger = document.getElementById('hamburger');
  const mob = document.getElementById('nav-mobile');

  const update = () => nav.classList.toggle('solid', window.scrollY > 30);
  window.addEventListener('scroll', update, {passive: true});
  update();

  burger?.addEventListener('click', () => {
    const open = mob.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });
  mob?.querySelectorAll('.nav-mobile-link').forEach(a => a.addEventListener('click', () => mob.classList.remove('open')));
}

// ══════════════════════════════
// FORM LOGIC
// ══════════════════════════════
function initForm() {
  // Service tabs
  document.getElementById('svc-tabs')?.querySelectorAll('.svc-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.svc-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (btn.dataset.svc === 'airport') {
        const drop = document.getElementById('dropoff');
        if (drop && !drop.value) drop.value = 'Schiphol Airport, Luchthaven';
        updatePrice();
      }
    });
  });

  // Trip tabs
  document.querySelectorAll('.trip-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.trip-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const showReturn = btn.dataset.trip === 'return';
      document.getElementById('return-row')?.classList.toggle('hidden', !showReturn);
    });
  });

  // Pin buttons
  document.querySelectorAll('.pin-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchMapMode(btn.dataset.mode);
      // On mobile: open map
      const panel = document.getElementById('map-panel');
      if (panel && window.innerWidth < 768 && !panel.classList.contains('map-open')) {
        panel.classList.add('map-open');
        document.getElementById('map-toggle-label').textContent = 'Kaart verbergen';
        setTimeout(() => map?.invalidateSize(), 50);
      }
    });
  });

  // Swap
  document.getElementById('swap-btn')?.addEventListener('click', () => {
    const pu = document.getElementById('pickup');
    const dr = document.getElementById('dropoff');
    if (!pu || !dr) return;
    [pu.value, dr.value] = [dr.value, pu.value];
    if (pickupMarker && dropoffMarker) {
      const p1 = pickupMarker.getLatLng();
      const p2 = dropoffMarker.getLatLng();
      pickupMarker.setLatLng(p2);
      dropoffMarker.setLatLng(p1);
      drawRouteLine();
    }
    updatePrice();
  });

  // Live price update
  ['pickup','dropoff','vehicle'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updatePrice);
    document.getElementById(id)?.addEventListener('change', updatePrice);
  });

  // Book button
  document.getElementById('book-btn')?.addEventListener('click', () => {
    const pickup   = document.getElementById('pickup')?.value.trim();
    const dropoff  = document.getElementById('dropoff')?.value.trim();
    const date     = document.getElementById('date')?.value;
    const time     = document.getElementById('time')?.value;
    const retDate  = document.getElementById('return-date')?.value;
    const retTime  = document.getElementById('return-time')?.value;
    const pax      = document.getElementById('passengers')?.value;
    const vehicle  = document.getElementById('vehicle')?.value;
    const svc      = document.querySelector('.svc-tab.active')?.dataset.svc;

    const msg = buildMsg({pickup, dropoff, date, time, retDate, retTime, pax, vehicle, service: svc});
    window.open(`https://wa.me/${PHONE}?text=${msg}`, '_blank', 'noopener');
  });

  // Date min = today
  const today = new Date().toISOString().split('T')[0];
  ['date','return-date'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.min = today; if (!el.value) el.value = today; }
  });
}

// ══════════════════════════════
// TOUR FILTERS
// ══════════════════════════════
function initTourFilters() {
  renderTours('all');
  document.getElementById('tour-filters')?.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderTours(btn.dataset.filter);
    });
  });
}

// ══════════════════════════════
// SCROLL ANIMATIONS
// ══════════════════════════════
function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }});
  }, {threshold: 0.08, rootMargin: '0px 0px -30px 0px'});
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

function initCountUp() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseInt(el.dataset.target, 10);
      if (isNaN(target)) return;
      const dur = 1200;
      const start = performance.now();
      (function tick(now) {
        const p = Math.min((now - start) / dur, 1);
        el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target);
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = target;
      })(start);
      obs.unobserve(el);
    });
  }, {threshold: 0.5});
  document.querySelectorAll('.stat-n[data-target]').forEach(el => obs.observe(el));
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = (document.getElementById('nav')?.offsetHeight || 62) + 8;
      window.scrollTo({top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth'});
      document.getElementById('nav-mobile')?.classList.remove('open');
    });
  });
}

function initFab() {
  const fab = document.getElementById('fab');
  if (!fab) return;
  window.addEventListener('scroll', () => fab.classList.toggle('visible', window.scrollY > 400), {passive: true});
}

// ══════════════════════════════
// INIT
// ══════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initMap();
  setupAutocomplete('pickup', 'pickup-suggest');
  setupAutocomplete('dropoff', 'dropoff-suggest');
  initForm();
  initTourFilters();
  initReveal();
  initCountUp();
  initSmoothScroll();
  initFab();

  // Default map mode = pickup
  switchMapMode('pickup');
});
