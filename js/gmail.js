import { fmtMoney } from './utils.js';

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

export async function getGmailToken() {
  const clientId = localStorage.getItem('gmailClientId');
  if (!clientId) throw new Error('Gmail niet ingesteld — voeg Client ID toe in ⚙️ Instellingen → Data');
  if (_accessToken && Date.now() < _tokenExpiry) return _accessToken;
  await loadGSI();
  return new Promise((resolve, reject) => {
    google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/gmail.send',
      callback(resp) {
        if (resp.error) { reject(new Error(resp.error_description || resp.error)); return; }
        _accessToken = resp.access_token;
        _tokenExpiry  = Date.now() + ((resp.expires_in ?? 3600) - 60) * 1000;
        resolve(_accessToken);
      },
      error_callback: (e) => reject(new Error(e?.message || 'OAuth mislukt')),
    }).requestToken();
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

export async function sendInvoiceEmail(inv, bedrijf, pdfBlob) {
  const to = inv.client?.email;
  if (!to) throw new Error('Geen e-mailadres bij deze klant');

  const filename = `${inv.number || 'factuur'}.pdf`;
  const subject  = `Factuur ${inv.number} — ${bedrijf.naam}`;

  const body = [
    `Geachte ${inv.client?.name || 'relatie'},`,
    '',
    `Hierbij ontvangt u factuur ${inv.number} van ${bedrijf.naam}.`,
    `De PDF is bijgevoegd als bijlage.`,
    '',
    `Factuurnummer : ${inv.number || '—'}`,
    `Factuurdatum  : ${inv.date   || '—'}`,
    `Vervaldatum   : ${inv.dueDate || '—'}`,
    `Bedrag        : ${fmtMoney(inv.totalIncl || 0)} (incl. BTW ${inv.lines?.[0]?.vatRate ?? 0}%)`,
    '',
    'Betalingsgegevens:',
    `IBAN  : ${bedrijf.iban}`,
    `T.n.v.: ${bedrijf.naam}`,
    `O.v.v.: ${inv.number || '—'}`,
    '',
    `Gelieve het bedrag voor ${inv.dueDate || '—'} over te maken.`,
    '',
    'Met vriendelijke groet,',
    bedrijf.naam,
    `KvK: ${bedrijf.kvk}  |  BTW: ${bedrijf.btw}`,
  ].join('\n');

  const pdfB64 = await blobToBase64Lines(pdfBlob);
  const bound  = `----=_Part_${Math.random().toString(36).slice(2)}`;

  const mime = [
    'From: me',
    `To: ${to}`,
    `Subject: ${encodeSubject(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${bound}"`,
    '',
    `--${bound}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    body,
    '',
    `--${bound}`,
    `Content-Type: application/pdf; name="${filename}"`,
    'Content-Transfer-Encoding: base64',
    `Content-Disposition: attachment; filename="${filename}"`,
    '',
    pdfB64,
    `--${bound}--`,
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
