import { all, put, clear } from '../db.js';
import { getSetting, setSetting } from '../settings.js';
import { setThemeMode, setAccent, ACCENT_NAMES } from '../theme.js';
import { BADGES, computeEarnedBadges } from '../achievements.js';
import { ok, err } from './toast.js';

const STORES = ['rides', 'expenses', 'hizb_log', 'cards', 'goals', 'todos', 'shifts'];

export async function openSettings(onClose) {
  const earned = await computeEarnedBadges();
  const themeMode = getSetting('themeMode') || 'dark';
  const accent = getSetting('accentColor') || 'gold';

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <h2>Instellingen</h2>

      <label>Thema</label>
      <select id="set-theme">
        <option value="dark" ${themeMode==='dark'?'selected':''}>Donker</option>
        <option value="light" ${themeMode==='light'?'selected':''}>Licht</option>
        <option value="auto" ${themeMode==='auto'?'selected':''}>Automatisch (volgt systeem)</option>
      </select>

      <label>Accent-kleur</label>
      <div class="accent-picker" id="accent-picker">
        ${ACCENT_NAMES.map(name => `
          <button type="button" class="accent-swatch accent-${name} ${name===accent?'active':''}" data-accent="${name}" aria-label="${name}"></button>
        `).join('')}
      </div>

      <label>Dagelijks inkomensdoel (€)</label>
      <input id="set-goal" type="number" step="1" value="${getSetting('dailyIncomeGoal')}" />

      <label>Belastingreservering (%)</label>
      <input id="set-tax" type="number" step="1" min="0" max="100" value="${getSetting('taxReservePercent')}" />

      <div class="row" style="margin-top:16px">
        <button type="button" class="btn" id="save-settings">Opslaan</button>
      </div>

      <hr style="border-color:var(--border);margin:20px 0" />

      <h3>🏆 Badges (${earned.size}/${BADGES.length})</h3>
      <div class="badge-grid">
        ${BADGES.map(b => `
          <div class="badge ${earned.has(b.id) ? 'earned' : 'locked'}" title="${b.desc}">
            <div class="badge-emoji">${earned.has(b.id) ? b.emoji : '🔒'}</div>
            <div class="badge-name">${b.name}</div>
          </div>
        `).join('')}
      </div>

      <hr style="border-color:var(--border);margin:20px 0" />

      <h3>Backup</h3>
      <p class="muted" style="font-size:.85rem;margin:0 0 12px">Bewaar je data of zet 'm terug.</p>
      <button type="button" class="btn block" id="export-data">📥 Exporteer alle data (JSON)</button>
      <label for="import-data" class="btn secondary block" style="text-align:center;display:block;margin-top:8px">📤 Importeer data</label>
      <input type="file" id="import-data" accept=".json" style="display:none" />

      <hr style="border-color:var(--border);margin:20px 0" />

      <div class="row">
        <button type="button" class="btn secondary" id="close-settings">Sluiten</button>
      </div>
    </div>`;
  document.body.appendChild(backdrop);

  const close = () => { backdrop.remove(); if (onClose) onClose(); };
  backdrop.querySelector('#close-settings').onclick = close;
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });

  backdrop.querySelectorAll('[data-accent]').forEach(btn => {
    btn.onclick = () => {
      setAccent(btn.dataset.accent);
      backdrop.querySelectorAll('.accent-swatch').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
    };
  });

  backdrop.querySelector('#set-theme').onchange = (e) => setThemeMode(e.target.value);

  backdrop.querySelector('#save-settings').onclick = () => {
    setSetting('dailyIncomeGoal', backdrop.querySelector('#set-goal').value);
    setSetting('taxReservePercent', backdrop.querySelector('#set-tax').value);
    ok('Opgeslagen');
    close();
  };

  backdrop.querySelector('#export-data').onclick = async () => {
    try {
      const data = {};
      for (const s of STORES) data[s] = await all(s);
      data._settings = {
        dailyIncomeGoal: getSetting('dailyIncomeGoal'),
        taxReservePercent: getSetting('taxReservePercent'),
        hizbReminderTime: getSetting('hizbReminderTime'),
        hizbStartPoint: getSetting('hizbStartPoint'),
        themeMode: getSetting('themeMode'),
        accentColor: getSetting('accentColor'),
      };
      data._exportedAt = new Date().toISOString();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'dashboard-backup-' + new Date().toISOString().slice(0,10) + '.json';
      a.click();
      URL.revokeObjectURL(a.href);
      ok('Backup gedownload');
    } catch (e) { err('Export mislukt: ' + e.message); }
  };

  backdrop.querySelector('#import-data').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!confirm('Importeren overschrijft al je huidige data. Doorgaan?')) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      for (const s of STORES) {
        if (!Array.isArray(data[s])) continue;
        await clear(s);
        for (const item of data[s]) await put(s, item);
      }
      if (data._settings) {
        for (const [k, v] of Object.entries(data._settings)) setSetting(k, v);
      }
      ok('Geïmporteerd. Pagina ververst.');
      setTimeout(() => location.reload(), 500);
    } catch (e2) { err('Import mislukt: ' + e2.message); }
  };
}
