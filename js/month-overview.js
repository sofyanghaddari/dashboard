// ─── MAANDOVERZICHT ────────────────────────────────────────────────────────
// Inkomen per maand + per jaar, met vergelijken. Staat in de Stats-tab.
// Bronnen: Taxi = dagregistratie (store `rides`), Adab/Olijf = verkoopfacturen
// (store `invoices`, op factuurdatum, incl. btw). Taxi-facturen worden bewust
// NIET meegeteld: die ritten zitten al in de dagregistratie (geen dubbeltelling).

import { fmtMoney, ymd, effectiveDate, effectiveNow } from './utils.js';
import { getNumber } from './settings.js';
import { initCountUps } from './animate.js';

const SOURCES = [
  { key: 'taxi',  label: 'Taxi'  },
  { key: 'adab',  label: 'Adab'  },
  { key: 'olijf', label: 'Olijf' },
];
const INVOICE_SRC = { adab: 'adab', olijfolie: 'olijf' };

// Sessie-state (blijft staan bij wisselen van tab, reset bij herstart)
let _year = null;      // number | 'all'
let _src  = 'alles';
let _sel  = null;      // 'YYYY-MM' van de opengeklapte maand
let _cmp  = '';        // 'YYYY-MM' om mee te vergelijken

const r2 = (v) => Math.round(v * 100) / 100;
const pad = (n) => String(n).padStart(2, '0');
const mKey = (y, m) => `${y}-${pad(m + 1)}`;          // m = 0..11
const monthName = (key, opts = { month: 'long' }) => {
  const [y, m] = key.split('-').map(Number);
  const s = new Date(y, m - 1, 1).toLocaleDateString('nl-NL', opts);
  return s.charAt(0).toUpperCase() + s.slice(1);
};
const shortMoney = (n) => {
  const a = Math.abs(n);
  if (a >= 1000) return '€' + (n / 1000).toFixed(a >= 10000 ? 0 : 1).replace('.', ',') + 'k';
  return '€' + Math.round(n);
};

// ── Data ─────────────────────────────────────────────────────────────────
// Eén platte lijst van posten { day:'YYYY-MM-DD', src, amt, open } — alles
// (maanden, jaren, zelfde-periode-vergelijking) wordt hieruit afgeleid.
function buildEntries(rides, invoices) {
  const out = [];
  for (const r of rides) {
    if (!r?.date) continue;
    const amt = Number(r.amount) || 0;
    if (!amt) continue;
    out.push({ day: ymd(effectiveDate(new Date(r.date))), src: 'taxi', amt, open: false });
  }
  for (const inv of invoices) {
    const src = INVOICE_SRC[inv?.adminId];
    if (!src || !inv.date) continue;
    const amt = Number(inv.totalIncl) || 0;
    if (!amt) continue;
    out.push({ day: inv.date.slice(0, 10), src, amt, open: inv.status !== 'betaald' });
  }
  return out;
}

function aggregate(entries, src) {
  const months = {};   // key → { total, bySrc, days:{day→amt}, open, count }
  for (const e of entries) {
    if (src !== 'alles' && e.src !== src) continue;
    const k = e.day.slice(0, 7);
    const m = months[k] ||= { total: 0, bySrc: { taxi: 0, adab: 0, olijf: 0 }, days: {}, open: 0, invoices: 0 };
    m.total += e.amt;
    m.bySrc[e.src] += e.amt;
    if (e.src === 'taxi') m.days[e.day] = (m.days[e.day] || 0) + e.amt;
    else { m.invoices++; if (e.open) m.open += e.amt; }
  }
  return months;
}

const monthTotal = (months, k) => months[k]?.total || 0;
// Som van maand `k` t/m dag-van-de-maand `dom` ('DD') — om de lopende maand eerlijk te vergelijken
const totalUpTo = (entries, k, dom) => entries
  .filter(e => (_src === 'alles' || e.src === _src) && e.day.startsWith(k + '-') && e.day.slice(8) <= dom)
  .reduce((s, e) => s + e.amt, 0);
function prevMonthKey(k) { const [y, m] = k.split('-').map(Number); return mKey(m === 1 ? y - 1 : y, m === 1 ? 11 : m - 2); }
function lastYearKey(k)  { const [y, m] = k.split('-'); return `${Number(y) - 1}-${m}`; }

function monthStats(months, k) {
  const m = months[k];
  if (!m) return { total: 0, days: 0, perDay: 0, best: null, open: 0, bySrc: { taxi: 0, adab: 0, olijf: 0 }, invoices: 0 };
  const dayEntries = Object.entries(m.days);
  const best = dayEntries.sort((a, b) => b[1] - a[1])[0] || null;
  const taxiTotal = m.bySrc.taxi;
  return {
    total: m.total, days: dayEntries.length,
    perDay: dayEntries.length ? taxiTotal / dayEntries.length : 0,
    best, open: m.open, bySrc: m.bySrc, invoices: m.invoices,
  };
}

// ── Kleine UI-helpers ────────────────────────────────────────────────────
function delta(cur, prev, { label = '', money = false } = {}) {
  if (!prev && !cur) return '';
  if (!prev) return `<span class="mo-delta new">nieuw${label ? ' ' + label : ''}</span>`;
  const pct = Math.round((cur - prev) / prev * 100);
  const up = pct >= 0;
  const diff = money ? ` <span class="mo-delta-amt">(${cur - prev >= 0 ? '+' : '−'}${fmtMoney(Math.abs(cur - prev))})</span>` : '';
  return `<span class="mo-delta ${up ? 'up' : 'down'}">${up ? '↑' : '↓'} ${Math.abs(pct)}%${label ? ' ' + label : ''}${diff}</span>`;
}

function srcSplit(bySrc) {
  const parts = SOURCES.filter(s => bySrc[s.key] > 0);
  if (parts.length < 2) return '';
  const tot = parts.reduce((s, p) => s + bySrc[p.key], 0) || 1;
  return `
    <div class="mo-split" aria-label="Verdeling per bron">
      ${parts.map(p => `<span class="mo-split-seg src-${p.key}" style="width:${(bySrc[p.key] / tot * 100).toFixed(1)}%"></span>`).join('')}
    </div>
    <div class="mo-split-leg">
      ${parts.map(p => `<span><i class="mo-dot src-${p.key}"></i>${p.label} <b>${fmtMoney(bySrc[p.key])}</b></span>`).join('')}
    </div>`;
}

// ── Render ───────────────────────────────────────────────────────────────
export function mountMonthOverview(mount, { rides = [], invoices = [] } = {}) {
  const entries = buildEntries(rides, invoices);
  const presentSrc = new Set(entries.map(e => e.src));
  if (_src !== 'alles' && !presentSrc.has(_src)) _src = 'alles';

  const now = effectiveNow();
  const curYear = now.getFullYear();
  const curKey = mKey(curYear, now.getMonth());
  if (_year == null) _year = curYear;

  const draw = (animate = false) => {
    const months = aggregate(entries, _src);
    const years = [...new Set([curYear, ...Object.keys(months).map(k => Number(k.slice(0, 4)))])].sort((a, b) => b - a);
    if (_year !== 'all' && !years.includes(_year)) _year = curYear;

    const srcChips = presentSrc.size > 1 ? `
      <div class="mo-chips" role="group" aria-label="Bron">
        <button class="mo-chip ${_src === 'alles' ? 'active' : ''}" data-mo-src="alles">Alles</button>
        ${SOURCES.filter(s => presentSrc.has(s.key)).map(s =>
          `<button class="mo-chip ${_src === s.key ? 'active' : ''}" data-mo-src="${s.key}"><i class="mo-dot src-${s.key}"></i>${s.label}</button>`).join('')}
      </div>` : '';

    const yearChips = `
      <div class="mo-chips mo-years" role="group" aria-label="Jaar">
        ${years.map(y => `<button class="mo-chip ${_year === y ? 'active' : ''}" data-mo-year="${y}">${y}</button>`).join('')}
        ${years.length > 1 ? `<button class="mo-chip ${_year === 'all' ? 'active' : ''}" data-mo-year="all">Alle jaren</button>` : ''}
      </div>`;

    const body = _year === 'all'
      ? renderAllYears(months, entries, years, curYear, now)
      : renderYear(months, entries, _year, curYear, curKey, now);

    mount.innerHTML = `
      <div class="stats-card mo-card${animate ? ' mo-anim' : ''}">
        <div class="mo-head">
          <div class="stats-card-title" style="margin:0">Inkomen per maand</div>
          <button class="mo-csv" data-mo-csv title="Exporteer als CSV">CSV ↓</button>
        </div>
        ${yearChips}
        ${srcChips}
        ${body}
        <p class="mo-foot">Taxi = je dagregistratie${presentSrc.size > 1 ? ' · facturen tellen op factuurdatum, incl. btw' : ''}.</p>
      </div>`;

    bind(months);
    initCountUps(mount);
  };

  const bind = (months) => {
    mount.querySelectorAll('[data-mo-year]').forEach(b => b.onclick = () => {
      const v = b.dataset.moYear;
      _year = v === 'all' ? 'all' : Number(v);
      _sel = null; _cmp = '';
      draw(true);
    });
    mount.querySelectorAll('[data-mo-src]').forEach(b => b.onclick = () => {
      _src = b.dataset.moSrc; _cmp = '';
      draw(true);
    });
    mount.querySelectorAll('[data-mo-month]').forEach(el => el.onclick = (e) => {
      if (e.target.closest('select, .mo-detail')) return;
      const k = el.dataset.moMonth;
      _sel = _sel === k ? null : k; _cmp = '';
      draw();
      if (_sel && !el.classList.contains('mo-row')) {
        mount.querySelector(`.mo-row[data-mo-month="${_sel}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
    mount.querySelectorAll('[data-mo-goyear]').forEach(el => el.onclick = () => {
      _year = Number(el.dataset.moGoyear); _sel = null; _cmp = '';
      draw(true);
    });
    mount.querySelectorAll('.mo-row[role="button"]').forEach(el => el.onkeydown = (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target === el) { e.preventDefault(); el.click(); }
    });
    const cmp = mount.querySelector('[data-mo-cmp]');
    if (cmp) cmp.onchange = () => { _cmp = cmp.value; draw(); };
    mount.querySelector('[data-mo-csv]').onclick = () => exportCsv(aggregate(entries, 'alles'), months);
  };

  draw(true);
}

// ── Eén jaar ─────────────────────────────────────────────────────────────
function renderYear(months, entries, year, curYear, curKey, now) {
  const isCur = year === curYear;
  const lastIdx = isCur ? now.getMonth() : 11;
  const keys = Array.from({ length: 12 }, (_, i) => mKey(year, i));
  const shown = keys.slice(0, lastIdx + 1);

  const total = r2(shown.reduce((s, k) => s + monthTotal(months, k), 0));
  const active = shown.filter(k => monthTotal(months, k) > 0);
  const avg = active.length ? total / active.length : 0;
  const bestKey = active.slice().sort((a, b) => monthTotal(months, b) - monthTotal(months, a))[0];
  const taxiDays = shown.reduce((s, k) => s + Object.keys(months[k]?.days || {}).length, 0);
  const taxiSum  = shown.reduce((s, k) => s + (months[k]?.bySrc.taxi || 0), 0);

  // Vergelijking met vorig jaar: lopend jaar → zelfde periode (t/m dezelfde datum)
  const prevYear = year - 1;
  let prevTotal, vsLabel;
  if (isCur) {
    const cutoff = `${prevYear}-${ymd(now).slice(5)}`;
    prevTotal = entries
      .filter(e => (_src === 'alles' || e.src === _src) && e.day.startsWith(prevYear + '-') && e.day <= cutoff)
      .reduce((s, e) => s + e.amt, 0);
    vsLabel = `vs ${prevYear} (zelfde periode)`;
  } else {
    prevTotal = Array.from({ length: 12 }, (_, i) => monthTotal(months, mKey(prevYear, i))).reduce((a, b) => a + b, 0);
    vsLabel = `vs ${prevYear}`;
  }
  const growth = prevTotal > 0 ? delta(total, prevTotal, { label: vsLabel }) : '';

  // Prognose lopend jaar (pas na 2 weken, anders te grillig)
  let prognose = null;
  if (isCur) {
    const start = new Date(year, 0, 1);
    const dayOfYear = Math.floor((now - start) / 86400000) + 1;
    const daysInYear = (new Date(year, 11, 31) - start) / 86400000 + 1;
    if (dayOfYear >= 14 && total > 0) prognose = total / dayOfYear * daysInYear;
  }

  const goal = (_src === 'alles' || _src === 'taxi') ? getNumber('monthlyIncomeGoal') : 0;
  const goalHits = goal > 0 ? active.filter(k => monthTotal(months, k) >= goal).length : 0;

  if (!total && !prevTotal) {
    return `<div class="stats-empty-state">Nog geen inkomen in ${year}.</div>`;
  }

  // ── Grafiek: 12 maanden, vorig jaar als schaduw ──
  const prevVals = keys.map(k => monthTotal(months, lastYearKey(k)));
  const vals = keys.map(k => monthTotal(months, k));
  const max = Math.max(1, ...vals, ...prevVals, goal > 0 ? goal : 0);
  const showPrev = prevVals.some(v => v > 0);
  const goalPct = goal > 0 ? goal / max * 100 : 0;

  const colCls = (k, i) => `${k === curKey ? ' current' : ''}${k === _sel ? ' sel' : ''}${isCur && i > lastIdx ? ' future' : ''}`;
  const chart = `
    <div class="mo-chart" role="img" aria-label="Inkomen per maand in ${year}">
      <div class="mo-plot">
        ${goal > 0 && goalPct <= 100 ? `<div class="mo-goal-line" style="bottom:${goalPct.toFixed(1)}%"><span>doel</span></div>` : ''}
        ${keys.map((k, i) => {
          const m = months[k];
          const v = vals[i];
          const segs = (_src === 'alles' && m)
            ? SOURCES.filter(s => m.bySrc[s.key] > 0).map(s => `<span class="mo-seg src-${s.key}" style="flex:${m.bySrc[s.key]}"></span>`).join('')
            : `<span class="mo-seg src-${_src === 'alles' ? 'taxi' : _src}" style="flex:1"></span>`;
          return `
            <div class="mo-bar-col${colCls(k, i)}" data-mo-month="${k}" style="--i:${i}" title="${monthName(k, { month: 'long', year: 'numeric' })}">
              ${showPrev && prevVals[i] > 0 ? `<div class="mo-ghost" style="height:${(prevVals[i] / max * 100).toFixed(1)}%"></div>` : ''}
              ${v > 0 ? `<div class="mo-bar" style="height:${Math.max(2, v / max * 100).toFixed(1)}%">${segs}</div>` : ''}
              ${k === _sel && v > 0 ? `<div class="mo-bar-val blurred-amount" style="bottom:calc(${Math.max(2, v / max * 100).toFixed(1)}% + 3px)">${shortMoney(v)}</div>` : ''}
            </div>`;
        }).join('')}
      </div>
      <div class="mo-lbls">
        ${keys.map((k, i) => `<div class="mo-bar-lbl${colCls(k, i)}" data-mo-month="${k}">${monthName(k, { month: 'short' }).replace('.', '').slice(0, 3)}</div>`).join('')}
      </div>
    </div>
    <div class="mo-legend">
      ${_src === 'alles' && SOURCES.filter(s => shown.some(k => months[k]?.bySrc[s.key] > 0)).length > 1
        ? SOURCES.filter(s => shown.some(k => months[k]?.bySrc[s.key] > 0)).map(s => `<span><i class="mo-dot src-${s.key}"></i>${s.label}</span>`).join('')
        : `<span><i class="mo-dot src-${_src === 'alles' ? 'taxi' : _src}"></i>${year}</span>`}
      ${showPrev ? `<span><i class="mo-dot ghost"></i>${prevYear}</span>` : ''}
      ${goal > 0 && goalPct <= 100 ? `<span><i class="mo-dot goal"></i>Maanddoel</span>` : ''}
    </div>`;

  // ── Kerncijfers ──
  const metrics = `
    <div class="mo-hero">
      <div class="mo-hero-lbl">Totaal ${year}${isCur ? ' tot nu' : ''}</div>
      <div class="mo-hero-amt blurred-amount" data-countup="${total}">${fmtMoney(total)}</div>
      ${growth}
    </div>
    <div class="shero-grid mo-metrics">
      <div class="shero-metric">
        <div class="shero-metric-val blurred-amount">${fmtMoney(avg)}</div>
        <div class="shero-metric-lbl">Gem. per maand<br><span class="shero-date">over ${active.length} ${active.length === 1 ? 'maand' : 'maanden'}</span></div>
      </div>
      <div class="shero-metric">
        <div class="shero-metric-val blurred-amount">${bestKey ? fmtMoney(monthTotal(months, bestKey)) : '—'}</div>
        <div class="shero-metric-lbl">Beste maand${bestKey ? `<br><span class="shero-date">${monthName(bestKey)}</span>` : ''}</div>
      </div>
      ${taxiDays > 0 ? `
      <div class="shero-metric">
        <div class="shero-metric-val plain">${taxiDays}</div>
        <div class="shero-metric-lbl">Rijdagen<br><span class="shero-date">gem. <span class="blurred-amount">${fmtMoney(Math.round(taxiSum / taxiDays))}</span> per dag</span></div>
      </div>` : ''}
      ${prognose ? `
      <div class="shero-metric">
        <div class="shero-metric-val blurred-amount">${fmtMoney(Math.round(prognose))}</div>
        <div class="shero-metric-lbl">Prognose ${year}<br><span class="shero-date">in dit tempo</span></div>
      </div>` : (goal > 0 ? `
      <div class="shero-metric">
        <div class="shero-metric-val plain">${goalHits}/${active.length}</div>
        <div class="shero-metric-lbl">Maanddoel gehaald</div>
      </div>` : '')}
    </div>
    ${prognose && goal > 0 ? `<p class="mo-goalnote">Maanddoel gehaald in <b>${goalHits}</b> van ${active.length} ${active.length === 1 ? 'maand' : 'maanden'}.</p>` : ''}`;

  // ── Maandenlijst (nieuwste boven) ──
  const best = bestKey ? monthTotal(months, bestKey) : 1;
  // Lopende maand eerlijk vergelijken: vorige maand t/m dezelfde dag
  const dom = ymd(now).slice(8);
  const prevAtPos = totalUpTo(entries, prevMonthKey(curKey), dom);
  const lastYearAtPos = totalUpTo(entries, lastYearKey(curKey), dom);
  const firstIdx = shown.findIndex(k => monthTotal(months, k) > 0);
  const listKeys = firstIdx < 0 ? [] : shown.slice(firstIdx);
  const rows = listKeys.slice().reverse().map(k => {
    const v = monthTotal(months, k);
    const prev = k === curKey ? prevAtPos : monthTotal(months, prevMonthKey(k));
    const open = k === _sel;
    return `
      <div class="mo-row${open ? ' open' : ''}${k === curKey ? ' current' : ''}${!v ? ' empty' : ''}" data-mo-month="${k}" role="button" tabindex="0" aria-expanded="${open}">
        <div class="mo-row-main">
          <span class="mo-row-name">${monthName(k)}${k === curKey ? ' <span class="mo-tag">lopend</span>' : ''}${goal > 0 && v >= goal ? ' <span class="mo-tag ok">✓ doel</span>' : ''}</span>
          <span class="mo-row-amt blurred-amount">${v ? fmtMoney(v) : '—'}</span>
        </div>
        <div class="mo-row-sub">
          <div class="mo-row-bar"><span style="width:${v > 0 ? Math.max(2, v / best * 100).toFixed(1) : 0}%"></span></div>
          ${v || prev ? delta(v, prev, { label: k === curKey ? 'zelfde punt vorige mnd' : '' }) : ''}
        </div>
        ${open ? monthDetail(months, k, curKey, k === curKey ? { p: prevAtPos, y: lastYearAtPos } : null) : ''}
      </div>`;
  }).join('');

  return `${metrics}${chart}<div class="mo-list">${rows}</div>`;
}

// ── Detail van één maand + vergelijken ───────────────────────────────────
function monthDetail(months, k, curKey, atPos = null) {
  const s = monthStats(months, k);
  const pk = prevMonthKey(k), yk = lastYearKey(k);
  // Lopende maand: vergelijk met dezelfde dagen van vorige maand / vorig jaar
  const p = atPos ? atPos.p : monthTotal(months, pk);
  const y = atPos ? atPos.y : monthTotal(months, yk);
  const ySuffix = atPos ? ' (t/m zelfde dag)' : '';
  const options = Object.keys(months).filter(x => x !== k && months[x].total > 0).sort().reverse();
  const c = _cmp && months[_cmp] ? monthStats(months, _cmp) : null;

  const row = (lbl, val) => `<div class="mo-kv"><span>${lbl}</span><b>${val}</b></div>`;
  return `
    <div class="mo-detail">
      ${srcSplit(s.bySrc)}
      ${s.days ? row('Rijdagen', `${s.days}`) : ''}
      ${s.days ? row('Gem. per rijdag', `<span class="blurred-amount">${fmtMoney(s.perDay)}</span>`) : ''}
      ${s.best ? row('Beste dag', `${new Date(s.best[0] + 'T12:00:00').toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })} · <span class="blurred-amount">${fmtMoney(s.best[1])}</span>`) : ''}
      ${s.invoices ? row('Facturen', `${s.invoices}`) : ''}
      ${s.open > 0 ? row('Nog niet betaald', `<span class="blurred-amount mo-open">${fmtMoney(s.open)}</span>`) : ''}
      ${row(`vs ${monthName(pk, { month: 'long' }).toLowerCase()}${ySuffix}`, p || s.total ? delta(s.total, p, { money: true }) || '—' : '—')}
      ${row(`vs ${monthName(yk, { month: 'short', year: 'numeric' }).replace('.', '')}${ySuffix}`, y ? delta(s.total, y, { money: true }) : '<span class="mo-muted">geen data</span>')}
      ${k === curKey ? '<p class="mo-muted mo-note">Lopende maand — vergeleken met dezelfde dagen, zodat het eerlijk is.</p>' : ''}
      ${options.length ? `
      <label class="mo-cmp-lbl">Vergelijk met
        <select data-mo-cmp>
          <option value="">kies een maand…</option>
          ${options.map(o => `<option value="${o}" ${o === _cmp ? 'selected' : ''}>${monthName(o, { month: 'long', year: 'numeric' })}</option>`).join('')}
        </select>
      </label>` : ''}
      ${c ? compareTable(k, s, _cmp, c) : ''}
    </div>`;
}

function compareTable(aKey, a, bKey, b) {
  const name = (k) => monthName(k, { month: 'short', year: '2-digit' }).replace('.', '');
  const money = (v) => `<span class="blurred-amount">${fmtMoney(v)}</span>`;
  const num = (v) => String(v);
  const line = (lbl, av, bv, fmt) => {
    const diff = r2(av - bv);
    const cls = diff > 0 ? 'up' : diff < 0 ? 'down' : '';
    return `
      <div class="mo-cmp-row">
        <div class="mo-cmp-top"><span>${lbl}</span><span class="mo-cmp-diff ${cls}">${diff ? (diff > 0 ? '+' : '−') + fmt(Math.abs(diff)) : 'gelijk'}</span></div>
        <div class="mo-cmp-vals"><span><i>${name(aKey)}</i>${fmt(av)}</span><span><i>${name(bKey)}</i>${fmt(bv)}</span></div>
      </div>`;
  };
  return `
    <div class="mo-cmp">
      ${line('Totaal', a.total, b.total, money)}
      ${a.days || b.days ? line('Rijdagen', a.days, b.days, num) : ''}
      ${a.days || b.days ? line('Gem. per rijdag', a.perDay, b.perDay, money) : ''}
      ${a.best || b.best ? line('Beste dag', a.best?.[1] || 0, b.best?.[1] || 0, money) : ''}
    </div>`;
}

// ── Alle jaren ───────────────────────────────────────────────────────────
function renderAllYears(months, entries, years, curYear, now) {
  const cutoff = `${curYear - 1}-${ymd(now).slice(5)}`;
  const prevYtd = entries
    .filter(e => (_src === 'alles' || e.src === _src) && e.day.startsWith((curYear - 1) + '-') && e.day <= cutoff)
    .reduce((s, e) => s + e.amt, 0);
  const asc = years.slice().sort((a, b) => a - b);
  const data = asc.map(y => {
    const keys = Array.from({ length: 12 }, (_, i) => mKey(y, i));
    const total = keys.reduce((s, k) => s + monthTotal(months, k), 0);
    const active = keys.filter(k => monthTotal(months, k) > 0);
    const best = active.slice().sort((a, b) => monthTotal(months, b) - monthTotal(months, a))[0];
    return { y, total, active: active.length, best };
  }).filter(d => d.total > 0 || d.y === curYear);
  const grand = data.reduce((s, d) => s + d.total, 0);
  const max = Math.max(1, ...data.map(d => d.total));

  return `
    <div class="mo-hero">
      <div class="mo-hero-lbl">Totaal alle jaren</div>
      <div class="mo-hero-amt blurred-amount" data-countup="${grand}">${fmtMoney(grand)}</div>
    </div>
    <div class="mo-chart mo-years-chart">
      <div class="mo-plot">
        ${data.map((d, i) => `
          <div class="mo-bar-col${d.y === curYear ? ' current' : ''}" data-mo-goyear="${d.y}" style="--i:${i}" title="${d.y}">
            ${d.total > 0 ? `<div class="mo-bar" style="height:${Math.max(2, d.total / max * 100).toFixed(1)}%"><span class="mo-seg src-${_src === 'alles' ? 'taxi' : _src}" style="flex:1"></span></div>` : ''}
          </div>`).join('')}
      </div>
      <div class="mo-lbls">
        ${data.map(d => `<div class="mo-bar-lbl${d.y === curYear ? ' current' : ''}" data-mo-goyear="${d.y}">${d.y}</div>`).join('')}
      </div>
    </div>
    <div class="mo-list">
      ${data.slice().reverse().map((d, i, arr) => {
        const prev = arr[i + 1];
        return `
        <div class="mo-row" data-mo-goyear="${d.y}" role="button" tabindex="0">
          <div class="mo-row-main">
            <span class="mo-row-name">${d.y}${d.y === curYear ? ' <span class="mo-tag">lopend</span>' : ''}</span>
            <span class="mo-row-amt blurred-amount">${fmtMoney(d.total)}</span>
          </div>
          <div class="mo-row-sub">
            <span class="mo-muted">${d.active ? `gem. <span class="blurred-amount">${fmtMoney(Math.round(d.total / d.active))}</span>/mnd${d.best ? ` · beste: ${monthName(d.best, { month: 'short' }).replace('.', '')}` : ''}` : 'geen inkomen'}</span>
            ${d.y === curYear ? (prevYtd > 0 ? delta(d.total, prevYtd, { label: 'zelfde periode' }) : '') : (prev ? delta(d.total, prev.total) : '')}
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

// ── CSV ──────────────────────────────────────────────────────────────────
function exportCsv(allMonths) {
  const keys = Object.keys(allMonths).sort();
  if (!keys.length) return;
  const n = (v) => (Math.round(v * 100) / 100).toFixed(2).replace('.', ',');
  const rows = ['sep=;', ['maand', 'taxi', 'adab', 'olijf', 'totaal', 'rijdagen', 'nog_open'].join(';')];
  let year = null, yt = { taxi: 0, adab: 0, olijf: 0, total: 0, days: 0, open: 0 };
  const flushYear = () => {
    if (year == null) return;
    rows.push([`Totaal ${year}`, n(yt.taxi), n(yt.adab), n(yt.olijf), n(yt.total), yt.days, n(yt.open)].join(';'));
    yt = { taxi: 0, adab: 0, olijf: 0, total: 0, days: 0, open: 0 };
  };
  for (const k of keys) {
    const y = k.slice(0, 4);
    if (y !== year) { flushYear(); year = y; }
    const m = allMonths[k];
    const days = Object.keys(m.days).length;
    rows.push([k, n(m.bySrc.taxi), n(m.bySrc.adab), n(m.bySrc.olijf), n(m.total), days, n(m.open)].join(';'));
    yt.taxi += m.bySrc.taxi; yt.adab += m.bySrc.adab; yt.olijf += m.bySrc.olijf;
    yt.total += m.total; yt.days += days; yt.open += m.open;
  }
  flushYear();
  const blob = new Blob(['﻿' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `inkomen-per-maand-${ymd(new Date())}.csv` });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

