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
  // Default: Amsterdam centrum — geen permissie nodig
  return { lat: 52.3676, lon: 4.9041 };
}

export async function getWeather(signal) {
  const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
  if (cached && Date.now() - cached.ts < TTL) return cached.data;

  const loc = await getLocation();
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,weather_code&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=3`;
  const res = await fetch(url, signal ? { signal } : undefined);
  if (!res.ok) throw new Error('Weer ophalen mislukt');
  const data = await res.json();
  localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  return data;
}

// Heuristiek: regen + spitsuren = goede taxi-momenten (Amsterdam)
export function rideOpportunities(weather) {
  if (!weather) return [];
  const out = [];
  const now = new Date();
  const hourly = weather.hourly;
  if (!hourly) return out;

  // Amsterdam spitsuren: 07-09 ochtend, 16-19 avond, plus uitgaan 22-02
  const peaks = [[7,9,'ochtend-spits'],[16,19,'avond-spits'],[22,26,'uitgaans-piek']];

  for (let i = 0; i < Math.min(48, hourly.time.length); i++) {
    const t = new Date(hourly.time[i]);
    if (t < now) continue;
    const h = t.getHours();
    const rain = hourly.precipitation_probability[i] || 0;
    const code = hourly.weather_code[i];
    const peak = peaks.find(([a, b]) => {
      if (b > 24) return h >= a || h <= b - 24;
      return h >= a && h <= b;
    });
    if (rain >= 60 && peak) {
      out.push({
        time: t,
        msg: `${codeInfo(code).e} ${dayLabel(t)} ${String(h).padStart(2,'0')}:00 — ${rain}% regen + ${peak[2]} → goede rit-tijd in Amsterdam`,
      });
    } else if (rain >= 80) {
      out.push({ time: t, msg: `${codeInfo(code).e} ${dayLabel(t)} ${String(h).padStart(2,'0')}:00 — ${rain}% regen, kans op meer ritten` });
    } else if (peak && [22,23,0,1].includes(h)) {
      out.push({ time: t, msg: `${codeInfo(code).e} ${dayLabel(t)} ${String(h).padStart(2,'0')}:00 — ${peak[2]} in Amsterdam` });
    }
    if (out.length >= 3) break;
  }
  return out;
}

// Fallback default-locatie: Amsterdam
export function defaultAmsterdam() {
  return { lat: 52.3676, lon: 4.9041 };
}

function dayLabel(d) {
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'vandaag';
  const tom = new Date(now); tom.setDate(tom.getDate() + 1);
  if (d.toDateString() === tom.toDateString()) return 'morgen';
  return ['zo','ma','di','wo','do','vr','za'][d.getDay()];
}
