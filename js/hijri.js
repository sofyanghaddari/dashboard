// hijri.js — islamitische (umm al-qura) datum via Intl, geen library nodig.
// Gebruikt op de begroetingskaart (leer-element: NL + Arabisch naast elkaar)
// en voor Ramadan/Eid-detectie in de begroetingslucht.

export function hijriToday(d = new Date()) {
  try {
    const nl = new Intl.DateTimeFormat('nl-NL-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' })
      .format(d).replace(/\s*AH$/, '');
    const ar = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' })
      .format(d);
    const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { month: 'numeric', day: 'numeric' }).formatToParts(d);
    const month = +(parts.find(p => p.type === 'month')?.value || 0);
    const day   = +(parts.find(p => p.type === 'day')?.value || 0);
    return { nl, ar, month, day };
  } catch (_) {
    return null; // oude browser zonder islamic-umalqura → geen hijri-regel
  }
}

// Maand 9 = Ramadan
export const isRamadan = (h) => !!h && h.month === 9;
// Eid al-Fitr: 1-3 Shawwal (10) · Eid al-Adha: 10-13 Dhu al-Hijjah (12)
export const isEid = (h) => !!h && ((h.month === 10 && h.day <= 3) || (h.month === 12 && h.day >= 10 && h.day <= 13));
