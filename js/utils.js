export function uid() { return crypto.randomUUID(); }

// Dag-cutoff: de nieuwe dag begint officieel om 02:00, niet om 00:00.
// Zo telt 01:30 als 'gisteren' ipv 'vandaag' — handig voor taxiritten 's nachts.
export const DAY_CUTOFF_HOUR = 2;

// Geeft de huidige tijd terug, maar verschoven met de cutoff.
// 01:30 → 23:30 vorige dag; 02:00 → 00:00 huidige dag.
export function effectiveNow() {
  return new Date(Date.now() - DAY_CUTOFF_HOUR * 3_600_000);
}

// Pas dezelfde verschuiving toe op een opgeslagen timestamp, zodat je kunt
// bepalen op welke 'effectieve dag' een rit of log-entry valt.
export function effectiveDate(d) {
  return new Date(new Date(d).getTime() - DAY_CUTOFF_HOUR * 3_600_000);
}
export function fmtMoney(n, raw = false) {
  const v = isFinite(n) ? +n : 0;
  const text = '€ ' + (Math.round(v * 100) / 100).toFixed(2);
  return raw ? text : `<span class="blurred-amount">${text}</span>`;
}
// Bedrag-invoer tolerant parsen: het NL-toetsenbord op iPhone typt een KOMMA
// ("187,50"); type="number"-velden maken de waarde dan stilletjes leeg.
// Gebruik daarom type="text" inputmode="decimal" + deze parser.
export function parseAmount(v) {
  // Vervang ALLE komma's door punten (NL decimaalscheidingsteken)
  return parseFloat(String(v ?? '').trim().replace(/,/g, '.'));
}
export function todayISO() { return new Date().toISOString(); }
export function ymd(d = new Date()) {
  const x = new Date(d);
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
}
export function startOfWeek(d = new Date()) {
  const x = new Date(d); const day = (x.getDay() + 6) % 7;
  x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - day); return x;
}
export function startOfMonth(d = new Date()) {
  const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(1); return x;
}
export function sameDay(a, b) { return ymd(a) === ymd(b); }
export function monthKey(d) {
  const x = new Date(d);
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0');
}
export function escapeHTML(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
}
export function orderedHabits(list) {
  const heads = list.filter(h => !h.after);
  const followers = list.filter(h => h.after);
  const out = [];
  function add(h) { out.push(h); followers.filter(f => f.after === h.id).forEach(add); }
  heads.forEach(add);
  list.forEach(h => { if (!out.some(x => x.id === h.id)) out.push(h); });
  return out;
}
