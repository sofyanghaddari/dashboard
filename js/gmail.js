import { fmtMoney } from './utils.js';
import { invoiceEpcPayload, qrCanvas } from './sepa-qr.js';

let _gsiLoading  = null;
let _accessToken = null;
let _tokenExpiry = 0;

function loadGSI() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (_gsiLoading) return _gsiLoading;
  _gsiLoading = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src   = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload  = () => { _gsiLoading = null; resolve(); };
    s.onerror = () => { _gsiLoading = null; reject(new Error('Google-bibliotheek kon niet laden')); };
    document.head.appendChild(s);
  });
  return _gsiLoading;
}

export function gmailConfigured() {
  return !!localStorage.getItem('gmailClientId');
}

export function hasValidGmailToken() {
  return !!(_accessToken && Date.now() < _tokenExpiry);
}

// Laad GSI alvast in de achtergrond — aanroepen zodra de modal opent
export function preloadGSI() {
  if (gmailConfigured()) loadGSI().catch(() => {});
}

export async function getGmailToken() {
  const clientId = localStorage.getItem('gmailClientId');
  if (!clientId) throw new Error('Gmail niet ingesteld — voeg Client ID toe in Instellingen Instellingen → Data');
  if (_accessToken && Date.now() < _tokenExpiry) return _accessToken;
  await loadGSI();
  return new Promise((resolve, reject) => {
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId.trim(),
      scope: 'https://www.googleapis.com/auth/gmail.send',
      callback(resp) {
        if (resp.error) { reject(new Error(resp.error_description || resp.error)); return; }
        _accessToken = resp.access_token;
        _tokenExpiry  = Date.now() + ((resp.expires_in ?? 3600) - 60) * 1000;
        resolve(_accessToken);
      },
      error_callback: (e) => {
        const msg = e?.type === 'popup_closed'
          ? 'Popup gesloten — probeer opnieuw'
          : (e?.message?.includes('popup') || e?.message?.includes('window'))
            ? 'Popup geblokkeerd — zorg dat je ingelogd bent bij Google in Safari en probeer opnieuw'
            : (e?.message || 'OAuth mislukt');
        reject(new Error(msg));
      },
    });
    if (!tokenClient) {
      reject(new Error('Ongeldig Client ID — controleer Instellingen → Data (moet eindigen op .apps.googleusercontent.com)'));
      return;
    }
    // Gebruik lege prompt zodat Google stille herauth gebruikt als sessie actief is
    tokenClient.requestAccessToken({ prompt: '' });
  });
}

async function blobToBase64Lines(blob) {
  const buf   = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 = btoa(bin);
  return b64.match(/.{1,76}/g)?.join('\r\n') ?? b64;
}

// UTF-8 tekst → base64 in regels van 76 tekens (veilig voor lange HTML-regels)
function textToBase64Lines(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach(b => (bin += String.fromCharCode(b)));
  const b64 = btoa(bin);
  return b64.match(/.{1,76}/g)?.join('\r\n') ?? b64;
}

function toBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach(b => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function encodeSubject(str) {
  if (!/[^\x20-\x7E]/.test(str)) return str;
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach(b => (bin += String.fromCharCode(b)));
  return `=?UTF-8?B?${btoa(bin)}?=`;
}

const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
// '€ 75,00' nooit over twee regels laten breken
const nl2br = s => esc(s).replace(/€ (?=\d)/g, '€&nbsp;').replace(/\n/g, '<br>');
const money = n => fmtMoney(n || 0, true);

function parseDate(iso) {
  if (!iso) return null;
  const d = new Date(String(iso).length === 10 ? iso + 'T00:00:00' : iso);
  return isNaN(d) ? null : d;
}
function fmtDate(iso) {
  const d = parseDate(iso);
  return d ? d.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
}
function fmtDateLong(iso) {
  const d = parseDate(iso);
  return d ? d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
}
function isOverdue(iso) {
  const d = parseDate(iso);
  if (!d) return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return d < today;
}

function fmtIBANEmail(iban) { return String(iban || '').replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim(); }

// Alle regels + BTW per tarief (een ritten-factuur heeft meerdere regels)
function invoiceParts(inv, bedrijf = {}) {
  let lines = (inv.lines || []).filter(l => l && (l.description || l.amountExcl || l.amountIncl));
  if (!lines.length) lines = [{ description: bedrijf.defaultDesc || 'Dienst', vatRate: bedrijf.defaultVat ?? 0, amountExcl: inv.totalExcl || 0, vatAmount: inv.totalVat || 0, amountIncl: inv.totalIncl || 0 }];
  const vatByRate = new Map();
  for (const l of lines) {
    const rate = l.vatRate ?? 0;
    const vat  = l.vatAmount ?? ((l.amountIncl ?? 0) - (l.amountExcl ?? 0));
    vatByRate.set(rate, (vatByRate.get(rate) || 0) + vat);
  }
  if (!vatByRate.size) vatByRate.set(0, inv.totalVat || 0);
  return { lines, vatRows: [...vatByRate].sort((a, b) => b[0] - a[0]) };
}

function defaultMessage(inv, bedrijf) {
  const client = inv.client || {};
  return `Geachte ${client.name || 'relatie'},\n\nHierbij ontvangt u factuur ${inv.number || ''} van ${money(inv.totalIncl)}. `
    + `Wij verzoeken u het bedrag ${isOverdue(inv.dueDate) ? 'zo snel mogelijk' : `vóór ${fmtDateLong(inv.dueDate)}`} over te maken. De betaalgegevens staan hieronder en in de bijgevoegde PDF.`
    + `\n\nMet vriendelijke groet,\n${bedrijf.naam}`;
}

function buildHtmlEmail(inv, bedrijf, options = {}) {
  const client   = inv.client || {};
  const { lines, vatRows } = invoiceParts(inv, bedrijf);
  const overdue  = isOverdue(inv.dueDate);
  const message  = options.message || defaultMessage(inv, bedrijf);
  const BORDER   = '#e6e2dd';
  const MUTED    = '#8a857f';
  const ACCENT   = '#7A5C20';
  const cell     = `padding:12px 18px;border-bottom:1px solid ${BORDER};font-size:14px;line-height:1.5`;
  const label    = `${cell};color:${MUTED};white-space:nowrap`;
  const value    = `${cell};text-align:right`;
  const row      = (l, v, wrap = false) => `<tr><td style="${label}">${l}</td><td style="${value}${wrap ? '' : ';white-space:nowrap'}">${v}</td></tr>`;
  const dueText  = overdue
    ? `<span style="color:#B3261E">Vervallen op ${esc(fmtDateLong(inv.dueDate))}</span>`
    : `Te betalen vóór ${esc(fmtDateLong(inv.dueDate))}`;
  const preheader = `Factuur ${inv.number || ''} · ${money(inv.totalIncl)} · ${overdue ? 'vervallen op' : 'te betalen vóór'} ${fmtDateLong(inv.dueDate)}`;

  const lineRows = lines.map(l => `
        <tr>
          <td style="${cell};vertical-align:top">${nl2br(l.description || bedrijf.defaultDesc || 'Dienst')}</td>
          <td style="${value};vertical-align:top;white-space:nowrap">${esc(money(l.amountExcl ?? l.amountIncl))}</td>
        </tr>`).join('');

  const vatLines = vatRows.map(([rate, amt]) => row(`BTW ${esc(rate)}%`, esc(money(amt)))).join('');

  return `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Factuur ${esc(inv.number || '')}</title></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;color:#1a1a1a">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;margin:0 auto;padding:32px 20px">
    <tr><td>

      <!-- Bericht -->
      <p style="margin:0 0 28px;font-size:15px;color:#333;line-height:1.6">${nl2br(message)}</p>

      <!-- Factuurkaart -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
             style="border:1px solid ${BORDER};border-radius:12px;border-collapse:separate;border-spacing:0;overflow:hidden;margin-bottom:20px">
        <tr>
          <td colspan="2" style="padding:20px 18px 18px;border-bottom:1px solid ${BORDER};background:#faf9f7">
            <div style="font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:${ACCENT};font-weight:700">Factuur ${esc(inv.number || '')}</div>
            <div style="font-size:28px;font-weight:700;margin:6px 0 2px;color:#1a1a1a">${esc(money(inv.totalIncl))}</div>
            <div style="font-size:13px;color:${MUTED}">${dueText}</div>
          </td>
        </tr>
        ${row('Aan', `<strong>${esc(client.name || '—')}</strong>`, true)}
        ${row('Factuurdatum', esc(fmtDate(inv.date)))}
        ${row('Vervaldatum', esc(fmtDate(inv.dueDate)))}
        <tr><td colspan="2" style="padding:14px 18px 6px;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:${MUTED};font-weight:700">Omschrijving</td></tr>
        ${lineRows}
        ${row('Subtotaal (excl. BTW)', esc(money(inv.totalExcl)))}
        ${vatLines}
        <tr>
          <td style="padding:15px 18px;font-size:15px;font-weight:700">Totaal</td>
          <td style="padding:15px 18px;font-size:17px;font-weight:700;text-align:right;white-space:nowrap">${esc(money(inv.totalIncl))}</td>
        </tr>
      </table>

      <!-- Betaalgegevens -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
             style="background:#faf9f7;border-radius:10px;margin-bottom:20px">
        <tr>
          <td style="padding:14px 18px;font-size:13px;color:#444;line-height:1.75">
            ${overdue ? 'Graag zo snel mogelijk overmaken naar:' : `Maak het bedrag over vóór <strong>${esc(fmtDateLong(inv.dueDate))}</strong> naar:`}<br>
            <strong>IBAN:</strong> ${esc(fmtIBANEmail(bedrijf.iban))}<br>
            ${bedrijf.bic ? `<strong>BIC:</strong> ${esc(bedrijf.bic)}<br>` : ''}
            <strong>T.n.v.:</strong> ${esc(bedrijf.naam)}<br>
            <strong>O.v.v.:</strong> ${esc(inv.number || '—')}
          </td>
        </tr>${options.qrCid ? `
        <tr>
          <td style="padding:0 18px 16px">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${BORDER};width:100%">
              <tr>
                <td width="124" style="padding:14px 14px 0 0;vertical-align:middle">
                  <img src="cid:${options.qrCid}" width="120" height="120" alt="Betaal-QR" style="display:block;width:120px;height:120px;border-radius:6px;border:0">
                </td>
                <td style="padding:14px 0 0;vertical-align:middle;font-size:13px;color:#444;line-height:1.55">
                  <strong style="color:#1a1a1a">Direct betalen</strong><br>
                  Scan deze code met uw bank-app. Bedrag, IBAN en factuurnummer worden automatisch ingevuld.
                </td>
              </tr>
            </table>
          </td>
        </tr>` : ''}
      </table>

      <p style="font-size:13px;color:${MUTED};margin:0 0 22px">De factuur zit als PDF in de bijlage.</p>

      <hr style="border:none;border-top:1px solid ${BORDER};margin:0 0 16px">

      <!-- Bedrijfsgegevens -->
      <p style="font-size:12px;color:${MUTED};margin:0;line-height:1.7">
        <strong style="color:#1a1a1a">${esc(bedrijf.naam)}</strong>${bedrijf.tagline ? ` · ${esc(bedrijf.tagline)}` : ''}<br>
        ${esc(bedrijf.adres)}, ${esc(bedrijf.postcode)}<br>
        KvK ${esc(bedrijf.kvk)} &nbsp;·&nbsp; BTW ${esc(bedrijf.btw)}
      </p>

    </td></tr>
  </table>
</td></tr></table>
</body>
</html>`;
}

// Platte-tekstversie (multipart/alternative) — beter voor spamfilters en tekst-only clients
function buildTextEmail(inv, bedrijf, options = {}) {
  const client = inv.client || {};
  const { lines, vatRows } = invoiceParts(inv, bedrijf);
  const overdue = isOverdue(inv.dueDate);
  const out = [
    options.message || defaultMessage(inv, bedrijf),
    '',
    '----------------------------------------',
    `Factuur:       ${inv.number || '—'}`,
    `Aan:           ${client.name || '—'}`,
    `Factuurdatum:  ${fmtDate(inv.date)}`,
    `Vervaldatum:   ${fmtDate(inv.dueDate)}`,
    '',
    ...lines.map(l => `${String(l.description || bedrijf.defaultDesc || 'Dienst').replace(/\n+/g, ' · ')}\n  ${money(l.amountExcl ?? l.amountIncl)}`),
    '',
    `Subtotaal (excl. BTW): ${money(inv.totalExcl)}`,
    ...vatRows.map(([rate, amt]) => `BTW ${rate}%: ${money(amt)}`),
    `Totaal: ${money(inv.totalIncl)}`,
    '----------------------------------------',
    '',
    overdue ? 'Graag zo snel mogelijk overmaken naar:' : `Maak het bedrag over vóór ${fmtDateLong(inv.dueDate)} naar:`,
    `IBAN: ${fmtIBANEmail(bedrijf.iban)}`,
    ...(bedrijf.bic ? [`BIC: ${bedrijf.bic}`] : []),
    `T.n.v.: ${bedrijf.naam}`,
    `O.v.v.: ${inv.number || '—'}`,
    '',
    'De factuur zit als PDF in de bijlage.',
    '',
    `${bedrijf.naam}${bedrijf.tagline ? ' · ' + bedrijf.tagline : ''}`,
    `${bedrijf.adres}, ${bedrijf.postcode}`,
    `KvK ${bedrijf.kvk} · BTW ${bedrijf.btw}`,
  ];
  return out.join('\n').replace(/\r?\n/g, '\r\n');
}

export async function sendInvoiceEmail(inv, bedrijf, pdfBlob, options = {}) {
  const to = options.to || inv.client?.email;
  if (!to) throw new Error('Geen e-mailadres bij deze klant');

  const filename = `${inv.number || 'factuur'}.pdf`;
  const subject  = options.subject || `${options.subjectPrefix || ''}Factuur ${inv.number} — ${bedrijf.naam}`;
  // Betaal-QR als ingesloten PNG (cid) — Gmail toont geen data:-afbeeldingen
  let qrB64 = null;
  try {
    const payload = invoiceEpcPayload(inv, bedrijf);
    if (payload) qrB64 = qrCanvas(payload).toDataURL('image/png').split(',')[1] || null;
  } catch (_) { qrB64 = null; }
  const qrCid    = qrB64 ? `betaal-qr-${Date.now().toString(36)}@dashboard` : null;

  const htmlBody = buildHtmlEmail(inv, bedrijf, { message: options.message, qrCid });
  const textBody = buildTextEmail(inv, bedrijf, { message: options.message });
  const pdfB64   = await blobToBase64Lines(pdfBlob);
  const rnd      = () => Math.random().toString(36).slice(2);
  const outerB   = `----=_Mixed_${rnd()}`;
  const altB     = `----=_Alt_${rnd()}`;
  const relB     = `----=_Rel_${rnd()}`;
  const htmlPart = [
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    textToBase64Lines(htmlBody),
  ];
  const htmlBlock = qrB64 ? [
    `Content-Type: multipart/related; boundary="${relB}"`,
    '',
    `--${relB}`,
    ...htmlPart,
    `--${relB}`,
    'Content-Type: image/png; name="betaal-qr.png"',
    'Content-Transfer-Encoding: base64',
    `Content-ID: <${qrCid}>`,
    'Content-Disposition: inline; filename="betaal-qr.png"',
    '',
    qrB64.match(/.{1,76}/g).join('\r\n'),
    `--${relB}--`,
  ] : htmlPart;
  const clean    = v => String(v).replace(/[\r\n]+/g, ' ').trim();

  const mime = [
    'From: me',
    `To: ${clean(to)}`,
    ...(options.cc ? [`Cc: ${clean(options.cc)}`] : []),
    `Subject: ${encodeSubject(clean(subject))}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${outerB}"`,
    '',
    `--${outerB}`,
    `Content-Type: multipart/alternative; boundary="${altB}"`,
    '',
    `--${altB}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    textToBase64Lines(textBody),
    `--${altB}`,
    ...htmlBlock,
    `--${altB}--`,
    '',
    `--${outerB}`,
    `Content-Type: application/pdf; name="${filename}"`,
    'Content-Transfer-Encoding: base64',
    `Content-Disposition: attachment; filename="${filename}"`,
    '',
    pdfB64,
    `--${outerB}--`,
  ].join('\r\n');

  const token = await getGmailToken();
  const resp  = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: toBase64Url(mime) }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.error?.message || `Gmail-fout ${resp.status}`);
  }
  return resp.json();
}
