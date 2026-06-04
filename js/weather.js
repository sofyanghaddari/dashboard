// Open-Meteo (geen API key nodig)
const CACHE_KEY = 'weatherCache';
const TTL = 30 * 60 * 1000;

const CODES = {
  0: { e: '☀️', d: 'Helder' },
  1: { e: '🌤️', d: 'Zonnig' }, 2: { e: '⛅', d: 'Wisselend' }, 3: { e: '☁️', d: 'Bewolkt' },
  45: { e: '🌫️', d: 'Mist' }, 48: { e: '🌫️', d: 'Mist' },
  51: { e: '🌦️', d: 'Motregen' }, 53: { e: '🌦️', d: 'Motregen' }, 55: { e: '🌦️', d: 'Motregen' },
  61: { e: '🌧️', d: 'Regen' }, 63: { e: '🌧️', d: 'Regen' }, 65: { e: '🌧️', d: 'Hevige regen' },
  71: { e: '🌨️', d: 'Sneeuw' }, 73: { e: '🌨️', d: 'Sneeuw' }, 75: { e: '❄️', d: 'Veel sneeuw' },
  80: { e: '🌦️', d: 'Buien' }, 81: { e: '🌧️', d: 'Buien' }, 82: { e: '⛈️', d: 'Zware buien' },
  95: { e: '⛈️', d: 'Onweer' }, 96: { e: '⛈️', d: 'Onweer + hagel' }, 99: { e: '⛈️', d: 'Onweer + hagel' },
};

export function codeInfo(c) { return CODES[c] || { e: '🌡️', d: '' }; }

export async function getLocation() {
  const stored = localStorage.getItem('userLocation');
  if (stored) return JSON.parse(stored);
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject('Geolocation niet ondersteund');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        localStorage.setItem('userLocation', JSON.stringify(loc));
        resolve(loc);
      },
      (e) => reject(e.message),
      { timeout: 10000, maximumAge: 6 * 3600 * 1000 }
    );
  });
}

export async function getWeather() {
  const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
  if (cached && Date.now() - cached.ts < TTL) return cached.data;

  const loc = await getLocation();
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,weather_code&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=3`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Weer ophalen mislukt');
  const data = await res.json();
  localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  return data;
}

// Heuristiek: regen + drukke vlucht-uren = goede taxi-momenten
export function rideOpportunities(weather) {
  if (!weather) return [];
  const out = [];
  const now = new Date();
  const hourly = weather.hourly;
  if (!hourly) return out;

  // Schiphol-pieken: 06-09 ochtend, 17-21 avond
  const flightPeaks = [[6,9],[17,21]];

  for (let i = 0; i < Math.min(48, hourly.time.length); i++) {
    const t = new Date(hourly.time[i]);
    if (t < now) continue;
    const h = t.getHours();
    const rain = hourly.precipitation_probability[i] || 0;
    const code = hourly.weather_code[i];
    const isPeak = flightPeaks.some(([a, b]) => h >= a && h <= b);
    if (rain >= 60 && isPeak) {
      out.push({
        time: t,
        msg: `${codeInfo(code).e} ${dayLabel(t)} ${String(h).padStart(2,'0')}:00 — ${rain}% regen + Schiphol-piek → goede rit-tijd`,
      });
    } else if (rain >= 80) {
      out.push({ time: t, msg: `${codeInfo(code).e} ${dayLabel(t)} ${String(h).padStart(2,'0')}:00 — ${rain}% regen, kans op meer ritten` });
    }
    if (out.length >= 3) break;
  }
  return out;
}

function dayLabel(d) {
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'vandaag';
  const tom = new Date(now); tom.setDate(tom.getDate() + 1);
  if (d.toDateString() === tom.toDateString()) return 'morgen';
  return ['zo','ma','di','wo','do','vr','za'][d.getDay()];
}
