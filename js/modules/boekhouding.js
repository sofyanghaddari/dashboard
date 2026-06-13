import { all, put, del, add } from '../db.js';
import { uid, fmtMoney, parseAmount, escapeHTML, ymd } from '../utils.js';
import { ok, err } from '../components/toast.js';
import { parseInvoiceText } from '../invoice-nlp.js';

const BEDRIJF = {
  naam:     'Woosh-Amsterdam',
  adres:    'Jephtastraat 28',
  postcode: '1055JV Amsterdam',
  btw:      'NL003042226B35',
  kvk:      '77755170',
  iban:     'NL67INGB0660701413',
  termijn:  30,
};

// ─── helpers ────────────────────────────────────────────────────────────────

async function nextNumber() {
  const invoices = await all('invoices');
  const year = new Date().getFullYear();
  const prefix = `WOOSH-${year}-`;
  const nums = invoices
    .map(i => i.number || '')
    .filter(n => n.startsWith(prefix))
    .map(n => parseInt(n.replace(prefix, ''), 10) || 0);
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `${prefix}${String(next).padStart(3, '0')}`;
}

function computeStatus(inv) {
  if (inv.status === 'betaald') return 'betaald';
  if (inv.dueDate && inv.dueDate < ymd()) return 'te-laat';
  return 'open';
}

function calcVat(amount, vatRate, isIncl) {
  if (isIncl) {
    const excl = amount / (1 + vatRate / 100);
    const vat  = amount - excl;
    return { amountExcl: excl, vatAmount: vat, amountIncl: amount };
  }
  const vat  = amount * (vatRate / 100);
  const incl = amount + vat;
  return { amountExcl: amount, vatAmount: vat, amountIncl: incl };
}

function fmtDateLong(iso) {
  if (!iso) return '—';
  return new Date(iso + 'T00:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return ymd(d);
}

function fmtIBAN(iban) {
  return iban.replace(/(.{4})/g, '$1 ').trim();
}

function statusLabel(s) {
  return s === 'betaald' ? 'Betaald' : s === 'te-laat' ? 'Vervallen' : 'Open';
}

// ─── main render ────────────────────────────────────────────────────────────

export async function render(container) {
  const invoices = await all('invoices');
  const now      = new Date();
  const yearStr  = String(now.getFullYear());

  const withStatus = invoices.map(inv => ({ ...inv, _status: computeStatus(inv) }));

  const openList  = withStatus.filter(i => i._status !== 'betaald');
  const paidList  = withStatus.filter(i => i._status === 'betaald');
  const totalOpen = openList.reduce((s, i) => s + (i.totalIncl || 0), 0);
  const paidYear  = paidList
    .filter(i => (i.date || '').startsWith(yearStr))
    .reduce((s, i) => s + (i.totalIncl || 0), 0);
  const curQ = Math.floor(now.getMonth() / 3);
  const vatQ  = withStatus
    .filter(i => {
      if (!i.date) return false;
      const d = new Date(i.date + 'T00:00:00');
      return d.getFullYear() === now.getFullYear() && Math.floor(d.getMonth() / 3) === curQ;
    })
    .reduce((s, i) => s + (i.totalVat || 0), 0);

  const sorted = [...withStatus].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  container.innerHTML = `
    <div class="page-title-row">
      <h1 class="page-title">Boekhouding</h1>
      <button class="btn bk-new-btn" id="bk-new-btn">+ Nieuwe factuur</button>
    </div>

    <div class="bk-stats">
      <div class="bk-stat">
        <div class="bk-stat-label">Openstaand</div>
        <div class="bk-stat-val money">${fmtMoney(totalOpen)}</div>
        <div class="bk-stat-sub">${openList.length} factuur${openList.length !== 1 ? 'en' : ''}</div>
      </div>
      <div class="bk-stat">
        <div class="bk-stat-label">Betaald ${yearStr}</div>
        <div class="bk-stat-val money">${fmtMoney(paidYear)}</div>
        <div class="bk-stat-sub">${paidList.filter(i => (i.date||'').startsWith(yearStr)).length} facturen</div>
      </div>
      <div class="bk-stat">
        <div class="bk-stat-label">BTW Q${curQ + 1}</div>
        <div class="bk-stat-val money">${fmtMoney(vatQ)}</div>
        <div class="bk-stat-sub">af te dragen</div>
      </div>
    </div>

    ${sorted.length === 0 ? `
      <div class="section-empty" style="margin-top:40px">
        <div style="font-size:2.5rem;margin-bottom:12px">🧾</div>
        <p style="font-weight:600;margin:0 0 6px">Nog geen facturen</p>
        <p class="muted" style="font-size:.85rem;margin:0">Tik op "+ Nieuwe factuur" om te beginnen</p>
      </div>
    ` : `
      <div class="bk-list">
        ${sorted.map(inv => `
          <div class="bk-card card" data-id="${escapeHTML(inv.id)}">
            <div class="bk-card-top">
              <span class="bk-card-client">${escapeHTML(inv.client?.name || '—')}</span>
              <span class="bk-status bk-status-${inv._status}">${statusLabel(inv._status)}</span>
            </div>
            <div class="bk-card-mid">
              <span class="bk-card-num">${escapeHTML(inv.number || '')}</span>
              <span>·</span>
              <span class="bk-card-date">${fmtDateLong(inv.date)}</span>
            </div>
            <div class="bk-card-bot">
              <span class="bk-card-amount money">${fmtMoney(inv.totalIncl || 0)}</span>
              <div class="bk-card-actions">
                ${inv._status !== 'betaald' ? `<button class="bk-btn-paid" data-id="${escapeHTML(inv.id)}">✓ Betaald</button>` : ''}
                <button class="bk-btn-print" data-id="${escapeHTML(inv.id)}">🖨️</button>
              </div>
            </div>
            ${inv._status === 'te-laat' ? `<div class="bk-overdue-bar">⚠️ Vervallen op ${fmtDateLong(inv.dueDate)}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `}
  `;

  container.querySelector('#bk-new-btn').onclick = () => openNewModal(container);

  container.querySelectorAll('.bk-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.bk-btn-paid, .bk-btn-print')) return;
      const inv = withStatus.find(i => i.id === card.dataset.id);
      if (inv) openDetailModal(inv, container);
    });
  });

  container.querySelectorAll('.bk-btn-paid').forEach(btn => {
    btn.onclick = async e => {
      e.stopPropagation();
      const inv = withStatus.find(i => i.id === btn.dataset.id);
      if (!inv) return;
      await put('invoices', { ...inv, status: 'betaald', paidAt: ymd() });
      ok('Factuur gemarkeerd als betaald ✓');
      render(container);
    };
  });

  container.querySelectorAll('.bk-btn-print').forEach(btn => {
    btn.onclick = async e => {
      e.stopPropagation();
      const inv = withStatus.find(i => i.id === btn.dataset.id);
      if (inv) printInvoice(inv);
    };
  });
}

// ─── new invoice modal ───────────────────────────────────────────────────────

async function openNewModal(container) {
  const number   = await nextNumber();
  const todayStr = ymd();
  const dueStr   = addDays(todayStr, BEDRIJF.termijn);

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal bk-modal">
      <button type="button" class="modal-close" id="bk-x">×</button>
      <h2 style="margin:0 0 18px">Nieuwe factuur</h2>

      <div class="bk-paste-section">
        <label class="bk-paste-label">📋 Plak WhatsApp- of e-mailtekst — velden worden automatisch ingevuld</label>
        <textarea id="bk-paste" class="bk-paste-area" rows="5"
          placeholder="Supreme Transit Solutions&#10;Baden Powellweg&#10;Amsterdam 1069 LK&#10;KvK: 85234362&#10;Email: info@voorbeeld.nl&#10;€320 incl 9% btw"></textarea>
        <div id="bk-parsed-preview" class="bk-parsed-preview" style="display:none"></div>
      </div>

      <div class="bk-divider">— of handmatig invullen —</div>

      <form id="bk-form" autocomplete="off">
        <div class="bk-form-section">
          <div class="bk-section-title">Klantgegevens</div>
          <label>Bedrijfsnaam / naam *</label>
          <input id="bk-client-name" type="text" placeholder="Bedrijfsnaam" required />
          <label>Straat + huisnummer</label>
          <input id="bk-client-addr" type="text" placeholder="Straatnaam 1" />
          <label>Postcode + stad</label>
          <input id="bk-client-city" type="text" placeholder="1234 AB Amsterdam" />
          <label>KvK-nummer</label>
          <input id="bk-client-kvk" type="text" placeholder="12345678" inputmode="numeric" />
          <label>E-mailadres</label>
          <input id="bk-client-email" type="email" placeholder="info@bedrijf.nl" />
        </div>

        <div class="bk-form-section">
          <div class="bk-section-title">Factuurgegevens</div>
          <label>Omschrijving *</label>
          <input id="bk-desc" type="text" placeholder="Vervoersdienst" value="Vervoersdienst" required />
          <label>Bedrag *</label>
          <div class="bk-amount-row">
            <input id="bk-amount" type="text" inputmode="decimal" placeholder="320" required />
            <label class="bk-radio"><input type="radio" name="bk-ie" value="incl" checked /> Incl. BTW</label>
            <label class="bk-radio"><input type="radio" name="bk-ie" value="excl" /> Excl. BTW</label>
          </div>
          <label style="margin-top:10px">BTW-tarief</label>
          <select id="bk-vat">
            <option value="9">9% — verlaagd (personenvervoer)</option>
            <option value="21">21% — standaard</option>
            <option value="0">0% — vrijgesteld</option>
          </select>
          <div id="bk-calc" class="bk-calc-preview" style="display:none"></div>
        </div>

        <div class="bk-form-section">
          <div class="bk-section-title">Nummering &amp; datum</div>
          <label>Factuurnummer</label>
          <input id="bk-number" type="text" value="${escapeHTML(number)}" required />
          <label>Factuurdatum</label>
          <input id="bk-date" type="date" value="${todayStr}" required />
          <label>Vervaldatum (${BEDRIJF.termijn} dagen)</label>
          <input id="bk-due" type="date" value="${dueStr}" required />
        </div>

        <label>Notitie (intern, staat niet op factuur)</label>
        <textarea id="bk-note" rows="2" style="width:100%;resize:vertical" placeholder="Optionele interne notitie…"></textarea>

        <button type="submit" class="btn block" style="margin-top:20px;font-size:1rem;padding:14px">🧾 Factuur aanmaken &amp; afdrukken</button>
      </form>
    </div>
  `;

  document.body.appendChild(backdrop);
  backdrop.querySelector('#bk-x').onclick = () => backdrop.remove();
  backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.remove(); });

  // Smart paste – live parsing with 300ms debounce
  const pasteArea = backdrop.querySelector('#bk-paste');
  const preview   = backdrop.querySelector('#bk-parsed-preview');
  let parseTimer  = null;

  pasteArea.addEventListener('input', () => {
    clearTimeout(parseTimer);
    parseTimer = setTimeout(() => {
      const parsed = parseInvoiceText(pasteArea.value);
      applyParsed(parsed, backdrop, preview);
      refreshCalc(backdrop);
    }, 300);
  });

  // Live VAT calc on amount/rate/incl change
  ['#bk-amount', '#bk-vat'].forEach(sel => {
    backdrop.querySelector(sel).addEventListener('input', () => refreshCalc(backdrop));
  });
  backdrop.querySelectorAll('input[name="bk-ie"]').forEach(r => {
    r.addEventListener('change', () => refreshCalc(backdrop));
  });

  // Update due date when invoice date changes
  backdrop.querySelector('#bk-date').addEventListener('change', e => {
    backdrop.querySelector('#bk-due').value = addDays(e.target.value, BEDRIJF.termijn);
  });

  // Form submit
  backdrop.querySelector('#bk-form').onsubmit = async e => {
    e.preventDefault();
    const clientName = backdrop.querySelector('#bk-client-name').value.trim();
    const raw        = parseAmount(backdrop.querySelector('#bk-amount').value);
    if (!clientName) { err('Vul een klantnaam in'); return; }
    if (!raw || isNaN(raw) || raw <= 0) { err('Vul een geldig bedrag in'); return; }

    const vatRate = parseInt(backdrop.querySelector('#bk-vat').value);
    const isIncl  = backdrop.querySelector('input[name="bk-ie"]:checked')?.value === 'incl';
    const { amountExcl, vatAmount, amountIncl } = calcVat(raw, vatRate, isIncl);

    const inv = {
      id:      uid(),
      number:  backdrop.querySelector('#bk-number').value.trim(),
      date:    backdrop.querySelector('#bk-date').value,
      dueDate: backdrop.querySelector('#bk-due').value,
      status:  'open',
      note:    backdrop.querySelector('#bk-note').value.trim(),
      client: {
        name:    clientName,
        address: backdrop.querySelector('#bk-client-addr').value.trim(),
        city:    backdrop.querySelector('#bk-client-city').value.trim(),
        kvk:     backdrop.querySelector('#bk-client-kvk').value.trim(),
        email:   backdrop.querySelector('#bk-client-email').value.trim(),
      },
      lines: [{
        description: backdrop.querySelector('#bk-desc').value.trim() || 'Vervoersdienst',
        amountExcl,
        vatRate,
        vatAmount,
        amountIncl,
      }],
      totalExcl:  amountExcl,
      totalVat:   vatAmount,
      totalIncl:  amountIncl,
    };

    await add('invoices', inv);
    ok(`Factuur ${inv.number} aangemaakt`);
    backdrop.remove();
    render(container);
    printInvoice(inv);
  };
}

function applyParsed(parsed, backdrop, preview) {
  if (!parsed) return;
  const set = (id, val) => { if (val != null) backdrop.querySelector(id).value = val; };
  set('#bk-client-name',  parsed.clientName);
  set('#bk-client-addr',  parsed.clientAddress);
  set('#bk-client-city',  parsed.clientCity);
  set('#bk-client-kvk',   parsed.clientKvk);
  set('#bk-client-email', parsed.clientEmail);
  if (parsed.amount != null) set('#bk-amount', parsed.amount);
  if (parsed.vatRate != null) backdrop.querySelector('#bk-vat').value = String(parsed.vatRate);
  if (parsed.isIncl !== null) {
    const radio = backdrop.querySelector(`input[name="bk-ie"][value="${parsed.isIncl ? 'incl' : 'excl'}"]`);
    if (radio) radio.checked = true;
  }
  if (parsed.description) set('#bk-desc', parsed.description);

  const found = [
    parsed.clientName && `<strong>${escapeHTML(parsed.clientName)}</strong>`,
    parsed.amount != null && `€${parsed.amount}`,
    parsed.vatRate != null && `${parsed.vatRate}% BTW`,
    parsed.isIncl !== null && (parsed.isIncl ? 'incl.' : 'excl.'),
    parsed.clientEmail && parsed.clientEmail,
  ].filter(Boolean);

  if (found.length) {
    preview.style.display = 'block';
    preview.innerHTML = `✅ Gevonden: ${found.join(' · ')}`;
  }
}

function refreshCalc(backdrop) {
  const calcEl  = backdrop.querySelector('#bk-calc');
  const raw     = parseAmount(backdrop.querySelector('#bk-amount').value);
  const vatRate = parseInt(backdrop.querySelector('#bk-vat').value) || 0;
  const isIncl  = backdrop.querySelector('input[name="bk-ie"]:checked')?.value === 'incl';
  if (!raw || isNaN(raw) || raw <= 0) { calcEl.style.display = 'none'; return; }
  const { amountExcl, vatAmount, amountIncl } = calcVat(raw, vatRate, isIncl);
  calcEl.style.display = 'block';
  calcEl.innerHTML = `
    <div class="bk-calc-row"><span>Excl. BTW</span><span>${fmtMoney(amountExcl)}</span></div>
    <div class="bk-calc-row"><span>BTW ${vatRate}%</span><span>${fmtMoney(vatAmount)}</span></div>
    <div class="bk-calc-row bk-calc-total"><span>Totaal incl. BTW</span><span class="money">${fmtMoney(amountIncl)}</span></div>
  `;
}

// ─── detail modal ────────────────────────────────────────────────────────────

function openDetailModal(inv, container) {
  const status = computeStatus(inv);
  const line   = inv.lines?.[0] || {};

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal bk-modal">
      <button type="button" class="modal-close" id="det-x">×</button>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
        <div>
          <div style="font-size:.75rem;text-transform:uppercase;letter-spacing:.07em;color:var(--text-dim);margin-bottom:4px">Factuur</div>
          <div style="font-size:1.2rem;font-weight:700">${escapeHTML(inv.number || '—')}</div>
        </div>
        <span class="bk-status bk-status-${status}" style="font-size:.8rem">${statusLabel(status)}</span>
      </div>

      <div class="bk-detail-block">
        <div class="bk-detail-label">Klant</div>
        <div class="bk-detail-val">${escapeHTML(inv.client?.name || '—')}</div>
        ${inv.client?.address ? `<div style="color:var(--text-dim);font-size:.88rem">${escapeHTML(inv.client.address)}</div>` : ''}
        ${inv.client?.city    ? `<div style="color:var(--text-dim);font-size:.88rem">${escapeHTML(inv.client.city)}</div>` : ''}
        ${inv.client?.kvk     ? `<div style="color:var(--text-dim);font-size:.88rem">KvK: ${escapeHTML(inv.client.kvk)}</div>` : ''}
        ${inv.client?.email   ? `<div style="color:var(--text-dim);font-size:.88rem">${escapeHTML(inv.client.email)}</div>` : ''}
      </div>

      <div class="bk-detail-block">
        <div class="bk-detail-label">Data</div>
        <div class="bk-detail-row"><span>Factuurdatum</span><span>${fmtDateLong(inv.date)}</span></div>
        <div class="bk-detail-row"><span>Vervaldatum</span><span>${fmtDateLong(inv.dueDate)}</span></div>
        ${inv.paidAt ? `<div class="bk-detail-row"><span>Betaald op</span><span>${fmtDateLong(inv.paidAt)}</span></div>` : ''}
      </div>

      <div class="bk-detail-block">
        <div class="bk-detail-label">Bedragen</div>
        <div class="bk-detail-row"><span>${escapeHTML(line.description || 'Vervoersdienst')}</span><span></span></div>
        <div class="bk-detail-row"><span>Excl. BTW</span><span>${fmtMoney(inv.totalExcl || 0)}</span></div>
        <div class="bk-detail-row"><span>BTW ${line.vatRate || 0}%</span><span>${fmtMoney(inv.totalVat || 0)}</span></div>
        <div class="bk-detail-row bk-detail-total"><span>Totaal</span><span class="money">${fmtMoney(inv.totalIncl || 0)}</span></div>
      </div>

      ${inv.note ? `<div class="bk-detail-block"><div class="bk-detail-label">Notitie</div><div style="font-size:.9rem;color:var(--text-dim)">${escapeHTML(inv.note)}</div></div>` : ''}

      <div class="bk-detail-actions">
        <button class="btn" id="det-print" style="flex:1">🖨️ Afdrukken</button>
        ${status !== 'betaald' ? `<button class="btn" id="det-paid" style="flex:1;background:var(--ok);color:#1a1a1a">✓ Betaald</button>` : ''}
      </div>
      <button class="btn" id="det-del" style="width:100%;margin-top:8px;background:rgba(217,140,132,.12);color:var(--danger);border:1px solid rgba(217,140,132,.25)">🗑️ Verwijderen</button>
    </div>
  `;

  document.body.appendChild(backdrop);
  backdrop.querySelector('#det-x').onclick = () => backdrop.remove();
  backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.remove(); });

  backdrop.querySelector('#det-print').onclick = () => { backdrop.remove(); printInvoice(inv); };

  const paidBtn = backdrop.querySelector('#det-paid');
  if (paidBtn) {
    paidBtn.onclick = async () => {
      await put('invoices', { ...inv, status: 'betaald', paidAt: ymd() });
      ok('Factuur gemarkeerd als betaald ✓');
      backdrop.remove();
      render(container);
    };
  }

  let delStep = 0;
  backdrop.querySelector('#det-del').onclick = async function () {
    if (delStep === 0) {
      delStep = 1;
      this.textContent = 'Weet je het zeker? Nogmaals tikken om definitief te verwijderen';
      this.style.background = 'rgba(217,140,132,.25)';
      return;
    }
    await del('invoices', inv.id);
    ok('Factuur verwijderd');
    backdrop.remove();
    render(container);
  };
}

// ─── PDF print window ────────────────────────────────────────────────────────

function printInvoice(inv) {
  const line    = inv.lines?.[0] || {};
  const client  = inv.client || {};
  const ibanFmt = fmtIBAN(BEDRIJF.iban);

  const html = `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<title>Factuur ${escapeHTML(inv.number || '')}</title>
<style>
  @page { margin: 20mm 22mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, Arial, Helvetica, sans-serif; color: #1a1a1a; font-size: 14px; line-height: 1.5; background: #fff; }
  .wrap { max-width: 760px; margin: 0 auto; padding: 0; }

  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 32px; border-bottom: 1.5px solid #e8e4de; margin-bottom: 36px; }
  .brand { font-size: 22px; font-weight: 800; letter-spacing: -.5px; color: #1a1a1a; margin-bottom: 8px; }
  .co-info { font-size: 12px; color: #666; line-height: 1.7; }
  .inv-title { font-size: 36px; font-weight: 800; color: #8a7e6f; letter-spacing: -1px; }
  .inv-meta { font-size: 12px; color: #666; margin-top: 10px; line-height: 1.7; text-align: right; }
  .inv-meta strong { color: #1a1a1a; }

  .client-box { background: #f8f7f5; border-radius: 10px; padding: 20px 24px; margin-bottom: 36px; }
  .client-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1.2px; color: #999; margin-bottom: 8px; font-weight: 600; }
  .client-name { font-size: 17px; font-weight: 700; margin-bottom: 5px; }
  .client-detail { font-size: 13px; color: #555; line-height: 1.7; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead th { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #999; font-weight: 600; padding: 8px 12px; border-bottom: 1.5px solid #e8e4de; text-align: left; }
  thead th:last-child { text-align: right; }
  tbody td { padding: 14px 12px; border-bottom: 1px solid #f0ede8; font-size: 14px; }
  tbody td:last-child { text-align: right; font-weight: 500; }

  .totals { margin-left: auto; width: 300px; margin-bottom: 40px; }
  .t-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; color: #555; }
  .t-grand { display: flex; justify-content: space-between; padding: 14px 0 0; margin-top: 10px; border-top: 2px solid #1a1a1a; font-size: 20px; font-weight: 800; color: #1a1a1a; }

  .pay-box { background: #f8f7f5; border-radius: 10px; padding: 20px 24px; font-size: 13px; color: #555; line-height: 1.8; }
  .pay-box strong { color: #1a1a1a; }
  .pay-iban { font-size: 15px; font-weight: 700; color: #1a1a1a; letter-spacing: .5px; }

  .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e8e4de; font-size: 11px; color: #aaa; display: flex; justify-content: space-between; }

  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div>
      <div class="brand">${escapeHTML(BEDRIJF.naam)}</div>
      <div class="co-info">
        ${escapeHTML(BEDRIJF.adres)}<br>
        ${escapeHTML(BEDRIJF.postcode)}<br>
        BTW: ${escapeHTML(BEDRIJF.btw)}<br>
        KvK: ${escapeHTML(BEDRIJF.kvk)}<br>
        IBAN: ${escapeHTML(ibanFmt)}
      </div>
    </div>
    <div style="text-align:right">
      <div class="inv-title">FACTUUR</div>
      <div class="inv-meta">
        Nummer: <strong>${escapeHTML(inv.number || '—')}</strong><br>
        Datum: <strong>${fmtDateLong(inv.date)}</strong><br>
        Vervaldatum: <strong>${fmtDateLong(inv.dueDate)}</strong>
      </div>
    </div>
  </div>

  <div class="client-box">
    <div class="client-label">Factuur aan</div>
    <div class="client-name">${escapeHTML(client.name || '—')}</div>
    <div class="client-detail">
      ${client.address ? escapeHTML(client.address) + '<br>' : ''}
      ${client.city    ? escapeHTML(client.city)    + '<br>' : ''}
      ${client.kvk     ? 'KvK: ' + escapeHTML(client.kvk) + '<br>' : ''}
      ${client.email   ? escapeHTML(client.email) : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:50%">Omschrijving</th>
        <th>BTW</th>
        <th>Excl. BTW</th>
        <th>Totaal incl.</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${escapeHTML(line.description || 'Vervoersdienst')}</td>
        <td>${line.vatRate || 0}%</td>
        <td>${fmtMoney(inv.totalExcl || 0)}</td>
        <td>${fmtMoney(inv.totalIncl || 0)}</td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    <div class="t-row"><span>Subtotaal excl. BTW</span><span>${fmtMoney(inv.totalExcl || 0)}</span></div>
    <div class="t-row"><span>BTW ${line.vatRate || 0}%</span><span>${fmtMoney(inv.totalVat || 0)}</span></div>
    <div class="t-grand"><span>Totaal</span><span>${fmtMoney(inv.totalIncl || 0)}</span></div>
  </div>

  <div class="pay-box">
    Gelieve het bedrag van <strong>${fmtMoney(inv.totalIncl || 0)}</strong> vóór <strong>${fmtDateLong(inv.dueDate)}</strong> over te maken naar:<br>
    <span class="pay-iban">${escapeHTML(ibanFmt)}</span> — t.n.v. ${escapeHTML(BEDRIJF.naam)}<br>
    o.v.v. factuurnummer <strong>${escapeHTML(inv.number || '')}</strong>
  </div>

  <div class="footer">
    <span>${escapeHTML(BEDRIJF.naam)} · KvK ${escapeHTML(BEDRIJF.kvk)} · BTW ${escapeHTML(BEDRIJF.btw)}</span>
    <span>${escapeHTML(inv.number || '')}</span>
  </div>
</div>
<script>window.addEventListener('load', () => { window.focus(); window.print(); });<\/script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) { err('Sta pop-ups toe om de factuur af te drukken'); return; }
  win.document.write(html);
  win.document.close();
}
