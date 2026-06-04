import { all, put, clear } from '../db.js';
import { getSetting, setSetting } from '../settings.js';

const STORES = ['rides', 'expenses', 'hizb_log', 'cards', 'goals', 'todos', 'shifts'];

export function openSettings(onClose) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <h2>Instellingen</h2>

      <label>Dagelijks inkomensdoel (€)</label>
      <input id="set-goal" type="number" step="1" value="${getSetting('dailyIncomeGoal')}" />

      <label>Belastingreservering (%)</label>
      <input id="set-tax" type="number" step="1" min="0" max="100" value="${getSetting('taxReservePercent')}" />

      <div class="row" style="margin-top:16px">
        <button type="button" class="btn" id="save-settings">Opslaan</button>
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

  backdrop.querySelector('#save-settings').onclick = () => {
    setSetting('dailyIncomeGoal', backdrop.querySelector('#set-goal').value);
    setSetting('taxReservePercent', backdrop.querySelector('#set-tax').value);
    alert('Opgeslagen');
    close();
  };

  backdrop.querySelector('#export-data').onclick = async () => {
    const data = {};
    for (const s of STORES) data[s] = await all(s);
    data._settings = { dailyIncomeGoal: getSetting('dailyIncomeGoal'), taxReservePercent: getSetting('taxReservePercent'), hizbReminderTime: getSetting('hizbReminderTime'), hizbStartPoint: getSetting('hizbStartPoint') };
    data._exportedAt = new Date().toISOString();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'dashboard-backup-' + new Date().toISOString().slice(0,10) + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  backdrop.querySelector('#import-data').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!confirm('Importeren overschrijft al je huidige data. Doorgaan?')) return;
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
    alert('Geïmporteerd. Pagina ververst.');
    location.reload();
  };
}
