// SEPA-betaal-QR (EPC069-12, ook "GiroCode"): de klant scant 'm in de bank-app en
// IBAN, naam, bedrag en factuurnummer staan meteen ingevuld.
// Werkt o.a. in de apps van ING, bunq, SNS, ASN en Knab — NIET in Rabobank/ABN AMRO,
// dus de gewone betaalgegevens blijven altijd naast de QR staan.
import qrcode from './vendor/qrcode-generator.js';

qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];

const clean = (s, max) => String(s ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, max);

// Geeft null terug als de gegevens geen geldige EPC-betaling opleveren
export function epcPayload({ name, iban, bic, amount, reference }) {
  const ibanC = String(iban || '').replace(/\s/g, '').toUpperCase();
  const amt   = Math.round(Number(amount) * 100) / 100;
  const naam  = clean(name, 70);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(ibanC)) return null;
  if (!(amt >= 0.01 && amt <= 999999999.99)) return null;
  if (!naam) return null;
  return [
    'BCD',                 // service tag
    '002',                 // versie
    '1',                   // tekenset UTF-8
    'SCT',                 // SEPA Credit Transfer
    clean(bic, 11),
    naam,
    ibanC,
    'EUR' + amt.toFixed(2),
    '',                    // purpose
    '',                    // gestructureerd kenmerk (niet gebruikt)
    clean(reference, 140), // omschrijving = factuurnummer
  ].join('\n');
}

// Alleen voor openstaande facturen met een positief bedrag
export function invoiceEpcPayload(inv, bedrijf) {
  if (!inv || !bedrijf || inv.status === 'betaald') return null;
  return epcPayload({
    name: bedrijf.naam, iban: bedrijf.iban, bic: bedrijf.bic,
    amount: inv.totalIncl, reference: inv.number,
  });
}

// Foutcorrectie M, zoals de EPC-richtlijn voorschrijft
export function qrModules(text) {
  const qr = qrcode(0, 'M');
  qr.addData(text, 'Byte');
  qr.make();
  const n = qr.getModuleCount();
  return { n, isDark: (r, c) => qr.isDark(r, c) };
}

// PNG (canvas) voor in de e-mail — witte achtergrond + stille zone van 4 modules
export function qrCanvas(text, scale = 6, margin = 4) {
  const { n, isDark } = qrModules(text);
  const size = (n + margin * 2) * scale;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const g = cv.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, size, size);
  g.fillStyle = '#000000';
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if (isDark(r, c)) g.fillRect((c + margin) * scale, (r + margin) * scale, scale, scale);
  return cv;
}

// Vector-SVG voor de HTML-/printversie van de factuur
export function qrSvg(text, px = 120, margin = 4) {
  const { n, isDark } = qrModules(text);
  let d = '';
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if (isDark(r, c)) d += `M${c + margin} ${r + margin}h1v1h-1z`;
  const vb = n + margin * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${vb} ${vb}" shape-rendering="crispEdges" role="img" aria-label="Betaal-QR"><rect width="${vb}" height="${vb}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}
