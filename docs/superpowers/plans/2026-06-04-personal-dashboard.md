# Personal Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal mobile-first PWA dashboard with 6 modules (taxi income tracking, Koran hizb tracking, Arabic SRS, goals, todos, summary dashboard) using vanilla HTML/CSS/JS with IndexedDB storage.

**Architecture:** Single-page PWA with bottom tab navigation, IndexedDB-backed modules, service worker for offline + push reminder, dark theme default. No build step — vanilla files served statically.

**Tech Stack:** Vanilla HTML/CSS/JavaScript (ES modules), IndexedDB (via small wrapper), Web Notifications API, Service Worker, Web App Manifest.

---

## Conventions

- **Dev server:** Run `python3 -m http.server 8000` from project root for all verification steps. Open `http://localhost:8000` in Chrome (desktop) and (optionally) phone via LAN.
- **Language:** All UI strings in Dutch; code/identifiers/paths in English.
- **Git:** Commit after every task with the exact message shown. Use `git add -A && git commit -m "..."`.
- **IDs:** Use `crypto.randomUUID()` for new records (rides, expenses, cards, goals, todos).
- **Dates:** Store as ISO strings (`new Date().toISOString()`) for `date`/`createdAt`; store `dueDate` and `hizb_log.date` as `YYYY-MM-DD` strings.
- **Module pattern:** Each module file exports `async function render(container)` that wipes and rebuilds the container's innerHTML, and binds events.
- **No external libraries.** No npm. Pure browser.

---

## Phase 0 — Project Init

### Task 0.1 — Initialize repo and folder skeleton

- [ ] Open terminal at `/Users/soef/claude code`.
- [ ] Run `git init`.
- [ ] Create folders: `mkdir -p css js/modules js/components icons`.
- [ ] Create `.gitignore` with:
  ```
  .DS_Store
  *.log
  node_modules/
  .vscode/
  .idea/
  ```
- [ ] Create empty placeholder files so the structure is committable:
  - `index.html` (empty)
  - `manifest.json` (empty)
  - `service-worker.js` (empty)
  - `css/styles.css` (empty)
  - `js/app.js` (empty)
  - `js/db.js` (empty)
  - `js/router.js` (empty)
  - `js/modules/dashboard.js` (empty)
  - `js/modules/taxi.js` (empty)
  - `js/modules/koran.js` (empty)
  - `js/modules/arabic.js` (empty)
  - `js/modules/goals.js` (empty)
  - `js/modules/todo.js` (empty)
  - `js/components/modal.js` (empty)
- [ ] Verify: `ls -la` shows all files. `git status` shows the new files.
- [ ] Commit: `chore: initialize project skeleton`

---

## Phase 1 — Foundation

### Task 1.1 — HTML shell with tabbar

- [ ] Replace `index.html` with:
  ```html
  <!DOCTYPE html>
  <html lang="nl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#111418" />
    <title>Dashboard</title>
    <link rel="manifest" href="manifest.json" />
    <link rel="stylesheet" href="css/styles.css" />
  </head>
  <body data-theme="dark">
    <main id="view" class="view"></main>
    <nav class="tabbar" role="tablist">
      <button class="tab" data-route="dashboard" aria-label="Dashboard">🏠<span>Home</span></button>
      <button class="tab" data-route="taxi" aria-label="Taxi">🚖<span>Taxi</span></button>
      <button class="tab" data-route="koran" aria-label="Koran">📖<span>Koran</span></button>
      <button class="tab" data-route="arabic" aria-label="Arabisch">📚<span>Arabisch</span></button>
      <button class="tab" data-route="goals" aria-label="Doelen">🎯<span>Doelen</span></button>
      <button class="tab" data-route="todo" aria-label="To-do">✅<span>To-do</span></button>
    </nav>
    <script type="module" src="js/app.js"></script>
  </body>
  </html>
  ```
- [ ] Verify: open `http://localhost:8000` after starting server. The page loads without console errors. The tabbar is visible at the bottom.
- [ ] Commit: `feat: html shell with bottom tabbar`

### Task 1.2 — Dark-theme CSS

- [ ] Replace `css/styles.css` with:
  ```css
  :root {
    --bg: #111418;
    --bg-elev: #1a1f25;
    --bg-elev-2: #232931;
    --text: #e8ecef;
    --text-dim: #9aa4ad;
    --accent: #4cc2ff;
    --danger: #ff5a5f;
    --ok: #4ade80;
    --border: #2a3038;
    --radius: 12px;
    --tabbar-h: 64px;
    --safe-bottom: env(safe-area-inset-bottom, 0px);
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: var(--bg); color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  body { min-height: 100vh; }
  .view { padding: 16px 16px calc(var(--tabbar-h) + var(--safe-bottom) + 16px); max-width: 720px; margin: 0 auto; }
  h1, h2, h3 { margin: 0 0 12px; }
  h1 { font-size: 1.5rem; }
  h2 { font-size: 1.15rem; }
  .card { background: var(--bg-elev); border: 1px solid var(--border); border-radius: var(--radius);
    padding: 14px; margin-bottom: 12px; }
  .btn { background: var(--accent); color: #001018; border: 0; border-radius: 10px;
    padding: 12px 16px; font-weight: 600; font-size: 1rem; cursor: pointer; }
  .btn.secondary { background: var(--bg-elev-2); color: var(--text); }
  .btn.danger { background: var(--danger); color: white; }
  .btn.block { display: block; width: 100%; }
  input, select, textarea {
    width: 100%; padding: 10px 12px; background: var(--bg-elev-2); color: var(--text);
    border: 1px solid var(--border); border-radius: 8px; font-size: 1rem;
  }
  label { display: block; font-size: .85rem; color: var(--text-dim); margin: 8px 0 4px; }
  .row { display: flex; gap: 8px; }
  .row > * { flex: 1; }
  .muted { color: var(--text-dim); }
  .tabbar {
    position: fixed; left: 0; right: 0; bottom: 0;
    height: calc(var(--tabbar-h) + var(--safe-bottom));
    padding-bottom: var(--safe-bottom);
    background: var(--bg-elev); border-top: 1px solid var(--border);
    display: flex; justify-content: space-around; align-items: stretch; z-index: 10;
  }
  .tab { background: none; border: 0; color: var(--text-dim); flex: 1;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    font-size: 1.25rem; gap: 2px; cursor: pointer; }
  .tab span { font-size: .65rem; }
  .tab.active { color: var(--accent); }
  .pill { display: inline-block; padding: 2px 8px; border-radius: 999px;
    background: var(--bg-elev-2); font-size: .75rem; color: var(--text-dim); }
  .list { display: flex; flex-direction: column; gap: 8px; }
  .list-item { background: var(--bg-elev); border: 1px solid var(--border);
    border-radius: 10px; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; }
  .bar-chart { display: flex; align-items: flex-end; gap: 4px; height: 140px; }
  .bar { flex: 1; background: var(--accent); border-radius: 4px 4px 0 0; min-height: 2px; position: relative; }
  .bar-label { font-size: .65rem; color: var(--text-dim); text-align: center; margin-top: 4px; }
  .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.55);
    display: flex; align-items: flex-end; justify-content: center; z-index: 20; }
  .modal { background: var(--bg-elev); width: 100%; max-width: 720px;
    border-radius: 16px 16px 0 0; padding: 16px; max-height: 90vh; overflow-y: auto; }
  ```
- [ ] Verify: reload. Background is dark, tabbar styled, bottom bar visible.
- [ ] Commit: `feat: dark theme css and tabbar styling`

### Task 1.3 — IndexedDB wrapper (`db.js`)

- [ ] Replace `js/db.js` with:
  ```js
  const DB_NAME = 'dashboard';
  const DB_VERSION = 1;
  const STORES = {
    rides:    { keyPath: 'id',   indexes: [['date', 'date']] },
    expenses: { keyPath: 'id',   indexes: [['date', 'date']] },
    hizb_log: { keyPath: 'date' },
    cards:    { keyPath: 'id',   indexes: [['dueDate', 'dueDate']] },
    goals:    { keyPath: 'id' },
    todos:    { keyPath: 'id' },
  };

  let _dbPromise = null;

  export function openDB() {
    if (_dbPromise) return _dbPromise;
    _dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        for (const [name, cfg] of Object.entries(STORES)) {
          if (!db.objectStoreNames.contains(name)) {
            const store = db.createObjectStore(name, { keyPath: cfg.keyPath });
            (cfg.indexes || []).forEach(([idx, key]) => store.createIndex(idx, key));
          }
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return _dbPromise;
  }

  async function tx(store, mode = 'readonly') {
    const db = await openDB();
    return db.transaction(store, mode).objectStore(store);
  }
  function p(req) {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  export async function put(store, value) { return p((await tx(store, 'readwrite')).put(value)); }
  export async function add(store, value) { return p((await tx(store, 'readwrite')).add(value)); }
  export async function get(store, key)   { return p((await tx(store)).get(key)); }
  export async function del(store, key)   { return p((await tx(store, 'readwrite')).delete(key)); }
  export async function all(store)        { return p((await tx(store)).getAll()); }
  export async function clear(store)      { return p((await tx(store, 'readwrite')).clear()); }
  ```
- [ ] Verify: reload page; open DevTools console; run:
  ```js
  const m = await import('./js/db.js');
  await m.put('rides', { id: 'test-1', date: new Date().toISOString(), amount: 25, source: 'uber' });
  console.log(await m.all('rides'));
  await m.del('rides', 'test-1');
  ```
  Confirm the inserted row is logged and then removed. Application > IndexedDB > `dashboard` shows the stores.
- [ ] Commit: `feat: indexeddb wrapper with all stores`

### Task 1.4 — Router and app bootstrap

- [ ] Replace `js/router.js` with:
  ```js
  const routes = {};
  let currentView = null;

  export function register(name, renderFn) { routes[name] = renderFn; }

  export async function navigate(name) {
    const route = routes[name] ? name : 'dashboard';
    const view = document.getElementById('view');
    view.innerHTML = '';
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('active', t.dataset.route === route);
    });
    currentView = route;
    location.hash = '#' + route;
    await routes[route](view);
  }

  export function currentRoute() { return currentView; }

  export function initRouter() {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => navigate(tab.dataset.route));
    });
    const initial = (location.hash || '#dashboard').slice(1);
    navigate(initial);
  }
  ```
- [ ] Replace `js/app.js` with:
  ```js
  import { openDB } from './db.js';
  import { register, initRouter } from './router.js';
  import { render as renderDashboard } from './modules/dashboard.js';
  import { render as renderTaxi } from './modules/taxi.js';
  import { render as renderKoran } from './modules/koran.js';
  import { render as renderArabic } from './modules/arabic.js';
  import { render as renderGoals } from './modules/goals.js';
  import { render as renderTodo } from './modules/todo.js';

  async function main() {
    await openDB();
    register('dashboard', renderDashboard);
    register('taxi', renderTaxi);
    register('koran', renderKoran);
    register('arabic', renderArabic);
    register('goals', renderGoals);
    register('todo', renderTodo);
    initRouter();
  }
  main();
  ```
- [ ] Add placeholder stubs in each module file so imports resolve. Each module file (`js/modules/dashboard.js`, `taxi.js`, `koran.js`, `arabic.js`, `goals.js`, `todo.js`) should contain:
  ```js
  export async function render(container) {
    container.innerHTML = `<h1>Module</h1><p class="muted">Nog niet geïmplementeerd.</p>`;
  }
  ```
  Adjust the `<h1>` title per module: Dashboard, Taxi, Koran, Arabisch, Doelen, To-do.
- [ ] Verify: reload `http://localhost:8000`. Tapping each tab switches the view and the active tab is highlighted in accent color. Hash updates (e.g. `#taxi`). No console errors.
- [ ] Commit: `feat: router and module stubs`

### Task 1.5 — Modal component

- [ ] Replace `js/components/modal.js` with:
  ```js
  export function openModal(title, bodyHTML, onSubmit) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <h2>${title}</h2>
        <form id="modal-form">${bodyHTML}
          <div class="row" style="margin-top:16px">
            <button type="button" class="btn secondary" id="modal-cancel">Annuleren</button>
            <button type="submit" class="btn">Opslaan</button>
          </div>
        </form>
      </div>`;
    document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    backdrop.querySelector('#modal-cancel').onclick = close;
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
    backdrop.querySelector('#modal-form').onsubmit = async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target));
      try {
        await onSubmit(data);
        close();
      } catch (err) {
        alert('Opslaan mislukt: ' + (err.message || err));
      }
    };
    return close;
  }
  ```
- [ ] Verify (sanity): from DevTools console:
  ```js
  const { openModal } = await import('./js/components/modal.js');
  openModal('Test', '<label>Naam</label><input name="naam" />', d => console.log(d));
  ```
  Modal slides up; fill in, submit, see object logged.
- [ ] Commit: `feat: modal component`

---

## Phase 2 — Taxi Module

### Task 2.1 — Shared helpers (`js/utils.js`)

- [ ] Create `js/utils.js`:
  ```js
  export function uid() { return crypto.randomUUID(); }
  export function fmtMoney(n) { return '€ ' + (Math.round(n * 100) / 100).toFixed(2); }
  export function todayISO() { return new Date().toISOString(); }
  export function ymd(d = new Date()) {
    const x = new Date(d);
    return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
  }
  export function startOfWeek(d = new Date()) {
    const x = new Date(d); const day = (x.getDay() + 6) % 7; // Mon=0
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
  ```
- [ ] Verify: import in DevTools console; `fmtMoney(12.5)` returns `"€ 12.50"`; `ymd()` returns today's YYYY-MM-DD.
- [ ] Commit: `feat: shared utils (dates, money, uid, escapeHTML)`

### Task 2.2 — Taxi module: rides + expenses CRUD, totals, chart, CSV export

- [ ] Replace `js/modules/taxi.js` with:
  ```js
  import { all, put, del } from '../db.js';
  import { openModal } from '../components/modal.js';
  import { uid, fmtMoney, todayISO, startOfWeek, startOfMonth, monthKey, escapeHTML } from '../utils.js';

  export async function render(container) {
    const rides = await all('rides');
    const expenses = await all('expenses');
    const now = new Date();
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);

    const sumIf = (arr, pred) => arr.filter(pred).reduce((s, r) => s + Number(r.amount || 0), 0);
    const weekIncome  = sumIf(rides, r => new Date(r.date) >= weekStart);
    const monthIncome = sumIf(rides, r => new Date(r.date) >= monthStart);
    const weekExp  = sumIf(expenses, e => new Date(e.date) >= weekStart);
    const monthExp = sumIf(expenses, e => new Date(e.date) >= monthStart);

    const bySource = { uber: 0, bolt: 0, whatsapp: 0 };
    rides.forEach(r => { bySource[r.source] = (bySource[r.source] || 0) + Number(r.amount || 0); });
    const totalIncome = bySource.uber + bySource.bolt + bySource.whatsapp;

    container.innerHTML = `
      <h1>Taxi</h1>
      <button class="btn block" id="add-ride">+ Nieuwe rit</button>
      <button class="btn secondary block" id="add-expense" style="margin-top:8px">+ Nieuwe uitgave</button>
      <button class="btn secondary block" id="export-csv" style="margin-top:8px">CSV exporteren</button>

      <div class="card" style="margin-top:16px">
        <h2>Deze week</h2>
        <p>Bruto: <b>${fmtMoney(weekIncome)}</b> · Uitgaven: <b>${fmtMoney(weekExp)}</b> · Netto: <b>${fmtMoney(weekIncome - weekExp)}</b></p>
      </div>
      <div class="card">
        <h2>Deze maand</h2>
        <p>Bruto: <b>${fmtMoney(monthIncome)}</b> · Uitgaven: <b>${fmtMoney(monthExp)}</b> · Netto: <b>${fmtMoney(monthIncome - monthExp)}</b></p>
      </div>
      <div class="card">
        <h2>Per bron (totaal)</h2>
        ${['uber','bolt','whatsapp'].map(s => {
          const v = bySource[s]; const pct = totalIncome ? Math.round(v / totalIncome * 100) : 0;
          return `<p>${s[0].toUpperCase()+s.slice(1)}: <b>${fmtMoney(v)}</b> <span class="muted">(${pct}%)</span></p>`;
        }).join('')}
      </div>

      <div class="card"><h2>Netto per maand (12 mnd)</h2><div id="chart"></div></div>

      <h2 style="margin-top:16px">Recente ritten</h2>
      <div class="list" id="rides-list"></div>

      <h2 style="margin-top:16px">Recente uitgaven</h2>
      <div class="list" id="exp-list"></div>
    `;

    renderRidesList(container, rides);
    renderExpensesList(container, expenses);
    renderChart(container, rides, expenses);

    container.querySelector('#add-ride').onclick = () => openRideModal(container);
    container.querySelector('#add-expense').onclick = () => openExpenseModal(container);
    container.querySelector('#export-csv').onclick = () => exportCSV(rides, expenses);
  }

  function renderRidesList(container, rides) {
    const list = container.querySelector('#rides-list');
    const recent = [...rides].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);
    if (!recent.length) { list.innerHTML = '<p class="muted">Nog geen ritten.</p>'; return; }
    list.innerHTML = recent.map(r => `
      <div class="list-item">
        <div>
          <div><b>${fmtMoney(r.amount)}</b> <span class="pill">${escapeHTML(r.source)}</span></div>
          <div class="muted" style="font-size:.8rem">
            ${new Date(r.date).toLocaleString('nl-NL')}${r.km ? ' · ' + r.km + ' km' : ''}${r.note ? ' · ' + escapeHTML(r.note) : ''}
          </div>
        </div>
        <button class="btn danger" data-del-ride="${r.id}">×</button>
      </div>`).join('');
    list.querySelectorAll('[data-del-ride]').forEach(b => {
      b.onclick = async () => { await del('rides', b.dataset.delRide); render(container); };
    });
  }

  function renderExpensesList(container, expenses) {
    const list = container.querySelector('#exp-list');
    const recent = [...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);
    if (!recent.length) { list.innerHTML = '<p class="muted">Nog geen uitgaven.</p>'; return; }
    list.innerHTML = recent.map(e => `
      <div class="list-item">
        <div>
          <div><b>${fmtMoney(e.amount)}</b> <span class="pill">${escapeHTML(e.category)}</span></div>
          <div class="muted" style="font-size:.8rem">
            ${new Date(e.date).toLocaleString('nl-NL')}${e.note ? ' · ' + escapeHTML(e.note) : ''}
          </div>
        </div>
        <button class="btn danger" data-del-exp="${e.id}">×</button>
      </div>`).join('');
    list.querySelectorAll('[data-del-exp]').forEach(b => {
      b.onclick = async () => { await del('expenses', b.dataset.delExp); render(container); };
    });
  }

  function openRideModal(container) {
    openModal('Nieuwe rit', `
      <label>Bedrag (€) *</label><input name="amount" type="number" step="0.01" required />
      <label>Bron *</label>
      <select name="source" required>
        <option value="uber">Uber</option>
        <option value="bolt">Bolt</option>
        <option value="whatsapp">WhatsApp</option>
      </select>
      <label>Km (optioneel)</label><input name="km" type="number" step="0.1" />
      <label>Notitie</label><input name="note" />
    `, async (d) => {
      const amount = parseFloat(d.amount);
      if (!isFinite(amount) || amount <= 0) throw new Error('Bedrag ongeldig');
      await put('rides', {
        id: uid(), date: todayISO(), amount,
        source: d.source, km: d.km ? parseFloat(d.km) : null, note: d.note || null,
      });
      render(container);
    });
  }

  function openExpenseModal(container) {
    openModal('Nieuwe uitgave', `
      <label>Bedrag (€) *</label><input name="amount" type="number" step="0.01" required />
      <label>Categorie *</label>
      <select name="category" required>
        <option value="brandstof">Brandstof</option>
        <option value="verzekering">Verzekering</option>
        <option value="onderhoud">Onderhoud</option>
        <option value="overig">Overig</option>
      </select>
      <label>Notitie</label><input name="note" />
    `, async (d) => {
      const amount = parseFloat(d.amount);
      if (!isFinite(amount) || amount <= 0) throw new Error('Bedrag ongeldig');
      await put('expenses', { id: uid(), date: todayISO(), amount, category: d.category, note: d.note || null });
      render(container);
    });
  }

  function renderChart(container, rides, expenses) {
    const buckets = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets[monthKey(d)] = { in: 0, out: 0, label: d.toLocaleString('nl-NL', { month: 'short' }) };
    }
    rides.forEach(r => { const k = monthKey(r.date); if (buckets[k]) buckets[k].in += Number(r.amount || 0); });
    expenses.forEach(e => { const k = monthKey(e.date); if (buckets[k]) buckets[k].out += Number(e.amount || 0); });
    const entries = Object.values(buckets);
    const max = Math.max(1, ...entries.map(b => b.in - b.out));
    container.querySelector('#chart').innerHTML = `
      <div class="bar-chart">
        ${entries.map(b => {
          const net = b.in - b.out;
          const h = Math.max(2, Math.round((Math.max(0, net) / max) * 130));
          return `<div style="display:flex;flex-direction:column;flex:1">
            <div class="bar" style="height:${h}px" title="${b.label}: ${fmtMoney(net)}"></div>
            <div class="bar-label">${b.label}</div>
          </div>`;
        }).join('')}
      </div>`;
  }

  function exportCSV(rides, expenses) {
    const rows = [['type','date','amount','source_or_category','km','note']];
    rides.forEach(r => rows.push(['rit', r.date, r.amount, r.source, r.km ?? '', (r.note||'').replace(/[\r\n,]/g,' ')]));
    expenses.forEach(e => rows.push(['uitgave', e.date, e.amount, e.category, '', (e.note||'').replace(/[\r\n,]/g,' ')]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'taxi-export-' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }
  ```
- [ ] Verify: open `http://localhost:8000#taxi`. Click `+ Nieuwe rit`, fill `25`, source `Uber`, save. Week + maand totals show `€ 25.00`, "Per bron" shows Uber 100%, recent ritten shows the entry. Add another ride Bolt `15`. Add an expense Brandstof `20`. Week netto = `€ 20.00`. Click `×` on a row — it disappears. Click "CSV exporteren" — a file downloads.
- [ ] Commit: `feat: taxi module with rides, expenses, chart, csv export`

---

## Phase 3 — Koran Module

### Task 3.1 — Hizb checkoff, streak, 30-day chart, reminder

- [ ] Replace `js/modules/koran.js` with:
  ```js
  import { all, put, get } from '../db.js';
  import { ymd, escapeHTML } from '../utils.js';

  let _reminderTimer = null;

  export async function render(container) {
    const today = ymd();
    const todayRec = await get('hizb_log', today);
    const log = await all('hizb_log');
    const doneSet = new Set(log.map(l => l.date));

    let streak = 0;
    const cur = new Date();
    while (doneSet.has(ymd(cur))) { streak++; cur.setDate(cur.getDate() - 1); }

    const reminderTime = localStorage.getItem('hizbReminderTime') || '20:00';
    const startPoint = localStorage.getItem('hizbStartPoint') || 'Surah Al-Fath, 10 hizb';

    container.innerHTML = `
      <h1>Koran</h1>
      <div class="card">
        <h2>Vandaag</h2>
        <p class="muted">${escapeHTML(startPoint)}</p>
        <button class="btn block" id="check" ${todayRec ? 'disabled' : ''}>
          ${todayRec ? 'Afgevinkt ✓' : 'Afvinken voor vandaag'}
        </button>
      </div>
      <div class="card">
        <h2>Streak</h2>
        <p><b style="font-size:2rem">${streak}</b> dag${streak===1?'':'en'} achter elkaar</p>
      </div>
      <div class="card">
        <h2>Laatste 30 dagen</h2>
        <div id="chart30"></div>
      </div>
      <div class="card">
        <h2>Instellingen</h2>
        <label>Herinneringstijd</label>
        <input type="time" id="reminder" value="${reminderTime}" />
        <label>Startpunt</label>
        <input id="start" value="${escapeHTML(startPoint)}" />
        <button class="btn block" id="save-settings" style="margin-top:8px">Opslaan</button>
        <button class="btn secondary block" id="enable-notif" style="margin-top:8px">Notificaties inschakelen</button>
      </div>
    `;

    renderChart30(container, doneSet);

    container.querySelector('#check').onclick = async () => {
      await put('hizb_log', { date: today, completed: true });
      render(container);
    };
    container.querySelector('#save-settings').onclick = () => {
      localStorage.setItem('hizbReminderTime', container.querySelector('#reminder').value);
      localStorage.setItem('hizbStartPoint', container.querySelector('#start').value);
      scheduleReminder();
      alert('Opgeslagen');
    };
    container.querySelector('#enable-notif').onclick = async () => {
      if (!('Notification' in window)) { alert('Notificaties niet ondersteund'); return; }
      const res = await Notification.requestPermission();
      alert('Status: ' + res);
      if (res === 'granted') scheduleReminder();
    };

    scheduleReminder();
  }

  function renderChart30(container, doneSet) {
    const cells = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const done = doneSet.has(ymd(d));
      cells.push(`<div title="${ymd(d)}" style="
        width:18px;height:18px;border-radius:4px;
        background:${done ? 'var(--ok)' : 'var(--bg-elev-2)'};
        border:1px solid var(--border)"></div>`);
    }
    container.querySelector('#chart30').innerHTML =
      `<div style="display:grid;grid-template-columns:repeat(15,1fr);gap:4px">${cells.join('')}</div>`;
  }

  function scheduleReminder() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (_reminderTimer) clearTimeout(_reminderTimer);
    const t = localStorage.getItem('hizbReminderTime') || '20:00';
    const [h, m] = t.split(':').map(Number);
    const now = new Date();
    const target = new Date(now); target.setHours(h, m, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    const ms = target - now;
    _reminderTimer = setTimeout(() => {
      new Notification('Koran herinnering', { body: 'Tijd voor je dagelijkse hizb.' });
      scheduleReminder();
    }, ms);
  }
  ```
- [ ] Verify: open `#koran`. Click "Afvinken voor vandaag" — button becomes disabled and shows "Afgevinkt ✓". Streak shows `1`. The last cell of the 30-day grid turns green. Change reminder time, click Opslaan, see "Opgeslagen". Click "Notificaties inschakelen" — browser asks permission.
- [ ] Commit: `feat: koran module with hizb tracking and reminder`

---

## Phase 4 — Arabic SRS

### Task 4.1 — SM-2-lite algorithm (`js/srs.js`)

- [ ] Create `js/srs.js`:
  ```js
  import { ymd, uid } from './utils.js';

  export function newCard(front, back, note = null) {
    return {
      id: uid(),
      front, back, note,
      interval: 0, ease: 2.5, repetitions: 0,
      dueDate: ymd(), createdAt: new Date().toISOString(),
    };
  }

  // grade ∈ 'again' | 'hard' | 'good' | 'easy'
  // Mapping: Opnieuw=again, Moeilijk=hard, Bijna=good, Makkelijk=easy
  export function review(card, grade) {
    const c = { ...card };
    if (grade === 'again') {
      c.interval = 0;
      c.repetitions = 0;
      c.ease = Math.max(1.3, c.ease - 0.2);
    } else if (grade === 'hard') {
      c.interval = Math.max(1, Math.round(c.interval * 1.2));
      c.ease = Math.max(1.3, c.ease - 0.15);
      c.repetitions += 1;
    } else if (grade === 'good') {
      c.interval = Math.max(2, Math.round(c.interval * c.ease));
      c.repetitions += 1;
    } else if (grade === 'easy') {
      c.interval = Math.max(4, Math.round(c.interval * c.ease * 1.3));
      c.ease = c.ease + 0.15;
      c.repetitions += 1;
    }
    const due = new Date();
    due.setDate(due.getDate() + c.interval);
    c.dueDate = ymd(due);
    return c;
  }
  ```
- [ ] Verify (console):
  ```js
  const { newCard, review } = await import('./js/srs.js');
  let c = newCard('hond', 'كلب');
  c = review(c, 'good'); console.log(c.interval, c.dueDate); // interval ≥ 2
  c = review(c, 'easy'); console.log(c.interval, c.ease);    // ease ≥ 2.65
  c = review(c, 'again'); console.log(c.interval, c.ease);   // interval 0, ease lower
  ```
- [ ] Commit: `feat: sm-2-lite srs algorithm`

### Task 4.2 — Arabic module: list, CRUD, CSV import, review session

- [ ] Replace `js/modules/arabic.js` with:
  ```js
  import { all, put, del } from '../db.js';
  import { openModal } from '../components/modal.js';
  import { newCard, review } from '../srs.js';
  import { ymd, escapeHTML } from '../utils.js';

  export async function render(container) {
    const cards = await all('cards');
    const today = ymd();
    const due = cards.filter(c => c.dueDate <= today);

    container.innerHTML = `
      <h1>Arabisch</h1>
      <div class="card">
        <h2>Vandaag</h2>
        <p><b>${due.length}</b> kaart${due.length===1?'':'en'} te leren</p>
        <button class="btn block" id="start" ${due.length === 0 ? 'disabled' : ''}>Start sessie</button>
      </div>
      <button class="btn secondary block" id="add">+ Nieuwe kaart</button>
      <label for="import" class="btn secondary block" style="text-align:center;margin-top:8px;display:block">CSV importeren</label>
      <input type="file" id="import" accept=".csv,.tsv,.txt" style="display:none" />

      <h2 style="margin-top:16px">Alle kaarten (${cards.length})</h2>
      <input id="search" placeholder="Zoeken..." />
      <div class="list" id="cards-list" style="margin-top:8px"></div>
    `;

    const renderList = (filter = '') => {
      const list = container.querySelector('#cards-list');
      const f = filter.toLowerCase();
      const items = cards
        .filter(c => !f || c.front.toLowerCase().includes(f) || c.back.toLowerCase().includes(f))
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 200);
      if (!items.length) { list.innerHTML = '<p class="muted">Geen kaarten.</p>'; return; }
      list.innerHTML = items.map(c => `
        <div class="list-item">
          <div>
            <div><b>${escapeHTML(c.front)}</b> → ${escapeHTML(c.back)}</div>
            <div class="muted" style="font-size:.8rem">due ${c.dueDate} · ease ${c.ease.toFixed(2)} · interval ${c.interval}d</div>
          </div>
          <div class="row" style="flex:0 0 auto;gap:4px">
            <button class="btn secondary" data-edit="${c.id}">✎</button>
            <button class="btn danger" data-del="${c.id}">×</button>
          </div>
        </div>`).join('');
      list.querySelectorAll('[data-del]').forEach(b => {
        b.onclick = async () => { await del('cards', b.dataset.del); render(container); };
      });
      list.querySelectorAll('[data-edit]').forEach(b => {
        b.onclick = () => openCardModal(container, cards.find(c => c.id === b.dataset.edit));
      });
    };

    renderList();
    container.querySelector('#search').oninput = (e) => renderList(e.target.value);
    container.querySelector('#add').onclick = () => openCardModal(container, null);
    container.querySelector('#start').onclick = () => startSession(container, due);
    container.querySelector('#import').onchange = (e) => importCSV(container, e.target.files[0]);
  }

  function openCardModal(container, existing) {
    openModal(existing ? 'Kaart bewerken' : 'Nieuwe kaart', `
      <label>Voorkant *</label><input name="front" required value="${existing ? escapeHTML(existing.front) : ''}" />
      <label>Achterkant *</label><input name="back" required value="${existing ? escapeHTML(existing.back) : ''}" />
      <label>Notitie</label><input name="note" value="${existing && existing.note ? escapeHTML(existing.note) : ''}" />
    `, async (d) => {
      if (!d.front || !d.back) throw new Error('Vul beide velden in');
      if (existing) {
        await put('cards', { ...existing, front: d.front, back: d.back, note: d.note || null });
      } else {
        await put('cards', newCard(d.front, d.back, d.note || null));
      }
      render(container);
    });
  }

  async function importCSV(container, file) {
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    let ok = 0, skip = 0;
    for (const line of lines) {
      const parts = line.includes('\t') ? line.split('\t') : line.split(',');
      const [front, back, note] = parts.map(p => (p || '').trim());
      if (!front || !back) { skip++; continue; }
      await put('cards', newCard(front, back, note || null));
      ok++;
    }
    alert(`${ok} geïmporteerd, ${skip} overgeslagen`);
    render(container);
  }

  function startSession(container, queue) {
    let idx = 0;
    let revealed = false;
    const showCard = () => {
      if (idx >= queue.length) { render(container); return; }
      const c = queue[idx];
      container.innerHTML = `
        <h1>Sessie (${idx + 1}/${queue.length})</h1>
        <div class="card" style="text-align:center;padding:32px">
          <div style="font-size:1.6rem">${escapeHTML(c.front)}</div>
          ${revealed ? `<hr style="border-color:var(--border);margin:16px 0" />
            <div style="font-size:1.4rem">${escapeHTML(c.back)}</div>
            ${c.note ? `<div class="muted" style="margin-top:8px">${escapeHTML(c.note)}</div>` : ''}` : ''}
        </div>
        ${revealed ? `
          <div class="row">
            <button class="btn danger" data-grade="again">Opnieuw</button>
            <button class="btn secondary" data-grade="hard">Moeilijk</button>
          </div>
          <div class="row" style="margin-top:8px">
            <button class="btn" data-grade="good">Bijna</button>
            <button class="btn" data-grade="easy" style="background:var(--ok)">Makkelijk</button>
          </div>` : `<button class="btn block" id="reveal">Toon antwoord</button>`}
        <button class="btn secondary block" id="stop" style="margin-top:16px">Stoppen</button>
      `;
      if (!revealed) {
        container.querySelector('#reveal').onclick = () => { revealed = true; showCard(); };
      } else {
        container.querySelectorAll('[data-grade]').forEach(btn => {
          btn.onclick = async () => {
            const updated = review(c, btn.dataset.grade);
            await put('cards', updated);
            idx++; revealed = false; showCard();
          };
        });
      }
      container.querySelector('#stop').onclick = () => render(container);
    };
    showCard();
  }
  ```
- [ ] Verify: open `#arabic`. Click `+ Nieuwe kaart`, add front "hond", back "كلب", save. The list shows it; "1 kaart te leren". Click "Start sessie" — front shown, click "Toon antwoord", click "Makkelijk". Session ends. The card now has a future due date (≥ today + 4). Create a local `test.tsv` with one line `kat\tقطة`, click "CSV importeren" → "1 geïmporteerd, 0 overgeslagen". Search field filters list.
- [ ] Commit: `feat: arabic srs module with cards, sessions, csv import`

---

## Phase 5 — Goals

### Task 5.1 — Goals module (long/short term, progress slider)

- [ ] Replace `js/modules/goals.js` with:
  ```js
  import { all, put, del } from '../db.js';
  import { openModal } from '../components/modal.js';
  import { uid, escapeHTML } from '../utils.js';

  export async function render(container) {
    const goals = await all('goals');
    const long = goals.filter(g => g.term === 'long');
    const short = goals.filter(g => g.term === 'short');

    container.innerHTML = `
      <h1>Doelen</h1>
      <button class="btn block" id="add-long">+ Lange termijn doel</button>
      <button class="btn secondary block" id="add-short" style="margin-top:8px">+ Korte termijn doel</button>

      <h2 style="margin-top:16px">Lange termijn</h2>
      <div class="list" id="long-list"></div>
      <h2 style="margin-top:16px">Korte termijn</h2>
      <div class="list" id="short-list"></div>
    `;

    renderSection(container, '#long-list', long);
    renderSection(container, '#short-list', short);

    container.querySelector('#add-long').onclick = () => openGoalModal(container, null, 'long');
    container.querySelector('#add-short').onclick = () => openGoalModal(container, null, 'short');
  }

  function renderSection(container, sel, items) {
    const el = container.querySelector(sel);
    if (!items.length) { el.innerHTML = '<p class="muted">Nog geen doelen.</p>'; return; }
    el.innerHTML = items.map(g => `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:start;gap:8px">
          <div>
            <b>${escapeHTML(g.title)}</b>
            ${g.deadline ? `<div class="muted" style="font-size:.8rem">deadline ${g.deadline}</div>` : ''}
            ${g.description ? `<div class="muted" style="margin-top:4px">${escapeHTML(g.description)}</div>` : ''}
          </div>
          <div class="row" style="flex:0 0 auto;gap:4px">
            <button class="btn secondary" data-edit="${g.id}">✎</button>
            <button class="btn danger" data-del="${g.id}">×</button>
          </div>
        </div>
        <label>Voortgang: <b>${g.progress}%</b></label>
        <input type="range" min="0" max="100" value="${g.progress}" data-progress="${g.id}" />
      </div>`).join('');
    el.querySelectorAll('[data-del]').forEach(b => {
      b.onclick = async () => { await del('goals', b.dataset.del); render(container); };
    });
    el.querySelectorAll('[data-edit]').forEach(b => {
      b.onclick = () => {
        const g = items.find(x => x.id === b.dataset.edit);
        openGoalModal(container, g, g.term);
      };
    });
    el.querySelectorAll('[data-progress]').forEach(input => {
      input.onchange = async () => {
        const g = items.find(x => x.id === input.dataset.progress);
        await put('goals', { ...g, progress: parseInt(input.value, 10) });
        render(container);
      };
    });
  }

  function openGoalModal(container, existing, term) {
    openModal(existing ? 'Doel bewerken' : 'Nieuw doel', `
      <label>Titel *</label><input name="title" required value="${existing ? escapeHTML(existing.title) : ''}" />
      <label>Beschrijving</label><textarea name="description" rows="3">${existing && existing.description ? escapeHTML(existing.description) : ''}</textarea>
      <label>Deadline</label><input name="deadline" type="date" value="${existing && existing.deadline ? existing.deadline : ''}" />
    `, async (d) => {
      if (!d.title) throw new Error('Titel verplicht');
      const base = existing || { id: uid(), term, progress: 0 };
      await put('goals', { ...base, title: d.title, description: d.description || '', deadline: d.deadline || null });
      render(container);
    });
  }
  ```
- [ ] Verify: open `#goals`. Add a long-term goal "Hadj 2030" with deadline `2030-08-01`. Drag the slider to 25; value persists (reload page, still 25%). Add a short-term goal. Edit and delete work.
- [ ] Commit: `feat: goals module with long/short term and progress`

---

## Phase 6 — Todo

### Task 6.1 — Todo module (3 priority buckets, archive)

- [ ] Replace `js/modules/todo.js` with:
  ```js
  import { all, put, del } from '../db.js';
  import { openModal } from '../components/modal.js';
  import { uid, escapeHTML } from '../utils.js';

  const LABELS = { high: 'Prioriteit', medium: 'Medium', waiting: 'Waiting' };

  export async function render(container) {
    const todos = await all('todos');
    const active = todos.filter(t => !t.done);
    const archived = todos.filter(t => t.done);
    const view = container.dataset.todoView || 'active';

    container.innerHTML = `
      <h1>To-do</h1>
      <div class="row">
        <button class="btn ${view==='active'?'':'secondary'}" id="tab-active">Actief (${active.length})</button>
        <button class="btn ${view==='archive'?'':'secondary'}" id="tab-archive">Afgerond (${archived.length})</button>
      </div>
      <button class="btn block" id="add" style="margin-top:8px">+ Nieuwe taak</button>
      <div id="todo-body" style="margin-top:16px"></div>
    `;

    const body = container.querySelector('#todo-body');
    if (view === 'active') {
      body.innerHTML = ['high','medium','waiting'].map(p => `
        <h2>${LABELS[p]}</h2>
        <div class="list" data-bucket="${p}"></div>
      `).join('');
      for (const p of ['high','medium','waiting']) {
        renderBucket(container, p, active.filter(t => t.priority === p));
      }
    } else {
      body.innerHTML = `<div class="list" data-bucket="archive"></div>`;
      renderArchive(container, archived);
    }

    container.querySelector('#add').onclick = () => openTodoModal(container);
    container.querySelector('#tab-active').onclick = () => { container.dataset.todoView = 'active'; render(container); };
    container.querySelector('#tab-archive').onclick = () => { container.dataset.todoView = 'archive'; render(container); };
  }

  function renderBucket(container, p, items) {
    const el = container.querySelector(`[data-bucket="${p}"]`);
    if (!items.length) { el.innerHTML = '<p class="muted">Geen taken.</p>'; return; }
    el.innerHTML = items.map(t => `
      <div class="list-item">
        <label style="display:flex;gap:8px;align-items:center;flex:1;margin:0">
          <input type="checkbox" data-check="${t.id}" style="width:auto" />
          <div>
            <div>${escapeHTML(t.title)}</div>
            ${t.note ? `<div class="muted" style="font-size:.8rem">${escapeHTML(t.note)}</div>` : ''}
          </div>
        </label>
        <button class="btn danger" data-del="${t.id}">×</button>
      </div>`).join('');
    el.querySelectorAll('[data-check]').forEach(cb => {
      cb.onchange = async () => {
        const t = items.find(x => x.id === cb.dataset.check);
        await put('todos', { ...t, done: true });
        render(container);
      };
    });
    el.querySelectorAll('[data-del]').forEach(b => {
      b.onclick = async () => { await del('todos', b.dataset.del); render(container); };
    });
  }

  function renderArchive(container, items) {
    const el = container.querySelector('[data-bucket="archive"]');
    if (!items.length) { el.innerHTML = '<p class="muted">Niets afgerond.</p>'; return; }
    el.innerHTML = items.map(t => `
      <div class="list-item">
        <div>
          <div style="text-decoration:line-through">${escapeHTML(t.title)}</div>
          <div class="muted" style="font-size:.8rem">${LABELS[t.priority]}</div>
        </div>
        <div class="row" style="flex:0 0 auto;gap:4px">
          <button class="btn secondary" data-restore="${t.id}">↺</button>
          <button class="btn danger" data-del="${t.id}">×</button>
        </div>
      </div>`).join('');
    el.querySelectorAll('[data-restore]').forEach(b => {
      b.onclick = async () => {
        const t = items.find(x => x.id === b.dataset.restore);
        await put('todos', { ...t, done: false });
        render(container);
      };
    });
    el.querySelectorAll('[data-del]').forEach(b => {
      b.onclick = async () => { await del('todos', b.dataset.del); render(container); };
    });
  }

  function openTodoModal(container) {
    openModal('Nieuwe taak', `
      <label>Titel *</label><input name="title" required />
      <label>Notitie</label><textarea name="note" rows="2"></textarea>
      <label>Prioriteit</label>
      <select name="priority">
        <option value="high">Prioriteit</option>
        <option value="medium">Medium</option>
        <option value="waiting">Waiting</option>
      </select>
    `, async (d) => {
      if (!d.title) throw new Error('Titel verplicht');
      await put('todos', {
        id: uid(), title: d.title, note: d.note || null,
        priority: d.priority, done: false, createdAt: new Date().toISOString(),
      });
      render(container);
    });
  }
  ```
- [ ] Verify: open `#todo`. Add a task "Belastingaangifte" with priority Prioriteit. It appears under Prioriteit. Check the box — count drops, switch to Afgerond to see it. Click ↺ to restore.
- [ ] Commit: `feat: todo module with priorities and archive`

---

## Phase 7 — Dashboard Aggregation

### Task 7.1 — Dashboard pulls live data from all modules

- [ ] Replace `js/modules/dashboard.js` with:
  ```js
  import { all } from '../db.js';
  import { fmtMoney, startOfWeek, startOfMonth, ymd, sameDay, escapeHTML } from '../utils.js';

  export async function render(container) {
    const [rides, hizb, todos, cards] = await Promise.all([
      all('rides'), all('hizb_log'), all('todos'), all('cards'),
    ]);
    const now = new Date();
    const todayRides = rides.filter(r => sameDay(new Date(r.date), now));
    const weekRides  = rides.filter(r => new Date(r.date) >= startOfWeek(now));
    const monthRides = rides.filter(r => new Date(r.date) >= startOfMonth(now));
    const sum = (arr) => arr.reduce((s, r) => s + Number(r.amount || 0), 0);

    const today = ymd();
    const todayHizb = hizb.some(h => h.date === today);
    const doneSet = new Set(hizb.map(h => h.date));
    let streak = 0;
    const cur = new Date();
    while (doneSet.has(ymd(cur))) { streak++; cur.setDate(cur.getDate() - 1); }

    const dueCards = cards.filter(c => c.dueDate <= today).length;
    const topTodos = todos.filter(t => !t.done && t.priority === 'high').slice(0, 3);

    container.innerHTML = `
      <h1>Dashboard</h1>
      <div class="card">
        <h2>🚖 Taxi</h2>
        <p>Vandaag: <b>${fmtMoney(sum(todayRides))}</b></p>
        <p class="muted">Deze week: ${fmtMoney(sum(weekRides))} · Deze maand: ${fmtMoney(sum(monthRides))}</p>
      </div>
      <div class="card">
        <h2>📖 Koran</h2>
        <p>Vandaag: <b>${todayHizb ? 'Afgevinkt ✓' : 'Nog niet afgevinkt'}</b></p>
        <p class="muted">Streak: ${streak} dag${streak===1?'':'en'}</p>
      </div>
      <div class="card">
        <h2>📚 Arabisch</h2>
        <p><b>${dueCards}</b> kaart${dueCards===1?'':'en'} vandaag te leren</p>
      </div>
      <div class="card">
        <h2>✅ Top prioriteiten</h2>
        ${topTodos.length
          ? topTodos.map(t => `<p>• ${escapeHTML(t.title)}</p>`).join('')
          : '<p class="muted">Geen prioriteit-taken.</p>'}
      </div>
    `;
  }
  ```
- [ ] Verify: open `#dashboard`. With seed data from earlier phases, see Taxi totals, hizb status, due cards count, and top todos. Add a new ride in Taxi, return to Dashboard — number updates.
- [ ] Commit: `feat: dashboard aggregation view`

---

## Phase 8 — PWA Polish

### Task 8.1 — Manifest and icons

- [ ] Replace `manifest.json` with:
  ```json
  {
    "name": "Dashboard",
    "short_name": "Dashboard",
    "start_url": ".",
    "scope": ".",
    "display": "standalone",
    "background_color": "#111418",
    "theme_color": "#111418",
    "orientation": "portrait",
    "icons": [
      { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
      { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
    ]
  }
  ```
- [ ] Create placeholder icon files in `icons/`:
  ```bash
  cd "/Users/soef/claude code/icons"
  touch icon-192.png icon-512.png
  ```
  (User can drop in real PNGs later; placeholders are fine for now and the SW will not block on them.)
- [ ] Verify: open DevTools > Application > Manifest. It parses without errors. Icons may show as broken — acceptable for now.
- [ ] Commit: `feat: pwa manifest and icon placeholders`

### Task 8.2 — Service worker for offline shell

- [ ] Replace `service-worker.js` with:
  ```js
  const CACHE = 'dashboard-v1';
  const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './css/styles.css',
    './js/app.js',
    './js/db.js',
    './js/router.js',
    './js/utils.js',
    './js/srs.js',
    './js/components/modal.js',
    './js/modules/dashboard.js',
    './js/modules/taxi.js',
    './js/modules/koran.js',
    './js/modules/arabic.js',
    './js/modules/goals.js',
    './js/modules/todo.js',
  ];

  self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
  });

  self.addEventListener('activate', (e) => {
    e.waitUntil(
      caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
        .then(() => self.clients.claim())
    );
  });

  self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => { try { c.put(e.request, copy); } catch (_) {} });
        return resp;
      }).catch(() => caches.match('./index.html')))
    );
  });
  ```
- [ ] In `js/app.js`, add at the very end of `main()` (after `initRouter()`):
  ```js
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(err => console.warn('SW error', err));
  }
  ```
- [ ] Verify: reload `http://localhost:8000`. DevTools > Application > Service Workers shows the worker active. Application > Cache Storage shows `dashboard-v1` with the assets. Stop the dev server (Ctrl-C) and reload — the page still loads from cache. Restart the server.
- [ ] Commit: `feat: service worker for offline shell`

### Task 8.3 — Install prompt hint

- [ ] In `js/app.js`, **before** the SW registration block, add:
  ```js
  let _deferredInstall = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _deferredInstall = e;
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = 'App installeren';
    btn.style.cssText = 'position:fixed;top:8px;right:8px;z-index:30';
    btn.onclick = async () => {
      btn.remove();
      _deferredInstall.prompt();
      await _deferredInstall.userChoice;
      _deferredInstall = null;
    };
    document.body.appendChild(btn);
  });
  ```
- [ ] Verify: in Chrome desktop, after the SW is registered and the page is reloaded, an "App installeren" button may appear top-right (Chrome only fires the event when PWA criteria are met — may require real icons; if it doesn't fire, that's OK, the code is harmless). Click "Notificaties inschakelen" in Koran module to confirm permission flow still works after SW is active.
- [ ] Commit: `feat: install prompt and pwa polish`

---

## Self-Review (run after writing this plan; fix inline)

- **Spec coverage:** All 6 modules from the spec have a phase (Dashboard P7, Taxi P2, Koran P3, Arabic P4, Goals P5, Todo P6). PWA + service worker + manifest covered in P8.
- **Data model:** Every store from the spec (`rides`, `expenses`, `hizb_log`, `cards`, `goals`, `todos`) is created in `db.js` (Task 1.3) and used by exactly the right module.
- **Field names match the spec exactly:**
  - `source` ∈ 'uber' | 'bolt' | 'whatsapp' — used in ride select and `bySource`.
  - `category` ∈ 'brandstof' | 'verzekering' | 'onderhoud' | 'overig' — used in expense select.
  - `term` ∈ 'long' | 'short' — used in goals filter and modal.
  - `priority` ∈ 'high' | 'medium' | 'waiting' — used in todo buckets and modal.
- **SM-2-lite formulas match prompt exactly:** Opnieuw → interval=0, repetitions=0, ease -= 0.2 (min 1.3); Moeilijk → interval = max(1, round(interval*1.2)), ease -= 0.15 (min 1.3); Bijna → interval = max(2, round(interval*ease)), no ease change; Makkelijk → interval = max(4, round(interval*ease*1.3)), ease += 0.15.
- **Settings:** `theme`, `hizbReminderTime`, `hizbStartPoint` read/written from `localStorage`. (Note: `theme` is reserved via `<body data-theme="dark">` default; a runtime toggle is not in the spec's MVP, only the storage key.)
- **No "implement X" placeholders:** every code-writing step contains actual code.
- **Verification steps are concrete:** each verification specifies a URL/action and an observable outcome.
- **Commit at each task:** every task ends with a `Commit:` line and an exact message.
- **File structure:** all files in the prompt's structure block are created; `js/utils.js` and `js/srs.js` added as shared helpers (justified — they are imported by multiple modules).
- **Cross-check:** `js/router.js` is referenced by the prompt's required structure and is created in Task 1.4. The placeholder for `theme` toggle is not surfaced in UI (spec calls it "toggle in instellingen" but doesn't require it for MVP); LocalStorage key is reserved so a later patch can wire it.

## Final structure produced by this plan

```
.gitignore
index.html
manifest.json
service-worker.js
css/styles.css
js/app.js
js/db.js
js/router.js
js/utils.js
js/srs.js
js/modules/dashboard.js
js/modules/taxi.js
js/modules/koran.js
js/modules/arabic.js
js/modules/goals.js
js/modules/todo.js
js/components/modal.js
icons/icon-192.png
icons/icon-512.png
docs/superpowers/specs/2026-06-04-personal-dashboard-design.md
docs/superpowers/plans/2026-06-04-personal-dashboard.md
```
