import { all, put, del, add } from '../db.js';
import { icon } from '../icons.js';
import { uid, fmtMoney, parseAmount, escapeHTML, ymd } from '../utils.js';
import { ok, err } from '../components/toast.js';
import { parseInvoiceText } from '../invoice-nlp.js';

function gmailConfigured() { return !!localStorage.getItem('gmailClientId'); }
function fmtMoneyPDF(n) {
  const v = isFinite(n) ? +n : 0;
  return '€ ' + v.toFixed(2).replace('.', ',');
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
  },
  olijfolie: {
    id:          'olijfolie',
    icon:        'leaf',
    label:       'Olijfolie',
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
  },
};

function getAdmin(container) {
  return ADMINS[container.dataset.bkAdmin || 'taxi'] || ADMINS.taxi;
}

const OWNER_EMAIL = 'sofyanghaddari@gmail.com';

// ─── FISCALE CONSTANTEN 2025 ─────────────────────────────────────────────────
const KM_VERGOEDING = 0.23;   // €0,23 per zakelijke km (2025)
const ZELFST_AFTREK = 2470;   // zelfstandigenaftrek 2025
const MKB_PCT       = 0.127;  // MKB-winstvrijstelling 12,7%
const BOX1_GRENS    = 75518;  // 2e belastingschijf grens 2025
const BOX1_LAAG     = 0.3582; // 35,82% box 1 schijf 1
const BOX1_HOOG     = 0.495;  // 49,50% box 1 schijf 2

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
    case 'btw':       renderBTW(view, withStatus, purchases, container); break;
    case 'wv':        renderWV(view, withStatus, purchases, kmLogs, container); break;
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
    <div class="bk-kpi-grid">
      <div class="bk-kpi">
        <div class="bk-kpi-label">Omzet ${y}</div>
        <div class="bk-kpi-val money blurred-amount" data-bk-count="${omzetYear}">${fmtMoney(omzetYear, true)}</div>
        <div class="bk-kpi-sub">excl. BTW</div>
      </div>
      <div class="bk-kpi">
        <div class="bk-kpi-label">Kosten ${y}</div>
        <div class="bk-kpi-val money blurred-amount" style="color:var(--danger)" data-bk-count="${kostenYear}">${fmtMoney(kostenYear, true)}</div>
        <div class="bk-kpi-sub">excl. BTW</div>
      </div>
      <div class="bk-kpi">
        <div class="bk-kpi-label">Winst ${y}</div>
        <div class="bk-kpi-val money blurred-amount" style="color:${winstYear >= 0 ? 'var(--ok)' : 'var(--danger)'}" data-bk-count="${winstYear}">${fmtMoney(winstYear, true)}</div>
        <div class="bk-kpi-sub">excl. aftrekken</div>
      </div>
      <div class="bk-kpi">
        <div class="bk-kpi-label">BTW Q${q + 1}</div>
        <div class="bk-kpi-val money blurred-amount" style="color:var(--accent)" data-bk-count="${btwSaldo}">${fmtMoney(btwSaldo, true)}</div>
        <div class="bk-kpi-sub">te betalen</div>
      </div>
    </div>

    ${overdueCount > 0 ? `
      <div class="bk-alert">
        ⚠️ <strong>${overdueCount} factuur${overdueCount > 1 ? 'en' : ''} vervallen</strong> — betaling achterstallig
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
        ${totalLate > 0 ? `<span style="color:var(--danger);margin-left:8px;font-size:.82rem">⚠️ ${totalLate} vervallen</span>` : ''}
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
            ${inv._status === 'te-laat' ? `<div class="bk-overdue-bar">⚠️ Vervallen op ${fmtDateLong(inv.dueDate)}</div>` : ''}
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
      Omschrijving: i.lines?.[0]?.description || '',
      'Excl BTW': (i.totalExcl || 0).toFixed(2).replace('.', ','),
      'BTW%': i.lines?.[0]?.vatRate || 0,
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

function renderBTW(view, invoices, purchases, container) {
  const now    = new Date();
  const curQ   = Math.floor(now.getMonth() / 3);
  const curY   = now.getFullYear();
  const selQ   = (container.dataset.btwQ !== '' && container.dataset.btwQ != null) ? parseInt(container.dataset.btwQ, 10) : curQ;
  const selY   = container.dataset.btwY ? parseInt(container.dataset.btwY) : curY;

  // BTW over verkoopfacturen — som per BTW-tarief over alle regels (niet alleen lines[0])
  const qInvoices = invoices.filter(i => inQuarter(i.date, selQ, selY));
  let omzet9 = 0, btw9 = 0, omzet21 = 0, btw21 = 0, omzet0 = 0;
  const inv9Set = new Set(), inv21Set = new Set(), inv0Set = new Set();
  for (const inv of qInvoices) {
    for (const line of (inv.lines || [])) {
      const rate = line.vatRate ?? 0;
      const excl = line.amountExcl ?? 0;
      const vat  = line.vatAmount  ?? 0;
      if (rate === 9)       { omzet9  += excl; btw9  += vat; inv9Set.add(inv.id); }
      else if (rate === 21) { omzet21 += excl; btw21 += vat; inv21Set.add(inv.id); }
      else                  { omzet0  += excl;               inv0Set.add(inv.id); }
    }
  }
  const totOmzet = omzet9 + omzet21 + omzet0;
  const totBtwAf = btw9 + btw21;

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

    ${isPast ? `
      <div class="bk-btw-deadline ${isLate ? 'bk-deadline-late' : ''}">
        ${isLate ? icon('warning') + ' Aangifte deadline verstreken' : `${icon('calendar')} Aangifte deadline: ${fmtDateLong(deadline)}`}
      </div>
    ` : ''}

    <div class="bk-btw-table">
      <div class="bk-btw-section-head">Leveringen/diensten</div>

      <div class="bk-btw-row">
        <span class="bk-btw-rubriek">1a</span>
        <span>Belast met 9% — ${inv9Set.size} facturen</span>
        <span class="money">${fmtMoney(omzet9)}</span>
        <span class="bk-btw-vat">${fmtMoney(btw9)}</span>
      </div>
      <div class="bk-btw-row">
        <span class="bk-btw-rubriek">1b</span>
        <span>Belast met 21% — ${inv21Set.size} facturen</span>
        <span class="money">${fmtMoney(omzet21)}</span>
        <span class="bk-btw-vat">${fmtMoney(btw21)}</span>
      </div>
      ${omzet0 > 0 ? `
        <div class="bk-btw-row">
          <span class="bk-btw-rubriek">1c</span>
          <span>Belast met 0%</span>
          <span class="money">${fmtMoney(omzet0)}</span>
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
        <span>BTW op inkopen — ${purQ.length} bonnen</span>
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
    const text = `BTW-aangifte ${quarterLabel(selQ, selY)}\n\nRubriek 1a (9%): €${omzet9.toFixed(2)} | BTW: €${btw9.toFixed(2)}\nRubriek 1b (21%): €${omzet21.toFixed(2)} | BTW: €${btw21.toFixed(2)}\nRubriek 5b (voorbelasting): -€${voorBel.toFixed(2)}\n\n${saldo > 0 ? 'TE BETALEN' : 'TERUG TE ONTVANGEN'}: €${Math.abs(saldo).toFixed(2)}`;
    navigator.clipboard.writeText(text).then(() => ok('Samenvatting gekopieerd')).catch(() => err('Kopiëren mislukt'));
  };
}

// ─── WINST & VERLIES ─────────────────────────────────────────────────────────

function renderWV(view, invoices, purchases, kmLogs, container) {
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
  const zelfstAftrek = brutoWinst > 0 ? Math.min(ZELFST_AFTREK, brutoWinst) : 0;
  const naZelfst    = Math.max(0, brutoWinst - zelfstAftrek);
  const mkbAftrek   = naZelfst * MKB_PCT;
  const belastbaar  = Math.max(0, naZelfst - mkbAftrek);

  // Belasting schatting (box 1)
  const belasting = belastbaar <= BOX1_GRENS
    ? belastbaar * BOX1_LAAG
    : BOX1_GRENS * BOX1_LAAG + (belastbaar - BOX1_GRENS) * BOX1_HOOG;

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
      <div class="bk-wv-section">FISCALE AFTREKKEN (schatting ${year})</div>
      <div class="bk-wv-row">
        <span>Zelfstandigenaftrek</span>
        <span class="money" style="color:var(--ok)">- ${fmtMoney(zelfstAftrek)}</span>
      </div>
      <div class="bk-wv-row">
        <span>MKB-winstvrijstelling (12,7%)</span>
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
      ⚠️ Dit is een ruwe schatting. Heffingskortingen, startersaftrek en andere persoonlijke omstandigheden zijn niet meegenomen. Laat je aangifte controleren door een boekhouder.
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
    if (delStep === 0) { delStep = 1; this.textContent = '⚠️ Nogmaals tikken om te verwijderen'; return; }
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
      email:   backdrop.querySelector('#ec-email').value.trim(),
      phone:   backdrop.querySelector('#ec-phone').value.trim(),
    });
    ok(`${name} bijgewerkt ✓`);
    backdrop.remove();
    render(container);
  };
}

function openNewClientModal(container) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal bk-modal">
      <button type="button" class="modal-close" id="nc-x">×</button>
      <h2 style="margin:0 0 16px">Nieuwe klant</h2>
      <form id="nc-form" autocomplete="off">
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

  backdrop.querySelector('#nc-form').onsubmit = async e => {
    e.preventDefault();
    const name = backdrop.querySelector('#nc-name').value.trim();
    if (!name) { err('Vul een naam in'); return; }
    await add('clients', {
      id:      uid(),
      name,
      address: backdrop.querySelector('#nc-addr').value.trim(),
      city:    backdrop.querySelector('#nc-city').value.trim(),
      kvk:     backdrop.querySelector('#nc-kvk').value.trim(),
      email:   backdrop.querySelector('#nc-email').value.trim(),
      phone:   backdrop.querySelector('#nc-phone').value.trim(),
      lastUsed: Date.now(),
    });
    ok(`${name} opgeslagen ✓`);
    backdrop.remove();
    render(container);
  };
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
  return new Date().toISOString().slice(0,10);
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

async function openRitImportModal(container) {
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

  backdrop.querySelector('#ri-parse-btn').onclick = () => {
    const text = backdrop.querySelector('#ri-text').value;
    parsedRides = parseRidesText(text);
    if (!parsedRides.length) { err('Geen ritten herkend — controleer het formaat en probeer opnieuw.'); return; }
    _renderRideTable(parsedRides, backdrop, bedrijf.defaultVat ?? 9);
    backdrop.querySelector('#ri-step1').style.display = 'none';
    backdrop.querySelector('#ri-step2').style.display = '';
  };

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

  const isMultiLine = isEdit && (existingInv.lines?.length || 0) > 1;
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
      <button type="button" id="bk-pick-client" class="btn secondary bk-pick-client-btn">
        ${icon('users')} Kies opgeslagen klant
      </button>

      <div class="bk-paste-section">
        <label class="bk-paste-label">${icon('clipboard')} Of plak WhatsApp- / e-mailtekst — velden worden automatisch ingevuld</label>
        <textarea id="bk-paste" class="bk-paste-area" rows="3"
          placeholder="Supreme Transit Solutions&#10;Baden Powellweg, Amsterdam 1069 LK&#10;KvK: 85234362&#10;€320 incl 9% btw"></textarea>
        <div id="bk-parsed-preview" class="bk-parsed-preview" style="display:none"></div>
      </div>

      <div class="bk-divider">— of handmatig —</div>
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
          <label>E-mailadres</label>
          <input id="bk-client-email" type="email" placeholder="info@bedrijf.nl" value="${escapeHTML(inv0.client?.email || '')}" />
          <label>Telefoon / WhatsApp</label>
          <input id="bk-client-phone" type="tel" inputmode="tel" placeholder="+31 6 12345678" value="${escapeHTML(inv0.client?.phone || '')}" />
        </div>

        ${!isMultiLine ? `
        <div class="bk-form-section">
          <div class="bk-section-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 7.5H10a2.5 2.5 0 0 0 0 5h2.5a2.5 2.5 0 0 1 0 5H8"/><path d="M12 5.5v13"/></svg>Bedrag &amp; BTW</div>
          <label>Omschrijving *</label>
          <input id="bk-desc" type="text" placeholder="${escapeHTML(bedrijf.defaultDesc)}" value="${escapeHTML(invDesc)}" ${isMultiLine ? '' : 'required'} />
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
            <option value="0"  ${invVatRate === 0  ? 'selected' : ''}>0% — vrijgesteld</option>
          </select>
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

    // Smart paste
    const pasteArea = backdrop.querySelector('#bk-paste');
    let parseTimer = null;
    pasteArea.addEventListener('input', () => {
      clearTimeout(parseTimer);
      parseTimer = setTimeout(() => {
        const parsed = parseInvoiceText(pasteArea.value);
        applyParsed(parsed, backdrop);
        refreshCalc(backdrop);
      }, 300);
    });
  }

  const refreshCalcFn = () => refreshCalc(backdrop);
  if (backdrop.querySelector('#bk-amount')) {
    backdrop.querySelector('#bk-amount').addEventListener('input', refreshCalcFn);
    backdrop.querySelector('#bk-vat').addEventListener('input', refreshCalcFn);
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
    const raw        = parseAmount(backdrop.querySelector('#bk-amount').value);
    if (!clientName) { err('Vul een klantnaam in'); return; }
    if (!raw || isNaN(raw) || raw <= 0) { err('Vul een geldig bedrag in'); return; }

    const client = {
      name:    clientName,
      address: backdrop.querySelector('#bk-client-addr').value.trim(),
      city:    backdrop.querySelector('#bk-client-city').value.trim(),
      kvk:     backdrop.querySelector('#bk-client-kvk').value.trim(),
      email:   backdrop.querySelector('#bk-client-email').value.trim(),
      phone:   backdrop.querySelector('#bk-client-phone').value.trim(),
    };

    let lines, totalExcl, totalVat, totalIncl;
    if (isMultiLine) {
      // Preserve all original lines and totals; only update metadata
      lines = existingInv.lines;
      totalExcl = existingInv.totalExcl; totalVat = existingInv.totalVat; totalIncl = existingInv.totalIncl;
    } else {
      const vatRate = parseInt(backdrop.querySelector('#bk-vat').value);
      const isIncl  = backdrop.querySelector('input[name="bk-ie"]:checked')?.value === 'incl';
      const vat     = calcVat(raw, vatRate, isIncl);
      lines     = [{ description: backdrop.querySelector('#bk-desc').value.trim() || bedrijf.defaultDesc, amountExcl: vat.amountExcl, vatRate, vatAmount: vat.vatAmount, amountIncl: vat.amountIncl }];
      totalExcl = vat.amountExcl; totalVat = vat.vatAmount; totalIncl = vat.amountIncl;
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
          email:   inv.client.email   || existing.email,
          phone:   inv.client.phone   || existing.phone,
          lastUsed: Date.now(),
        });
        ok(`Factuur ${inv.number} aangemaakt ✓`);
      } else if (name) {
        await add('clients', { id: uid(), name, address: inv.client.address, city: inv.client.city, kvk: inv.client.kvk, email, phone: inv.client.phone, lastUsed: Date.now() });
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

function applyParsed(parsed, backdrop) {
  if (!parsed) return;
  const set = (id, val) => { if (val != null) backdrop.querySelector(id).value = val; };
  set('#bk-client-name',  parsed.clientName);
  set('#bk-client-addr',  parsed.clientAddress);
  set('#bk-client-city',  parsed.clientCity);
  set('#bk-client-kvk',   parsed.clientKvk);
  set('#bk-client-email', parsed.clientEmail);
  if (parsed.amount != null) set('#bk-amount', parsed.amount);
  if (parsed.vatRate != null) backdrop.querySelector('#bk-vat').value = String(parsed.vatRate);
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
          <div class="bk-detail-row" style="align-items:flex-start">
            <span style="flex:1;padding-right:8px">${escapeHTML(l.description || 'Vervoersdienst')}</span>
            <span style="white-space:nowrap">${fmtMoney(l.amountIncl ?? l.amountExcl ?? 0)}</span>
          </div>
        `).join('')}
        <div style="border-top:1px solid var(--border-faint);margin:6px 0"></div>
        <div class="bk-detail-row"><span>Excl. BTW</span><span>${fmtMoney(inv.totalExcl || 0)}</span></div>
        <div class="bk-detail-row"><span>BTW</span><span>${fmtMoney(inv.totalVat || 0)}</span></div>
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
      const text = `${isLate ? 'Herinnering' : 'Betalingsverzoek'}: Factuur ${inv.number}\n\nGeachte ${clientName},\n\n${isLate ? 'Wij constateren dat onderstaande factuur nog niet is voldaan.' : 'Wij verzoeken u vriendelijk het onderstaande bedrag te voldoen.'}\n\nFactuurnummer: ${inv.number}\nFactuurdatum: ${fmtDateLong(inv.date)}\nVervaldatum: ${fmtDateLong(inv.dueDate)}\nBedrag: ${fmtMoney(inv.totalIncl || 0)}\n\nOmschrijving: ${inv.lines?.[0]?.description || '—'}\n\nGelieve het bedrag over te maken naar:\nIBAN: ${fmtIBAN(_remAdmin.iban || '')}${_remAdmin.bic ? '\nBIC: ' + _remAdmin.bic : ''}\nt.n.v. ${_remAdmin.naam || ''}\no.v.v. ${inv.number}\n\nMet vriendelijke groet,\n${_remAdmin.naam || ''}`;
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
      this.textContent = '⚠️ Nogmaals tikken om definitief te verwijderen';
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
    if (delStep === 0) { delStep = 1; this.textContent = '⚠️ Nogmaals tikken om te verwijderen'; return; }
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
    if (delStep === 0) { delStep = 1; this.textContent = '⚠️ Nogmaals tikken om te verwijderen'; return; }
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
  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<title>Factuur ${escapeHTML(inv.number || '')}</title>
<style>
  @page { margin: 20mm 22mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, Arial, Helvetica, sans-serif; color: #1a1a1a; font-size: 14px; line-height: 1.5; background: #fff; }
  .wrap { max-width: 760px; margin: 0 auto; }
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
      <div class="brand">${escapeHTML(bedrijf.naam)}</div>
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
      ${client.email   ? escapeHTML(client.email) : ''}
    </div>
  </div>
  <table>
    <thead><tr>
      <th style="width:50%">Omschrijving</th>
      <th>BTW</th><th>Excl. BTW</th><th>Totaal incl.</th>
    </tr></thead>
    <tbody>
      ${lines.map(l => `<tr>
        <td>${escapeHTML(l.description || 'Vervoersdienst')}</td>
        <td>${l.vatRate ?? 0}%</td>
        <td>${fmtMoney(l.amountExcl ?? 0)}</td>
        <td>${fmtMoney(l.amountIncl ?? 0)}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  <div class="totals">
    <div class="t-row"><span>Subtotaal excl. BTW</span><span>${fmtMoney(inv.totalExcl || 0)}</span></div>
    <div class="t-row"><span>BTW</span><span>${fmtMoney(inv.totalVat || 0)}</span></div>
    <div class="t-grand"><span>Totaal</span><span>${fmtMoney(inv.totalIncl || 0)}</span></div>
  </div>
  <div class="pay-box">
    Gelieve het bedrag van <strong>${fmtMoney(inv.totalIncl || 0)}</strong> vóór <strong>${fmtDateLong(inv.dueDate)}</strong> over te maken naar:<br>
    <span class="pay-iban">${escapeHTML(ibanFmt)}</span> — t.n.v. ${escapeHTML(bedrijf.naam)}<br>
    ${bedrijf.bic ? `BIC: <strong>${escapeHTML(bedrijf.bic)}</strong><br>` : ''}
    o.v.v. factuurnummer <strong>${escapeHTML(inv.number || '')}</strong>
  </div>
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

async function generateInvoicePDF(inv, bedrijf) {
  const JsPDF = await loadJsPdf();
  const doc    = new JsPDF({ unit: 'mm', format: 'a4' });
  const _pdfFallback = { description: bedrijf?.defaultDesc || 'Vervoersdienst', vatRate: bedrijf?.defaultVat ?? 9, amountExcl: inv.totalExcl || 0, vatAmount: inv.totalVat || 0, amountIncl: inv.totalIncl || 0 };
  const lines  = inv.lines?.length ? inv.lines : [_pdfFallback];
  const client = inv.client  || {};
  const L = 20, R = 190, W = 170;
  const TAUPE = [138, 126, 111];
  const DARK  = [26, 26, 26];
  const MED   = [85, 85, 85];
  const DIM   = [153, 153, 153];
  const BG    = [248, 247, 245];

  // ── Accent balk bovenin ──
  doc.setFillColor(...TAUPE);
  doc.rect(0, 0, 210, 6, 'F');

  // ── Bedrijfsnaam ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...DARK);
  doc.text(bedrijf.naam, L, 18);

  // ── Bedrijfsgegevens ──
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...MED);
  doc.text([bedrijf.adres, bedrijf.postcode, `KvK: ${bedrijf.kvk}   BTW: ${bedrijf.btw}`, `IBAN: ${fmtIBAN(bedrijf.iban)}`].join('\n'), L, 25, { lineHeightFactor: 1.6 });

  // ── "FACTUUR" + meta rechts ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(...TAUPE);
  doc.text('FACTUUR', R, 18, { align: 'right' });

  let mY = 27;
  [['Nummer:', inv.number || '—'], ['Datum:', fmtDateLong(inv.date)], ['Vervaldatum:', fmtDateLong(inv.dueDate)]].forEach(([lbl, val]) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...DIM);
    doc.text(lbl, R - 55, mY);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK);
    doc.text(val, R, mY, { align: 'right' });
    mY += 5.5;
  });

  // ── Scheidingslijn ──
  const sep1 = 52;
  doc.setDrawColor(220, 215, 208); doc.setLineWidth(0.4); doc.line(L, sep1, R, sep1);

  // ── Klantbox (dynamische hoogte) ──
  const clientInfoLines = [client.address, client.city, client.kvk ? `KvK: ${client.kvk}` : null, client.email, client.phone].filter(Boolean);
  const boxH = 22 + clientInfoLines.length * 5;
  const boxY = sep1 + 5;
  doc.setFillColor(...BG);
  doc.roundedRect(L, boxY, W, boxH, 2, 2, 'F');
  doc.setFillColor(...TAUPE);
  doc.rect(L, boxY, 3, boxH, 'F');

  doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...DIM);
  doc.text('FACTUUR AAN', L + 7, boxY + 8);
  doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK);
  doc.text(client.name || '—', L + 7, boxY + 15);
  if (clientInfoLines.length) {
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...MED);
    doc.text(clientInfoLines.join('\n'), L + 7, boxY + 21, { lineHeightFactor: 1.55 });
  }

  // ── Tabelkop ──
  const tY = boxY + boxH + 10;
  doc.setFillColor(...TAUPE);
  doc.rect(L, tY, W, 7, 'F');
  doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
  doc.text('OMSCHRIJVING', L + 2, tY + 5);
  doc.text('BTW', R - 53, tY + 5, { align: 'right' });
  doc.text('EXCL. BTW', R - 27, tY + 5, { align: 'right' });
  doc.text('TOTAAL INCL.', R, tY + 5, { align: 'right' });

  // ── Tabelrijen — één per factuurregel, met automatische paginaovergang ──
  const PAGE_H     = 297;
  const FOOT_H     = 22;   // footer-hoogte (altijd gereserveerd onderaan)
  const DESC_W     = 108;  // breedte beschrijving-kolom (mm)
  let rowEndY      = tY + 7;
  let pageCount    = 1;
  doc.setDrawColor(220, 215, 208); doc.setLineWidth(0.25);
  doc.line(L, rowEndY, R, rowEndY);

  const _footer = () => {
    doc.setDrawColor(220, 215, 208); doc.setLineWidth(0.3);
    doc.line(L, PAGE_H - FOOT_H + 2, R, PAGE_H - FOOT_H + 2);
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...DIM);
    doc.text(`${bedrijf.naam}  ·  KvK ${bedrijf.kvk}  ·  BTW ${bedrijf.btw}`, L, PAGE_H - 8);
    doc.text(`${inv.number || ''}   ·   Pagina ${pageCount}`, R, PAGE_H - 8, { align: 'right' });
  };

  const _newPage = () => {
    _footer();
    doc.addPage();
    pageCount++;
    // Mini-header
    doc.setFillColor(...TAUPE); doc.rect(0, 0, 210, 4, 'F');
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK);
    doc.text(bedrijf.naam, L, 11);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...DIM);
    doc.text(`Factuur ${inv.number || ''}`, R, 11, { align: 'right' });
    // Tabelkop
    const hY = 15;
    doc.setFillColor(...TAUPE); doc.rect(L, hY, W, 7, 'F');
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
    doc.text('OMSCHRIJVING', L + 2, hY + 5);
    doc.text('BTW',          R - 53, hY + 5, { align: 'right' });
    doc.text('EXCL. BTW',   R - 27, hY + 5, { align: 'right' });
    doc.text('TOTAAL INCL.', R,     hY + 5, { align: 'right' });
    rowEndY = hY + 7;
    doc.setDrawColor(220, 215, 208); doc.setLineWidth(0.25);
    doc.line(L, rowEndY, R, rowEndY);
  };

  for (const l of lines) {
    const descText = l.description || bedrijf.defaultDesc || 'Vervoersdienst';
    // Splits in regels, filter leeg
    const rawLines = descText.split('\n').map(s => s.trim()).filter(Boolean);

    // Eerste regel = vette kop (passagier/referentie)
    const mainWrapped   = doc.splitTextToSize(rawLines[0] || descText, DESC_W);
    // Overige regels = details kleiner
    const detailText    = rawLines.slice(1).join('\n');
    const detailWrapped = detailText ? doc.splitTextToSize(detailText, DESC_W) : [];

    const mainH   = mainWrapped.length  * 5.5;
    const detailH = detailWrapped.length * 4.2;
    const rowH    = Math.max(14, mainH + (detailH > 0 ? detailH + 2 : 0) + 6);

    if (rowEndY + rowH > PAGE_H - FOOT_H - 5) _newPage();

    const rowTopY = rowEndY;
    const rowMidY = rowTopY + rowH / 2 + 1;

    // Beschrijving — vet hoofd
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK);
    doc.text(mainWrapped, L + 2, rowTopY + 5.5);
    // Detailregels dimmer + kleiner
    if (detailWrapped.length) {
      doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...MED);
      doc.text(detailWrapped, L + 2, rowTopY + 5.5 + mainH, { lineHeightFactor: 1.3 });
    }

    // Bedragen rechts, verticaal gecentreerd
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...MED);
    doc.text(`${l.vatRate ?? 0}%`, R - 53, rowMidY, { align: 'right' });
    doc.text(fmtMoneyPDF(l.amountExcl ?? 0), R - 27, rowMidY, { align: 'right' });
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK);
    doc.text(fmtMoneyPDF(l.amountIncl ?? 0), R, rowMidY, { align: 'right' });

    rowEndY = rowTopY + rowH;
    doc.setDrawColor(220, 215, 208); doc.setLineWidth(0.25);
    doc.line(L, rowEndY, R, rowEndY);
  }

  // ── Totalen — nieuwe pagina als geen ruimte meer ──
  const TOTALS_H = 75;
  if (rowEndY + TOTALS_H > PAGE_H - FOOT_H - 5) _newPage();

  let tTY = rowEndY + 9;
  const totX = R - 75;
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...MED);
  [[`Subtotaal excl. BTW`, fmtMoneyPDF(inv.totalExcl || 0)],
   [`BTW`,                 fmtMoneyPDF(inv.totalVat  || 0)]].forEach(([lbl, val]) => {
    doc.text(lbl, totX, tTY); doc.text(val, R, tTY, { align: 'right' }); tTY += 5.5;
  });
  doc.setDrawColor(...TAUPE); doc.setLineWidth(0.8); doc.line(totX, tTY + 1, R, tTY + 1);
  tTY += 6;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...DARK);
  doc.text('Te betalen', totX, tTY);
  doc.setFontSize(14); doc.setTextColor(...TAUPE);
  doc.text(fmtMoneyPDF(inv.totalIncl || 0), R, tTY, { align: 'right' });

  // ── Betaalinstructies ──
  const pY    = tTY + 12;
  const pBoxH = bedrijf.bic ? 30 : 24;
  doc.setFillColor(...BG);
  doc.roundedRect(L, pY, W, pBoxH, 2, 2, 'F');
  doc.setFillColor(...TAUPE);
  doc.rect(L, pY, 3, pBoxH, 'F');
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...MED);
  doc.text(`Gelieve ${fmtMoneyPDF(inv.totalIncl || 0)} voor ${fmtDateLong(inv.dueDate)} over te maken naar:`, L + 7, pY + 7);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...DARK);
  doc.text(fmtIBAN(bedrijf.iban), L + 7, pY + 14);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...MED);
  doc.text(`t.n.v. ${bedrijf.naam}   o.v.v. ${inv.number || ''}`, L + 7, pY + 20);
  if (bedrijf.bic) {
    doc.setTextColor(...DIM);
    doc.text(`BIC: ${bedrijf.bic}`, L + 7, pY + 26);
  }

  // ── Footer laatste pagina ──
  _footer();

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
    normaal:     `Geachte ${clientName || 'relatie'},\n\nGelieve bijgevoegde factuur voor de daarop vermelde datum te betalen.\n\nMet vriendelijke groet,\n${bedrijf.naam}`,
    herinnering: `Geachte ${clientName || 'relatie'},\n\nWij willen u vriendelijk herinneren dat factuur ${inv.number} van ${fmtMoney(inv.totalIncl || 0)} op ${fmtDateLong(inv.dueDate)} betaald diende te zijn.\n\nHebt u al betaald? Dan kunt u deze herinnering als niet verzonden beschouwen.\n\nMet vriendelijke groet,\n${bedrijf.naam}`,
    aanmaning:   `Geachte ${clientName || 'relatie'},\n\nOndanks onze eerdere herinnering staat factuur ${inv.number} van ${fmtMoney(inv.totalIncl || 0)} nog steeds open. Wij verzoeken u dringend het verschuldigde bedrag binnen 7 dagen te voldoen.\n\nMet vriendelijke groet,\n${bedrijf.naam}`,
  };

  const waText = encodeURIComponent(
    `Hallo${clientName ? ' ' + clientName : ''}, hierbij de factuurgegevens van ${bedrijf.naam}:\n\nFactuur: ${inv.number}\nBedrag: ${fmtMoney(inv.totalIncl || 0)}\nVervaldatum: ${fmtDateLong(inv.dueDate)}\n\nBetalen via:\nIBAN: ${ibanFmt}${bedrijf.bic ? '\nBIC: ' + bedrijf.bic : ''}\nt.n.v. ${bedrijf.naam}\no.v.v. ${inv.number}\n\nBedankt!`
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
          <option value="aanmaning">⚠️ Aanmaning</option>
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
