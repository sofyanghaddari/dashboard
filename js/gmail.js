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

const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  try { return new Date(dateStr).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch { return dateStr; }
}

function buildHtmlEmail(inv, bedrijf) {
  const client = inv.client || {};
  const line   = inv.lines?.[0] || {};
  const TAUPE  = '#8a7e6f';

  return `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;color:#1a1a1a">
<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;margin:0 auto;padding:36px 20px">
    <tr><td>

      <!-- Aanhef -->
      <p style="margin:0 0 6px;font-size:16px">Beste${client.name ? ' ' + esc(client.name) : ''},</p>
      <p style="margin:0 0 28px;font-size:15px;color:#444">Gelieve bijgevoegde factuur voor de daarop vermelde datum te betalen.</p>

      <!-- Factuurkaart -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0"
             style="border:1px solid #e0ddd9;border-radius:12px;border-collapse:separate;border-spacing:0;overflow:hidden;margin-bottom:24px">

        <!-- Factuurdatum -->
        <tr>
          <td style="padding:13px 16px;border-bottom:1px solid #e0ddd9;font-size:14px;color:#888">Factuurdatum</td>
          <td style="padding:13px 16px;border-bottom:1px solid #e0ddd9;font-size:14px;text-align:right">${esc(fmtDate(inv.date))}</td>
        </tr>

        <!-- Vervaldatum -->
        <tr>
          <td style="padding:13px 16px;border-bottom:1px solid #e0ddd9;font-size:14px;color:#888">Vervaldatum</td>
          <td style="padding:13px 16px;border-bottom:1px solid #e0ddd9;font-size:14px;text-align:right">${esc(fmtDate(inv.dueDate))}</td>
        </tr>

        <!-- Klant + factuurnummer -->
        <tr>
          <td colspan="2" style="padding:13px 16px;border-bottom:1px solid #e0ddd9">
            <div style="font-weight:700;font-size:15px;margin-bottom:3px">${esc(client.name || '—')}</div>
            <div style="font-size:13px;color:#888">Factuurnummer: ${esc(inv.number || '—')}</div>
          </td>
        </tr>

        <!-- Afzender-adres -->
        <tr>
          <td colspan="2" style="padding:13px 16px;border-bottom:1px solid #e0ddd9;font-size:14px;color:#2563eb;line-height:1.65">
            ${esc(bedrijf.naam)}<br>
            ${esc(bedrijf.adres)}<br>
            ${esc(bedrijf.postcode)}<br>
            Nederland
          </td>
        </tr>

        <!-- Omschrijving -->
        ${line.description ? `
        <tr>
          <td style="padding:13px 16px;border-bottom:1px solid #e0ddd9;font-size:14px;color:#888">Omschrijving</td>
          <td style="padding:13px 16px;border-bottom:1px solid #e0ddd9;font-size:14px;text-align:right">${esc(line.description)}</td>
        </tr>` : ''}

        <!-- Subtotaal -->
        <tr>
          <td style="padding:13px 16px;border-bottom:1px solid #e0ddd9;font-size:14px;color:#888">Subtotaal</td>
          <td style="padding:13px 16px;border-bottom:1px solid #e0ddd9;font-size:14px;text-align:right">${esc(fmtMoney(inv.totalExcl || 0))}</td>
        </tr>

        <!-- BTW -->
        <tr>
          <td style="padding:13px 16px;border-bottom:1px solid #e0ddd9;font-size:14px;color:#888">BTW ${line.vatRate ?? 0}%</td>
          <td style="padding:13px 16px;border-bottom:1px solid #e0ddd9;font-size:14px;text-align:right">${esc(fmtMoney(inv.totalVat || 0))}</td>
        </tr>

        <!-- Totaal -->
        <tr style="background:#faf9f7">
          <td style="padding:15px 16px;font-size:15px;font-weight:700">Totaal</td>
          <td style="padding:15px 16px;font-size:17px;font-weight:700;text-align:right;color:${TAUPE}">${esc(fmtMoney(inv.totalIncl || 0))}</td>
        </tr>

      </table>

      <!-- Betaalinfo -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0"
             style="background:#faf9f7;border-radius:10px;margin-bottom:24px">
        <tr>
          <td style="padding:14px 16px;font-size:13px;color:#555;line-height:1.6">
            Maak het bedrag over vóór <strong>${esc(fmtDate(inv.dueDate))}</strong> naar:<br>
            <strong>IBAN:</strong> ${esc(bedrijf.iban)}<br>
            <strong>T.n.v.:</strong> ${esc(bedrijf.naam)}<br>
            <strong>O.v.v.:</strong> ${esc(inv.number || '—')}
          </td>
        </tr>
      </table>

      <p style="font-size:13px;color:#999;margin:0 0 20px">De PDF-factuur is bijgevoegd als bijlage.</p>

      <hr style="border:none;border-top:1px solid #e8e5e1;margin:0 0 20px">

      <!-- Footer -->
      <p style="font-size:13px;color:#999;margin:0;line-height:1.6">
        Met vriendelijke groet,<br>
        <strong style="color:#1a1a1a">${esc(bedrijf.naam)}</strong><br>
        KvK: ${esc(bedrijf.kvk)} &nbsp;·&nbsp; BTW: ${esc(bedrijf.btw)}
      </p>

    </td></tr>
  </table>
</td></tr></table>
</body>
</html>`;
}

export async function sendInvoiceEmail(inv, bedrijf, pdfBlob, options = {}) {
  const to = options.to || inv.client?.email;
  if (!to) throw new Error('Geen e-mailadres bij deze klant');

  const filename = `${inv.number || 'factuur'}.pdf`;
  const subject  = `${options.subjectPrefix || ''}Factuur ${inv.number} — ${bedrijf.naam}`;
  const htmlBody = buildHtmlEmail(inv, bedrijf);
  const pdfB64   = await blobToBase64Lines(pdfBlob);
  const outerB   = `----=_Mixed_${Math.random().toString(36).slice(2)}`;

  const mime = [
    'From: me',
    `To: ${to}`,
    `Subject: ${encodeSubject(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${outerB}"`,
    '',
    `--${outerB}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    htmlBody,
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
