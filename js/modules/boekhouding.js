import { all, put, del, add } from '../db.js';
import { icon } from '../icons.js';
import { uid, fmtMoney, parseAmount, escapeHTML, ymd } from '../utils.js';
import { ok, err } from '../components/toast.js';
import { parseInvoiceText } from '../invoice-nlp.js';
import { invoiceEpcPayload, qrModules, qrSvg } from '../sepa-qr.js';

function gmailConfigured() { return !!localStorage.getItem('gmailClientId'); }
function fmtMoneyPDF(n) {
  const v = isFinite(n) ? Math.round(+n * 100) / 100 : 0;
  const [int, dec] = Math.abs(v).toFixed(2).split('.');
  return `€ ${v < 0 ? '-' : ''}${int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${dec}`;
}

// jsPDF-standaardfonts kennen alleen WinAnsi (Latin-1 + €, “”, –, …). Alles daarbuiten
// werd onleesbaar ("Şahin" → "^ahin", emoji/pijlen → rommel). Daarom: letters met
// accent terug naar de basisletter, bekende tekens vervangen, de rest weglaten.
const _WIN_EXTRA = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
const _PDF_MAP = {
  '→': '->', '←': '<-', '⇒': '=>', '↔': '<->', '➔': '->', '≈': '~', '✓': 'v', '✔': 'v',
  '−': '-', '‐': '-', '‑': '-', ' ': ' ', ' ': ' ', '​': '', '\t': ' ',
  'ı': 'i', 'ł': 'l', 'Ł': 'L', 'đ': 'd', 'Đ': 'D', 'ħ': 'h', 'ŀ': 'l',
};
function pdfText(s) {
  return String(s ?? '').replace(/\r/g, '').replace(/[^\n\x20-\x7E\xA0-\xFF]/g, ch => {
    if (_WIN_EXTRA.includes(ch)) return ch;
    if (_PDF_MAP[ch] != null) return _PDF_MAP[ch];
    const base = ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return base !== ch && /^[\x20-\x7E\xA0-\xFF]+$/.test(base) ? base : '';
  }).replace(/ {2,}/g, ' ');
}

// BTW per tarief: [tarief, bedrag excl., btw] — verplicht per tarief op de factuur
function vatBreakdown(lines) {
  const r2 = v => Math.round(v * 100) / 100;
  const map = new Map();
  for (const l of lines) {
    const rate = Number(l.vatRate ?? 0);
    const excl = Number(l.amountExcl ?? 0);
    const vat  = Number(l.vatAmount ?? ((l.amountIncl ?? 0) - excl));
    const cur  = map.get(rate) || [0, 0];
    map.set(rate, [cur[0] + excl, cur[1] + vat]);
  }
  return [...map].map(([rate, [excl, vat]]) => [rate, r2(excl), r2(vat)]).sort((a, b) => b[0] - a[0]);
}

// Escape-toets sluit het bovenste boekhouding-modal (eenmalig geregistreerd).
if (!window._bkEscapeRegistered) {
  window._bkEscapeRegistered = true;
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const backdrop = [...document.querySelectorAll('.modal-backdrop')].pop();
    if (backdrop) { e.preventDefault(); backdrop.remove(); }
  });
}

// ─── ADMINISTRATIES ──────────────────────────────────────────────────────────
const ADMINS = {
  taxi: {
    id:          'taxi',
    icon:        'taxi',
    label:       'Taxi',
    naam:        'Woosh-Amsterdam',
    adres:       'Jephtastraat 28',
    postcode:    '1055JV Amsterdam',
    btw:         'NL003042226B35',
    kvk:         '77755170',
    iban:        'NL67INGB0660701413',
    bic:         'INGBNL2A',
    termijn:     30,
    prefix:      'WOOSH',
    defaultVat:  9,
    defaultDesc: 'Vervoersdienst',
    tagline:     'Taxivervoer Amsterdam',
    logoGlyph:   'taxi',
  },
  olijfolie: {
    id:          'olijfolie',
    icon:        'leaf',
    label:       'Olijf',
    naam:        'Sofyan Ghaddari',
    adres:       'Jephtastraat 28',
    postcode:    '1055JV Amsterdam',
    btw:         'NL003042226B35',
    kvk:         '77755170',
    iban:        'NL67INGB0660701413',
    bic:         'INGBNL2A',
    termijn:     14,
    prefix:      'OLIE',
    defaultVat:  21,
    defaultDesc: 'Levering olijfolie',
    tagline:     'Premium olijfolie',
    logoGlyph:   'leaf',
  },
  adab: {
    id:          'adab',
    icon:        'ball',
    label:       'Adab',
    naam:        'Woosh-Amsterdam',
    adres:       'Jephtastraat 28',
    postcode:    '1055JV Amsterdam',
    btw:         'NL003042226B35',
    kvk:         '77755170',
    iban:        'NL67INGB0660701413',
    bic:         'INGBNL2A',
    termijn:     14,
    prefix:      'ADAB',
    defaultVat:  0,
    defaultDesc: 'TSO (tussenschoolse opvang) IBS Elif Zaandam',
    tagline:     'Sportactiviteiten basisonderwijs',
    logoGlyph:   'ball',
    accent:      [31, 122, 99],   // sportief diepgroen i.p.v. taupe
    lessons:     true,            // factuur = één regel: omschrijving + uren × tarief
  },
};

// Btw-vrijstellingstekst die op een 0%-factuur moet staan (wettelijk verplicht)
const VAT_NOTES = {
  art11:     'Btw vrijgesteld op grond van artikel 11 Wet op de omzetbelasting 1968.',
  kor:       'Vrijgesteld van btw op grond van de kleineondernemersregeling (KOR).',
  onderwijs: 'Btw vrijgesteld op grond van art. 11 lid 1 sub o Wet OB 1968 (onderwijs).',
  verlegd:   'Btw verlegd.',
};

function fmtHours(n) {
  return (Number(n) || 0).toLocaleString('nl-NL', { maximumFractionDigits: 2 });
}

// Samenvatting van een lessen-factuur: aantal lessen + totaal uren
function lessonSummary(inv) {
  if (inv.kind !== 'lessen') return null;
  const ls = (inv.lines || []).filter(l => l.qty != null);
  if (ls.length < 2) return null;
  const hours = ls.reduce((s, l) => s + (Number(l.qty) || 0), 0);
  return `${ls.length} ${ls.length === 1 ? 'les' : 'lessen'} · ${fmtHours(hours)} uur`;
}

function getAdmin(container) {
  return ADMINS[container.dataset.bkAdmin || 'taxi'] || ADMINS.taxi;
}

const OWNER_EMAIL = 'sofyanghaddari@gmail.com';

// ─── FISCALE CONSTANTEN 2025 ─────────────────────────────────────────────────
const KM_VERGOEDING = 0.23;   // €0,23 per zakelijke km (2025 en 2026)

// ─── FISCALE CIJFERS PER JAAR (schatting W&V) ────────────────────────────────
// Box 1 kent sinds 2025 drie schijven (onder AOW-leeftijd). Zelfstandigenaftrek daalt
// hard: 2025 € 2.470 → 2026 € 1.200 → 2027 € 900. Onbekend jaar → dichtstbijzijnde jaar.
const FISCAAL = {
  2025: { zelfst: 2470, mkb: 0.127, schijven: [[38441, 0.3582], [76817, 0.3748], [Infinity, 0.495]] },
  2026: { zelfst: 1200, mkb: 0.127, schijven: [[38883, 0.3575], [78426, 0.3756], [Infinity, 0.495]] },
};
function fiscaal(year) {
  const yrs = Object.keys(FISCAAL).map(Number).sort((a, b) => a - b);
  const y = yrs.includes(year) ? year : (year < yrs[0] ? yrs[0] : yrs[yrs.length - 1]);
  return { year: y, ...FISCAAL[y] };
}
function box1Tax(income, schijven) {
  let tax = 0, prev = 0;
  for (const [grens, tarief] of schijven) {
    if (income <= prev) break;
    tax += (Math.min(income, grens) - prev) * tarief;
    prev = grens;
  }
  return tax;
}

// ─── KOSTENCATEGORIEËN ───────────────────────────────────────────────────────
const CATS = [
  { id: 'brandstof',   label: 'Brandstof',            icon: 'fuel' },
  { id: 'onderhoud',   label: 'Onderhoud & reparatie', icon: 'wrench' },
  { id: 'verzekering', label: 'Verzekering',           icon: 'shield' },
  { id: 'lease',       label: 'Lease / financiering',  icon: 'car' },
  { id: 'licentie',    label: 'Vergunning & licentie', icon: 'doc' },
  { id: 'telefoon',    label: 'Telefoon & data',       icon: 'phone' },
  { id: 'software',    label: 'Software & apps',       icon: 'laptop' },
  { id: 'accountant',  label: 'Accountant & advies',   icon: 'stats' },
  { id: 'overig',      label: 'Overige kosten',        icon: 'box' },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function computeStatus(inv) {
  if (inv.status === 'betaald') return 'betaald';
  if (inv.dueDate && inv.dueDate < ymd()) return 'te-laat';
  return 'open';
}

function statusLabel(s) {
  return s === 'betaald' ? 'Betaald' : s === 'te-laat' ? 'Vervallen' : 'Open';
}

function calcVat(amount, vatRate, isIncl) {
  const r2 = v => Math.round(v * 100) / 100;
  if (isIncl) {
    const excl = r2(amount / (1 + vatRate / 100));
    return { amountExcl: excl, vatAmount: r2(amount - excl), amountIncl: r2(amount) };
  }
  const vat = r2(amount * (vatRate / 100));
  return { amountExcl: r2(amount), vatAmount: vat, amountIncl: r2(amount + vat) };
}

function fmtDateLong(iso) {
  if (!iso) return '—';
  return new Date(iso + 'T00:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function fmtDateShort(iso) {
  if (!iso) return '—';
  return new Date(iso + 'T00:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return ymd(d);
}

function fmtIBAN(iban) { return iban.replace(/(.{4})/g, '$1 ').trim(); }

function getYear(dateStr)  { return dateStr ? parseInt(dateStr.slice(0, 4)) : 0; }
function getMonth(dateStr) { return dateStr ? parseInt(dateStr.slice(5, 7)) - 1 : -1; }
function getQuarter(dateStr) { return Math.floor(getMonth(dateStr) / 3); }

function quarterLabel(q, y) { return `Q${q + 1} ${y}`; }

function quarterDates(q, y) {
  const start = `${y}-${String(q * 3 + 1).padStart(2, '0')}-01`;
  const endMonth = q * 3 + 3;
  const lastDay = new Date(y, endMonth, 0).getDate();
  const end = `${y}-${String(endMonth).padStart(2, '0')}-${lastDay}`;
  return { start, end };
}

function inQuarter(dateStr, q, y) {
  if (!dateStr) return false;
  const { start, end } = quarterDates(q, y);
  return dateStr >= start && dateStr <= end;
}

function inYear(dateStr, y) {
  return dateStr && getYear(dateStr) === y;
}

async function nextInvoiceNumber(bedrijf) {
  const invoices = await all('invoices');
  const year    = new Date().getFullYear();
  const prefix  = bedrijf.prefix || 'WOOSH';
  const pattern = `${prefix}-${year}-`;
  const nums = invoices
    .filter(i => (i.adminId || 'taxi') === bedrijf.id && (i.number || '').startsWith(pattern))
    .map(i => { const m = (i.number || '').match(/(\d+)$/); return m ? parseInt(m[1], 10) : 0; })
    .filter(n => isFinite(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `${pattern}${String(next).padStart(3, '0')}`;
}

function cleanInv(inv) {
  // Strip computed _status before storing
  const { _status, ...clean } = inv;
  return clean;
}

function catInfo(id) {
  return CATS.find(c => c.id === id) || CATS[CATS.length - 1];
}

function animateKPIs(root) {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  root.querySelectorAll('[data-bk-count]').forEach(el => {
    const target = parseFloat(el.dataset.bkCount);
    if (isNaN(target) || target === 0) return;
    const isMoney = el.classList.contains('money');
    const duration = 650;
    const t0 = performance.now();
    const tick = ts => {
      const p = Math.min((ts - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      const v = target * ease;
      if (isMoney) {
        el.textContent = '€ ' + v.toFixed(2)
          .replace('.', ',')
          .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      } else {
        el.textContent = Math.round(v).toLocaleString('nl-NL');
      }
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function exportCSV(rows, filename) {
  if (!rows.length) { err('Geen data om te exporteren'); return; }
  const headers = Object.keys(rows[0]);
  const csv = [
    'sep=;',           // Excel-hint: puntkomma als scheidingsteken
    headers.join(';'),
    ...rows.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(';')),
  ].join('\r\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })),
    download: filename,
  });
  a.click();
  URL.revokeObjectURL(a.href);
  ok(`${filename} gedownload ✓`);
}

// ─── SUB-NAV ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overzicht', icon: 'grid',     label: 'Overzicht' },
  { id: 'facturen',  icon: 'receipt',  label: 'Facturen' },
  { id: 'klanten',   icon: 'users',    label: 'Klanten' },
  { id: 'kosten',    icon: 'tag',      label: 'Kosten' },
  { id: 'km',        icon: 'car',      label: 'Kilometers' },
  { id: 'btw',       icon: 'clipboard',label: 'BTW' },
  { id: 'wv',        icon: 'trend',    label: 'W&V' },
];

function buildSubNav(active, adminId) {
  return `
    <div class="bk-admin-switcher">
      ${Object.values(ADMINS).map(a => `
        <button class="bk-admin-btn${a.id === adminId ? ' active' : ''}" data-admin="${a.id}">
          ${icon(a.icon)} ${a.label}
        </button>
      `).join('')}
    </div>
    <div class="bk-subnav">
      ${TABS.map(t => `<button class="bk-subnav-btn${t.id === active ? ' active' : ''}" data-tab="${t.id}">${icon(t.icon)} ${t.label}</button>`).join('')}
    </div>
    <div id="bk-view"></div>
  `;
}

// ─── MAIN RENDER ─────────────────────────────────────────────────────────────

export async function render(container) {
  const tab     = container.dataset.bkTab   || 'overzicht';
  const adminId = container.dataset.bkAdmin || localStorage.getItem('bkAdmin') || 'taxi';
  container.dataset.bkAdmin = adminId;
  container.innerHTML = buildSubNav(tab, adminId);

  container.querySelectorAll('.bk-admin-btn').forEach(btn => {
    btn.onclick = () => {
      container.dataset.bkAdmin     = btn.dataset.admin;
      container.dataset.bkTab       = 'overzicht';
      container.dataset.invFilter   = '';
      container.dataset.invSearch   = '';
      container.dataset.clientSearch = '';
      container.dataset.kostenYear  = '';
      container.dataset.kmYear      = '';
      container.dataset.btwQ        = '';
      container.dataset.btwY        = '';
      container.dataset.wvYear      = '';
      localStorage.setItem('bkAdmin', btn.dataset.admin);
      render(container);
    };
  });

  container.querySelectorAll('.bk-subnav-btn').forEach(btn => {
    btn.onclick = () => { container.dataset.bkTab = btn.dataset.tab; render(container); };
  });

  const view = container.querySelector('#bk-view');

  const [allInvoices, allPurchases, allKmLogs, clients] = await Promise.all([
    all('invoices'),
    all('purchase_invoices'),
    all('km_log'),
    all('clients'),
  ]);

  // Filter op actieve administratie; records zonder adminId vallen onder 'taxi' (achterwaartse compatibiliteit)
  const invoicesRaw = allInvoices.filter(i => (i.adminId || 'taxi') === adminId);
  const purchases   = allPurchases.filter(p => (p.adminId || 'taxi') === adminId);
  const kmLogs      = allKmLogs.filter(k => (k.adminId || 'taxi') === adminId);
  const withStatus  = invoicesRaw.map(inv => ({ ...inv, _status: computeStatus(inv) }));

  switch (tab) {
    case 'overzicht': renderOverview(view, withStatus, purchases, kmLogs, container); break;
    case 'facturen':  renderFacturen(view, withStatus, container); break;
    case 'klanten':   renderKlanten(view, clients, withStatus, container); break;
    case 'kosten':    renderKosten(view, purchases, container); break;
    case 'km':        renderKm(view, kmLogs, container); break;
    case 'btw':
    case 'wv': {
      // Taxi, Olijf en Adab vallen onder één onderneming (zelfde btw-nummer/KvK):
      // btw-aangifte en inkomstenbelasting gaan over alles samen, niet per administratie.
      const key   = tab === 'btw' ? 'btw' : 'kvk';
      const group = Object.values(ADMINS).filter(a => a[key] === ADMINS[adminId]?.[key]).map(a => a.id);
      const inGroup = r => group.includes(r.adminId || 'taxi');
      const invG = allInvoices.filter(inGroup).map(inv => ({ ...inv, _status: computeStatus(inv) }));
      const purG = allPurchases.filter(inGroup);
      if (tab === 'btw') renderBTW(view, invG, purG, container, group);
      else renderWV(view, invG, purG, allKmLogs.filter(inGroup), container, group);
      break;
    }
    default:          renderOverview(view, withStatus, purchases, kmLogs, container);
  }
  animateKPIs(view);
}

// ─── OVERZICHT ────────────────────────────────────────────────────────────────

function renderOverview(view, invoices, purchases, kmLogs, container) {
  const now  = new Date();
  const y    = now.getFullYear();
  const q    = Math.floor(now.getMonth() / 3);

  // Jaaromzet (excl BTW, alleen betaalde + openstaande facturen)
  const omzetYear   = invoices.filter(i => inYear(i.date, y)).reduce((s, i) => s + (i.totalExcl || 0), 0);
  const kostenYear  = purchases.filter(i => inYear(i.date, y)).reduce((s, i) => s + (i.amountExcl || 0), 0);
  const winstYear   = omzetYear - kostenYear;
  const marge       = omzetYear > 0 ? Math.round(winstYear / omzetYear * 100) : 0;
  const openCount   = invoices.filter(i => i._status !== 'betaald').length;
  const openAmount  = invoices.filter(i => i._status !== 'betaald').reduce((s, i) => s + (i.totalIncl || 0), 0);
  const overdueCount = invoices.filter(i => i._status === 'te-laat').length;

  // BTW saldo dit kwartaal
  const btwOntvangen = invoices.filter(i => inQuarter(i.date, q, y)).reduce((s, i) => s + (i.totalVat || 0), 0);
  const btwBetaald   = purchases.filter(i => inQuarter(i.date, q, y)).reduce((s, i) => s + (i.vatAmount || 0), 0);
  const btwSaldo     = btwOntvangen - btwBetaald;

  // Openstaande/vervallen facturen eerst, daarna recente betaalde
  const openInv  = invoices.filter(i => i._status === 'open' || i._status === 'te-laat')
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const otherInv = invoices.filter(i => i._status !== 'open' && i._status !== 'te-laat')
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const recent = [...openInv, ...otherInv].slice(0, 5);

  view.innerHTML = `
    <div class="bk-hero card">
      <div class="bk-hero-head">
        <span class="bk-hero-label">Winst ${y}</span>
        <span class="bk-hero-marge">${marge}% marge</span>
      </div>
      <div class="bk-hero-val money blurred-amount ${winstYear >= 0 ? 'pos' : 'neg'}" data-bk-count="${winstYear}">${fmtMoney(winstYear, true)}</div>
      <div class="bk-hero-bar"><div class="bk-hero-bar-fill" style="width:${Math.max(2, Math.min(100, marge))}%"></div></div>
      <div class="bk-hero-legend">
        <span class="bk-leg"><i class="bk-dot bk-dot-rev"></i>Omzet <b class="money blurred-amount">${fmtMoney(omzetYear)}</b></span>
        <span class="bk-leg"><i class="bk-dot bk-dot-cost"></i>Kosten <b class="money blurred-amount">${fmtMoney(kostenYear)}</b></span>
      </div>
    </div>

    <div class="bk-kpi-grid">
      <div class="bk-kpi">
        <div class="bk-kpi-label">BTW Q${q + 1}</div>
        <div class="bk-kpi-val money blurred-amount accent" data-bk-count="${btwSaldo}">${fmtMoney(btwSaldo, true)}</div>
        <div class="bk-kpi-sub">${btwSaldo >= 0 ? 'te betalen' : 'terug te ontvangen'}</div>
      </div>
      <div class="bk-kpi">
        <div class="bk-kpi-label">Openstaand</div>
        <div class="bk-kpi-val money blurred-amount" data-bk-count="${openAmount}">${fmtMoney(openAmount, true)}</div>
        <div class="bk-kpi-sub">${openCount} factuur${openCount === 1 ? '' : 'en'} incl. BTW</div>
      </div>
    </div>

    ${overdueCount > 0 ? `
      <div class="bk-alert">
        <svg class="bk-alert-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5 2.5 20h19L12 3.5z"/><path d="M12 9.5v5"/><path d="M12 17.6h.01"/></svg>
        <span><strong>${overdueCount} factuur${overdueCount > 1 ? 'en' : ''} vervallen</strong> — betaling achterstallig</span>
      </div>
    ` : ''}

    <div class="bk-quick-actions">
      <button class="bk-qa" id="qa-factuur">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.5h7L18 8.5V20a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5z"/><path d="M12.8 3.5V8.5H18"/><path d="M11.6 12v5"/><path d="M9.1 14.5h5"/></svg>
        <span>Nieuwe factuur</span></button>
      <button class="bk-qa" id="qa-kosten">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.7h12v16.8l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3z"/><path d="M8.6 8.2h6.8"/><path d="M8.6 11.6h6.8"/><path d="M8.6 15h4.2"/></svg>
        <span>Kosten boeken</span></button>
      <button class="bk-qa" id="qa-km">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l1.5-4.2A2 2 0 0 1 8.4 7.4h7.2a2 2 0 0 1 1.9 1.4L19 13"/><rect x="3.6" y="12.8" width="16.8" height="4" rx="1.2"/><circle cx="7.4" cy="18" r="1.4"/><circle cx="16.6" cy="18" r="1.4"/></svg>
        <span>Km registreren</span></button>
    </div>

    <div class="bk-section-head">
      <span class="card-title">Openstaande facturen</span>
      <span class="bk-badge${openCount > 0 ? ' bk-badge-warn' : ''}">${openCount} · ${fmtMoney(openAmount)}</span>
    </div>

    ${recent.length === 0 ? `<p class="muted" style="text-align:center;padding:20px 0">Nog geen facturen</p>` : `
      <div class="bk-list">
        ${recent.map(inv => `
          <div class="bk-card card bk-card-sm" data-id="${inv.id}">
            <div class="bk-card-top">
              <span class="bk-card-client">${escapeHTML(inv.client?.name || '—')}</span>
              <span class="bk-status bk-status-${inv._status}">${statusLabel(inv._status)}</span>
            </div>
            <div class="bk-card-bot" style="margin-top:6px">
              <span style="font-size:.78rem;color:var(--text-dim)">${escapeHTML(inv.number || '')} · ${fmtDateShort(inv.date)}</span>
              <div style="display:flex;align-items:center;gap:8px">
                <span class="bk-card-amount money">${fmtMoney(inv.totalIncl || 0)}</span>
                ${inv._status !== 'betaald' ? `<button class="bk-btn-paid" data-id="${escapeHTML(inv.id)}" style="font-size:.72rem;padding:3px 8px">✓</button>` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `}
  `;

  view.querySelector('#qa-factuur').onclick = () => { container.dataset.bkTab = 'facturen'; render(container); setTimeout(() => openInvoiceModal(container), 100); };
  view.querySelector('#qa-kosten').onclick  = () => { container.dataset.bkTab = 'kosten';   render(container); setTimeout(() => openNewPurchaseModal(container), 100); };
  view.querySelector('#qa-km').onclick      = () => { container.dataset.bkTab = 'km';        render(container); setTimeout(() => openNewKmModal(container), 100); };

  view.querySelectorAll('.bk-card-sm').forEach(card => {
    card.onclick = (e) => {
      if (e.target.closest('.bk-btn-paid')) return;
      const inv = invoices.find(i => i.id === card.dataset.id);
      if (inv) openDetailModal(inv, container);
    };
  });

  view.querySelectorAll('.bk-card-sm .bk-btn-paid').forEach(btn => {
    btn.onclick = async e => {
      e.stopPropagation();
      const inv = invoices.find(i => i.id === btn.dataset.id);
      if (!inv) return;
      await put('invoices', { ...cleanInv(inv), status: 'betaald', paidAt: ymd() });
      ok('Factuur gemarkeerd als betaald ✓');
      render(container);
    };
  });
}

// ─── FACTUREN ────────────────────────────────────────────────────────────────

function renderFacturen(view, invoices, container) {
  const now      = new Date();
  const yearStr  = String(now.getFullYear());
  const filter   = container.dataset.invFilter || 'alle';
  const search   = (container.dataset.invSearch || '').toLowerCase();

  const filteredInv = (filter === 'alle' ? invoices : invoices.filter(i => i._status === filter))
    .filter(i => !search ||
      (i.client?.name || '').toLowerCase().includes(search) ||
      (i.number || '').toLowerCase().includes(search) ||
      (i.lines?.[0]?.description || '').toLowerCase().includes(search)
    );

  const sorted = [...filteredInv].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const totalOpen  = invoices.filter(i => i._status === 'open').reduce((s, i) => s + (i.totalIncl || 0), 0);
  const totalLate  = invoices.filter(i => i._status === 'te-laat').length;

  view.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <div>
        <span style="font-size:.82rem;color:var(--text-dim)">${invoices.length} facturen · ${fmtMoney(totalOpen)} open</span>
        ${totalLate > 0 ? `<span style="color:var(--danger);margin-left:8px;font-size:.82rem">⚠ ${totalLate} vervallen</span>` : ''}
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn" id="inv-csv-btn" style="background:var(--bg-elev-2);color:var(--text-dim);border:1px solid var(--border);padding:8px 12px;font-size:.8rem">${icon('stats')} CSV</button>
        <button class="btn" id="rit-import-btn" style="background:var(--bg-elev-2);color:var(--accent);border:1.5px solid var(--accent);padding:8px 12px;font-size:.8rem">${icon('taxi')} Ritten</button>
        <button class="btn bk-new-btn" id="new-inv-btn">+ Factuur</button>
      </div>
    </div>

    <div class="bk-client-search-wrap" style="margin-bottom:10px">
      <span style="opacity:.5">${icon('search')}</span>
      <input id="inv-search" class="bk-client-search" placeholder="Zoek klant, nummer…" value="${escapeHTML(container.dataset.invSearch || '')}" />
    </div>

    <div class="bk-filter-row">
      ${['alle','open','betaald','te-laat'].map(f => `
        <button class="bk-filter-chip${filter === f ? ' active' : ''}" data-filter="${f}">
          ${f === 'alle' ? 'Alle' : f === 'open' ? 'Open' : f === 'betaald' ? 'Betaald' : 'Vervallen'}
          <span class="bk-chip-count">${invoices.filter(i => f === 'alle' || i._status === f).length}</span>
        </button>
      `).join('')}
    </div>

    ${sorted.length === 0 ? `
      <div class="section-empty" style="margin-top:30px">
        <div style="font-size:2rem;margin-bottom:10px">${icon('receipt')}</div>
        <p style="font-weight:600;margin:0 0 4px">Geen facturen</p>
        <p class="muted" style="font-size:.85rem;margin:0">Tik op "+ Factuur" om te beginnen</p>
      </div>
    ` : `
      <div class="bk-list">
        ${sorted.map((inv, idx) => `
          <div class="bk-card card" style="--i:${idx}" data-id="${escapeHTML(inv.id)}">
            <div class="bk-card-top">
              <span class="bk-card-client">${escapeHTML(inv.client?.name || '—')}</span>
              <span class="bk-status bk-status-${inv._status}">${statusLabel(inv._status)}</span>
            </div>
            <div class="bk-card-mid">
              <span class="bk-card-num">${escapeHTML(inv.number || '')}</span>
              <span>·</span>
              <span class="bk-card-date">${fmtDateLong(inv.date)}</span>
              ${inv.sentAt ? `<span class="bk-sent-badge">${icon('mail')} verstuurd</span>` : ''}
            </div>
            <div class="bk-card-bot">
              <div>
                <div class="bk-card-amount money">${fmtMoney(inv.totalIncl || 0)}</div>
                <div class="bk-amount-sub">excl. ${fmtMoney(inv.totalExcl || 0)} · BTW ${fmtMoney(inv.totalVat || 0)}</div>
              </div>
              <div class="bk-card-actions">
                ${inv._status !== 'betaald' ? `<button class="bk-btn-paid" data-id="${escapeHTML(inv.id)}">✓</button>` : ''}
                <button class="bk-btn-print" data-id="${escapeHTML(inv.id)}">${icon('print')}</button>
              </div>
            </div>
            ${inv._status === 'te-laat' ? `<div class="bk-overdue-bar">⚠ Vervallen op ${fmtDateLong(inv.dueDate)}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `}
  `;

  view.querySelector('#new-inv-btn').onclick    = () => openInvoiceModal(container);
  view.querySelector('#rit-import-btn').onclick = () => openRitImportModal(container);

  view.querySelector('#inv-csv-btn').onclick = () => exportCSV(
    invoices.map(i => ({
      Nummer: i.number || '',
      Datum: i.date || '',
      Vervaldatum: i.dueDate || '',
      Status: statusLabel(computeStatus(i)),
      Klant: i.client?.name || '',
      KvK: i.client?.kvk || '',
      Email: i.client?.email || '',
      Omschrijving: (i.lines || []).map(l => String(l.description || '').replace(/\s*\n\s*/g, ' · ')).join(' | '),
      'Excl BTW': (i.totalExcl || 0).toFixed(2).replace('.', ','),
      'BTW%': [...new Set((i.lines || []).map(l => l.vatRate ?? 0))].join('/') || 0,
      'BTW bedrag': (i.totalVat || 0).toFixed(2).replace('.', ','),
      'Incl BTW': (i.totalIncl || 0).toFixed(2).replace('.', ','),
    })),
    `facturen-${new Date().getFullYear()}.csv`
  );

  const searchInput = view.querySelector('#inv-search');
  if (searchInput) {
    let t = null;
    searchInput.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => { container.dataset.invSearch = searchInput.value; render(container); }, 300);
    });
  }

  view.querySelectorAll('.bk-filter-chip').forEach(chip => {
    chip.onclick = () => { container.dataset.invFilter = chip.dataset.filter; render(container); };
  });

  view.querySelectorAll('.bk-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.bk-btn-paid,.bk-btn-print')) return;
      const inv = invoices.find(i => i.id === card.dataset.id);
      if (inv) openDetailModal(inv, container);
    });
  });

  view.querySelectorAll('.bk-btn-paid').forEach(btn => {
    btn.onclick = async e => {
      e.stopPropagation();
      const inv = invoices.find(i => i.id === btn.dataset.id);
      if (!inv) return;
      await put('invoices', { ...cleanInv(inv), status: 'betaald', paidAt: ymd() });
      ok('Factuur gemarkeerd als betaald ✓');
      render(container);
    };
  });

  view.querySelectorAll('.bk-btn-print').forEach(btn => {
    btn.onclick = e => {
      e.stopPropagation();
      const inv = invoices.find(i => i.id === btn.dataset.id);
      if (inv) sharePDF(inv, ADMINS[inv.adminId || 'taxi'] || ADMINS.taxi);
    };
  });
}

// ─── KOSTEN ──────────────────────────────────────────────────────────────────

function renderKosten(view, purchases, container) {
  const now    = new Date();
  const year   = container.dataset.kostenYear ? parseInt(container.dataset.kostenYear) : now.getFullYear();
  const yearPurchases = purchases.filter(p => inYear(p.date, year));

  const totalExcl = yearPurchases.reduce((s, p) => s + (p.amountExcl || 0), 0);
  const totalVat  = yearPurchases.reduce((s, p) => s + (p.vatAmount || 0), 0);
  const totalIncl = yearPurchases.reduce((s, p) => s + (p.amountIncl || 0), 0);

  // Per categorie
  const byCat = {};
  yearPurchases.forEach(p => {
    const id = p.category || 'overig';
    byCat[id] = (byCat[id] || 0) + (p.amountExcl || 0);
  });

  const sorted = [...yearPurchases].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const years = [...new Set(purchases.map(p => getYear(p.date)).filter(Boolean))].sort((a, b) => b - a);
  if (!years.includes(now.getFullYear())) years.unshift(now.getFullYear());

  view.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <select id="kosten-year" class="bk-year-select">
        ${years.map(y => `<option value="${y}" ${y === year ? 'selected' : ''}>${y}</option>`).join('')}
      </select>
      <div style="display:flex;gap:8px">
        <button class="btn" id="kosten-csv-btn" style="background:var(--bg-elev-2);color:var(--text-dim);border:1px solid var(--border);padding:8px 12px;font-size:.8rem">${icon('stats')} CSV</button>
        <button class="btn bk-new-btn" id="new-kosten-btn">+ Kosten</button>
      </div>
    </div>

    <div class="bk-kosten-summary">
      <div class="bk-ks-item">
        <span>Totaal excl. BTW</span>
        <span class="money" style="color:var(--danger)">${fmtMoney(totalExcl)}</span>
      </div>
      <div class="bk-ks-item">
        <span>BTW betaald</span>
        <span style="color:var(--text-dim)">${fmtMoney(totalVat)}</span>
      </div>
      <div class="bk-ks-item bk-ks-total">
        <span>Totaal incl. BTW</span>
        <span class="money" style="color:var(--danger)">${fmtMoney(totalIncl)}</span>
      </div>
    </div>

    ${Object.keys(byCat).length > 0 ? `
      <div class="bk-cat-bars">
        ${Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([id, amt]) => {
          const cat = catInfo(id);
          const pct = totalExcl > 0 ? Math.round(amt / totalExcl * 100) : 0;
          return `
            <div class="bk-cat-row">
              <span class="bk-cat-label">${icon(cat.icon)} ${cat.label}</span>
              <div class="bk-cat-bar-wrap">
                <div class="bk-cat-bar" style="--bk-bar-w:${pct}%;width:var(--bk-bar-w,0)"></div>
              </div>
              <span class="bk-cat-amt">${fmtMoney(amt)}</span>
            </div>
          `;
        }).join('')}
      </div>
    ` : ''}

    ${sorted.length === 0 ? `
      <div class="section-empty" style="margin-top:20px">
        <div style="font-size:2rem;margin-bottom:10px">${icon('tag')}</div>
        <p style="font-weight:600;margin:0 0 4px">Geen kosten in ${year}</p>
        <p class="muted" style="font-size:.85rem;margin:0">Boek zakelijke kosten om BTW terug te vragen</p>
      </div>
    ` : `
      <div class="card-title" style="margin:16px 0 8px">Alle kosten ${year}</div>
      <div class="bk-list">
        ${sorted.map((p, idx) => {
          const cat = catInfo(p.category || 'overig');
          return `
            <div class="bk-cost-card card" style="--i:${idx}" data-id="${escapeHTML(p.id)}">
              <div style="display:flex;justify-content:space-between;align-items:flex-start">
                <div>
                  <div style="font-weight:600">${icon(cat.icon)} ${escapeHTML(p.vendor || '—')}</div>
                  <div style="font-size:.78rem;color:var(--text-dim);margin-top:2px">${cat.label} · ${fmtDateShort(p.date)}</div>
                  ${p.description ? `<div style="font-size:.8rem;color:var(--text-dim)">${escapeHTML(p.description)}</div>` : ''}
                </div>
                <div style="text-align:right">
                  <div class="money" style="color:var(--danger)">${fmtMoney(p.amountIncl || 0)}</div>
                  <div style="font-size:.7rem;color:var(--text-faint)">BTW ${p.vatRate || 0}%: ${fmtMoney(p.vatAmount || 0)}</div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `}
  `;

  view.querySelector('#new-kosten-btn').onclick = () => openNewPurchaseModal(container);
  view.querySelector('#kosten-year').onchange = e => { container.dataset.kostenYear = e.target.value; render(container); };
  view.querySelector('#kosten-csv-btn').onclick = () => exportCSV(
    yearPurchases.map(p => ({
      Datum: p.date || '',
      Leverancier: p.vendor || '',
      Omschrijving: p.description || '',
      Categorie: catInfo(p.category || 'overig').label,
      'Excl BTW': (p.amountExcl || 0).toFixed(2).replace('.', ','),
      'BTW%': p.vatRate || 0,
      'BTW bedrag': (p.vatAmount || 0).toFixed(2).replace('.', ','),
      'Incl BTW': (p.amountIncl || 0).toFixed(2).replace('.', ','),
    })),
    `kosten-${year}.csv`
  );

  view.querySelectorAll('.bk-cost-card').forEach(card => {
    card.onclick = () => {
      const p = purchases.find(x => x.id === card.dataset.id);
      if (p) openPurchaseDetailModal(p, container);
    };
  });
}

// ─── KILOMETERS ──────────────────────────────────────────────────────────────

function renderKm(view, kmLogs, container) {
  const now  = new Date();
  const year = container.dataset.kmYear ? parseInt(container.dataset.kmYear) : now.getFullYear();
  const yearLogs = kmLogs.filter(k => inYear(k.date, year) && !k.isPrivate);
  const allYearLogs = kmLogs.filter(k => inYear(k.date, year));

  const totalZakelijk = yearLogs.reduce((s, k) => s + (Number(k.km) || 0), 0);
  const totalPrive    = allYearLogs.filter(k => k.isPrivate).reduce((s, k) => s + (Number(k.km) || 0), 0);
  const aftrek        = totalZakelijk * KM_VERGOEDING;

  const sorted = [...allYearLogs].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  // Per maand zakelijk
  const byMonth = {};
  yearLogs.forEach(k => {
    const m = getMonth(k.date);
    byMonth[m] = (byMonth[m] || 0) + (Number(k.km) || 0);
  });

  const years = [...new Set(kmLogs.map(k => getYear(k.date)).filter(Boolean))].sort((a, b) => b - a);
  if (!years.includes(now.getFullYear())) years.unshift(now.getFullYear());

  const maanden = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
  const maxKm   = Math.max(...Object.values(byMonth), 1);

  view.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <select id="km-year" class="bk-year-select">
        ${years.map(y => `<option value="${y}" ${y === year ? 'selected' : ''}>${y}</option>`).join('')}
      </select>
      <button class="btn bk-new-btn" id="new-km-btn">+ Rit</button>
    </div>

    <div class="bk-km-summary">
      <div class="bk-km-stat">
        <div class="bk-km-val">${totalZakelijk.toLocaleString('nl-NL')}</div>
        <div class="bk-km-label">Zakelijke km</div>
      </div>
      <div class="bk-km-stat">
        <div class="bk-km-val money">${fmtMoney(aftrek)}</div>
        <div class="bk-km-label">Aftrek (€0,23/km)</div>
      </div>
      <div class="bk-km-stat">
        <div class="bk-km-val">${totalPrive.toLocaleString('nl-NL')}</div>
        <div class="bk-km-label">Privé km</div>
      </div>
    </div>

    ${Object.keys(byMonth).length > 0 ? `
      <div class="bk-km-chart">
        ${maanden.map((m, i) => {
          const km = byMonth[i] || 0;
          const h  = maxKm > 0 ? Math.round(km / maxKm * 60) : 0;
          return `
            <div class="bk-km-col">
              <div class="bk-km-bar-wrap">
                <div class="bk-km-bar bar" style="--bk-bar-h:${h}px;height:var(--bk-bar-h,0)" title="${km} km"></div>
              </div>
              <div class="bk-km-month">${m}</div>
            </div>
          `;
        }).join('')}
      </div>
    ` : ''}

    ${sorted.length === 0 ? `
      <div class="section-empty" style="margin-top:20px">
        <div style="font-size:2rem;margin-bottom:10px">${icon('car')}</div>
        <p style="font-weight:600;margin:0 0 4px">Geen ritten in ${year}</p>
        <p class="muted" style="font-size:.85rem;margin:0">Registreer zakelijke kilometers voor aftrek</p>
      </div>
    ` : `
      <div class="card-title" style="margin:16px 0 8px">Ritten ${year}</div>
      <div class="bk-list">
        ${sorted.map((k, idx) => `
          <div class="bk-km-card card" style="--i:${idx}" data-id="${escapeHTML(k.id)}">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div>
                <div style="font-weight:600">${k.isPrivate ? icon('home') : icon('briefcase')} ${escapeHTML(k.from || '—')} → ${escapeHTML(k.to || '—')}</div>
                <div style="font-size:.78rem;color:var(--text-dim);margin-top:2px">${fmtDateShort(k.date)} · ${escapeHTML(k.purpose || '')}</div>
              </div>
              <div style="text-align:right">
                <div style="font-weight:700;font-size:1.05rem">${Number(k.km || 0).toLocaleString('nl-NL')} km</div>
                ${!k.isPrivate ? `<div style="font-size:.7rem;color:var(--ok)">${fmtMoney((Number(k.km) || 0) * KM_VERGOEDING)} aftrek</div>` : `<div style="font-size:.7rem;color:var(--text-faint)">Privé</div>`}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `}
  `;

  view.querySelector('#new-km-btn').onclick = () => openNewKmModal(container);
  view.querySelector('#km-year').onchange = e => { container.dataset.kmYear = e.target.value; render(container); };

  view.querySelectorAll('.bk-km-card').forEach(card => {
    card.onclick = () => {
      const k = kmLogs.find(x => x.id === card.dataset.id);
      if (k) openKmDetailModal(k, container);
    };
  });
}

// ─── BTW-AANGIFTE ────────────────────────────────────────────────────────────

// Klein blokje boven BTW/W&V: welke administraties zijn samengevoegd + omzet per administratie
function groupNotice(group, invoices, label) {
  if (group.length < 2) return '';
  const per = group.map(id => {
    const omzet = invoices.filter(i => (i.adminId || 'taxi') === id).reduce((s, i) => s + (i.totalExcl || 0), 0);
    return `${escapeHTML(ADMINS[id].label)} ${fmtMoney(omzet)}`;
  }).join(' · ');
  return `<div class="bk-group-note"><span class="bk-group-ic">${icon('building')}</span><div><div>${label}: <strong>${group.map(id => escapeHTML(ADMINS[id].label)).join(' + ')}</strong> samen — één onderneming, één btw-nummer.</div><div class="bk-group-per">Omzet excl. btw: ${per}</div></div></div>`;
}

function renderBTW(view, invoices, purchases, container, group = []) {
  const now    = new Date();
  const curQ   = Math.floor(now.getMonth() / 3);
  const curY   = now.getFullYear();
  const selQ   = (container.dataset.btwQ !== '' && container.dataset.btwQ != null) ? parseInt(container.dataset.btwQ, 10) : curQ;
  const selY   = container.dataset.btwY ? parseInt(container.dataset.btwY) : curY;

  // BTW over verkoopfacturen — som per BTW-tarief over alle regels (niet alleen lines[0])
  const qInvoices = invoices.filter(i => inQuarter(i.date, selQ, selY));
  // Rubrieken aangifte: 1a = hoog tarief (21%), 1b = laag tarief (9%), 1c = overige tarieven,
  // 1e = 0% / verlegd. Vrijgestelde omzet (art. 11, bv. Adab) en KOR horen níet in de aangifte.
  let omzet9 = 0, btw9 = 0, omzet21 = 0, btw21 = 0, omzetOv = 0, btwOv = 0, omzetVerl = 0, omzetVrij = 0;
  const inv9Set = new Set(), inv21Set = new Set(), invOvSet = new Set(), invVerlSet = new Set(), invVrijSet = new Set();
  for (const inv of qInvoices) {
    const verlegd = inv.vatNote === VAT_NOTES.verlegd;
    for (const line of (inv.lines || [])) {
      const rate = Number(line.vatRate ?? 0);
      const excl = line.amountExcl ?? 0;
      const vat  = line.vatAmount  ?? 0;
      if (rate === 21)     { omzet21 += excl; btw21 += vat; inv21Set.add(inv.id); }
      else if (rate === 9) { omzet9  += excl; btw9  += vat; inv9Set.add(inv.id); }
      else if (rate > 0)   { omzetOv += excl; btwOv += vat; invOvSet.add(inv.id); }
      else if (verlegd)    { omzetVerl += excl; invVerlSet.add(inv.id); }
      else                 { omzetVrij += excl; invVrijSet.add(inv.id); }
    }
  }
  const totOmzet = omzet9 + omzet21 + omzetOv + omzetVerl + omzetVrij;
  const nFact = n => `${n} ${n === 1 ? 'factuur' : 'facturen'}`;
  const totBtwAf = btw9 + btw21 + btwOv;

  // Voorbelasting (BTW op inkoopfacturen)
  const purQ    = purchases.filter(p => inQuarter(p.date, selQ, selY));
  const voorBel = purQ.reduce((s, p) => s + (p.vatAmount || 0), 0);

  // Saldo
  const saldo = totBtwAf - voorBel;

  // Deadline: 30 dagen na einde kwartaal
  const { end } = quarterDates(selQ, selY);
  const deadline = addDays(end, 30);
  const isLate   = ymd() > deadline;
  const isPast   = end < ymd();

  // Kwartaal picker
  const quarters = [];
  for (let y = curY; y >= curY - 2; y--) {
    for (let q = 3; q >= 0; q--) {
      if (y === curY && q > curQ) continue;
      quarters.push({ q, y });
    }
  }

  view.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div class="card-title">BTW-aangifte</div>
      <select id="btw-kwartaal" class="bk-year-select">
        ${quarters.map(({ q, y }) => `
          <option value="${q}-${y}" ${q === selQ && y === selY ? 'selected' : ''}>${quarterLabel(q, y)}</option>
        `).join('')}
      </select>
    </div>

    ${groupNotice(group, qInvoices, 'Aangifte voor')}

    ${isPast ? `
      <div class="bk-btw-deadline ${isLate ? 'bk-deadline-late' : ''}">
        ${isLate ? icon('warning') + ' Aangifte deadline verstreken' : `${icon('calendar')} Aangifte deadline: ${fmtDateLong(deadline)}`}
      </div>
    ` : ''}

    <div class="bk-btw-table">
      <div class="bk-btw-section-head">Leveringen/diensten</div>

      <div class="bk-btw-row">
        <span class="bk-btw-rubriek">1a</span>
        <span>Hoog tarief 21% — ${nFact(inv21Set.size)}</span>
        <span class="money">${fmtMoney(omzet21)}</span>
        <span class="bk-btw-vat">${fmtMoney(btw21)}</span>
      </div>
      <div class="bk-btw-row">
        <span class="bk-btw-rubriek">1b</span>
        <span>Laag tarief 9% — ${nFact(inv9Set.size)}</span>
        <span class="money">${fmtMoney(omzet9)}</span>
        <span class="bk-btw-vat">${fmtMoney(btw9)}</span>
      </div>
      ${omzetOv ? `
        <div class="bk-btw-row">
          <span class="bk-btw-rubriek">1c</span>
          <span>Overige tarieven — ${nFact(invOvSet.size)}</span>
          <span class="money">${fmtMoney(omzetOv)}</span>
          <span class="bk-btw-vat">${fmtMoney(btwOv)}</span>
        </div>
      ` : ''}
      ${omzetVerl ? `
        <div class="bk-btw-row">
          <span class="bk-btw-rubriek">1e</span>
          <span>0% / btw verlegd — ${nFact(invVerlSet.size)}</span>
          <span class="money">${fmtMoney(omzetVerl)}</span>
          <span class="bk-btw-vat">—</span>
        </div>
      ` : ''}
      ${omzetVrij ? `
        <div class="bk-btw-row bk-btw-row-info">
          <span class="bk-btw-rubriek">—</span>
          <span>Vrijgesteld (bv. art. 11) — ${nFact(invVrijSet.size)} · hoort niet in de aangifte</span>
          <span class="money">${fmtMoney(omzetVrij)}</span>
          <span class="bk-btw-vat">—</span>
        </div>
      ` : ''}

      <div class="bk-btw-subtotal">
        <span>Totaal omzet</span>
        <span class="money">${fmtMoney(totOmzet)}</span>
        <span>BTW verschuldigd</span>
        <span class="money">${fmtMoney(totBtwAf)}</span>
      </div>

      <div class="bk-btw-section-head" style="margin-top:12px">Voorbelasting (aftrekbaar)</div>
      <div class="bk-btw-row">
        <span class="bk-btw-rubriek">5b</span>
        <span>BTW op inkopen — ${purQ.length} ${purQ.length === 1 ? 'bon' : 'bonnen'}</span>
        <span></span>
        <span class="bk-btw-vat" style="color:var(--ok)">- ${fmtMoney(voorBel)}</span>
      </div>

      <div class="bk-btw-saldo ${saldo > 0 ? 'bk-saldo-betalen' : 'bk-saldo-terug'}">
        <span>${saldo > 0 ? 'Te betalen aan Belastingdienst' : 'Terug te ontvangen'}</span>
        <span class="money">${fmtMoney(Math.abs(saldo))}</span>
      </div>
    </div>

    <button class="btn secondary bk-act-wide" id="btw-copy" style="margin-top:14px">Kopieer aangifte-samenvatting</button>

    <div class="bk-btw-disclaimer">
      ℹ️ Dit is een indicatie. Controleer altijd via Mijn Belastingdienst Zakelijk. Aangifte uiterlijk ${fmtDateLong(deadline)}.
    </div>
  `;

  view.querySelector('#btw-kwartaal').onchange = e => {
    const [q, y] = e.target.value.split('-');
    container.dataset.btwQ = q;
    container.dataset.btwY = y;
    render(container);
  };

  view.querySelector('#btw-copy').onclick = () => {
    const eur = n => fmtMoneyPDF(n);
    const text = [
      `BTW-aangifte ${quarterLabel(selQ, selY)}${group.length > 1 ? ` (${group.map(id => ADMINS[id].label).join(' + ')})` : ''}`,
      '',
      `Rubriek 1a (hoog, 21%): omzet ${eur(omzet21)} | btw ${eur(btw21)}`,
      `Rubriek 1b (laag, 9%): omzet ${eur(omzet9)} | btw ${eur(btw9)}`,
      ...(omzetOv ? [`Rubriek 1c (overige tarieven): omzet ${eur(omzetOv)} | btw ${eur(btwOv)}`] : []),
      ...(omzetVerl ? [`Rubriek 1e (0% / verlegd): omzet ${eur(omzetVerl)}`] : []),
      `Rubriek 5b (voorbelasting): ${eur(voorBel)}`,
      ...(omzetVrij ? ['', `Niet aangeven - vrijgestelde omzet: ${eur(omzetVrij)}`] : []),
      '',
      `${saldo > 0 ? 'TE BETALEN' : 'TERUG TE ONTVANGEN'}: ${eur(Math.abs(saldo))}`,
    ].join('\n');
    navigator.clipboard.writeText(text).then(() => ok('Samenvatting gekopieerd')).catch(() => err('Kopiëren mislukt'));
  };
}

// ─── WINST & VERLIES ─────────────────────────────────────────────────────────

function renderWV(view, invoices, purchases, kmLogs, container, group = []) {
  const now  = new Date();
  const year = container.dataset.wvYear ? parseInt(container.dataset.wvYear) : now.getFullYear();

  const invYear = invoices.filter(i => inYear(i.date, year));
  const purYear = purchases.filter(p => inYear(p.date, year));
  const kmYear  = kmLogs.filter(k => inYear(k.date, year) && !k.isPrivate);

  const omzet    = invYear.reduce((s, i) => s + (i.totalExcl || 0), 0);
  const kosten   = purYear.reduce((s, p) => s + (p.amountExcl || 0), 0);
  const kmTotaal = kmYear.reduce((s, k) => s + (Number(k.km) || 0), 0);
  const kmAftrek = kmTotaal * KM_VERGOEDING;

  const brutoWinst  = omzet - kosten - kmAftrek;
  const fis = fiscaal(year);
  const zelfstAftrek = brutoWinst > 0 ? Math.min(fis.zelfst, brutoWinst) : 0;
  const naZelfst    = Math.max(0, brutoWinst - zelfstAftrek);
  const mkbAftrek   = naZelfst * fis.mkb;
  const belastbaar  = Math.max(0, naZelfst - mkbAftrek);

  // Belasting schatting (box 1, schijven van dat jaar)
  const belasting = box1Tax(belastbaar, fis.schijven);

  const nettoNaBelasting = brutoWinst - belasting;

  const years = [...new Set([...invoices, ...purchases].map(i => getYear(i.date)).filter(Boolean))].sort((a, b) => b - a);
  if (!years.includes(now.getFullYear())) years.unshift(now.getFullYear());

  view.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div class="card-title">Winst &amp; Verlies ${year}</div>
      <select id="wv-year" class="bk-year-select">
        ${years.map(y => `<option value="${y}" ${y === year ? 'selected' : ''}>${y}</option>`).join('')}
      </select>
    </div>

    ${groupNotice(group, invYear, 'Winst over')}

    <div class="bk-wv-table">
      <div class="bk-wv-section">OMZET</div>
      <div class="bk-wv-row">
        <span>Verkoopfacturen (excl. BTW)</span>
        <span class="money" style="color:var(--ok)">${fmtMoney(omzet)}</span>
      </div>
      <div class="bk-wv-row bk-wv-subtotal">
        <span>Totale omzet</span>
        <span class="money" style="color:var(--ok)">${fmtMoney(omzet)}</span>
      </div>

      <div class="bk-wv-section" style="margin-top:12px">KOSTEN</div>
      <div class="bk-wv-row">
        <span>Zakelijke kosten (excl. BTW)</span>
        <span class="money" style="color:var(--danger)">- ${fmtMoney(kosten)}</span>
      </div>
      <div class="bk-wv-row">
        <span>Kilometeraftrek (${kmTotaal.toLocaleString('nl-NL')} km × €0,23)</span>
        <span class="money" style="color:var(--danger)">- ${fmtMoney(kmAftrek)}</span>
      </div>
      <div class="bk-wv-row bk-wv-subtotal">
        <span>Totale kosten</span>
        <span class="money" style="color:var(--danger)">- ${fmtMoney(kosten + kmAftrek)}</span>
      </div>

      <div class="bk-wv-row bk-wv-result ${brutoWinst >= 0 ? 'bk-wv-positive' : 'bk-wv-negative'}">
        <span>Bruto winst</span>
        <span class="money">${fmtMoney(brutoWinst)}</span>
      </div>
    </div>

    <div class="bk-wv-table" style="margin-top:12px">
      <div class="bk-wv-section">FISCALE AFTREKKEN (schatting, cijfers ${fis.year})</div>
      <div class="bk-wv-row">
        <span>Zelfstandigenaftrek (max. € ${fis.zelfst.toLocaleString('nl-NL')})</span>
        <span class="money" style="color:var(--ok)">- ${fmtMoney(zelfstAftrek)}</span>
      </div>
      <div class="bk-wv-row">
        <span>MKB-winstvrijstelling (${String(fis.mkb * 100).replace('.', ',')}%)</span>
        <span class="money" style="color:var(--ok)">- ${fmtMoney(mkbAftrek)}</span>
      </div>
      <div class="bk-wv-row bk-wv-subtotal">
        <span>Belastbare winst</span>
        <span class="money">${fmtMoney(belastbaar)}</span>
      </div>
      <div class="bk-wv-row">
        <span>Inkomstenbelasting (schatting)</span>
        <span class="money" style="color:var(--danger)">- ${fmtMoney(belasting)}</span>
      </div>

      <div class="bk-wv-row bk-wv-netto ${nettoNaBelasting >= 0 ? 'bk-wv-positive' : 'bk-wv-negative'}">
        <span>${icon('money')} Netto over (na belasting)</span>
        <span class="money" style="font-size:1.1rem">${fmtMoney(nettoNaBelasting)}</span>
      </div>
    </div>

    <div class="bk-btw-disclaimer">
      ⚠ Dit is een ruwe schatting. Zelfstandigenaftrek geldt alleen bij minimaal 1.225 uur per jaar (urencriterium). Heffingskortingen, startersaftrek en andere persoonlijke omstandigheden zijn niet meegenomen. Laat je aangifte controleren door een boekhouder.
    </div>
  `;

  view.querySelector('#wv-year').onchange = e => { container.dataset.wvYear = e.target.value; render(container); };
}

// ─── KLANTEN ─────────────────────────────────────────────────────────────────

function renderKlanten(view, clients, invoices, container) {
  const search = (container.dataset.clientSearch || '').toLowerCase();

  // Enrich clients with invoice count + total
  const enriched = clients.map(c => {
    const cInv = invoices.filter(i =>
      (c.email && i.client?.email === c.email) ||
      (i.client?.name || '').toLowerCase() === (c.name || '').toLowerCase()
    );
    return { ...c, invoiceCount: cInv.length, totalIncl: cInv.reduce((s, i) => s + (i.totalIncl || 0), 0) };
  });

  const filtered = search
    ? enriched.filter(c => (c.name || '').toLowerCase().includes(search) || (c.email || '').toLowerCase().includes(search))
    : enriched;

  const sorted = [...filtered].sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));

  view.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <span style="font-size:.82rem;color:var(--text-dim)">${clients.length} klant${clients.length !== 1 ? 'en' : ''} opgeslagen</span>
      <button class="btn bk-new-btn" id="new-client-btn">+ Klant</button>
    </div>

    <div class="bk-client-search-wrap">
      <span style="opacity:.5">${icon('search')}</span>
      <input id="client-search" class="bk-client-search" placeholder="Zoek klant…" value="${escapeHTML(container.dataset.clientSearch || '')}" />
    </div>

    ${sorted.length === 0 ? `
      <div class="section-empty" style="margin-top:30px">
        <div style="font-size:2rem;margin-bottom:10px">${icon('users')}</div>
        <p style="font-weight:600;margin:0 0 4px">${search ? 'Geen klanten gevonden' : 'Nog geen klanten'}</p>
        <p class="muted" style="font-size:.85rem;margin:0">${search ? 'Probeer een andere zoekopdracht' : 'Klanten worden automatisch opgeslagen bij het aanmaken van een factuur'}</p>
      </div>
    ` : `
      <div class="bk-list">
        ${sorted.map((c, idx) => `
          <div class="bk-client-card card" style="--i:${idx}" data-id="${escapeHTML(c.id)}">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
              <div style="flex:1;min-width:0">
                <div class="bk-client-name">${escapeHTML(c.name || '—')}</div>
                ${c.city    ? `<div class="bk-client-detail">${icon('pin')} ${escapeHTML(c.city)}</div>` : ''}
                ${c.email   ? `<div class="bk-client-detail">${icon('mail')} ${escapeHTML(c.email)}</div>` : ''}
                ${c.phone   ? `<div class="bk-client-detail">${icon('phone')} ${escapeHTML(c.phone)}</div>` : ''}
                ${c.kvk     ? `<div class="bk-client-detail">${icon('building')} KvK: ${escapeHTML(c.kvk)}</div>` : ''}
              </div>
              <div style="text-align:right;flex-shrink:0;margin-left:10px">
                <div class="bk-client-count">${c.invoiceCount} factuur${c.invoiceCount !== 1 ? 'en' : ''}</div>
                ${c.invoiceCount > 0 ? `<div class="bk-client-amount">${fmtMoney(c.totalIncl)}</div>` : ''}
              </div>
            </div>
            <button class="btn bk-client-inv-btn" data-id="${escapeHTML(c.id)}" style="width:100%;margin-top:10px;font-size:.85rem;padding:8px">
              ${icon('receipt')} Nieuwe factuur voor ${escapeHTML(c.name || '')}
            </button>
          </div>
        `).join('')}
      </div>
    `}
  `;

  view.querySelector('#new-client-btn').onclick = () => openNewClientModal(container);

  const searchInput = view.querySelector('#client-search');
  let searchTimer = null;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { container.dataset.clientSearch = searchInput.value; render(container); }, 300);
  });

  view.querySelectorAll('.bk-client-inv-btn').forEach(btn => {
    btn.onclick = async e => {
      e.stopPropagation();
      const client = clients.find(c => c.id === btn.dataset.id);
      if (!client) return;
      container.dataset.bkTab = 'facturen';
      render(container);
      setTimeout(() => openInvoiceModal(container, { prefillClient: client }), 100);
    };
  });

  view.querySelectorAll('.bk-client-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.bk-client-inv-btn')) return;
      const c = enriched.find(x => x.id === card.dataset.id);
      if (c) openClientDetailModal(c, invoices, container);
    });
  });
}

function openClientDetailModal(client, invoices, container) {
  const cInv = invoices.filter(i =>
    (client.email && i.client?.email === client.email) ||
    (i.client?.name || '').toLowerCase() === (client.name || '').toLowerCase()
  ).sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal bk-modal">
      <button type="button" class="modal-close" id="cd-x">×</button>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">
        <div style="font-size:1.25rem;font-weight:800">${escapeHTML(client.name || '—')}</div>
        <button class="btn secondary" id="cd-edit" style="font-size:.8rem;padding:6px 12px">Bewerken</button>
      </div>
      ${client.address ? `<div style="font-size:.85rem;color:var(--text-dim)">${escapeHTML(client.address)}</div>` : ''}
      ${client.city    ? `<div style="font-size:.85rem;color:var(--text-dim)">${escapeHTML(client.city)}</div>` : ''}
      ${client.kvk     ? `<div style="font-size:.85rem;color:var(--text-dim)">KvK: ${escapeHTML(client.kvk)}</div>` : ''}
      ${client.btw     ? `<div style="font-size:.85rem;color:var(--text-dim)">BTW: ${escapeHTML(client.btw)}</div>` : ''}
      ${client.iban    ? `<div style="font-size:.85rem;color:var(--text-dim)">IBAN: ${escapeHTML(client.iban)}${client.bic ? ` · BIC: ${escapeHTML(client.bic)}` : ''}</div>` : ''}
      ${client.email   ? `<div style="font-size:.85rem;color:var(--text-dim)">${icon('mail')} ${escapeHTML(client.email)}</div>` : ''}
      ${client.phone   ? `<div style="font-size:.85rem;color:var(--text-dim)">${icon('phone')} ${escapeHTML(client.phone)}</div>` : ''}

      <button class="btn block" id="cd-new-inv" style="margin:16px 0 4px;padding:12px">${icon('receipt')} Nieuwe factuur voor deze klant</button>

      ${cInv.length > 0 ? `
        <div class="card-title" style="margin:16px 0 8px">Factuurhistorie (${cInv.length})</div>
        <div class="bk-list">
          ${cInv.map(inv => `
            <div class="bk-card-sm card" style="cursor:default">
              <div class="bk-card-top">
                <span style="font-size:.82rem;color:var(--text-dim)">${escapeHTML(inv.number || '')} · ${fmtDateShort(inv.date)}</span>
                <span class="bk-status bk-status-${inv._status || computeStatus(inv)}">${statusLabel(inv._status || computeStatus(inv))}</span>
              </div>
              <div style="display:flex;justify-content:space-between;margin-top:4px">
                <span style="font-size:.82rem;color:var(--text-dim)">${escapeHTML(inv.lines?.[0]?.description || 'Vervoersdienst')}</span>
                <span class="money">${fmtMoney(inv.totalIncl || 0)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      ` : '<p class="muted" style="font-size:.85rem;margin-top:12px">Nog geen facturen voor deze klant</p>'}

      <button class="btn secondary bk-act-wide bk-act-del" id="cd-del" style="margin-top:16px">Klant verwijderen</button>
    </div>
  `;

  document.body.appendChild(backdrop);
  backdrop.querySelector('#cd-x').onclick = () => backdrop.remove();
  backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.remove(); });

  backdrop.querySelector('#cd-edit').onclick = () => {
    backdrop.remove();
    openEditClientModal(client, container);
  };

  backdrop.querySelector('#cd-new-inv').onclick = () => {
    backdrop.remove();
    container.dataset.bkTab = 'facturen';
    render(container);
    setTimeout(() => openInvoiceModal(container, { prefillClient: client }), 100);
  };

  let delStep = 0;
  backdrop.querySelector('#cd-del').onclick = async function () {
    if (delStep === 0) { delStep = 1; this.textContent = '⚠ Nogmaals tikken om te verwijderen'; return; }
    await del('clients', client.id);
    ok('Klant verwijderd');
    backdrop.remove();
    render(container);
  };
}

function openEditClientModal(client, container) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal bk-modal">
      <button type="button" class="modal-close" id="ec-x">×</button>
      <h2 style="margin:0 0 16px">Klant bewerken</h2>
      <form id="ec-form" autocomplete="off">
        <div class="bk-form-section">
          <label>Bedrijfsnaam / naam *</label>
          <input id="ec-name"  type="text"  value="${escapeHTML(client.name    || '')}" required />
          <label>Straat + huisnummer</label>
          <input id="ec-addr"  type="text"  value="${escapeHTML(client.address || '')}" placeholder="Straatnaam 1" />
          <label>Postcode + stad</label>
          <input id="ec-city"  type="text"  value="${escapeHTML(client.city    || '')}" placeholder="1234 AB Amsterdam" />
          <label>KvK-nummer</label>
          <input id="ec-kvk"   type="text"  inputmode="numeric" value="${escapeHTML(client.kvk   || '')}" placeholder="12345678" />
          <label>BTW-nummer</label>
          <input id="ec-btw"   type="text"  value="${escapeHTML(client.btw     || '')}" placeholder="NL123456789B01" />
          <label>IBAN</label>
          <input id="ec-iban"  type="text"  value="${escapeHTML(client.iban    || '')}" placeholder="NL00 BANK 0123 4567 89" />
          <label>BIC</label>
          <input id="ec-bic"   type="text"  value="${escapeHTML(client.bic     || '')}" placeholder="INGBNL2A" />
          <label>E-mailadres</label>
          <input id="ec-email" type="email" value="${escapeHTML(client.email   || '')}" placeholder="info@bedrijf.nl" />
          <label>Telefoon / WhatsApp</label>
          <input id="ec-phone" type="tel"   inputmode="tel" value="${escapeHTML(client.phone || '')}" placeholder="+31 6 12345678" />
        </div>
        <button type="submit" class="btn block" style="margin-top:14px;padding:13px">Klant opslaan</button>
      </form>
    </div>
  `;

  document.body.appendChild(backdrop);
  backdrop.querySelector('#ec-x').onclick = () => backdrop.remove();
  backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.remove(); });

  backdrop.querySelector('#ec-form').onsubmit = async e => {
    e.preventDefault();
    const name = backdrop.querySelector('#ec-name').value.trim();
    if (!name) { err('Vul een naam in'); return; }
    await put('clients', {
      ...client,
      name,
      address: backdrop.querySelector('#ec-addr').value.trim(),
      city:    backdrop.querySelector('#ec-city').value.trim(),
      kvk:     backdrop.querySelector('#ec-kvk').value.trim(),
      btw:     backdrop.querySelector('#ec-btw').value.trim(),
      iban:    backdrop.querySelector('#ec-iban').value.trim(),
      bic:     backdrop.querySelector('#ec-bic').value.trim(),
      email:   backdrop.querySelector('#ec-email').value.trim(),
      phone:   backdrop.querySelector('#ec-phone').value.trim(),
    });
    ok(`${name} bijgewerkt ✓`);
    backdrop.remove();
    render(container);
  };
}

// ─── Snel invullen: plak een blok klantgegevens en lees alles zelf uit ──────
// Herkent (met of zonder label): naam, straat+nr, postcode+stad, KvK, BTW,
// IBAN, BIC, e-mail en telefoon. Gelabelde regels ("Btw-nummer: …") winnen;
// ongelabelde regels worden op patroon herkend.
// ── OCR-correcties: tekstherkenning verwart cijfers en letters (0↔O, 1↔I, 8↔B…).
// Alleen toegepast op plekken waar zeker cijfers (of letters) horen.
const _OCR_DIGIT  = { O: '0', o: '0', Q: '0', D: '0', I: '1', l: '1', '|': '1', i: '1', Z: '2', z: '2', S: '5', s: '5', G: '6', B: '8' };
const _OCR_LETTER = { 0: 'O', 1: 'I', 2: 'Z', 5: 'S', 6: 'G', 8: 'B' };
const ocrDigits  = v => String(v).replace(/[OoQDIl|iZzSsGB]/g, c => _OCR_DIGIT[c]);
const ocrLetters = v => String(v).toUpperCase().replace(/[012568]/g, c => _OCR_LETTER[c]);

function fixBtw(v) {
  const t = String(v || '').toUpperCase().replace(/[\s.\-]/g, '');
  const m = t.match(/^([A-Z]{2})([0-9A-Z]{9,10})B([0-9A-Z]{2})$/);
  if (!m) return t;
  let mid = m[2];
  // OCR leest twee nullen soms als drie tekens ("00" → "O0O"). Een btw-nummer heeft
  // precies 9 cijfers tussen landcode en B: bij 10 met zo'n reeks er één uit halen.
  if (mid.length === 10) {
    const run = mid.match(/[O0Q]{3,}/);
    if (!run) return t;
    mid = mid.slice(0, run.index) + mid.slice(run.index + 1);
  }
  return `${m[1]}${ocrDigits(mid)}B${ocrDigits(m[3])}`;
}
export function btwValid(v) {
  const t = String(v || '').toUpperCase().replace(/\s/g, '');
  return t.startsWith('NL') ? /^NL\d{9}B\d{2}$/.test(t) : /^[A-Z]{2}[0-9A-Z+*]{2,12}$/.test(t);
}
function fixIban(v) {
  const t = String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const m = t.match(/^(NL)([0-9A-Z]{2})([0-9A-Z]{4})([0-9A-Z]{10})$/);   // NL: 2 cijfers, 4 letters, 10 cijfers
  return m ? `NL${ocrDigits(m[2])}${ocrLetters(m[3])}${ocrDigits(m[4])}` : t;
}
export function ibanValid(iban) {
  const t = String(iban || '').toUpperCase().replace(/\s/g, '');
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(t)) return false;
  const num = (t.slice(4) + t.slice(0, 4)).replace(/[A-Z]/g, c => c.charCodeAt(0) - 55);
  let r = 0;
  for (const ch of num) r = (r * 10 + +ch) % 97;
  return r === 1;
}
function fixPhone(v) {
  return String(v || '')
    .replace(/\(\s*[0O]\s*\)/g, ' ')                 // +31 (0) 6 … → +31 6 … (anders breekt WhatsApp)
    .replace(/[OoIl|]/g, c => _OCR_DIGIT[c])
    .replace(/[^\d+\s\-]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

// OCR-ruis weghalen: regels zonder (genoeg) letters/cijfers, losse streepjes, ‘|’ van randen
export function cleanOcrText(text) {
  return String(text || '').split(/\r?\n/)
    .map(l => l.replace(/[|_~`]+/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(l => {
      const alnum = (l.match(/[A-Za-z0-9@]/g) || []).length;
      return alnum >= 3 && alnum / l.length >= 0.5;
    })
    .join('\n');
}

export function parseClientText(raw) {
  const res = {};
  const lines = (raw || '').split(/\r?\n/).map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const leftover = [];
  const afterLabel = line => (line.includes(':') ? line.slice(line.indexOf(':') + 1) : line.replace(/^\S+\s*/, '')).trim();

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (!res.btw && /\bbtw|\bvat\b|\bb\.?t\.?w\.?\b/.test(lower)) {
      const m = line.match(/[A-Z]{2}\s?[0-9OQDILSZ]{9,10}\s?B\s?[0-9OQDILSZ]{2}/i);
      res.btw = fixBtw(m ? m[0] : afterLabel(line));
      continue;
    }
    if (!res.kvk && /k\.?v\.?k|kamer van koophandel|coc\b/.test(lower)) {
      const m = ocrDigits(afterLabel(line).replace(/\s/g, '')).match(/\d{8}/);
      res.kvk = m ? m[0] : afterLabel(line);
      continue;
    }
    if (!res.iban && /iban|rekeningnummer|rekening/.test(lower)) {
      const m = line.match(/[A-Z]{2}\s?[0-9OQDIL]{2}(?:\s?[A-Z0-9]{4}){3,7}(?:\s?[A-Z0-9]{1,3})?/i);
      res.iban = fixIban(m ? m[0] : afterLabel(line));
      continue;
    }
    if (!res.bic && /\bbic\b|swift/.test(lower)) {
      const m = afterLabel(line).match(/[A-Z]{6}[A-Z0-9]{2}(?:[A-Z0-9]{3})?/i);
      res.bic = (m ? m[0] : afterLabel(line)).toUpperCase();
      continue;
    }
    if (/mail/.test(lower)) {
      const m = line.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/);
      if (m && !res.email) { res.email = m[0].toLowerCase(); continue; }
    }
    if (!res.phone && /^(tel(efoon)?|t\b|mob(iel)?|m\b|phone|gsm|whatsapp)\.?\s*[:.]?/i.test(lower) && /\d{3}/.test(line)) {
      res.phone = fixPhone(afterLabel(line));
      continue;
    }
    leftover.push(line);
  }

  const rest = [];
  for (const line of leftover) {
    let m;
    if (!res.email && (m = line.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/))) { res.email = m[0].toLowerCase(); continue; }
    if (!res.btw && (m = line.match(/\b[A-Z]{2}\s?\d{9}\s?B\s?\d{2}\b/i))) { res.btw = fixBtw(m[0]); continue; }
    if (!res.iban && (m = line.match(/\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){3,7}(?:\s?[A-Z0-9]{1,3})?\b/))) { res.iban = fixIban(m[0]); continue; }
    if (!res.kvk && (m = line.match(/^\d{8}$/))) { res.kvk = m[0]; continue; }
    if (!res.city && (m = line.match(/^(\d{4})\s?([A-Za-z]{2})\s+(.+)$/))) { res.city = `${m[1]} ${m[2].toUpperCase()} ${m[3]}`; continue; }
    if (!res.phone && /^(\+\d{2}|0)[\d\s\-()]{7,}$/.test(line)) { res.phone = fixPhone(line); continue; }
    if (!res.address && /^[^\d@]{2,}\s\d+\S*$/.test(line)) { res.address = line; continue; }
    if (/^(www\.|https?:)/i.test(line)) continue;    // website-regel is geen naam
    if (/^(met )?(vriendelijke )?groet(en)?|^mvg\b|^(kind |best )?regards|^gr(oe)?t?\.?,?$/i.test(line)) continue;   // aanhef/afsluiting
    rest.push(line);
  }

  // Bedrijfsnaam met rechtsvorm heeft voorrang (handtekening: eerst persoon, dan bedrijf)
  const LEGAL = /\b(b\.?\s?v\.?|v\.?o\.?f\.?|n\.?v\.?|c\.?v\.?|holding|stichting|vereniging|gmbh|ltd|bvba|sarl)(\s|$|\.)/i;
  if (rest.length) res.name = rest.find(l => LEGAL.test(l)) || rest[0];
  return res;
}

function openNewClientModal(container) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal bk-modal">
      <button type="button" class="modal-close" id="nc-x">×</button>
      <h2 style="margin:0 0 16px">Nieuwe klant</h2>
      <form id="nc-form" autocomplete="off">
        <div class="bk-form-section bk-paste-box">
          <div class="bk-section-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="3.5" width="10" height="4" rx="1.2"/><path d="M17 5.5h2a1.5 1.5 0 0 1 1.5 1.5v12A1.5 1.5 0 0 1 19 20.5H5A1.5 1.5 0 0 1 3.5 19V7A1.5 1.5 0 0 1 5 5.5h2"/><path d="M8 11.5h8M8 15h5.5"/></svg>Snel invullen</div>
          <button type="button" class="btn secondary bk-photo-btn" id="nc-photo">${icon('camera')} Klant uit foto / screenshot</button>
          <input type="file" id="nc-photo-file" accept="image/*" hidden />
          <textarea id="nc-paste" rows="4" placeholder="…of plak hier de klantgegevens als tekst (of een gekopieerde afbeelding) — de velden hieronder worden automatisch ingevuld"></textarea>
          <div id="nc-paste-hint" class="bk-paste-hint"></div>
        </div>
        <div class="bk-form-section">
          <div class="bk-section-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.4"/><path d="M5.5 19.5a6.5 6.5 0 0 1 13 0"/></svg>Klantgegevens</div>
          <label>Bedrijfsnaam / naam *</label>
          <input id="nc-name" type="text" placeholder="Bedrijfsnaam" required />
          <label>Straat + huisnummer</label>
          <input id="nc-addr" type="text" placeholder="Straatnaam 1" />
          <label>Postcode + stad</label>
          <input id="nc-city" type="text" placeholder="1234 AB Amsterdam" />
          <label>KvK-nummer</label>
          <input id="nc-kvk" type="text" inputmode="numeric" placeholder="12345678" />
          <label>BTW-nummer</label>
          <input id="nc-btw" type="text" placeholder="NL123456789B01" />
          <label>IBAN</label>
          <input id="nc-iban" type="text" placeholder="NL00 BANK 0123 4567 89" />
          <label>BIC</label>
          <input id="nc-bic" type="text" placeholder="INGBNL2A" />
          <label>E-mailadres</label>
          <input id="nc-email" type="email" placeholder="info@bedrijf.nl" />
          <label>Telefoon / WhatsApp</label>
          <input id="nc-phone" type="tel" inputmode="tel" placeholder="+31 6 12345678" />
        </div>
        <button type="submit" class="btn block" style="margin-top:14px;padding:13px">Klant opslaan</button>
      </form>
    </div>
  `;

  document.body.appendChild(backdrop);
  backdrop.querySelector('#nc-x').onclick = () => backdrop.remove();
  backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.remove(); });

  const FIELD_MAP = { name: '#nc-name', address: '#nc-addr', city: '#nc-city', kvk: '#nc-kvk', btw: '#nc-btw', iban: '#nc-iban', bic: '#nc-bic', email: '#nc-email', phone: '#nc-phone' };
  const pasteEl = backdrop.querySelector('#nc-paste');
  const hint    = backdrop.querySelector('#nc-paste-hint');
  const applyText = (fromPhoto = false) => {
    const parsed = parseClientText(pasteEl.value);
    let count = 0;
    for (const [key, sel] of Object.entries(FIELD_MAP)) {
      const el = backdrop.querySelector(sel);
      el.classList.remove('bk-field-filled');
      if (parsed[key]) { el.value = key === 'iban' ? fmtIBAN(parsed[key]) : parsed[key]; el.classList.add('bk-field-filled'); count++; }
    }
    const warn = [
      parsed.iban && !ibanValid(parsed.iban) ? 'IBAN klopt niet (controlegetal)' : '',
      parsed.btw && !btwValid(parsed.btw) ? 'btw-nummer heeft geen geldig formaat' : '',
    ].filter(Boolean).map(w => ` · ⚠ ${w} — check het nummer`).join('');
    if (count) hint.textContent = `✓ ${count} veld${count !== 1 ? 'en' : ''} herkend${fromPhoto ? ' uit de foto' : ''} — controleer hieronder en sla op${warn}`;
    else hint.textContent = pasteEl.value.trim() ? 'Niets herkend — vul de velden handmatig in' : '';
    hint.classList.toggle('ok', count > 0 && !warn);
    hint.classList.toggle('warn', !!warn);
  };
  pasteEl.addEventListener('input', () => applyText(false));
  bindClientPhoto(backdrop, {
    button: '#nc-photo', file: '#nc-photo-file', pasteTarget: pasteEl, hint,
    onText: text => { pasteEl.value = text; applyText(true); },
  });

  backdrop.querySelector('#nc-form').onsubmit = async e => {
    e.preventDefault();
    const name = backdrop.querySelector('#nc-name').value.trim();
    if (!name) { err('Vul een naam in'); return; }
    const data = {
      name,
      address: backdrop.querySelector('#nc-addr').value.trim(),
      city:    backdrop.querySelector('#nc-city').value.trim(),
      kvk:     backdrop.querySelector('#nc-kvk').value.trim(),
      btw:     backdrop.querySelector('#nc-btw').value.replace(/\s/g, '').toUpperCase(),
      iban:    backdrop.querySelector('#nc-iban').value.trim(),
      bic:     backdrop.querySelector('#nc-bic').value.trim().toUpperCase(),
      email:   backdrop.querySelector('#nc-email').value.trim(),
      phone:   backdrop.querySelector('#nc-phone').value.trim(),
    };
    // Bestaat deze klant al (zelfde KvK, btw-nummer, e-mail of naam)? Dan bijwerken i.p.v. dubbel aanmaken
    const norm = v => String(v || '').toLowerCase().replace(/\s/g, '');
    const existing = (await all('clients')).find(c =>
      (data.kvk && norm(c.kvk) === norm(data.kvk)) || (data.btw && norm(c.btw) === norm(data.btw)) ||
      (data.email && norm(c.email) === norm(data.email)) || norm(c.name) === norm(name));
    if (existing) {
      const merged = { ...existing, lastUsed: Date.now() };
      for (const [k, v] of Object.entries(data)) if (v) merged[k] = v;
      await put('clients', merged);
      ok(`${name} bestond al — gegevens bijgewerkt ✓`);
    } else {
      await add('clients', { id: uid(), ...data, lastUsed: Date.now() });
      ok(`${name} opgeslagen ✓`);
    }
    backdrop.remove();
    render(container);
  };
}

// Foto/screenshot met klantgegevens → tekst (OCR, lazy geladen) → onText(text).
// Werkt via de knop (fotobibliotheek of camera) én door een afbeelding te plakken.
function bindClientPhoto(root, { button, file, pasteTarget, hint, onText }) {
  const btn   = root.querySelector(button);
  const input = root.querySelector(file);
  if (!btn || !input) return;
  const label = btn.innerHTML;
  let busy = false;
  const run = async (img) => {
    if (busy || !img) return;
    busy = true; btn.disabled = true;
    const show = (msg, p) => {
      btn.innerHTML = `${icon('camera')} ${msg}${p > 0 && p < 1 ? ` ${Math.round(p * 100)}%` : ''}`;
    };
    try {
      const { ocrImage } = await import('../receipt-ocr.js');
      const raw  = await ocrImage(img, show);
      const text = cleanOcrText(raw);
      if (!text) { err('Geen tekst gevonden op de foto — probeer een scherpere foto of screenshot'); return; }
      onText(text);
    } catch (e) {
      err('Foto lezen mislukt: ' + (e.message || 'onbekende fout'));
      if (hint) hint.textContent = '';
    } finally {
      busy = false; btn.disabled = false; btn.innerHTML = label; input.value = '';
    }
  };
  btn.onclick = () => input.click();
  input.onchange = () => run(input.files?.[0]);
  // Afbeelding geplakt (bv. gekopieerd uit WhatsApp) → direct lezen
  pasteTarget?.addEventListener('paste', e => {
    const item = [...(e.clipboardData?.items || [])].find(i => i.type.startsWith('image/'));
    if (!item) return;
    e.preventDefault();
    run(item.getAsFile());
  });
}

// Helper: open client picker mini-modal, resolves with selected client or null
function openClientPicker(clients) {
  return new Promise(resolve => {
    const sorted = [...clients].sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
      <div class="modal bk-modal" style="max-height:70vh">
        <button type="button" class="modal-close" id="cp-x">×</button>
        <h2 style="margin:0 0 12px;font-size:1.1rem">Kies klant</h2>
        <input id="cp-search" class="bk-client-search" placeholder="Zoek…" style="margin-bottom:10px" />
        <div id="cp-list" style="overflow-y:auto;max-height:50vh">
          ${sorted.length === 0 ? '<p class="muted" style="text-align:center;padding:20px">Nog geen opgeslagen klanten</p>' : sorted.map(c => `
            <div class="bk-cp-row" data-id="${escapeHTML(c.id)}">
              <div style="font-weight:600">${escapeHTML(c.name || '—')}</div>
              ${c.city ? `<div style="font-size:.78rem;color:var(--text-dim)">${escapeHTML(c.city)}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    const close = (val) => { backdrop.remove(); resolve(val); };
    backdrop.querySelector('#cp-x').onclick = () => close(null);
    backdrop.addEventListener('click', e => { if (e.target === backdrop) close(null); });

    // Search filter
    backdrop.querySelector('#cp-search').addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      backdrop.querySelectorAll('.bk-cp-row').forEach(row => {
        const id = row.dataset.id;
        const c  = sorted.find(x => x.id === id);
        row.style.display = (!q || (c?.name || '').toLowerCase().includes(q) || (c?.email || '').toLowerCase().includes(q)) ? '' : 'none';
      });
    });

    backdrop.querySelectorAll('.bk-cp-row').forEach(row => {
      row.onclick = () => {
        const c = sorted.find(x => x.id === row.dataset.id);
        close(c || null);
      };
    });
  });
}

// ─── RITTEN IMPORTEREN ───────────────────────────────────────────────────────

const _MONTH_EN = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12 };

function _riExtractAmount(lines) {
  for (const line of lines) {
    let m;
    // €95 / € 95 / €95.50 / € 95,50
    m = line.match(/€\s*(\d+(?:[.,]\d+)?)/);
    if (m) return parseFloat(m[1].replace(',', '.'));
    // 35 SGH WOOSH / 35 Woosh-Amsterdam / 35 woosh
    m = line.match(/(\d+(?:[.,]\d+)?)\s+(?:sgh\s+)?woosh(?:-\S+)?/i);
    if (m) return parseFloat(m[1].replace(',', '.'));
    // 80.00ROR / 80ROR
    m = line.match(/(\d+(?:\.\d+)?)\s*ROR\b/i);
    if (m) return parseFloat(m[1]);
  }
  // Standalone integer/decimal on its own line (anywhere in block)
  for (const line of lines) {
    const m = line.match(/^(\d+(?:[.,]\d+)?)$/);
    if (m) return parseFloat(m[1].replace(',', '.'));
  }
  return null;
}

function _riExtractDate(lines) {
  const yr = new Date().getFullYear();
  for (const line of lines) {
    let m;
    // "Sat, 16 May 2026 at ..." or "16 May 2026"
    m = line.match(/\b(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})/);
    if (m) {
      const mon = _MONTH_EN[m[2].toLowerCase().slice(0,3)];
      if (mon) return `${m[3]}-${String(mon).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`;
    }
    // "16.05.2026" or "16.05.2026."
    m = line.match(/\b(\d{1,2})\.(\d{2})\.(\d{4})/);
    if (m) return `${m[3]}-${m[2]}-${String(m[1]).padStart(2,'0')}`;
    // "16/05 16:00" or "16/05"
    m = line.match(/^(\d{1,2})\/(\d{2})\b/);
    if (m) return `${yr}-${m[2]}-${String(m[1]).padStart(2,'0')}`;
    // "Sunday 17 May 2026" / "Monday 16 May"
    m = line.match(/(?:mon|tue|wed|thu|fri|sat|sun)\w*\s+(\d{1,2})\s+([A-Za-z]{3,})(?:\s+(\d{4}))?/i);
    if (m) {
      const mon = _MONTH_EN[m[2].toLowerCase().slice(0,3)];
      if (mon) return `${m[3] || yr}-${String(mon).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`;
    }
  }
  return ymd();   // lokale datum (toISOString gaf tussen 00:00 en 02:00 nog 'gisteren')
}

function _riIsLikelyName(str) {
  if (!str || str.length < 3 || str.length > 50) return false;
  if (/\d/.test(str)) return false;
  if (/^[+@]/.test(str)) return false;
  if (/^(pick|drop|van|naar|from|to|flight|booking|transfer|ride|passengers?|naam|klant|client|vehicle|km|pick-up|drop-off|arrival|departure|a |b )/i.test(str)) return false;
  const words = str.trim().split(/\s+/);
  if (words.length < 2 || words.length > 5) return false;
  return words.every(w => /^[A-ZÁÉÍÓÚÀÈÌÒÙÄËÏÖÜÂÊÎÔÛÑ]/.test(w));
}

function _riExtractPassenger(lines) {
  for (const line of lines) {
    const m = line.match(/^(?:passengers?|naam|client|klant):\s*(.+)/i);
    if (m) return m[1].trim();
  }
  for (const line of lines) {
    if (_riIsLikelyName(line)) return line.trim();
  }
  return null;
}

function _riExtractLocation(lines) {
  let pickup = null, dropoff = null;
  for (const line of lines) {
    let m;
    m = line.match(/^pick[-\s]?up(?:\s+location)?:\s*(.+)/i);
    if (m) { pickup = m[1].trim(); continue; }
    m = line.match(/^drop[-\s]?off(?:\s+location)?:\s*(.+)/i);
    if (m) { dropoff = m[1].trim(); continue; }
    m = line.match(/^A\s+(.+)/);
    if (m) { pickup = m[1].trim(); continue; }
    m = line.match(/^B\s+(.+)/);
    if (m) { dropoff = m[1].trim(); continue; }
    m = line.match(/^(?:Van|From):\s*(.+)/i);
    if (m) { pickup = m[1].trim(); continue; }
    m = line.match(/^(?:Naar|To):\s*(.+)/i);
    if (m) { dropoff = m[1].trim(); continue; }
  }
  if (pickup && dropoff) return `${pickup} → ${dropoff}`;
  return dropoff || pickup || null;
}

function _parseRideBlock(lines) {
  const amount = _riExtractAmount(lines);
  if (!amount || amount <= 0) return null;
  const date = _riExtractDate(lines);
  const passenger = _riExtractPassenger(lines);
  const location = _riExtractLocation(lines);
  return { date, passenger, amount, location };
}

function parseRidesText(text) {
  // Blank line (or multiple blank lines) = rit-scheiding
  const blocks = text.trim().split(/\n[ \t]*\n/);
  const rides = [];
  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 1) continue;
    const ride = _parseRideBlock(lines);
    if (ride) {
      ride.rawText = trimmed; // bewaar originele tekst als factuur-omschrijving
      rides.push(ride);
    }
  }
  return rides;
}

function _renderRideTable(rides, backdrop, vatRate = 9) {
  const wrap = backdrop.querySelector('#ri-table-wrap');

  wrap.innerHTML = `
    <div style="font-size:.82rem;color:var(--text-dim);margin-bottom:8px;display:flex;align-items:center;gap:10px">
      <span>${rides.length} ritten gevonden — elk wordt één factuurlijn</span>
      <label style="margin-left:auto;cursor:pointer;white-space:nowrap"><input type="checkbox" id="ri-check-all" checked /> Alles</label>
    </div>
    <div style="max-height:260px;overflow-y:auto;border:1px solid var(--border);border-radius:10px">
      <table style="width:100%;border-collapse:collapse;font-size:.83rem">
        <thead>
          <tr style="text-align:left;color:var(--text-dim);font-size:.72rem;background:var(--bg-elev-2);position:sticky;top:0">
            <th style="padding:6px 8px">✓</th>
            <th style="padding:6px 4px">Omschrijving (origineel)</th>
            <th style="padding:6px 8px;text-align:right;white-space:nowrap">Bedrag incl.</th>
          </tr>
        </thead>
        <tbody>
          ${rides.map((r, i) => {
            const preview = escapeHTML((r.rawText || '').replace(/\n/g, ' · ').slice(0, 80) + ((r.rawText || '').length > 80 ? '…' : ''));
            return `
            <tr style="border-top:1px solid var(--border-faint)">
              <td style="padding:7px 8px;vertical-align:top"><input type="checkbox" id="ri-check-${i}" checked /></td>
              <td style="padding:7px 4px;max-width:240px">
                <div style="font-size:.78rem;color:var(--text-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${preview}</div>
                <div style="font-size:.72rem;color:var(--text-faint);margin-top:2px">${r.date ? fmtDateShort(r.date) : ''}${r.passenger ? ' · ' + escapeHTML(r.passenger) : ''}</div>
              </td>
              <td style="padding:7px 8px;text-align:right;font-weight:600;vertical-align:top;white-space:nowrap">${fmtMoney(r.amount)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  const updateTotal = () => {
    const sel = rides.filter((_, i) => backdrop.querySelector(`#ri-check-${i}`)?.checked);
    const total = sel.reduce((s, r) => s + (r.amount || 0), 0);
    const excl = total / (1 + vatRate / 100);
    const vat  = total - excl;
    backdrop.querySelector('#ri-totaal').innerHTML =
      `<div style="font-size:.8rem;color:var(--text-dim)">${sel.length} ritten · excl. BTW: <span class="money">${fmtMoney(excl)}</span> · BTW ${vatRate}%: <span class="money">${fmtMoney(vat)}</span></div>
       <div style="font-size:1rem;font-weight:600;margin-top:2px">Totaal incl.: <span class="money">${fmtMoney(total)}</span></div>`;
  };

  backdrop.querySelector('#ri-check-all').onchange = e => {
    rides.forEach((_, i) => { const cb = backdrop.querySelector(`#ri-check-${i}`); if (cb) cb.checked = e.target.checked; });
    updateTotal();
  };
  rides.forEach((_, i) => { const cb = backdrop.querySelector(`#ri-check-${i}`); if (cb) cb.onchange = updateTotal; });
  updateTotal();
}

async function openRitImportModal(container, { initialText = '', clientPrefill = null } = {}) {
  const bedrijf = getAdmin(container);
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal bk-modal" style="max-width:540px">
      <button type="button" class="modal-close" id="ri-x">×</button>
      <h2 style="margin:0 0 4px;display:flex;align-items:center;gap:8px">${icon('taxi')} Ritten importeren</h2>
      <p style="font-size:.83rem;color:var(--text-dim);margin:0 0 14px">Plak je notities (app of WhatsApp-formaat) — datum, naam en bedrag worden automatisch herkend.</p>

      <div id="ri-step1">
        <textarea id="ri-text" rows="7" style="width:100%;resize:vertical;background:var(--bg-elev-2);border:1px solid var(--border);border-radius:10px;padding:10px 12px;font-size:.88rem;color:var(--text);font-family:monospace;box-sizing:border-box"
          placeholder="Ride: 337-175-6607&#10;Pickup date and time: Sat, 16 May 2026 at 14:10 PM&#10;Passengers: Graham Milton&#10;35 SGH WOOSH&#10;&#10;16/05 22:00&#10;Rein Strikwerda&#10;+31619015505&#10;Kinkerstraat&#10;50 SGH WOOSH"></textarea>
        <button type="button" id="ri-parse-btn" class="btn block" style="margin-top:10px;padding:13px;font-size:.95rem">${icon('search')} Analyseer ritten</button>
      </div>

      <div id="ri-step2" style="display:none">
        <div id="ri-table-wrap"></div>

        <div style="margin-top:14px;border-top:1px solid var(--border);padding-top:14px">
          <div style="font-size:.82rem;color:var(--text-dim);margin-bottom:6px">Klant op factuur</div>
          <button type="button" id="ri-pick-client" class="btn" style="width:100%;margin-bottom:8px;background:var(--bg-elev-2);border:1.5px solid var(--accent);color:var(--accent);padding:10px">
            ${icon('users')} Kies opgeslagen klant
          </button>
          <input id="ri-client-name" type="text" placeholder="Klantnaam *" style="width:100%;margin-bottom:6px;box-sizing:border-box" />
          <input id="ri-client-email" type="email" placeholder="E-mailadres (optioneel)" style="width:100%;box-sizing:border-box" />
        </div>

        <div style="margin-top:14px;display:flex;justify-content:space-between;align-items:center;gap:12px">
          <div id="ri-totaal"></div>
          <button type="button" id="ri-create-btn" class="btn bk-new-btn" style="white-space:nowrap;padding:11px 18px">${icon('receipt')} Maak factuur</button>
        </div>

        <button type="button" id="ri-back" class="btn" style="margin-top:10px;width:100%;background:transparent;border:1px solid var(--border);color:var(--text-dim);font-size:.82rem;padding:8px">
          ← Opnieuw plakken
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  backdrop.querySelector('#ri-x').onclick    = () => backdrop.remove();
  backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.remove(); });

  let parsedRides = [];

  const runParse = () => {
    const text = backdrop.querySelector('#ri-text').value;
    parsedRides = parseRidesText(text);
    if (!parsedRides.length) { err('Geen ritten herkend — controleer het formaat en probeer opnieuw.'); return; }
    _renderRideTable(parsedRides, backdrop, bedrijf.defaultVat ?? 9);
    backdrop.querySelector('#ri-step1').style.display = 'none';
    backdrop.querySelector('#ri-step2').style.display = '';
    if (clientPrefill) {
      if (clientPrefill.name)  backdrop.querySelector('#ri-client-name').value  = clientPrefill.name;
      if (clientPrefill.email) backdrop.querySelector('#ri-client-email').value = clientPrefill.email;
    }
  };
  backdrop.querySelector('#ri-parse-btn').onclick = runParse;

  if (initialText) {
    backdrop.querySelector('#ri-text').value = initialText;
    runParse();
  }

  backdrop.querySelector('#ri-back').onclick = () => {
    backdrop.querySelector('#ri-step1').style.display = '';
    backdrop.querySelector('#ri-step2').style.display = 'none';
  };

  backdrop.querySelector('#ri-pick-client').onclick = async () => {
    const saved = await all('clients');
    const chosen = await openClientPicker(saved);
    if (chosen) {
      backdrop.querySelector('#ri-client-name').value  = chosen.name  || '';
      backdrop.querySelector('#ri-client-email').value = chosen.email || '';
    }
  };

  backdrop.querySelector('#ri-create-btn').onclick = async () => {
    const clientName = backdrop.querySelector('#ri-client-name').value.trim();
    if (!clientName) { err('Vul een klantnaam in'); return; }

    const selected = parsedRides.filter((_, i) => backdrop.querySelector(`#ri-check-${i}`)?.checked);
    if (!selected.length) { err('Selecteer minimaal één rit'); return; }

    const number   = await nextInvoiceNumber(bedrijf);
    const todayStr = ymd();
    const dueStr   = addDays(todayStr, bedrijf.termijn);

    const vatRate = bedrijf.defaultVat ?? 9;
    const lines = selected.map(r => {
      // Bouw nette omschrijving: regel 1 = passagier + datum (vet in PDF),
      // daarna de originele regels als detail (kleiner). Zo staat alles op de factuur.
      const header = [
        r.passenger || null,
        r.date ? fmtDateShort(r.date) : null,
      ].filter(Boolean).join(' · ');

      // Originele tekst als detail (laat technische/bedrag-regels weg)
      const rawLines = (r.rawText || '').split('\n').map(s => s.trim()).filter(Boolean);
      const detailLines = rawLines.filter(line => {
        if (/^\d+(?:[.,]\d+)?\s*(?:sgh\s+)?woosh/i.test(line)) return false;
        if (/^\d+(?:\.\d+)?\s*ROR\b/i.test(line)) return false;
        if (/^€\s*\d+/.test(line)) return false;
        if (/^special request:\s*none/i.test(line)) return false;
        if (/^vehicle type:/i.test(line)) return false;
        if (/^type of luggage:/i.test(line)) return false;
        return true;
      });

      const description = [header, ...detailLines].filter(Boolean).join('\n')
        || bedrijf.defaultDesc || 'Vervoersdienst';
      const { amountExcl, vatAmount, amountIncl } = calcVat(r.amount, vatRate, true);
      return { description, amountExcl, vatRate, vatAmount, amountIncl };
    });

    const totalExcl = lines.reduce((s, l) => s + l.amountExcl, 0);
    const totalVat  = lines.reduce((s, l) => s + l.vatAmount, 0);
    const totalIncl = lines.reduce((s, l) => s + l.amountIncl, 0);

    const clientEmail = backdrop.querySelector('#ri-client-email').value.trim();
    const inv = {
      id: uid(), adminId: bedrijf.id, number,
      date: todayStr, dueDate: dueStr, status: 'open',
      client: { name: clientName, email: clientEmail },
      lines, totalExcl, totalVat, totalIncl,
    };

    await add('invoices', inv);

    // Auto-save client
    const savedClients = await all('clients');
    const existing = savedClients.find(c =>
      (clientEmail && c.email?.toLowerCase() === clientEmail.toLowerCase()) ||
      c.name?.toLowerCase() === clientName.toLowerCase()
    );
    if (existing) {
      await put('clients', { ...existing, name: existing.name, email: clientEmail || existing.email, lastUsed: Date.now() });
    } else {
      await add('clients', { id: uid(), name: clientName, email: clientEmail, lastUsed: Date.now() });
    }

    ok(`Factuur ${number} aangemaakt met ${lines.length} ritten ✓`);
    backdrop.remove();
    render(container);
    setTimeout(() => openSendModal(inv, bedrijf, container), 150);
  };
}

// ─── NIEUWE / BEWERK FACTUUR MODAL ──────────────────────────────────────────

async function openInvoiceModal(container, { prefillClient = null, existingInv = null } = {}) {
  const isEdit   = !!existingInv;
  const bedrijf  = isEdit ? (ADMINS[existingInv.adminId || 'taxi'] || ADMINS.taxi) : getAdmin(container);
  const number   = isEdit ? existingInv.number : await nextInvoiceNumber(bedrijf);
  const todayStr = ymd();
  const dueStr   = isEdit ? existingInv.dueDate : addDays(todayStr, bedrijf.termijn);
  const inv0     = existingInv || {};

  // Oudere Adab-facturen met meerdere regels blijven als 'meerregelig' bewaard
  const isLessons   = !!bedrijf.lessons && !(isEdit && (existingInv.lines?.length || 0) > 1);
  const lastHours   = isLessons && !isEdit ? await lastHoursInvoice(bedrijf) : null;
  const isMultiLine = !isLessons && isEdit && (existingInv.lines?.length || 0) > 1;
  const invVatRate  = inv0.lines?.[0]?.vatRate ?? bedrijf.defaultVat;
  const invDesc     = inv0.lines?.[0]?.description || bedrijf.defaultDesc;

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal bk-modal">
      <button type="button" class="modal-close" id="bk-x">×</button>
      <h2 style="margin:0 0 16px">${isEdit ? 'Factuur bewerken' : 'Nieuwe factuur'}</h2>

      ${isMultiLine ? `
      <div class="bk-multiline-notice">
        ${icon('clipboard')} Ritten-factuur · ${existingInv.lines.length} regels · ${fmtMoney(existingInv.totalIncl || 0)} — bedragen en regels blijven ongewijzigd
      </div>
      ` : ''}

      ${!isEdit ? `
      <div class="bk-client-src">
        <button type="button" id="bk-pick-client" class="btn secondary bk-pick-client-btn">
          ${icon('users')} Opgeslagen klant
        </button>
        <button type="button" id="bk-client-photo" class="btn secondary bk-pick-client-btn">
          ${icon('camera')} Klant uit foto
        </button>
        <input type="file" id="bk-client-photo-file" accept="image/*" hidden />
      </div>
      <div id="bk-client-photo-hint" class="bk-paste-hint"></div>

      ${isLessons ? '' : `<div class="bk-paste-section">
        <label class="bk-paste-label">${icon('clipboard')} Of plak WhatsApp- / e-mailtekst — velden worden automatisch ingevuld</label>
        <textarea id="bk-paste" class="bk-paste-area" rows="3"
          placeholder="Supreme Transit Solutions&#10;Baden Powellweg, Amsterdam 1069 LK&#10;KvK: 85234362&#10;€320 incl 9% btw"></textarea>
        <div id="bk-parsed-preview" class="bk-parsed-preview" style="display:none"></div>
        <div id="bk-rides-banner" class="bk-rides-banner" style="display:none"></div>
      </div>

      <div class="bk-divider">— of handmatig —</div>`}
      ` : ''}

      <form id="bk-form" autocomplete="off">
        <div class="bk-form-section">
          <div class="bk-section-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.4"/><path d="M5.5 19.5a6.5 6.5 0 0 1 13 0"/></svg>Klant</div>
          <label>Bedrijfsnaam / naam *</label>
          <input id="bk-client-name" type="text" placeholder="Bedrijfsnaam" value="${escapeHTML(inv0.client?.name || '')}" required />
          <label>Straat + huisnummer</label>
          <input id="bk-client-addr" type="text" placeholder="Straatnaam 1" value="${escapeHTML(inv0.client?.address || '')}" />
          <label>Postcode + stad</label>
          <input id="bk-client-city" type="text" placeholder="1234 AB Amsterdam" value="${escapeHTML(inv0.client?.city || '')}" />
          <label>KvK-nummer</label>
          <input id="bk-client-kvk" type="text" inputmode="numeric" placeholder="12345678" value="${escapeHTML(inv0.client?.kvk || '')}" />
          <label>BTW-nummer klant <span class="bk-label-hint">optioneel</span></label>
          <input id="bk-client-btw" type="text" autocapitalize="characters" placeholder="NL123456789B01" value="${escapeHTML(inv0.client?.btw || '')}" />
          <label>E-mailadres</label>
          <input id="bk-client-email" type="email" placeholder="info@bedrijf.nl" value="${escapeHTML(inv0.client?.email || '')}" />
          <label>Telefoon / WhatsApp</label>
          <input id="bk-client-phone" type="tel" inputmode="tel" placeholder="+31 6 12345678" value="${escapeHTML(inv0.client?.phone || '')}" />
        </div>

        ${isLessons ? lessonsSectionHTML(inv0, bedrijf, lastHours) : ''}

        ${!isMultiLine && !isLessons ? `
        <div class="bk-form-section">
          <div class="bk-section-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 7.5H10a2.5 2.5 0 0 0 0 5h2.5a2.5 2.5 0 0 1 0 5H8"/><path d="M12 5.5v13"/></svg>Bedrag &amp; BTW</div>
          <label>Omschrijving * <span class="bk-label-hint">Enter = nieuwe regel</span></label>
          <textarea id="bk-desc" class="bk-desc-area" rows="2" placeholder="${escapeHTML(bedrijf.defaultDesc)}" ${isMultiLine ? '' : 'required'}>${escapeHTML(invDesc)}</textarea>
          <label>Bedrag *</label>
          <div class="bk-amount-row">
            <input id="bk-amount" type="text" inputmode="decimal" placeholder="320" value="${isEdit ? (inv0.totalIncl || '') : ''}" ${isMultiLine ? '' : 'required'} />
            <label class="bk-radio"><input type="radio" name="bk-ie" value="incl" checked /> Incl. BTW</label>
            <label class="bk-radio"><input type="radio" name="bk-ie" value="excl" /> Excl. BTW</label>
          </div>
          <label style="margin-top:10px">BTW-tarief</label>
          <select id="bk-vat">
            <option value="9"  ${invVatRate === 9  ? 'selected' : ''}>9% — verlaagd (personenvervoer)</option>
            <option value="21" ${invVatRate === 21 ? 'selected' : ''}>21% — standaard</option>
            <option value="0"  ${invVatRate === 0  ? 'selected' : ''}>0% — vrijgesteld / verlegd</option>
          </select>
          <div id="bk-vatnote-wrap" style="display:${invVatRate === 0 ? 'block' : 'none'}">
            <label>Tekst op de factuur (verplicht bij 0%)</label>
            <select id="bk-vatnote">
              ${(() => { const k = Object.keys(VAT_NOTES).find(x => VAT_NOTES[x] === inv0.vatNote) || (isEdit && inv0.vatNote === '' ? 'geen' : 'art11'); return [
                ['art11', 'Vrijgesteld (art. 11 Wet OB)'], ['verlegd', 'Btw verlegd (afnemer draagt btw af)'],
                ['kor', 'Kleineondernemersregeling (KOR)'], ['onderwijs', 'Onderwijsvrijstelling'], ['geen', 'Geen tekst'],
              ].map(([v, t]) => `<option value="${v}" ${k === v ? 'selected' : ''}>${t}</option>`).join(''); })()}
            </select>
          </div>
          <div id="bk-calc" class="bk-calc-preview" style="display:none"></div>
        </div>
        ` : ''}

        <div class="bk-form-section">
          <div class="bk-section-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5.2" width="16" height="14.6" rx="2"/><path d="M4 9.4h16"/><path d="M8 3.4v3.2"/><path d="M16 3.4v3.2"/></svg>Nummer &amp; datum</div>
          <label>Factuurnummer</label>
          <input id="bk-number" type="text" value="${escapeHTML(number)}" ${isEdit ? 'readonly style="opacity:.6;cursor:default"' : ''} required />
          <label>Factuurdatum</label>
          <input id="bk-date" type="date" value="${isEdit ? (inv0.date || todayStr) : todayStr}" required />
          <label>Vervaldatum (${bedrijf.termijn} dagen)</label>
          <input id="bk-due" type="date" value="${dueStr}" required />
        </div>

        <label>Interne notitie (staat niet op factuur)</label>
        <textarea id="bk-note" rows="2" style="resize:vertical" placeholder="Optioneel…">${escapeHTML(inv0.note || '')}</textarea>

        <button type="submit" class="btn block bk-form-submit">
          ${isEdit ? 'Factuur opslaan' : 'Factuur aanmaken'}
        </button>
      </form>
    </div>
  `;

  document.body.appendChild(backdrop);
  backdrop.querySelector('#bk-x').onclick = () => backdrop.remove();
  backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.remove(); });

  if (!isEdit) {
    // Prefill from saved client (when invoked from klanten tab)
    function fillClient(c) {
      if (!c) return;
      backdrop.querySelector('#bk-client-name').value  = c.name    || '';
      backdrop.querySelector('#bk-client-addr').value  = c.address || '';
      backdrop.querySelector('#bk-client-city').value  = c.city    || '';
      backdrop.querySelector('#bk-client-kvk').value   = c.kvk     || '';
      backdrop.querySelector('#bk-client-btw').value   = c.btw     || '';
      backdrop.querySelector('#bk-client-email').value = c.email   || '';
      backdrop.querySelector('#bk-client-phone').value = c.phone   || '';
    }
    if (prefillClient) fillClient(prefillClient);

    // Client picker button
    backdrop.querySelector('#bk-pick-client').onclick = async () => {
      const savedClients = await all('clients');
      const chosen = await openClientPicker(savedClients);
      if (chosen) fillClient(chosen);
    };

    // Klant uit foto/screenshot: OCR → klantvelden (alleen herkende velden overschrijven)
    const photoHint = backdrop.querySelector('#bk-client-photo-hint');
    bindClientPhoto(backdrop, {
      button: '#bk-client-photo', file: '#bk-client-photo-file', hint: photoHint,
      pasteTarget: backdrop.querySelector('#bk-paste'),
      onText: async text => {
        const p = parseClientText(text);
        // Al bekend als klant? Dan de opgeslagen gegevens als basis gebruiken
        const norm = v => String(v || '').toLowerCase().replace(/\s/g, '');
        const known = (await all('clients')).find(c =>
          (p.kvk && norm(c.kvk) === norm(p.kvk)) || (p.btw && norm(c.btw) === norm(p.btw)) ||
          (p.email && norm(c.email) === norm(p.email)) || (p.name && norm(c.name) === norm(p.name)));
        const merged = { ...(known || {}) };
        for (const k of ['name', 'address', 'city', 'kvk', 'btw', 'email', 'phone']) if (p[k]) merged[k] = p[k];
        const count = ['name', 'address', 'city', 'kvk', 'btw', 'email', 'phone'].filter(k => p[k]).length;
        if (!count) { photoHint.textContent = 'Niets herkend op de foto — vul de klant handmatig in'; photoHint.className = 'bk-paste-hint'; return; }
        const ids = { name: '#bk-client-name', address: '#bk-client-addr', city: '#bk-client-city', kvk: '#bk-client-kvk', btw: '#bk-client-btw', email: '#bk-client-email', phone: '#bk-client-phone' };
        for (const [k, sel] of Object.entries(ids)) {
          const el = backdrop.querySelector(sel);
          if (merged[k] && el) { el.value = merged[k]; el.classList.add('bk-field-filled'); }
        }
        const badBtw = p.btw && !btwValid(p.btw);
        photoHint.textContent = `✓ ${count} klantgegevens uit de foto overgenomen${known ? ' · bestaande klant herkend' : ''} — controleer ze even${badBtw ? ' · ⚠ btw-nummer heeft geen geldig formaat' : ''}`;
        photoHint.className = `bk-paste-hint ${badBtw ? 'warn' : 'ok'}`;
      },
    });

    // Smart paste
    const pasteArea = backdrop.querySelector('#bk-paste');
    if (pasteArea) {
    const ridesBanner = backdrop.querySelector('#bk-rides-banner');
    let parseTimer = null;
    const runSmartParse = () => {
      const text = pasteArea.value;
      const parsed = parseInvoiceText(text);
      applyParsed(parsed, backdrop);
      refreshCalc(backdrop);

      // Rit-detectie: als de plaktekst er als één of meer ritten uitziet
      // (met passagier/pickup/dropoff), toon een knop om per-rit te boeken.
      const rides = parseRidesText(text);
      const hasRideSignal = rides.length >= 1 && rides.some(r => r.passenger || r.location);
      if (hasRideSignal) {
        const label = rides.length > 1 ? `${rides.length} ritten` : '1 rit';
        ridesBanner.style.display = 'flex';
        ridesBanner.innerHTML = `
          <div class="bk-rides-banner-text">
            ${icon('taxi')} <strong>${label} herkend</strong> — elke rit als aparte regel met passagier en bedrag?
          </div>
          <button type="button" id="bk-to-rides" class="btn">Per rit boeken →</button>`;
      } else {
        ridesBanner.style.display = 'none';
        ridesBanner.innerHTML = '';
      }
    };
    pasteArea.addEventListener('input', () => {
      clearTimeout(parseTimer);
      parseTimer = setTimeout(runSmartParse, 300);
    });

    ridesBanner.addEventListener('click', (e) => {
      if (!e.target.closest('#bk-to-rides')) return;
      const text = pasteArea.value;
      const clientName  = backdrop.querySelector('#bk-client-name').value.trim();
      const clientEmail = backdrop.querySelector('#bk-client-email').value.trim();
      backdrop.remove();
      openRitImportModal(container, {
        initialText: text,
        clientPrefill: { name: clientName, email: clientEmail },
      });
    });
    }
  }

  if (isLessons) initLessons(backdrop, bedrijf);

  const refreshCalcFn = () => refreshCalc(backdrop);
  const descArea = backdrop.querySelector('#bk-desc');
  if (descArea) {
    // Groeit mee met de tekst — lange (geplakte) omschrijvingen blijven leesbaar
    const grow = () => { descArea.style.height = 'auto'; descArea.style.height = Math.min(descArea.scrollHeight + 3, 320) + 'px'; };
    descArea.addEventListener('input', grow);
    requestAnimationFrame(grow);
  }
  if (backdrop.querySelector('#bk-amount')) {
    backdrop.querySelector('#bk-amount').addEventListener('input', refreshCalcFn);
    backdrop.querySelector('#bk-vat').addEventListener('input', () => {
      backdrop.querySelector('#bk-vatnote-wrap').style.display = backdrop.querySelector('#bk-vat').value === '0' ? 'block' : 'none';
      refreshCalcFn();
    });
    backdrop.querySelectorAll('input[name="bk-ie"]').forEach(r => r.addEventListener('change', refreshCalcFn));
  }
  backdrop.querySelector('#bk-date').addEventListener('change', e => {
    backdrop.querySelector('#bk-due').value = addDays(e.target.value, bedrijf.termijn);
  });

  // Show calc preview immediately if editing (only for single-line)
  if (isEdit && !isMultiLine) refreshCalc(backdrop);

  backdrop.querySelector('#bk-form').onsubmit = async e => {
    e.preventDefault();
    const clientName = backdrop.querySelector('#bk-client-name').value.trim();
    if (!clientName) { err('Vul een klantnaam in'); return; }
    let lessonData = null;
    if (isLessons) {
      lessonData = collectLessons(backdrop);
      if (lessonData.error) { err(lessonData.error); return; }
    } else {
      const raw = parseAmount(backdrop.querySelector('#bk-amount')?.value);
      if (!isMultiLine && (!raw || isNaN(raw) || raw <= 0)) { err('Vul een geldig bedrag in'); return; }
    }

    const client = {
      name:    clientName,
      address: backdrop.querySelector('#bk-client-addr').value.trim(),
      city:    backdrop.querySelector('#bk-client-city').value.trim(),
      kvk:     backdrop.querySelector('#bk-client-kvk').value.trim(),
      btw:     backdrop.querySelector('#bk-client-btw').value.replace(/\s/g, '').toUpperCase(),
      email:   backdrop.querySelector('#bk-client-email').value.trim(),
      phone:   backdrop.querySelector('#bk-client-phone').value.trim(),
    };

    let lines, totalExcl, totalVat, totalIncl, vatNoteSingle = null;
    if (isLessons) {
      ({ lines, totalExcl, totalVat, totalIncl } = lessonData);
    } else if (isMultiLine) {
      // Preserve all original lines and totals; only update metadata
      lines = existingInv.lines;
      totalExcl = existingInv.totalExcl; totalVat = existingInv.totalVat; totalIncl = existingInv.totalIncl;
    } else {
      const raw     = parseAmount(backdrop.querySelector('#bk-amount').value);
      const vatRate = parseInt(backdrop.querySelector('#bk-vat').value);
      const isIncl  = backdrop.querySelector('input[name="bk-ie"]:checked')?.value === 'incl';
      const vat     = calcVat(raw, vatRate, isIncl);
      const desc = backdrop.querySelector('#bk-desc').value.replace(/\r/g, '').split('\n').map(s => s.trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim();
      lines     = [{ description: desc || bedrijf.defaultDesc, amountExcl: vat.amountExcl, vatRate, vatAmount: vat.vatAmount, amountIncl: vat.amountIncl }];
      totalExcl = vat.amountExcl; totalVat = vat.vatAmount; totalIncl = vat.amountIncl;
      const noteKey = backdrop.querySelector('#bk-vatnote')?.value;
      vatNoteSingle = vatRate === 0 && VAT_NOTES[noteKey] ? VAT_NOTES[noteKey] : '';
      if (vatRate === 0 && noteKey === 'verlegd' && !client.btw) { err('Btw verlegd: vul het BTW-nummer van de klant in'); return; }
    }

    const inv = {
      id:      isEdit ? existingInv.id : uid(),
      adminId: bedrijf.id,
      number:  backdrop.querySelector('#bk-number').value.trim(),
      date:    backdrop.querySelector('#bk-date').value,
      dueDate: backdrop.querySelector('#bk-due').value,
      status:  isEdit ? (existingInv.status || 'open') : 'open',
      note:    backdrop.querySelector('#bk-note').value.trim(),
      client, lines, totalExcl, totalVat, totalIncl,
    };
    if (isLessons) {
      Object.assign(inv, { kind: 'lessen', period: lessonData.period, reference: lessonData.reference, vatNote: lessonData.vatNote });
    } else if (vatNoteSingle !== null) {
      inv.vatNote = vatNoteSingle;
    }

    if (isEdit) {
      await put('invoices', { ...cleanInv(existingInv), ...inv, paidAt: existingInv.paidAt, sentAt: existingInv.sentAt });
      ok(`Factuur ${inv.number} bijgewerkt ✓`);
      backdrop.remove();
      render(container);
    } else {
      await add('invoices', inv);

      // Auto-save / update client
      const savedClients = await all('clients');
      const email = inv.client.email;
      const name  = inv.client.name;
      const existing = savedClients.find(c =>
        (email && c.email && c.email.toLowerCase() === email.toLowerCase()) ||
        (!email && (c.name || '').toLowerCase() === name.toLowerCase())
      );
      if (existing) {
        await put('clients', { ...existing,
          name:    inv.client.name    || existing.name,
          address: inv.client.address || existing.address,
          city:    inv.client.city    || existing.city,
          kvk:     inv.client.kvk     || existing.kvk,
          btw:     inv.client.btw     || existing.btw,
          email:   inv.client.email   || existing.email,
          phone:   inv.client.phone   || existing.phone,
          lastUsed: Date.now(),
        });
        ok(`Factuur ${inv.number} aangemaakt ✓`);
      } else if (name) {
        await add('clients', { id: uid(), name, address: inv.client.address, city: inv.client.city, kvk: inv.client.kvk, btw: inv.client.btw, email, phone: inv.client.phone, lastUsed: Date.now() });
        ok(`Factuur ${inv.number} aangemaakt · ${name} opgeslagen als klant ✓`);
      } else {
        ok(`Factuur ${inv.number} aangemaakt ✓`);
      }

      backdrop.remove();
      render(container);
      setTimeout(() => openSendModal(inv, bedrijf, container), 150);
    }
  };
}

// ─── UREN-FACTUUR (Adab: TSO / sport op basisscholen) ────────────────────────
// Eén regel: omschrijving (vrij aan te passen) + uren × tarief. De omschrijving
// volgt het vaste patroon "<werk> - <mnd>/ <uren> uur x <tarief>,-" en wordt
// meegewerkt zolang dat staartje er nog in staat.

const HOURS_TAIL_RE = /\s*[-–—]\s*[a-z]{3,}\.?\s*\/\s*[\d.,]+\s*uur\s*x\s*[\d.,]+(?:,-)?\s*$/i;

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

function fmtRateShort(r) {
  return Number.isInteger(r) ? `${r},-` : (Math.round(r * 100) / 100).toFixed(2).replace('.', ',');
}

function hoursTail(monthIdx, hours, rate) {
  const mnd = new Date(2000, monthIdx, 1).toLocaleDateString('nl-NL', { month: 'short' }).replace('.', '');
  return ` - ${mnd}/ ${fmtHours(hours)} uur x ${fmtRateShort(rate)}`;
}

function lessonsSectionHTML(inv0, bedrijf, last) {
  const isEdit  = !!inv0.id;
  const line    = isEdit ? (inv0.lines?.[0] || {}) : {};
  const vatRate = isEdit ? (line.vatRate ?? bedrijf.defaultVat) : (last?.lines?.[0]?.vatRate ?? bedrijf.defaultVat);
  const noteSrc = isEdit ? inv0.vatNote : last?.vatNote;
  const noteKey = Object.keys(VAT_NOTES).find(k => VAT_NOTES[k] === noteSrc) || (noteSrc === '' && last ? 'geen' : 'art11');

  // Standaard: vorige maand (je factureert na afloop van de maand)
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1);
  const period = isEdit ? (inv0.period || '') : capitalize(d.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' }));
  const lastLine = last?.lines?.[0];
  const hours = isEdit ? line.qty : (lastLine?.qty ?? 20);
  const rate  = isEdit ? line.rate : (lastLine?.rate ?? 30);
  let desc;
  if (isEdit) desc = line.description || '';
  else {
    const base = (lastLine?.description || bedrijf.defaultDesc).split('\n')[0].replace(HOURS_TAIL_RE, '');
    desc = base + hoursTail(d.getMonth(), hours, rate);
  }
  const num = v => (v == null || v === '' ? '' : String(v).replace('.', ','));
  return `
        <div class="bk-form-section">
          <div class="bk-section-title">${icon('ball')}Werkzaamheden</div>
          <label>Omschrijving *</label>
          <textarea id="bk-les-desc" rows="2" style="resize:vertical">${escapeHTML(desc)}</textarea>
          <div class="bk-les-two">
            <div><label>Uren *</label>
              <input id="bk-les-hours" type="text" inputmode="decimal" value="${num(hours)}" /></div>
            <div><label>Tarief per uur *</label>
              <input id="bk-les-rate" type="text" inputmode="decimal" value="${num(rate)}" /></div>
          </div>
          <div class="bk-les-two">
            <div><label>Periode</label>
              <input id="bk-les-period" type="text" placeholder="September 2026" value="${escapeHTML(period)}" /></div>
            <div><label>Kenmerk</label>
              <input id="bk-les-ref" type="text" value="${escapeHTML(inv0.reference || '')}" /></div>
          </div>
          <label>BTW-tarief</label>
          <select id="bk-les-vat">
            <option value="0"  ${vatRate === 0  ? 'selected' : ''}>0% — vrijgesteld</option>
            <option value="21" ${vatRate === 21 ? 'selected' : ''}>21% — standaard</option>
            <option value="9"  ${vatRate === 9  ? 'selected' : ''}>9% — verlaagd</option>
          </select>
          <div id="bk-les-note-wrap" style="display:${vatRate === 0 ? 'block' : 'none'}">
            <label>Tekst vrijstelling op de factuur</label>
            <select id="bk-les-note">
              <option value="art11" ${noteKey === 'art11' ? 'selected' : ''}>Vrijgestelde activiteiten (art. 11 Wet OB)</option>
              <option value="onderwijs" ${noteKey === 'onderwijs' ? 'selected' : ''}>Onderwijsvrijstelling</option>
              <option value="kor" ${noteKey === 'kor' ? 'selected' : ''}>Kleineondernemersregeling (KOR)</option>
              <option value="geen" ${noteKey === 'geen' ? 'selected' : ''}>Geen tekst</option>
            </select>
          </div>
          <div id="bk-les-calc" class="bk-calc-preview"></div>
        </div>`;
}

async function lastHoursInvoice(bedrijf, excludeId) {
  return (await all('invoices'))
    .filter(i => i.adminId === bedrijf.id && i.kind === 'lessen' && i.id !== excludeId && i.lines?.[0]?.qty != null)
    .sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.number || '').localeCompare(a.number || ''))[0] || null;
}

function initLessons(backdrop, bedrijf) {
  const $ = sel => backdrop.querySelector(sel);
  const recalc = () => refreshLessonCalc(backdrop, bedrijf);
  // Uren/tarief/periode aangepast → staartje "- mnd/ X uur x Y,-" in de omschrijving meeschrijven
  const syncDesc = () => {
    const desc = $('#bk-les-desc');
    if (!HOURS_TAIL_RE.test(desc.value)) return;   // zelf herschreven → niet aanraken
    const hours = parseAmount($('#bk-les-hours').value);
    const rate  = parseAmount($('#bk-les-rate').value);
    if (!hours || !rate) return;
    const m = $('#bk-les-desc').value.match(/[-–—]\s*([a-z]{3,})\.?\s*\//i);
    let monthIdx = MONTHS_NL.findIndex(n => $('#bk-les-period').value.toLowerCase().startsWith(n));
    if (monthIdx < 0 && m) monthIdx = MONTHS_NL.findIndex(n => n.startsWith(m[1].toLowerCase().slice(0, 3)));
    if (monthIdx < 0) return;
    desc.value = desc.value.replace(HOURS_TAIL_RE, '') + hoursTail(monthIdx, hours, rate);
  };
  ['#bk-les-hours', '#bk-les-rate', '#bk-les-period'].forEach(id => $(id).addEventListener('input', () => { syncDesc(); recalc(); }));
  $('#bk-les-desc').addEventListener('input', recalc);
  const vatSel = $('#bk-les-vat');
  vatSel.addEventListener('change', () => {
    $('#bk-les-note-wrap').style.display = vatSel.value === '0' ? 'block' : 'none';
    recalc();
  });
  recalc();
}

const MONTHS_NL = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];

function collectLessons(backdrop) {
  const $ = sel => backdrop.querySelector(sel);
  const r2 = v => Math.round(v * 100) / 100;
  const description = $('#bk-les-desc').value.trim();
  const qty     = parseAmount($('#bk-les-hours').value);
  const rate    = parseAmount($('#bk-les-rate').value);
  const vatRate = parseInt($('#bk-les-vat').value) || 0;
  if (!description) return { error: 'Vul een omschrijving in' };
  if (!qty || isNaN(qty) || qty <= 0) return { error: 'Vul het aantal uren in' };
  if (!rate || isNaN(rate) || rate <= 0) return { error: 'Vul een geldig uurtarief in' };
  const vat  = calcVat(r2(qty * rate), vatRate, false);
  const note = $('#bk-les-note').value;
  return {
    lines: [{ description, qty, unit: 'uur', rate, amountExcl: vat.amountExcl, vatRate, vatAmount: vat.vatAmount, amountIncl: vat.amountIncl }],
    qty, rate, totalExcl: vat.amountExcl, totalVat: vat.vatAmount, totalIncl: vat.amountIncl,
    period:    $('#bk-les-period').value.trim(),
    reference: $('#bk-les-ref').value.trim(),
    vatNote:   vatRate === 0 && VAT_NOTES[note] ? VAT_NOTES[note] : '',
  };
}

function refreshLessonCalc(backdrop) {
  const el = backdrop.querySelector('#bk-les-calc');
  const d  = collectLessons(backdrop);
  if (d.error) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  el.innerHTML = `
    <div class="bk-calc-row"><span>${fmtHours(d.qty)} uur × ${fmtMoney(d.rate)}</span><span>${fmtMoney(d.totalExcl)}</span></div>
    <div class="bk-calc-row"><span>BTW ${d.lines[0].vatRate}%</span><span>${fmtMoney(d.totalVat)}</span></div>
    <div class="bk-calc-row bk-calc-total"><span>Totaal</span><span class="money">${fmtMoney(d.totalIncl)}</span></div>`;
}

function applyParsed(parsed, backdrop) {
  if (!parsed) return;
  const set = (id, val) => { if (val != null) backdrop.querySelector(id).value = val; };
  set('#bk-client-name',  parsed.clientName);
  set('#bk-client-addr',  parsed.clientAddress);
  set('#bk-client-city',  parsed.clientCity);
  set('#bk-client-kvk',   parsed.clientKvk);
  set('#bk-client-email', parsed.clientEmail);
  if (parsed.amount != null) set('#bk-amount', parsed.amount);
  if (parsed.vatRate != null && [0, 9, 21].includes(parsed.vatRate)) {
    backdrop.querySelector('#bk-vat').value = String(parsed.vatRate);
    backdrop.querySelector('#bk-vat').dispatchEvent(new Event('input'));
  }
  if (parsed._inclExplicit) {
    const r = backdrop.querySelector(`input[name="bk-ie"][value="${parsed.isIncl ? 'incl' : 'excl'}"]`);
    if (r) r.checked = true;
  }
  if (parsed.description) set('#bk-desc', parsed.description);

  const found = [
    parsed.clientName  && `<strong>${escapeHTML(parsed.clientName)}</strong>`,
    parsed.amount != null && `€${parsed.amount}`,
    parsed.vatRate != null && `${parsed.vatRate}% BTW`,
    parsed._inclExplicit && (parsed.isIncl ? 'incl.' : 'excl.'),
  ].filter(Boolean);

  const preview = backdrop.querySelector('#bk-parsed-preview');
  if (found.length) {
    preview.style.display = 'block';
    preview.innerHTML = `${icon('check')} Gevonden: ${found.join(' · ')}`;
  }
}

function refreshCalc(backdrop) {
  const calcEl  = backdrop.querySelector('#bk-calc');
  if (!calcEl) return;
  const raw     = parseAmount(backdrop.querySelector('#bk-amount').value);
  const vatRate = parseInt(backdrop.querySelector('#bk-vat').value) || 0;
  const isIncl  = backdrop.querySelector('input[name="bk-ie"]:checked')?.value === 'incl';
  if (!raw || isNaN(raw) || raw <= 0) { calcEl.style.display = 'none'; return; }
  const { amountExcl, vatAmount, amountIncl } = calcVat(raw, vatRate, isIncl);
  calcEl.style.display = 'block';
  calcEl.innerHTML = `
    <div class="bk-calc-row"><span>Excl. BTW</span><span>${fmtMoney(amountExcl)}</span></div>
    <div class="bk-calc-row"><span>BTW ${vatRate}%</span><span>${fmtMoney(vatAmount)}</span></div>
    <div class="bk-calc-row bk-calc-total"><span>Totaal incl.</span><span class="money">${fmtMoney(amountIncl)}</span></div>
  `;
}

// ─── NIEUWE KOSTEN MODAL ──────────────────────────────────────────────────────

function openNewPurchaseModal(container) {
  const bedrijf  = getAdmin(container);
  const todayStr = ymd();
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal bk-modal">
      <button type="button" class="modal-close" id="pk-x">×</button>
      <h2 style="margin:0 0 16px">Kosten boeken</h2>
      <!-- Bonnetje scanner -->
      <div class="rcpt-scan-wrap">
        <input type="file" id="rcpt-file" accept="image/*" capture="environment" style="display:none" />
        <button type="button" id="rcpt-btn" class="btn rcpt-scan-btn">
          ${icon('camera')} Bonnetje scannen
        </button>
        <div id="rcpt-area" style="display:none">
          <div id="rcpt-prog-wrap" class="rcpt-prog-wrap">
            <div id="rcpt-prog-bar" class="rcpt-prog-bar"></div>
          </div>
          <div id="rcpt-status" class="rcpt-status">Scannen…</div>
          <div id="rcpt-tags" class="rcpt-tags" style="display:none"></div>
        </div>
      </div>
      <form id="pk-form" autocomplete="off">
        <div class="bk-form-section">
          <div class="bk-section-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7.5a2 2 0 0 1 2-2h5.2a2 2 0 0 1 1.4.6l6.4 6.4a1.8 1.8 0 0 1 0 2.5l-4.8 4.8a1.8 1.8 0 0 1-2.5 0L5.3 13.4A2 2 0 0 1 4 11.5z"/><circle cx="8.4" cy="9.4" r="1.1" fill="currentColor" stroke="none"/></svg>Kosten</div>
          <label>Leverancier / winkel *</label>
          <input id="pk-vendor" type="text" placeholder="bijv. Shell, Gamma, …" required />
          <label>Omschrijving</label>
          <input id="pk-desc" type="text" placeholder="bijv. Brandstof 13 juni" />
          <label>Categorie</label>
          <select id="pk-cat">
            ${CATS.map(c => `<option value="${c.id}">${c.label}</option>`).join('')}
          </select>
          <label>Bedrag *</label>
          <div class="bk-amount-row">
            <input id="pk-amount" type="text" inputmode="decimal" placeholder="80" required />
            <label class="bk-radio"><input type="radio" name="pk-ie" value="incl" checked /> Incl. BTW</label>
            <label class="bk-radio"><input type="radio" name="pk-ie" value="excl" /> Excl. BTW</label>
          </div>
          <label style="margin-top:10px">BTW-tarief</label>
          <select id="pk-vat">
            <option value="21">21% — standaard</option>
            <option value="9">9% — verlaagd</option>
            <option value="0">0% — geen BTW aftrek</option>
          </select>
          <div id="pk-calc" class="bk-calc-preview" style="display:none"></div>
        </div>
        <div class="bk-form-section">
          <div class="bk-section-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5.2" width="16" height="14.6" rx="2"/><path d="M4 9.4h16"/><path d="M8 3.4v3.2"/><path d="M16 3.4v3.2"/></svg>Datum</div>
          <label>Datum</label>
          <input id="pk-date" type="date" value="${todayStr}" required />
          <label>Factuurnummer leverancier (optioneel)</label>
          <input id="pk-invnr" type="text" placeholder="bijv. INV-2026-001" />
        </div>
        <button type="submit" class="btn block" style="margin-top:16px;padding:14px">Kosten opslaan</button>
      </form>
    </div>
  `;

  document.body.appendChild(backdrop);
  backdrop.querySelector('#pk-x').onclick = () => backdrop.remove();
  backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.remove(); });

  const refreshFn = () => refreshPurchaseCalc(backdrop);
  backdrop.querySelector('#pk-amount').addEventListener('input', refreshFn);
  backdrop.querySelector('#pk-vat').addEventListener('input', refreshFn);
  backdrop.querySelectorAll('input[name="pk-ie"]').forEach(r => r.addEventListener('change', refreshFn));

  // ── Bonnetje scanner ──────────────────────────────────────────────────────
  const rcptFile = backdrop.querySelector('#rcpt-file');
  const rcptBtn  = backdrop.querySelector('#rcpt-btn');
  const rcptArea = backdrop.querySelector('#rcpt-area');
  const rcptProg = backdrop.querySelector('#rcpt-prog-bar');
  const rcptStat = backdrop.querySelector('#rcpt-status');
  const rcptTags = backdrop.querySelector('#rcpt-tags');

  rcptBtn.onclick = () => rcptFile.click();

  rcptFile.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    rcptArea.style.display = 'block';
    rcptProg.style.width   = '0%';
    rcptTags.style.display = 'none';
    rcptBtn.disabled       = true;

    const onProg = (msg, pct) => {
      rcptStat.textContent = msg;
      rcptProg.style.width = Math.round((pct || 0) * 100) + '%';
    };

    try {
      const { ocrReceipt, parseReceiptText } = await import('../receipt-ocr.js');
      const text   = await ocrReceipt(file, onProg);
      const parsed = parseReceiptText(text);

      // Auto-fill form
      if (parsed.vendor)      backdrop.querySelector('#pk-vendor').value = parsed.vendor;
      if (parsed.date)        backdrop.querySelector('#pk-date').value   = parsed.date;
      if (parsed.totalAmount) {
        backdrop.querySelector('#pk-amount').value = String(parsed.totalAmount).replace('.', ',');
        backdrop.querySelector('input[name="pk-ie"][value="incl"]').checked = true;
      }
      if (parsed.vatRate !== null) backdrop.querySelector('#pk-vat').value = String(parsed.vatRate);
      if (parsed.category)         backdrop.querySelector('#pk-cat').value = parsed.category;
      refreshPurchaseCalc(backdrop);

      // Show found tags
      const tags = [
        parsed.vendor      && `${icon('building')} ${parsed.vendor}`,
        parsed.totalAmount && `${icon('euro')} ${parsed.totalAmount.toFixed(2).replace('.',',')}`,
        parsed.vatRate     && `${icon('clipboard')} BTW ${parsed.vatRate}%`,
        parsed.date        && `${icon('calendar')} ${parsed.date}`,
      ].filter(Boolean);

      rcptProg.style.width   = '100%';
      rcptStat.textContent   = tags.length ? '✓ Gevonden' : 'Controleer de velden hieronder';
      rcptTags.style.display = 'flex';
      rcptTags.innerHTML     = tags.length
        ? tags.map(t => `<span class="rcpt-tag">${t}</span>`).join('')
        : `<span class="rcpt-tag" style="color:var(--text-dim)">Niets gevonden — vul zelf in</span>`;

    } catch (ex) {
      rcptStat.textContent   = (ex.message || 'Scan mislukt');
      rcptTags.style.display = 'flex';
      rcptTags.innerHTML     = `<span class="rcpt-tag" style="color:var(--danger)">Vul het bonnetje handmatig in</span>`;
    } finally {
      rcptBtn.disabled = false;
    }
  };

  backdrop.querySelector('#pk-form').onsubmit = async e => {
    e.preventDefault();
    const vendor = backdrop.querySelector('#pk-vendor').value.trim();
    const raw    = parseAmount(backdrop.querySelector('#pk-amount').value);
    if (!vendor) { err('Vul een leverancier in'); return; }
    if (!raw || isNaN(raw) || raw <= 0) { err('Vul een geldig bedrag in'); return; }

    const vatRate = parseInt(backdrop.querySelector('#pk-vat').value);
    const isIncl  = backdrop.querySelector('input[name="pk-ie"]:checked')?.value === 'incl';
    const { amountExcl, vatAmount, amountIncl } = calcVat(raw, vatRate, isIncl);

    await add('purchase_invoices', {
      id:            uid(),
      adminId:       bedrijf.id,
      date:          backdrop.querySelector('#pk-date').value,
      vendor,
      description:   backdrop.querySelector('#pk-desc').value.trim(),
      category:      backdrop.querySelector('#pk-cat').value,
      invoiceNumber: backdrop.querySelector('#pk-invnr').value.trim(),
      amountIncl, amountExcl, vatRate, vatAmount,
    });

    ok(`Kosten ${vendor} geboekt ✓`);
    backdrop.remove();
    render(container);
  };
}

function refreshPurchaseCalc(backdrop) {
  const calcEl  = backdrop.querySelector('#pk-calc');
  if (!calcEl) return;
  const raw     = parseAmount(backdrop.querySelector('#pk-amount').value);
  const vatRate = parseInt(backdrop.querySelector('#pk-vat').value) || 0;
  const isIncl  = backdrop.querySelector('input[name="pk-ie"]:checked')?.value === 'incl';
  if (!raw || isNaN(raw) || raw <= 0) { calcEl.style.display = 'none'; return; }
  const { amountExcl, vatAmount, amountIncl } = calcVat(raw, vatRate, isIncl);
  calcEl.style.display = 'block';
  calcEl.innerHTML = `
    <div class="bk-calc-row"><span>Excl. BTW</span><span>${fmtMoney(amountExcl)}</span></div>
    <div class="bk-calc-row"><span>BTW ${vatRate}% (aftrekbaar)</span><span style="color:var(--ok)">${fmtMoney(vatAmount)}</span></div>
    <div class="bk-calc-row bk-calc-total"><span>Totaal incl.</span><span class="money" style="color:var(--danger)">${fmtMoney(amountIncl)}</span></div>
  `;
}

// ─── NIEUWE KM MODAL ─────────────────────────────────────────────────────────

function openNewKmModal(container) {
  const bedrijf  = getAdmin(container);
  const todayStr = ymd();
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal bk-modal">
      <button type="button" class="modal-close" id="km-x">×</button>
      <h2 style="margin:0 0 16px">Rit registreren</h2>
      <form id="km-form" autocomplete="off">
        <div class="bk-form-section">
          <div class="bk-section-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l1.5-4.2A2 2 0 0 1 8.4 7.4h7.2a2 2 0 0 1 1.9 1.4L19 13"/><rect x="3.6" y="12.8" width="16.8" height="4" rx="1.2"/><circle cx="7.4" cy="18" r="1.4"/><circle cx="16.6" cy="18" r="1.4"/></svg>Ritgegevens</div>
          <label>Datum *</label>
          <input id="km-date" type="date" value="${todayStr}" required />
          <label>Van *</label>
          <input id="km-from" type="text" placeholder="bijv. Amsterdam Centrum" required />
          <label>Naar *</label>
          <input id="km-to" type="text" placeholder="bijv. Schiphol" required />
          <label>Kilometers *</label>
          <input id="km-km" type="text" inputmode="decimal" placeholder="18" required />
          <label>Doel</label>
          <input id="km-purpose" type="text" placeholder="bijv. Klantvervoer, Inkoop, Bank" />
          <label style="margin-top:12px;display:flex;align-items:center;gap:10px;cursor:pointer">
            <input type="checkbox" id="km-private" style="width:auto;min-width:unset" />
            Privérit (niet aftrekbaar)
          </label>
          <div id="km-preview" class="bk-calc-preview" style="display:none;margin-top:10px"></div>
        </div>
        <button type="submit" class="btn block" style="margin-top:16px;padding:14px">Rit opslaan</button>
      </form>
    </div>
  `;

  document.body.appendChild(backdrop);
  backdrop.querySelector('#km-x').onclick = () => backdrop.remove();
  backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.remove(); });

  const previewKm = () => {
    const km      = parseAmount(backdrop.querySelector('#km-km').value);
    const preview = backdrop.querySelector('#km-preview');
    const isPriv  = backdrop.querySelector('#km-private').checked;
    if (!km || isNaN(km) || km <= 0 || isPriv) { preview.style.display = 'none'; return; }
    preview.style.display = 'block';
    preview.innerHTML = `<div class="bk-calc-row"><span>Aftrek (${km} km × €0,23)</span><span class="money" style="color:var(--ok)">${fmtMoney(km * KM_VERGOEDING)}</span></div>`;
  };

  backdrop.querySelector('#km-km').addEventListener('input', previewKm);
  backdrop.querySelector('#km-private').addEventListener('change', previewKm);

  backdrop.querySelector('#km-form').onsubmit = async e => {
    e.preventDefault();
    const km = parseAmount(backdrop.querySelector('#km-km').value);
    if (!km || isNaN(km) || km <= 0) { err('Vul een geldig aantal km in'); return; }
    const from = backdrop.querySelector('#km-from').value.trim();
    const to   = backdrop.querySelector('#km-to').value.trim();
    if (!from || !to) { err('Vul vertrek en bestemming in'); return; }

    await add('km_log', {
      id:        uid(),
      adminId:   bedrijf.id,
      date:      backdrop.querySelector('#km-date').value,
      from, to, km,
      purpose:   backdrop.querySelector('#km-purpose').value.trim(),
      isPrivate: backdrop.querySelector('#km-private').checked,
    });

    ok(`${km} km geregistreerd ✓`);
    backdrop.remove();
    render(container);
  };
}

// ─── DETAIL MODALS ────────────────────────────────────────────────────────────

function openDetailModal(inv, container) {
  const status = computeStatus(inv);
  const line   = inv.lines?.[0] || {};

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal bk-modal">
      <button type="button" class="modal-close" id="det-x">×</button>
      <div class="bk-detail-hd">
        <div>
          <div class="bk-detail-label">Factuur</div>
          <div class="bk-detail-num">${escapeHTML(inv.number || '—')}</div>
        </div>
        <span class="bk-status bk-status-${status}">${statusLabel(status)}</span>
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
        ${inv.sentAt  ? `<div class="bk-detail-row"><span>Verstuurd op</span><span>${fmtDateLong(new Date(inv.sentAt).toISOString().slice(0,10))}</span></div>` : ''}
        ${inv.paidAt  ? `<div class="bk-detail-row"><span>Betaald op</span><span>${fmtDateLong(inv.paidAt)}</span></div>` : ''}
      </div>

      <div class="bk-detail-block">
        <div class="bk-detail-label">Regels</div>
        ${(inv.lines || [line]).map(l => `
          <div class="bk-detail-row bk-detail-line">
            <span class="bk-detail-desc">${escapeHTML(l.description || 'Vervoersdienst')}</span>
            <span style="white-space:nowrap">${fmtMoney(l.amountIncl ?? l.amountExcl ?? 0)}</span>
          </div>
        `).join('')}
        <div style="border-top:1px solid var(--border-faint);margin:6px 0"></div>
        <div class="bk-detail-row"><span>Excl. BTW</span><span>${fmtMoney(inv.totalExcl || 0)}</span></div>
        ${inv.lines?.length
          ? vatBreakdown(inv.lines).map(([rate, , vat]) => `<div class="bk-detail-row"><span>BTW ${rate}%</span><span>${fmtMoney(vat)}</span></div>`).join('')
          : `<div class="bk-detail-row"><span>BTW</span><span>${fmtMoney(inv.totalVat || 0)}</span></div>`}
        ${inv.vatNote ? `<div class="bk-detail-vatnote">${escapeHTML(inv.vatNote)}</div>` : ''}
        <div class="bk-detail-row bk-detail-total"><span>Totaal</span><span class="money">${fmtMoney(inv.totalIncl || 0)}</span></div>
      </div>

      ${inv.note ? `<div class="bk-detail-block"><div class="bk-detail-label">Notitie</div><div class="bk-detail-note">${escapeHTML(inv.note)}</div></div>` : ''}

      <button class="btn block bk-detail-send-btn" id="det-send">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:17px;height:17px"><path d="M20 4 11 13"/><path d="M20 4l-6 16-3.5-7.5L3 9z"/></svg>
        Factuur versturen</button>
      <div class="bk-detail-actions">
        <button class="btn secondary bk-act" id="det-edit">Bewerken</button>
        <button class="btn secondary bk-act" id="det-pdf">PDF</button>
        ${status !== 'betaald' ? `<button class="btn secondary bk-act bk-act-pay" id="det-paid">Betaald</button>` : ''}
      </div>
      ${status !== 'betaald' ? `<button class="btn secondary bk-act-wide" id="det-remind">Kopieer betalingsherinnering</button>` : ''}
      <button class="btn secondary bk-act-wide bk-act-del" id="det-del">Verwijderen</button>
    </div>
  `;

  document.body.appendChild(backdrop);
  backdrop.querySelector('#det-x').onclick = () => backdrop.remove();
  backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.remove(); });
  backdrop.querySelector('#det-send').onclick  = () => { backdrop.remove(); openSendModal(inv, ADMINS[inv.adminId || 'taxi'] || ADMINS.taxi, container); };
  backdrop.querySelector('#det-pdf').onclick = async () => { backdrop.remove(); await sharePDF(inv, ADMINS[inv.adminId || 'taxi'] || ADMINS.taxi); };

  backdrop.querySelector('#det-edit').onclick = () => {
    backdrop.remove();
    openInvoiceModal(container, { existingInv: inv });
  };

  const remindBtn = backdrop.querySelector('#det-remind');
  if (remindBtn) {
    remindBtn.onclick = () => {
      const clientName = inv.client?.name || 'Geachte relatie';
      const isLate = status === 'te-laat';
      const _remAdmin = ADMINS[inv.adminId || 'taxi'] || ADMINS.taxi;
      const text = `${isLate ? 'Herinnering' : 'Betalingsverzoek'}: Factuur ${inv.number}\n\nGeachte ${clientName},\n\n${isLate ? 'Wij constateren dat onderstaande factuur nog niet is voldaan.' : 'Wij verzoeken u vriendelijk het onderstaande bedrag te voldoen.'}\n\nFactuurnummer: ${inv.number}\nFactuurdatum: ${fmtDateLong(inv.date)}\nVervaldatum: ${fmtDateLong(inv.dueDate)}\nBedrag: ${fmtMoney(inv.totalIncl || 0, true)}\n\nOmschrijving: ${inv.lines?.[0]?.description || '—'}\n\nGelieve het bedrag over te maken naar:\nIBAN: ${fmtIBAN(_remAdmin.iban || '')}${_remAdmin.bic ? '\nBIC: ' + _remAdmin.bic : ''}\nt.n.v. ${_remAdmin.naam || ''}\no.v.v. ${inv.number}\n\nMet vriendelijke groet,\n${_remAdmin.naam || ''}`;
      navigator.clipboard.writeText(text).then(() => ok('Herinneringstekst gekopieerd ✓')).catch(() => err('Kopiëren mislukt'));
    };
  }

  const paidBtn = backdrop.querySelector('#det-paid');
  if (paidBtn) {
    paidBtn.onclick = async () => {
      await put('invoices', { ...cleanInv(inv), status: 'betaald', paidAt: ymd() });
      ok('Factuur gemarkeerd als betaald ✓');
      backdrop.remove();
      render(container);
    };
  }

  let delStep = 0;
  backdrop.querySelector('#det-del').onclick = async function () {
    if (delStep === 0) {
      delStep = 1;
      this.textContent = '⚠ Nogmaals tikken om definitief te verwijderen';
      return;
    }
    await del('invoices', inv.id);
    ok('Factuur verwijderd');
    backdrop.remove();
    render(container);
  };
}

function openPurchaseDetailModal(purchase, container) {
  const cat = catInfo(purchase.category || 'overig');
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal bk-modal">
      <button type="button" class="modal-close" id="pd-x">×</button>
      <h2 style="margin:0 0 16px;display:flex;align-items:center;gap:8px">${icon(cat.icon)} ${escapeHTML(purchase.vendor || '—')}</h2>

      <div class="bk-detail-block">
        <div class="bk-detail-label">Kosten</div>
        <div class="bk-detail-row"><span>Categorie</span><span>${cat.label}</span></div>
        <div class="bk-detail-row"><span>Datum</span><span>${fmtDateLong(purchase.date)}</span></div>
        ${purchase.description ? `<div class="bk-detail-row"><span>Omschrijving</span><span>${escapeHTML(purchase.description)}</span></div>` : ''}
        ${purchase.invoiceNumber ? `<div class="bk-detail-row"><span>Factuurnr. leverancier</span><span>${escapeHTML(purchase.invoiceNumber)}</span></div>` : ''}
      </div>

      <div class="bk-detail-block">
        <div class="bk-detail-label">Bedragen</div>
        <div class="bk-detail-row"><span>Excl. BTW</span><span>${fmtMoney(purchase.amountExcl || 0)}</span></div>
        <div class="bk-detail-row"><span>BTW ${purchase.vatRate || 0}% (aftrekbaar)</span><span style="color:var(--ok)">${fmtMoney(purchase.vatAmount || 0)}</span></div>
        <div class="bk-detail-row bk-detail-total"><span>Totaal incl.</span><span class="money" style="color:var(--danger)">${fmtMoney(purchase.amountIncl || 0)}</span></div>
      </div>

      <button class="btn secondary bk-act-wide" id="pd-edit" style="margin-top:12px">Bewerken</button>
      <button class="btn secondary bk-act-wide bk-act-del" id="pd-del">Verwijderen</button>
    </div>
  `;

  document.body.appendChild(backdrop);
  backdrop.querySelector('#pd-x').onclick = () => backdrop.remove();
  backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.remove(); });

  backdrop.querySelector('#pd-edit').onclick = () => {
    backdrop.remove();
    openEditPurchaseModal(purchase, container);
  };

  let delStep = 0;
  backdrop.querySelector('#pd-del').onclick = async function () {
    if (delStep === 0) { delStep = 1; this.textContent = '⚠ Nogmaals tikken om te verwijderen'; return; }
    await del('purchase_invoices', purchase.id);
    ok('Kosten verwijderd');
    backdrop.remove();
    render(container);
  };
}

function openEditPurchaseModal(purchase, container) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal bk-modal">
      <button type="button" class="modal-close" id="epk-x">×</button>
      <h2 style="margin:0 0 16px">Kosten bewerken</h2>
      <form id="epk-form" autocomplete="off">
        <div class="bk-form-section">
          <div class="bk-section-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7.5a2 2 0 0 1 2-2h5.2a2 2 0 0 1 1.4.6l6.4 6.4a1.8 1.8 0 0 1 0 2.5l-4.8 4.8a1.8 1.8 0 0 1-2.5 0L5.3 13.4A2 2 0 0 1 4 11.5z"/><circle cx="8.4" cy="9.4" r="1.1" fill="currentColor" stroke="none"/></svg>Kosten</div>
          <label>Leverancier / winkel *</label>
          <input id="epk-vendor" type="text" placeholder="bijv. Shell, Gamma, …" value="${escapeHTML(purchase.vendor || '')}" required />
          <label>Omschrijving</label>
          <input id="epk-desc" type="text" placeholder="bijv. Brandstof 13 juni" value="${escapeHTML(purchase.description || '')}" />
          <label>Categorie</label>
          <select id="epk-cat">
            ${CATS.map(c => `<option value="${c.id}" ${purchase.category === c.id ? 'selected' : ''}>${c.label}</option>`).join('')}
          </select>
          <label>Bedrag *</label>
          <div class="bk-amount-row">
            <input id="epk-amount" type="text" inputmode="decimal" placeholder="80" value="${escapeHTML(String(purchase.amountIncl || ''))}" required />
            <label class="bk-radio"><input type="radio" name="epk-ie" value="incl" checked /> Incl. BTW</label>
            <label class="bk-radio"><input type="radio" name="epk-ie" value="excl" /> Excl. BTW</label>
          </div>
          <label style="margin-top:10px">BTW-tarief</label>
          <select id="epk-vat">
            <option value="21" ${(purchase.vatRate || 21) === 21 ? 'selected' : ''}>21% — standaard</option>
            <option value="9"  ${purchase.vatRate === 9  ? 'selected' : ''}>9% — verlaagd</option>
            <option value="0"  ${purchase.vatRate === 0  ? 'selected' : ''}>0% — geen BTW aftrek</option>
          </select>
          <div id="epk-calc" class="bk-calc-preview" style="display:none"></div>
        </div>
        <div class="bk-form-section">
          <div class="bk-section-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5.2" width="16" height="14.6" rx="2"/><path d="M4 9.4h16"/><path d="M8 3.4v3.2"/><path d="M16 3.4v3.2"/></svg>Datum</div>
          <label>Datum</label>
          <input id="epk-date" type="date" value="${escapeHTML(purchase.date || ymd())}" required />
          <label>Factuurnummer leverancier (optioneel)</label>
          <input id="epk-invnr" type="text" placeholder="bijv. INV-2026-001" value="${escapeHTML(purchase.invoiceNumber || '')}" />
        </div>
        <button type="submit" class="btn block" style="margin-top:16px;padding:14px">Kosten opslaan</button>
      </form>
    </div>
  `;

  document.body.appendChild(backdrop);
  backdrop.querySelector('#epk-x').onclick = () => backdrop.remove();
  backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.remove(); });

  const refreshFn = () => {
    const calcEl  = backdrop.querySelector('#epk-calc');
    if (!calcEl) return;
    const raw     = parseAmount(backdrop.querySelector('#epk-amount').value);
    const vatRate = parseInt(backdrop.querySelector('#epk-vat').value) || 0;
    const isIncl  = backdrop.querySelector('input[name="epk-ie"]:checked')?.value === 'incl';
    if (!raw || isNaN(raw) || raw <= 0) { calcEl.style.display = 'none'; return; }
    const { amountExcl, vatAmount, amountIncl } = calcVat(raw, vatRate, isIncl);
    calcEl.style.display = 'block';
    calcEl.innerHTML = `
      <div class="bk-calc-row"><span>Excl. BTW</span><span>${fmtMoney(amountExcl)}</span></div>
      <div class="bk-calc-row"><span>BTW ${vatRate}% (aftrekbaar)</span><span style="color:var(--ok)">${fmtMoney(vatAmount)}</span></div>
      <div class="bk-calc-row bk-calc-total"><span>Totaal incl.</span><span class="money" style="color:var(--danger)">${fmtMoney(amountIncl)}</span></div>
    `;
  };
  backdrop.querySelector('#epk-amount').addEventListener('input', refreshFn);
  backdrop.querySelector('#epk-vat').addEventListener('input', refreshFn);
  backdrop.querySelectorAll('input[name="epk-ie"]').forEach(r => r.addEventListener('change', refreshFn));
  refreshFn();

  backdrop.querySelector('#epk-form').onsubmit = async e => {
    e.preventDefault();
    const vendor = backdrop.querySelector('#epk-vendor').value.trim();
    const raw    = parseAmount(backdrop.querySelector('#epk-amount').value);
    if (!vendor) { err('Vul een leverancier in'); return; }
    if (!raw || isNaN(raw) || raw <= 0) { err('Vul een geldig bedrag in'); return; }

    const vatRate = parseInt(backdrop.querySelector('#epk-vat').value);
    const isIncl  = backdrop.querySelector('input[name="epk-ie"]:checked')?.value === 'incl';
    const { amountExcl, vatAmount, amountIncl } = calcVat(raw, vatRate, isIncl);

    await put('purchase_invoices', {
      ...purchase,
      date:          backdrop.querySelector('#epk-date').value,
      vendor,
      description:   backdrop.querySelector('#epk-desc').value.trim(),
      category:      backdrop.querySelector('#epk-cat').value,
      invoiceNumber: backdrop.querySelector('#epk-invnr').value.trim(),
      amountIncl, amountExcl, vatRate, vatAmount,
    });

    ok('Kosten bijgewerkt ✓');
    backdrop.remove();
    render(container);
  };
}

function openKmDetailModal(k, container) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal bk-modal">
      <button type="button" class="modal-close" id="kd-x">×</button>
      <h2 style="margin:0 0 16px">${k.isPrivate ? icon('home') + ' Privérit' : icon('briefcase') + ' Zakelijke rit'}</h2>
      <div class="bk-detail-block">
        <div class="bk-detail-row"><span>Datum</span><span>${fmtDateLong(k.date)}</span></div>
        <div class="bk-detail-row"><span>Van</span><span>${escapeHTML(k.from || '—')}</span></div>
        <div class="bk-detail-row"><span>Naar</span><span>${escapeHTML(k.to || '—')}</span></div>
        <div class="bk-detail-row"><span>Kilometers</span><span>${Number(k.km || 0).toLocaleString('nl-NL')} km</span></div>
        ${k.purpose ? `<div class="bk-detail-row"><span>Doel</span><span>${escapeHTML(k.purpose)}</span></div>` : ''}
        ${!k.isPrivate ? `<div class="bk-detail-row bk-detail-total"><span>Aftrek (€0,23/km)</span><span class="money" style="color:var(--ok)">${fmtMoney((Number(k.km) || 0) * KM_VERGOEDING)}</span></div>` : ''}
      </div>
      <button class="btn secondary bk-act-wide" id="kd-edit" style="margin-top:12px">Bewerken</button>
      <button class="btn secondary bk-act-wide bk-act-del" id="kd-del">Verwijderen</button>
    </div>
  `;

  document.body.appendChild(backdrop);
  backdrop.querySelector('#kd-x').onclick = () => backdrop.remove();
  backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.remove(); });

  backdrop.querySelector('#kd-edit').onclick = () => {
    backdrop.remove();
    openEditKmModal(k, container);
  };

  let delStep = 0;
  backdrop.querySelector('#kd-del').onclick = async function () {
    if (delStep === 0) { delStep = 1; this.textContent = '⚠ Nogmaals tikken om te verwijderen'; return; }
    await del('km_log', k.id);
    ok('Rit verwijderd');
    backdrop.remove();
    render(container);
  };
}

function openEditKmModal(k, container) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal bk-modal">
      <button type="button" class="modal-close" id="ekm-x">×</button>
      <h2 style="margin:0 0 16px">Rit bewerken</h2>
      <form id="ekm-form" autocomplete="off">
        <div class="bk-form-section">
          <div class="bk-section-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l1.5-4.2A2 2 0 0 1 8.4 7.4h7.2a2 2 0 0 1 1.9 1.4L19 13"/><rect x="3.6" y="12.8" width="16.8" height="4" rx="1.2"/><circle cx="7.4" cy="18" r="1.4"/><circle cx="16.6" cy="18" r="1.4"/></svg>Ritgegevens</div>
          <label>Datum *</label>
          <input id="ekm-date" type="date" value="${escapeHTML(k.date || ymd())}" required />
          <label>Van *</label>
          <input id="ekm-from" type="text" placeholder="bijv. Amsterdam Centrum" value="${escapeHTML(k.from || '')}" required />
          <label>Naar *</label>
          <input id="ekm-to" type="text" placeholder="bijv. Schiphol" value="${escapeHTML(k.to || '')}" required />
          <label>Kilometers *</label>
          <input id="ekm-km" type="text" inputmode="decimal" placeholder="18" value="${escapeHTML(String(k.km || ''))}" required />
          <label>Doel</label>
          <input id="ekm-purpose" type="text" placeholder="bijv. Klantvervoer, Inkoop, Bank" value="${escapeHTML(k.purpose || '')}" />
          <label style="margin-top:12px;display:flex;align-items:center;gap:10px;cursor:pointer">
            <input type="checkbox" id="ekm-private" style="width:auto;min-width:unset" ${k.isPrivate ? 'checked' : ''} />
            Privérit (niet aftrekbaar)
          </label>
          <div id="ekm-preview" class="bk-calc-preview" style="display:none;margin-top:10px"></div>
        </div>
        <button type="submit" class="btn block" style="margin-top:16px;padding:14px">Rit opslaan</button>
      </form>
    </div>
  `;

  document.body.appendChild(backdrop);
  backdrop.querySelector('#ekm-x').onclick = () => backdrop.remove();
  backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.remove(); });

  const previewKm = () => {
    const km      = parseAmount(backdrop.querySelector('#ekm-km').value);
    const preview = backdrop.querySelector('#ekm-preview');
    const isPriv  = backdrop.querySelector('#ekm-private').checked;
    if (!km || isNaN(km) || km <= 0 || isPriv) { preview.style.display = 'none'; return; }
    preview.style.display = 'block';
    preview.innerHTML = `<div class="bk-calc-row"><span>Aftrek (${km} km × €0,23)</span><span class="money" style="color:var(--ok)">${fmtMoney(km * KM_VERGOEDING)}</span></div>`;
  };
  backdrop.querySelector('#ekm-km').addEventListener('input', previewKm);
  backdrop.querySelector('#ekm-private').addEventListener('change', previewKm);
  previewKm();

  backdrop.querySelector('#ekm-form').onsubmit = async e => {
    e.preventDefault();
    const km = parseAmount(backdrop.querySelector('#ekm-km').value);
    if (!km || isNaN(km) || km <= 0) { err('Vul een geldig aantal km in'); return; }
    const from = backdrop.querySelector('#ekm-from').value.trim();
    const to   = backdrop.querySelector('#ekm-to').value.trim();
    if (!from || !to) { err('Vul vertrek en bestemming in'); return; }

    await put('km_log', {
      ...k,
      date:      backdrop.querySelector('#ekm-date').value,
      from, to, km,
      purpose:   backdrop.querySelector('#ekm-purpose').value.trim(),
      isPrivate: backdrop.querySelector('#ekm-private').checked,
    });

    ok('Rit bijgewerkt ✓');
    backdrop.remove();
    render(container);
  };
}

// ─── PDF / VERZENDEN ─────────────────────────────────────────────────────────

function generateInvoiceHTML(inv, bedrijf) {
  const _fallbackLine = { description: bedrijf?.defaultDesc || 'Vervoersdienst', vatRate: bedrijf?.defaultVat ?? 9, amountExcl: inv.totalExcl || 0, vatAmount: inv.totalVat || 0, amountIncl: inv.totalIncl || 0 };
  const lines   = inv.lines?.length ? inv.lines : [_fallbackLine];
  const client  = inv.client || {};
  const ibanFmt = fmtIBAN(bedrijf.iban);
  let qrPayload = null;
  try { qrPayload = invoiceEpcPayload(inv, bedrijf); } catch (_) {}
  const accent  = bedrijf.accent ? `rgb(${bedrijf.accent.join(',')})` : '#8a7e6f';
  const summary = lessonSummary(inv);
  const vatRows = vatBreakdown(lines);
  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Factuur ${escapeHTML(inv.number || '')}</title>
<style>
  @page { margin: 20mm 22mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, Arial, Helvetica, sans-serif; color: #1a1a1a; font-size: 14px; line-height: 1.5; background: #fff; }
  .wrap { max-width: 760px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 32px; border-bottom: 1.5px solid #e8e4de; margin-bottom: 36px; }
  .brand { font-size: 22px; font-weight: 800; letter-spacing: -.5px; color: #1a1a1a; margin-bottom: 8px; }
  .co-info { font-size: 12px; color: #666; line-height: 1.7; }
  .inv-title { font-size: 36px; font-weight: 800; color: ${accent}; letter-spacing: -1px; }
  .inv-meta { font-size: 12px; color: #666; margin-top: 10px; line-height: 1.7; text-align: right; }
  .inv-meta strong { color: #1a1a1a; }
  .client-box { background: #f8f7f5; border-radius: 10px; padding: 20px 24px; margin-bottom: 36px; }
  .client-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1.2px; color: #999; margin-bottom: 8px; font-weight: 600; }
  .client-name { font-size: 17px; font-weight: 700; margin-bottom: 5px; }
  .client-detail { font-size: 13px; color: #555; line-height: 1.7; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead th { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #999; font-weight: 600; padding: 8px 12px; border-bottom: 1.5px solid #e8e4de; text-align: left; }
  thead th.num { text-align: right; }
  tbody td { padding: 14px 12px; border-bottom: 1px solid #f0ede8; font-size: 14px; vertical-align: top; }
  tbody td.num { text-align: right; white-space: nowrap; }
  tbody td.num-strong { font-weight: 600; }
  td.desc { white-space: pre-line; overflow-wrap: anywhere; word-break: break-word; }
  .totals { margin-left: auto; width: 300px; margin-bottom: 40px; }
  .t-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; color: #555; }
  .t-grand { display: flex; justify-content: space-between; padding: 14px 0 0; margin-top: 10px; border-top: 2px solid #1a1a1a; font-size: 20px; font-weight: 800; color: #1a1a1a; }
  .pay-box { background: #f8f7f5; border-radius: 10px; padding: 20px 24px; font-size: 13px; color: #555; line-height: 1.8; }
  .pay-box strong { color: #1a1a1a; }
  .pay-iban { font-size: 15px; font-weight: 700; color: #1a1a1a; letter-spacing: .5px; }
  .pay-wrap { display: flex; gap: 20px; align-items: center; justify-content: space-between; }
  .pay-qr { flex: 0 0 auto; text-align: center; font-size: 11px; color: #888; line-height: 1.4; }
  .pay-qr svg { display: block; margin: 0 auto 4px; border-radius: 6px; }
  .tagline { font-size: 11px; text-transform: uppercase; letter-spacing: 1.4px; color: ${accent}; font-weight: 700; margin: -4px 0 8px; }
  .notes { display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; }
  .notes-left { font-size: 13px; color: #555; line-height: 1.6; padding-top: 5px; }
  .notes-left em { display: block; font-size: 12px; color: #777; margin-top: 4px; }
  .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e8e4de; font-size: 11px; color: #aaa; display: flex; justify-content: space-between; gap: 12px; }
  .t-row span:last-child, .t-grand span:last-child { white-space: nowrap; }
  @media (max-width: 560px) {
    body { font-size: 13px; padding: 16px 14px; }
    .header { flex-direction: column; gap: 18px; padding-bottom: 22px; margin-bottom: 24px; }
    .header > div:last-child { text-align: left !important; }
    .inv-meta { text-align: left; }
    .inv-title { font-size: 28px; }
    .client-box, .pay-box { padding: 16px; margin-bottom: 24px; }
    thead th, tbody td { padding: 10px 6px; font-size: 12.5px; }
    thead th { font-size: 9px; letter-spacing: .5px; }
    td.desc { font-size: 12.5px; }
    .notes { flex-direction: column; gap: 8px; }
    .totals { width: 100%; margin-bottom: 24px; }
    .pay-wrap { flex-direction: column; align-items: flex-start; }
    .footer { flex-direction: column; }
  }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div>
      <div class="brand">${escapeHTML(bedrijf.naam)}</div>
      ${bedrijf.tagline ? `<div class="tagline">${escapeHTML(bedrijf.tagline)}</div>` : ''}
      <div class="co-info">
        ${escapeHTML(bedrijf.adres)}<br>${escapeHTML(bedrijf.postcode)}<br>
        BTW: ${escapeHTML(bedrijf.btw)}<br>KvK: ${escapeHTML(bedrijf.kvk)}<br>IBAN: ${escapeHTML(ibanFmt)}
      </div>
    </div>
    <div style="text-align:right">
      <div class="inv-title">FACTUUR</div>
      <div class="inv-meta">
        Nummer: <strong>${escapeHTML(inv.number || '—')}</strong><br>
        Datum: <strong>${fmtDateLong(inv.date)}</strong><br>
        Vervaldatum: <strong>${fmtDateLong(inv.dueDate)}</strong>
        ${inv.period ? `<br>Periode: <strong>${escapeHTML(inv.period)}</strong>` : ''}
        ${inv.reference ? `<br>Kenmerk: <strong>${escapeHTML(inv.reference)}</strong>` : ''}
      </div>
    </div>
  </div>
  <div class="client-box">
    <div class="client-label">Factuur aan</div>
    <div class="client-name">${escapeHTML(client.name || '—')}</div>
    <div class="client-detail">
      ${client.address ? escapeHTML(client.address) + '<br>' : ''}
      ${client.city    ? escapeHTML(client.city)    + '<br>' : ''}
      ${client.kvk     ? 'KvK: '   + escapeHTML(client.kvk)   + '<br>' : ''}
      ${client.btw     ? 'BTW: '   + escapeHTML(client.btw)   + '<br>' : ''}
      ${client.email   ? escapeHTML(client.email) : ''}
    </div>
  </div>
  <table>
    <thead><tr>
      <th>Omschrijving</th>
      <th class="num">BTW</th><th class="num">Excl. BTW</th><th class="num">Totaal incl.</th>
    </tr></thead>
    <tbody>
      ${lines.map(l => `<tr>
        <td class="desc">${escapeHTML(String(l.description || bedrijf.defaultDesc || 'Vervoersdienst').replace(/[ \t]{2,}/g, ' ').trim())}</td>
        <td class="num">${l.vatRate ?? 0}%</td>
        <td class="num">${fmtMoneyPDF(l.amountExcl ?? 0)}</td>
        <td class="num num-strong">${fmtMoneyPDF(l.amountIncl ?? 0)}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  <div class="notes">
  <div class="notes-left">${summary ? `<strong>${escapeHTML(summary)}</strong>` : ''}${inv.vatNote ? `<em>${escapeHTML(inv.vatNote)}</em>` : ''}</div>
  <div class="totals">
    <div class="t-row"><span>Subtotaal excl. BTW</span><span>${fmtMoneyPDF(inv.totalExcl || 0)}</span></div>
    ${vatRows.map(([rate, excl, vat]) => `<div class="t-row"><span>BTW ${rate}%${vatRows.length > 1 ? ` over ${fmtMoneyPDF(excl)}` : ''}</span><span>${fmtMoneyPDF(vat)}</span></div>`).join('')}
    <div class="t-grand"><span>Te betalen</span><span>${fmtMoneyPDF(inv.totalIncl || 0)}</span></div>
  </div>
  </div>
  <div class="pay-box"><div class="pay-wrap"><div>
    Gelieve het bedrag van <strong>${fmtMoneyPDF(inv.totalIncl || 0)}</strong> vóór <strong>${fmtDateLong(inv.dueDate)}</strong> over te maken naar:<br>
    <span class="pay-iban">${escapeHTML(ibanFmt)}</span> — t.n.v. ${escapeHTML(bedrijf.naam)}<br>
    ${bedrijf.bic ? `BIC: <strong>${escapeHTML(bedrijf.bic)}</strong><br>` : ''}
    o.v.v. factuurnummer <strong>${escapeHTML(inv.number || '')}</strong>
  </div>${qrPayload ? `<div class="pay-qr">${qrSvg(qrPayload, 104)}Scan met uw bank-app</div>` : ''}</div></div>
  <div class="footer">
    <span>${escapeHTML(bedrijf.naam)} · KvK ${escapeHTML(bedrijf.kvk)} · BTW ${escapeHTML(bedrijf.btw)}</span>
    <span>${escapeHTML(inv.number || '')}</span>
  </div>
</div>
<script>window.addEventListener('load', () => { window.focus(); window.print(); });<\/script>
</body>
</html>`;
}

function printInvoice(inv, bedrijf) {
  if (!bedrijf) bedrijf = ADMINS[inv.adminId || 'taxi'] || ADMINS.taxi;
  const html = generateInvoiceHTML(inv, bedrijf);
  // Gebruik blob URL — werkt op iPhone Safari (window.open+document.write wordt geblokkeerd)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank');
  if (!win) {
    // Fallback: download als HTML-bestand
    const a = Object.assign(document.createElement('a'), { href: url, download: `${inv.number || 'factuur'}.html` });
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// ── PDF generatie via jsPDF (lazy) ───────────────────────────────────────────

let _jsPdfLoading = null;
function loadJsPdf() {
  if (window.jspdf?.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
  if (_jsPdfLoading) return _jsPdfLoading;
  _jsPdfLoading = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.onload  = () => { _jsPdfLoading = null; resolve(window.jspdf.jsPDF); };
    s.onerror = () => { _jsPdfLoading = null; reject(new Error('PDF-bibliotheek kon niet laden — controleer je internetverbinding')); };
    document.head.appendChild(s);
  });
  return _jsPdfLoading;
}

// Vector-logo (geen afbeelding nodig) — taxi-badge of blad, in accentkleur
function drawCompanyLogo(doc, bedrijf, x, y, s, TAUPE, DARK) {
  // Afgeronde badge in accentkleur
  doc.setFillColor(...TAUPE);
  doc.roundedRect(x, y, s, s, s * 0.17, s * 0.17, 'F');

  const glyph = bedrijf.logoGlyph || (bedrijf.id === 'olijfolie' ? 'leaf' : 'taxi');

  if (glyph === 'taxi') {
    // Witte taxi-silhouet
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x + s * 0.30, y + s * 0.24, s * 0.40, s * 0.18, 0.5, 0.5, 'F'); // dak
    doc.roundedRect(x + s * 0.15, y + s * 0.40, s * 0.70, s * 0.26, 0.9, 0.9, 'F'); // body
    // Dambord-streep (taupe blokjes op de body)
    doc.setFillColor(...TAUPE);
    const cw = s * 0.075, cby = y + s * 0.46;
    for (let i = 0; i < 3; i++) doc.rect(x + s * 0.31 + i * cw * 1.5, cby, cw, cw, 'F');
    // Wielen (donker) met witte naaf
    const wy = y + s * 0.70, r = s * 0.105;
    doc.setFillColor(...DARK);
    doc.circle(x + s * 0.33, wy, r, 'F');
    doc.circle(x + s * 0.67, wy, r, 'F');
    doc.setFillColor(255, 255, 255);
    doc.circle(x + s * 0.33, wy, r * 0.42, 'F');
    doc.circle(x + s * 0.67, wy, r * 0.42, 'F');
  } else if (glyph === 'ball') {
    // Bal-silhouet: witte bal met vijfhoek + naden in accentkleur
    const cx = x + s / 2, cy = y + s / 2, r = s * 0.32;
    doc.setFillColor(255, 255, 255);
    doc.circle(cx, cy, r, 'F');
    const pts = [0, 1, 2, 3, 4].map(i => {
      const a = -Math.PI / 2 + i * 2 * Math.PI / 5;
      return [cx + Math.cos(a) * r * 0.42, cy + Math.sin(a) * r * 0.42, cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    });
    doc.setFillColor(...TAUPE);
    doc.setDrawColor(...TAUPE); doc.setLineWidth(0.35);
    doc.lines(pts.slice(1).map((p, i) => [p[0] - pts[i][0], p[1] - pts[i][1]]), pts[0][0], pts[0][1], [1, 1], 'FD', true);
    pts.forEach(p => doc.line(p[0], p[1], p[2], p[3]));
  } else if (glyph === 'letter') {
    // Monogram: eerste letter van de naam in wit
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(s * 2.2);
    doc.setTextColor(255, 255, 255);
    doc.text((bedrijf.naam || bedrijf.label || '?').charAt(0).toUpperCase(), x + s / 2, y + s * 0.72, { align: 'center' });
  } else {
    // Blad-silhouet voor olijfolie
    doc.setFillColor(255, 255, 255);
    doc.ellipse(x + s * 0.5, y + s * 0.5, s * 0.17, s * 0.31, 'F');
    doc.setDrawColor(...TAUPE); doc.setLineWidth(0.45);
    doc.line(x + s * 0.5, y + s * 0.24, x + s * 0.5, y + s * 0.74);
  }
}

async function generateInvoicePDF(inv, bedrijf) {
  const JsPDF = await loadJsPdf();
  const doc    = new JsPDF({ unit: 'mm', format: 'a4' });
  // Alle tekst door pdfText(): de standaardfonts kunnen alleen WinAnsi-tekens tonen
  const _text  = doc.text.bind(doc);
  doc.text = (t, ...rest) => _text(Array.isArray(t) ? t.map(pdfText) : pdfText(t), ...rest);
  const _split = doc.splitTextToSize.bind(doc);
  doc.splitTextToSize = (t, w, o) => _split(pdfText(t), w, o);
  doc.setProperties({
    title:   pdfText(`Factuur ${inv.number || ''}`),
    subject: pdfText(`Factuur ${inv.number || ''} - ${inv.client?.name || ''}`),
    author:  pdfText(bedrijf.naam),
    creator: pdfText(bedrijf.naam),
  });

  const _pdfFallback = { description: bedrijf?.defaultDesc || 'Vervoersdienst', vatRate: bedrijf?.defaultVat ?? 9, amountExcl: inv.totalExcl || 0, vatAmount: inv.totalVat || 0, amountIncl: inv.totalIncl || 0 };
  const lines  = inv.lines?.length ? inv.lines : [_pdfFallback];
  const client = inv.client  || {};
  const L = 20, R = 190, W = 170;
  const TAUPE = bedrijf.accent || [138, 126, 111];
  const DARK  = [26, 26, 26];
  const MED   = [85, 85, 85];
  const DIM   = [153, 153, 153];
  const BG    = [248, 247, 245];
  const font  = (style, size, color) => { doc.setFont('helvetica', style); doc.setFontSize(size); doc.setTextColor(...color); };

  // ── Accent balk bovenin ──
  doc.setFillColor(...TAUPE);
  doc.rect(0, 0, 210, 6, 'F');

  // ── Logo-badge + woordmerk ──
  drawCompanyLogo(doc, bedrijf, L, 9, 13, TAUPE, DARK);
  font('bold', 14, DARK);
  doc.text(bedrijf.naam, L + 17, 16);
  if (bedrijf.tagline) {
    font('normal', 7.5, TAUPE);
    doc.text(bedrijf.tagline.toUpperCase(), L + 17, 20.5, { charSpace: 0.3 });
  }

  // ── Bedrijfsgegevens ──
  font('normal', 8.5, MED);
  doc.text([bedrijf.adres, bedrijf.postcode, `KvK: ${bedrijf.kvk}   BTW: ${bedrijf.btw}`, `IBAN: ${fmtIBAN(bedrijf.iban)}`].join('\n'), L, 28, { lineHeightFactor: 1.6 });

  // ── "FACTUUR" + meta rechts ──
  font('bold', 28, TAUPE);
  doc.text('FACTUUR', R, 18, { align: 'right' });

  let mY = 27;
  const metaRows = [['Nummer:', inv.number || '—'], ['Datum:', fmtDateLong(inv.date)], ['Vervaldatum:', fmtDateLong(inv.dueDate)]];
  if (inv.period)    metaRows.push(['Periode:', inv.period]);
  if (inv.reference) metaRows.push(['Kenmerk:', inv.reference]);
  if (metaRows.length > 3) mY = 25;
  const mStep = metaRows.length > 4 ? 4.8 : 5.5;
  metaRows.forEach(([lbl, val]) => {
    font('normal', 9, DIM);
    doc.text(lbl, R - 55, mY);
    // Lange waarde (bv. kenmerk/PO-nummer) mag nooit over het label heen lopen:
    // eerst iets kleiner, past het dan nog niet → op de regel eronder.
    const maxW = 55 - doc.getTextWidth(lbl) - 3;
    let size = 9;
    font('bold', size, DARK);
    while (size > 7.5 && doc.getTextWidth(pdfText(val)) > maxW) doc.setFontSize(size -= 0.5);
    if (doc.getTextWidth(pdfText(val)) > maxW) {
      mY += mStep * 0.85;
      let v = pdfText(val);
      while (v.length > 4 && doc.getTextWidth(v) > 70) v = v.slice(0, -2);
      doc.text(v === pdfText(val) ? v : v.trimEnd() + '…', R, mY, { align: 'right' });
    } else {
      doc.text(val, R, mY, { align: 'right' });
    }
    mY += mStep;
  });

  // ── Scheidingslijn ──
  const sep1 = 52;
  doc.setDrawColor(220, 215, 208); doc.setLineWidth(0.4); doc.line(L, sep1, R, sep1);

  // ── Klantbox (dynamische hoogte) ──
  font('bold', 12, DARK);
  const nameLines = doc.splitTextToSize(client.name || '—', W - 14);
  const clientInfoLines = [client.address, client.city, client.kvk ? `KvK: ${client.kvk}` : null, client.btw ? `BTW: ${client.btw}` : null, client.email, client.phone].filter(Boolean);
  const nameExtra = (nameLines.length - 1) * 5;
  const boxH = 22 + nameExtra + clientInfoLines.length * 5;
  const boxY = sep1 + 5;
  doc.setFillColor(...BG);
  doc.roundedRect(L, boxY, W, boxH, 2, 2, 'F');
  doc.setFillColor(...TAUPE);
  doc.rect(L, boxY, 3, boxH, 'F');

  font('bold', 7.5, DIM);
  doc.text('FACTUUR AAN', L + 7, boxY + 8);
  font('bold', 12, DARK);
  doc.text(nameLines, L + 7, boxY + 15, { lineHeightFactor: 1.2 });
  if (clientInfoLines.length) {
    font('normal', 9, MED);
    doc.text(clientInfoLines.join('\n'), L + 7, boxY + 21 + nameExtra, { lineHeightFactor: 1.55 });
  }

  // ── Tabel: vaste kolommen. Omschrijving heeft een eigen kolom en loopt naar
  //    beneden door (nooit over BTW/bedragen heen); bedragen staan op de eerste regel.
  const COL = { desc: L + 3, descW: 98, vat: R - 54, excl: R - 28, incl: R - 3 };
  const PAGE_H = 297;
  const FOOT_H = 22;                       // footer-hoogte (altijd gereserveerd onderaan)
  const LIMIT  = PAGE_H - FOOT_H - 4;      // onderste schrijfgrens van de tabel
  const PAD_T  = 5.2;                      // rijbovenkant → eerste basislijn
  const PAD_B  = 3.4;                      // laatste basislijn → scheidingslijn
  const HEAD   = { style: 'bold',   size: 9, color: DARK, lh: 4.3 };
  const BODY   = { style: 'normal', size: 9, color: DARK, lh: 4.3 };
  const DETAIL = { style: 'normal', size: 8, color: MED,  lh: 3.8 };

  const drawTableHead = (y) => {
    doc.setFillColor(...TAUPE);
    doc.rect(L, y, W, 7, 'F');
    font('bold', 7.5, [255, 255, 255]);
    doc.text('OMSCHRIJVING', COL.desc, y + 4.8);
    doc.text('BTW',          COL.vat,  y + 4.8, { align: 'right' });
    doc.text('EXCL. BTW',    COL.excl, y + 4.8, { align: 'right' });
    doc.text('TOTAAL INCL.', COL.incl, y + 4.8, { align: 'right' });
    doc.setDrawColor(220, 215, 208); doc.setLineWidth(0.25);
    doc.line(L, y + 7, R, y + 7);
    return y + 7;
  };

  let rowEndY = drawTableHead(boxY + boxH + 10);

  const _newPage = (withTableHead = true) => {
    doc.addPage();
    // Mini-header
    doc.setFillColor(...TAUPE); doc.rect(0, 0, 210, 4, 'F');
    font('bold', 8, DARK);
    doc.text(bedrijf.naam, L, 11);
    font('normal', 8, DIM);
    doc.text(`Factuur ${inv.number || ''} (vervolg)`, R, 11, { align: 'right' });
    rowEndY = withTableHead ? drawTableHead(15) : 15;
  };

  // Omschrijving → losse, al afgebroken regels. Afbreken gebeurt pas NA het zetten
  // van het juiste font: splitTextToSize meet met het actieve font (dat was de fout:
  // er werd gemeten op 7,5pt en getekend op 9pt vet → tekst liep ~20% te breed door).
  const descLines = (l) => {
    const raw = String(l.description || bedrijf.defaultDesc || 'Vervoersdienst')
      .split('\n').map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
    if (!raw.length) raw.push(bedrijf.defaultDesc || 'Vervoersdienst');
    const out = [];
    const wrap = (text, st) => { font(st.style, st.size, st.color); return doc.splitTextToSize(text, COL.descW).map(t => ({ t, ...st })); };
    // Eerste regel vet als kopje — maar een lange alinea niet als één zwaar vet blok
    const head = wrap(raw[0], HEAD);
    out.push(...(head.length <= 2 ? head : wrap(raw[0], BODY)));
    raw.slice(1).forEach(r => out.push(...wrap(r, DETAIL)));
    return out;
  };

  const usableFresh = LIMIT - 22;          // ruimte op een nieuwe pagina onder de tabelkop
  for (const l of lines) {
    const dl   = descLines(l);
    const adv  = dl.map((ln, i) => i === 0 ? 0 : ln.lh + (ln.size !== dl[i - 1].size ? 0.8 : 0));
    const rowH = PAD_T + adv.reduce((s, a) => s + a, 0) + PAD_B;
    const room = LIMIT - rowEndY;
    // Past de hele rij niet meer? Naar een nieuwe pagina — tenzij de rij zelf langer
    // is dan een pagina, dan loopt hij netjes door op de volgende pagina.
    if (rowH > room && (rowH <= usableFresh || room < 25)) _newPage();

    let y = rowEndY + PAD_T;
    // Bedragen op de eerste regel (kolommen rechts)
    font('normal', 9, MED);
    doc.text(`${l.vatRate ?? 0}%`, COL.vat, y, { align: 'right' });
    doc.text(fmtMoneyPDF(l.amountExcl ?? 0), COL.excl, y, { align: 'right' });
    font('bold', 9, DARK);
    doc.text(fmtMoneyPDF(l.amountIncl ?? 0), COL.incl, y, { align: 'right' });

    dl.forEach((ln, i) => {
      if (i > 0) {
        if (y + adv[i] + PAD_B > LIMIT) { _newPage(); y = rowEndY + PAD_T; }
        else y += adv[i];
      }
      font(ln.style, ln.size, ln.color);
      doc.text(ln.t, COL.desc, y);
    });

    rowEndY = y + PAD_B;
    doc.setDrawColor(220, 215, 208); doc.setLineWidth(0.25);
    doc.line(L, rowEndY, R, rowEndY);
  }

  // ── Totalen + betaalvak — samen naar een nieuwe pagina als ze niet meer passen ──
  const qrPayload = (() => { try { return invoiceEpcPayload(inv, bedrijf); } catch (_) { return null; } })();
  const vatRows   = vatBreakdown(lines);
  const multiVat  = vatRows.length > 1;
  const totRows   = [
    ['Subtotaal excl. BTW', fmtMoneyPDF(inv.totalExcl || 0)],
    ...vatRows.map(([rate, excl, vat]) => [multiVat ? `BTW ${rate}% over ${fmtMoneyPDF(excl)}` : `BTW ${rate}%`, fmtMoneyPDF(vat)]),
  ];
  const pBoxH    = qrPayload ? 36 : (bedrijf.bic ? 30 : 24);
  const TOTALS_H = 9 + totRows.length * 5.5 + 6 + 12 + pBoxH + 2;
  if (rowEndY + TOTALS_H > PAGE_H - FOOT_H - 2) _newPage(false);   // alleen totalen → geen lege tabelkop

  let tTY = rowEndY + 9;
  const totX = R - 75;
  font('normal', 9, MED);
  totRows.forEach(([lbl, val]) => {
    doc.text(lbl, totX, tTY); doc.text(val, R, tTY, { align: 'right' }); tTY += 5.5;
  });
  doc.setDrawColor(...TAUPE); doc.setLineWidth(0.8); doc.line(totX, tTY + 1, R, tTY + 1);
  tTY += 6;
  font('bold', 13, DARK);
  doc.text('Te betalen', totX, tTY);
  font('bold', 14, TAUPE);
  doc.text(fmtMoneyPDF(inv.totalIncl || 0), R, tTY, { align: 'right' });

  // Links naast de totalen: lessen-samenvatting + btw-vrijstellingstekst
  let noteY = rowEndY + 9;
  const summary = lessonSummary(inv);
  if (summary) {
    font('bold', 9, DARK);
    doc.text(summary, L + 2, noteY);
    noteY += 5.5;
  }
  if (inv.vatNote) {
    font('italic', 8, MED);
    doc.text(doc.splitTextToSize(inv.vatNote, totX - L - 10), L + 2, noteY, { lineHeightFactor: 1.35 });
  }

  // ── Betaalinstructies ──
  const pY = tTY + 12;
  doc.setFillColor(...BG);
  doc.roundedRect(L, pY, W, pBoxH, 2, 2, 'F');
  doc.setFillColor(...TAUPE);
  doc.rect(L, pY, 3, pBoxH, 'F');
  font('normal', 9, MED);
  doc.text(`Gelieve ${fmtMoneyPDF(inv.totalIncl || 0)} vóór ${fmtDateLong(inv.dueDate)} over te maken naar:`, L + 7, pY + 7);
  font('bold', 11, DARK);
  doc.text(fmtIBAN(bedrijf.iban), L + 7, pY + 14);
  font('normal', 9, MED);
  doc.text(`t.n.v. ${bedrijf.naam}   o.v.v. ${inv.number || ''}`, L + 7, pY + 20);
  if (bedrijf.bic) {
    doc.setTextColor(...DIM);
    doc.text(`BIC: ${bedrijf.bic}`, L + 7, pY + 26);
  }
  // Betaal-QR (EPC/SEPA) rechts in het betaalvak — vector, dus scherp bij printen
  if (qrPayload) {
    try {
      const { n, isDark } = qrModules(qrPayload);
      const qs = 30, qx = R - 4 - qs, qy = pY + 3;
      const mod = qs / (n + 8), pad = mod * 4; // stille zone van 4 modules
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(qx, qy, qs, qs, 1.2, 1.2, 'F');
      doc.setFillColor(0, 0, 0);
      for (let r = 0; r < n; r++)
        for (let c = 0; c < n; c++)
          if (isDark(r, c)) doc.rect(qx + pad + c * mod, qy + pad + r * mod, mod + 0.01, mod + 0.01, 'F');
      font('normal', 8, DIM);
      doc.text('Of scan de QR-code met uw bank-app om direct te betalen.', L + 7, pY + 32);
    } catch (_) {}
  }

  // ── Footer op elke pagina (met "Pagina x van y" bij meerdere pagina's) ──
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setDrawColor(220, 215, 208); doc.setLineWidth(0.3);
    doc.line(L, PAGE_H - FOOT_H + 2, R, PAGE_H - FOOT_H + 2);
    font('normal', 8, DIM);
    doc.text(`${bedrijf.naam}  ·  KvK ${bedrijf.kvk}  ·  BTW ${bedrijf.btw}`, L, PAGE_H - 8);
    doc.text(`${inv.number || ''}   ·   Pagina ${p}${pages > 1 ? ` van ${pages}` : ''}`, R, PAGE_H - 8, { align: 'right' });
  }

  return doc.output('blob');
}

async function sharePDF(inv, bedrijf) {
  if (!bedrijf) bedrijf = ADMINS[inv.adminId || 'taxi'] || ADMINS.taxi;
  try {
    const blob     = await generateInvoicePDF(inv, bedrijf);
    const filename = `${inv.number || 'factuur'}.pdf`;
    const file     = new File([blob], filename, { type: 'application/pdf' });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title: `Factuur ${inv.number}`, files: [file] });
    } else {
      const url = URL.createObjectURL(blob);
      Object.assign(document.createElement('a'), { href: url, download: filename }).click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      ok('PDF opgeslagen ✓');
    }
  } catch (e) {
    if (e.name !== 'AbortError') err('PDF: ' + (e.message || 'Onbekende fout'));
  }
}

async function sendViaGmail(inv, bedrijf, opts = {}) {
  if (!bedrijf) bedrijf = ADMINS[inv.adminId || 'taxi'] || ADMINS.taxi;
  const { to, cc, selfCopy, subject, message } = opts;
  const recipient = to || inv.client?.email;

  if (!gmailConfigured()) {
    // Geen Gmail → PDF downloaden als fallback
    try {
      const blob = await generateInvoicePDF(inv, bedrijf);
      const filename = `${inv.number || 'factuur'}.pdf`;
      const file = new File([blob], filename, { type: 'application/pdf' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: `Factuur ${inv.number}`, files: [file] });
      } else {
        const url = URL.createObjectURL(blob);
        Object.assign(document.createElement('a'), { href: url, download: filename }).click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        ok('PDF opgeslagen — stel Gmail in via Instellingen → Data voor volledig versturen');
      }
    } catch (e) {
      if (e.name !== 'AbortError') err('PDF: ' + (e.message || 'Onbekende fout'));
      return false;
    }
    return true;
  }

  if (!recipient) {
    err('Geen e-mailadres — vul in bij de klant of in het verzendscherm');
    return false;
  }

  // Laad gmail.js module (is al in cache na openSendModal, dus vrijwel instant)
  const { sendInvoiceEmail, getGmailToken } = await import('../gmail.js');

  // Haal token op VÓÓR PDF-generatie — zo dicht mogelijk bij de gebruikersklik
  // zodat iOS de OAuth-popup niet blokkeert
  try {
    await getGmailToken();
  } catch (e) {
    if (e.name !== 'AbortError') err('Gmail: ' + (e.message || 'Inloggen mislukt'));
    return false;
  }

  // Nu pas de PDF genereren (token is gecached, geen popup meer nodig)
  let blob;
  try {
    blob = await generateInvoicePDF(inv, bedrijf);
  } catch (e) {
    if (e.name !== 'AbortError') err('PDF: ' + (e.message || 'Onbekende fout'));
    return false;
  }

  let mainSent = false;
  try {
    await sendInvoiceEmail(inv, bedrijf, blob, {
      to: recipient,
      cc: cc || undefined,
      subject: subject || undefined,
      message: message || undefined,
    });
    mainSent = true;
    ok(`Factuur ${inv.number} verstuurd naar ${recipient} ✓`);
    // Markeer factuur als verstuurd
    try { await put('invoices', { ...cleanInv(inv), sentAt: Date.now() }); } catch (_) {}
  } catch (e) {
    if (e.name !== 'AbortError') err('Gmail: ' + (e.message || 'Inloggen mislukt of netwerk-fout'));
    return false;
  }

  if (selfCopy && mainSent) {
    try {
      await sendInvoiceEmail(inv, bedrijf, blob, {
        to: OWNER_EMAIL,
        subject: `[Kopie] ${subject || `Factuur ${inv.number} — ${bedrijf.naam}`}`,
        message: message || undefined,
      });
      ok(`Kopie verstuurd naar ${OWNER_EMAIL} ✓`);
    } catch (e) {
      if (e.name !== 'AbortError') err('Kopie niet verstuurd: ' + (e.message || 'Gmail fout'));
    }
  }
  return true;
}

function openInvoiceViewer(inv, bedrijf) {
  if (!bedrijf) bedrijf = ADMINS[inv.adminId || 'taxi'] || ADMINS.taxi;
  const html = generateInvoiceHTML(inv, bedrijf);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);

  const overlay = document.createElement('div');
  overlay.className = 'bk-invoice-overlay';
  overlay.innerHTML = `
    <div class="bk-ov-bar">
      <button id="ov-close" class="bk-ov-close">← Terug</button>
      <span class="bk-ov-title">${escapeHTML(inv.number || 'Factuur')}</span>
      <a id="ov-dl" href="${url}" download="${escapeHTML(inv.number || 'factuur')}.html" class="bk-ov-dl">⬇ Opslaan</a>
    </div>
    <iframe src="${url}" class="bk-inv-frame" sandbox="allow-same-origin allow-scripts allow-popups"></iframe>
  `;
  document.body.appendChild(overlay);
  const cleanup = () => { overlay.remove(); URL.revokeObjectURL(url); };
  overlay.querySelector('#ov-close').onclick = cleanup;
}

function openSendModal(inv, bedrijf, container) {
  if (!bedrijf) bedrijf = ADMINS[inv.adminId || 'taxi'] || ADMINS.taxi;
  // Laad GSI alvast zodat requestAccessToken() snel beschikbaar is bij "Versturen"
  if (gmailConfigured()) import('../gmail.js').then(m => m.preloadGSI()).catch(() => {});
  const clientName  = inv.client?.name  || '';
  const clientEmail = inv.client?.email || '';
  const clientPhone = inv.client?.phone || '';
  const ibanFmt     = fmtIBAN(bedrijf.iban);

  const SUBJECTS = {
    normaal:     `Factuur ${inv.number} — ${bedrijf.naam}`,
    herinnering: `Herinnering: Factuur ${inv.number} — ${bedrijf.naam}`,
    aanmaning:   `Aanmaning: Factuur ${inv.number} — ${bedrijf.naam}`,
  };

  const MESSAGES = {
    normaal:     `Geachte ${clientName || 'relatie'},\n\nHierbij ontvangt u factuur ${inv.number}${inv.kind === 'lessen' && inv.period ? ` voor de werkzaamheden in ${inv.period.toLowerCase()}` : ''} van ${fmtMoney(inv.totalIncl || 0, true)}. Wij verzoeken u het bedrag vóór ${fmtDateLong(inv.dueDate)} over te maken. De betaalgegevens staan hieronder en in de bijgevoegde PDF.\n\nMet vriendelijke groet,\n${bedrijf.naam}`,
    herinnering: `Geachte ${clientName || 'relatie'},\n\nWij willen u vriendelijk herinneren dat factuur ${inv.number} van ${fmtMoney(inv.totalIncl || 0, true)} op ${fmtDateLong(inv.dueDate)} betaald diende te zijn.\n\nHebt u al betaald? Dan kunt u deze herinnering als niet verzonden beschouwen.\n\nMet vriendelijke groet,\n${bedrijf.naam}`,
    aanmaning:   `Geachte ${clientName || 'relatie'},\n\nOndanks onze eerdere herinnering staat factuur ${inv.number} van ${fmtMoney(inv.totalIncl || 0, true)} nog steeds open. Wij verzoeken u dringend het verschuldigde bedrag binnen 7 dagen te voldoen.\n\nMet vriendelijke groet,\n${bedrijf.naam}`,
  };

  const waText = encodeURIComponent(
    `Hallo${clientName ? ' ' + clientName : ''}, hierbij de factuurgegevens van ${bedrijf.naam}:\n\nFactuur: ${inv.number}\nBedrag: ${fmtMoney(inv.totalIncl || 0, true)}\nVervaldatum: ${fmtDateLong(inv.dueDate)}\n\nBetalen via:\nIBAN: ${ibanFmt}${bedrijf.bic ? '\nBIC: ' + bedrijf.bic : ''}\nt.n.v. ${bedrijf.naam}\no.v.v. ${inv.number}\n\nBedankt!`
  );

  const configured = gmailConfigured();
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal bk-modal bk-send-modal">
      <button type="button" class="modal-close" id="snd-x">×</button>
      <div class="bk-send-hd">
        <div class="bk-send-hd-title">Versturen</div>
        <div class="bk-send-hd-meta">${escapeHTML(inv.number)} · ${escapeHTML(clientName || '—')} · <span class="money">${fmtMoney(inv.totalIncl || 0)}</span></div>
      </div>

      <div class="bk-sf-row">
        <label class="bk-sf-label">Aan</label>
        <input id="snd-to" type="email" class="bk-sf-input" value="${escapeHTML(clientEmail)}" placeholder="e-mailadres klant" />
      </div>

      <label class="bk-sf-toggle-row">
        <span>Stuur een kopie naar mijzelf</span>
        <span class="bk-ios-tog">
          <input type="checkbox" id="snd-self" ${configured ? 'checked' : ''} />
          <span class="bk-tog-track"></span>
        </span>
      </label>

      <div class="bk-sf-row">
        <label class="bk-sf-label">CC <span style="opacity:.5">(optioneel)</span></label>
        <input id="snd-cc" type="email" class="bk-sf-input" placeholder="CC-adres" />
      </div>

      <div class="bk-sf-row">
        <label class="bk-sf-label">Verstuur als</label>
        <select id="snd-type" class="bk-sf-input">
          <option value="normaal">Normaal</option>
          <option value="herinnering">Herinnering</option>
          <option value="aanmaning">Aanmaning</option>
        </select>
      </div>

      <div class="bk-sf-row">
        <label class="bk-sf-label">Onderwerp</label>
        <input id="snd-subject" type="text" class="bk-sf-input" value="${escapeHTML(SUBJECTS.normaal)}" />
      </div>

      <div class="bk-sf-row">
        <label class="bk-sf-label">Bericht</label>
        <textarea id="snd-message" class="bk-sf-input bk-sf-textarea" rows="4">${escapeHTML(MESSAGES.normaal)}</textarea>
      </div>

      <div class="bk-sf-attach">
        <span>${icon('paperclip')}</span>
        <span>${escapeHTML(inv.number || 'factuur')}.pdf</span>
      </div>

      <button id="snd-send" class="btn block bk-send-btn-primary">
        Versturen
      </button>
      ${!configured ? `<p style="font-size:.78rem;color:var(--text-dim);text-align:center;margin:8px 0 0">Gmail instellen via Instellingen → Data voor volledig versturen</p>` : ''}

      <div class="bk-sf-sec">
        <button id="snd-pdf" class="bk-sf-sec-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3.5h7L18 8v12.5H6V4.5"/><path d="M13 3.5V8h4.5"/><path d="M12 11.5v6"/><path d="M9.4 15l2.6 2.6 2.6-2.6"/></svg>PDF opslaan</button>
        <button id="snd-wa"  class="bk-sf-sec-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l1.4-4A7.5 7.5 0 1 1 8 18.6z"/></svg>WhatsApp</button>
        <button id="snd-view" class="bk-sf-sec-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.7"/></svg>Bekijken</button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  backdrop.querySelector('#snd-x').onclick = () => backdrop.remove();
  backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.remove(); });

  // Wissel onderwerp/bericht bij type-keuze
  backdrop.querySelector('#snd-type').addEventListener('change', e => {
    const t = e.target.value;
    backdrop.querySelector('#snd-subject').value = SUBJECTS[t] || SUBJECTS.normaal;
    backdrop.querySelector('#snd-message').value = MESSAGES[t] || MESSAGES.normaal;
  });

  // Versturen
  backdrop.querySelector('#snd-send').onclick = async () => {
    const to       = backdrop.querySelector('#snd-to').value.trim();
    const cc       = backdrop.querySelector('#snd-cc').value.trim();
    const selfCopy = backdrop.querySelector('#snd-self').checked;
    const subject  = backdrop.querySelector('#snd-subject').value.trim();
    const message  = backdrop.querySelector('#snd-message').value.trim();
    if (!to) { backdrop.querySelector('#snd-to').focus(); err('Vul een e-mailadres in'); return; }
    if (!to.includes('@')) { backdrop.querySelector('#snd-to').focus(); err('Vul een geldig e-mailadres in'); return; }
    const btn = backdrop.querySelector('#snd-send');
    btn.disabled = true;
    btn.textContent = '⏳ Versturen…';
    const success = await sendViaGmail(inv, bedrijf, { to, cc: cc || undefined, selfCopy, subject, message });
    if (success !== false) {
      backdrop.remove();
    } else {
      btn.disabled = false;
      btn.textContent = 'Versturen';
    }
  };

  // PDF opslaan / delen
  backdrop.querySelector('#snd-pdf').onclick  = async () => { backdrop.remove(); await sharePDF(inv, bedrijf); };

  // Bekijken
  backdrop.querySelector('#snd-view').onclick = () => { backdrop.remove(); openInvoiceViewer(inv, bedrijf); };

  // WhatsApp
  backdrop.querySelector('#snd-wa').onclick = () => {
    let phone = clientPhone.replace(/\s/g, '');
    if (phone && !phone.startsWith('+')) phone = phone.replace(/^00/, '+').replace(/^0/, '+31');
    phone = phone.replace(/[^+\d]/g, '');
    const url = phone ? `https://wa.me/${phone.replace('+', '')}?text=${waText}` : `https://wa.me/?text=${waText}`;
    window.open(url, '_blank');
  };
}
