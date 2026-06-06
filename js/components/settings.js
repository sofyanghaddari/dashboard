import { all, put, clear } from '../db.js';
import { getSetting, setSetting } from '../settings.js';
import { setThemeMode, setAccent, ACCENT_NAMES, setPreset, THEME_PRESETS, setDensity } from '../theme.js';
import { BADGES, computeEarnedBadges } from '../achievements.js';
import { ok, err } from './toast.js';
import { exportICal } from '../export-ical.js';
import { setupGithub, syncUp, syncDown, syncMerge, getSyncStatus, listVersions, createSecondaryGist, removeGist, emailGistLink } from '../github-sync.js';
import { isLockEnabled, setPin, clearUnlock } from '../lock.js';
import { biometricAvailable, platformAuthenticatorAvailable, registerBiometric, isBiometricEnabled, disableBiometric } from '../biometric.js';
import { exportMonthPDF } from '../pdf-export.js';
import { openWeeklyReview } from './weekly-review.js';
import { getCustomShame, setCustomShame, customMascot, setCustomMascot } from '../mascot.js';

const STORES = ['rides', 'expenses', 'hizb_log', 'cards', 'goals', 'todos', 'shifts', 'notes', 'habits', 'habit_log', 'pots'];

export async function openVersionPicker() {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal">
      <button type="button" class="modal-close" id="vp-x" aria-label="Sluiten">×</button>
      <h2>Backup-versies</h2>
      <p class="muted" style="font-size:.85rem">Kies een eerdere backup om naar terug te gaan. Laatste 30 versies worden bewaard.</p>
      <div id="vp-list" style="margin-top:12px">Laden…</div>
    </div>`;
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.remove(); });
  backdrop.querySelector('#vp-x').onclick = () => backdrop.remove();

  try {
    const versions = await listVersions();
    const list = backdrop.querySelector('#vp-list');
    if (!versions.length) { list.innerHTML = '<p class="muted">Geen versies gevonden.</p>'; return; }
    list.innerHTML = '<div class="list">' + versions.map((v, i) => `
      <div class="list-item">
        <div>
          <b>${v.date ? v.date.toLocaleString('nl-NL') : v.filename}</b>
          <div class="muted" style="font-size:.75rem">${(v.size/1024).toFixed(1)} KB · ${v.filename}</div>
        </div>
        <button class="btn" data-restore="${v.filename}">Herstel</button>
      </div>
    `).join('') + '</div>';
    list.querySelectorAll('[data-restore]').forEach(b => {
      b.onclick = async () => {
        if (!confirm(`Backup van ${b.previousElementSibling.querySelector('b').textContent} herstellen? Huidige data wordt overschreven.`)) return;
        try {
          await syncDown(b.dataset.restore);
          ok('Hersteld. Pagina ververst.');
          setTimeout(() => location.reload(), 500);
        } catch (e) { err(e.message); }
      };
    });
  } catch (e) {
    backdrop.querySelector('#vp-list').innerHTML = `<p class="muted">Fout: ${e.message}</p>`;
  }
}

export async function openSettings(onClose) {
  const earned = await computeEarnedBadges();
  const themeMode = getSetting('themeMode') || 'dark';
  const accent = getSetting('accentColor') || 'gold';
  const preset = getSetting('themePreset') || 'midnight';
  const sync = getSyncStatus();
  const lockOn = isLockEnabled();

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <button type="button" class="modal-close" id="close-settings-x" aria-label="Sluiten">×</button>
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

      <label>Sfeer / thema</label>
      <div class="preset-picker">
        ${THEME_PRESETS.map(p => `<button type="button" class="preset-chip preset-${p} ${p===preset?'active':''}" data-preset="${p}">${p}</button>`).join('')}
      </div>

      <label>Dichtheid</label>
      <div class="segmented" id="density-pick">
        <button type="button" class="seg ${(getSetting('density')||'comfortable')==='comfortable'?'active':''}" data-density="comfortable">Ruim</button>
        <button type="button" class="seg ${getSetting('density')==='compact'?'active':''}" data-density="compact">Compact</button>
      </div>

      <label>Dagelijks inkomensdoel (€)</label>
      <input id="set-goal" type="number" step="1" value="${getSetting('dailyIncomeGoal')}" />

      <label>Maandelijks inkomensdoel (€)</label>
      <input id="set-mgoal" type="number" step="50" value="${getSetting('monthlyIncomeGoal')}" />

      <div class="row" style="margin-top:16px">
        <button type="button" class="btn" id="save-settings">Opslaan</button>
      </div>

      <hr style="border-color:var(--border);margin:20px 0" />

      <h3>Beveiliging</h3>
      <p class="muted" style="font-size:.85rem;margin:0 0 12px">Vergrendel de app bij openen.</p>

      <div class="settings-group">
        <div class="settings-row" id="bio-row">
          <div class="settings-row-main">
            <div class="settings-row-title">Face ID / Touch ID</div>
            <div class="settings-row-sub muted">Checken…</div>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-main">
            <div class="settings-row-title">PIN-code</div>
            <div class="settings-row-sub muted">${lockOn ? 'Ingesteld' : 'Niet ingesteld'}</div>
          </div>
          <div class="row" style="flex:0 0 auto">
            <button type="button" class="btn secondary" id="set-pin">${lockOn ? 'Wijzig' : 'Instellen'}</button>
            ${lockOn ? `<button type="button" class="btn danger" id="remove-pin">Verwijder</button>` : ''}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-main">
            <div class="settings-row-title">Niet opnieuw vragen voor</div>
            <div class="settings-row-sub muted">Na ontgrendeling blijft de app open</div>
          </div>
          <select id="lock-grace" style="flex:0 0 auto;width:auto">
            ${[
              ['0','Altijd vragen'],['1','1 minuut'],['5','5 minuten'],
              ['15','15 minuten'],['60','1 uur'],['1440','24 uur'],
            ].map(([v,l]) => `<option value="${v}" ${getSetting('lockGraceMin')===v?'selected':''}>${l}</option>`).join('')}
          </select>
        </div>
        <div class="settings-row">
          <div class="settings-row-main">
            <div class="settings-row-title">Nu vergrendelen</div>
            <div class="settings-row-sub muted">Vraag direct opnieuw om PIN/Face ID</div>
          </div>
          <button type="button" class="btn secondary" id="lock-now" style="flex:0 0 auto">Vergrendel</button>
        </div>
      </div>

      <hr style="border-color:var(--border);margin:20px 0" />

      <h3>☁️ GitHub auto-backup</h3>
      <p class="muted" style="font-size:.85rem;margin:0 0 8px">
        ${sync.enabled
          ? `Ingeschakeld. Laatste sync: ${sync.last ? sync.last.toLocaleString('nl-NL') : 'nooit'}`
          : `Slaat data automatisch op naar een privé-Gist. Vereist <a href="https://github.com/settings/tokens/new?scopes=gist&description=Dashboard" target="_blank" style="color:var(--accent)">GitHub token (scope: gist)</a>.`}
      </p>
      ${!sync.enabled ? `
        <input id="gh-token" type="password" placeholder="GitHub Personal Access Token" />
        <button type="button" class="btn block" id="gh-setup" style="margin-top:8px">Verbind GitHub</button>
      ` : `
        <div class="settings-row-sub muted" style="margin-bottom:8px">
          ${sync.gistCount} gist${sync.gistCount===1?'':'s'} actief
          ${sync.gistIds.map(id => `<div style="font-size:.75rem;font-family:monospace;margin-top:2px">${id.slice(0,12)}…</div>`).join('')}
        </div>
        <div class="row">
          <button type="button" class="btn" id="gh-sync-up">⬆️ Pushen</button>
          <button type="button" class="btn" id="gh-sync-merge">🔀 Slim mergen</button>
        </div>
        <button type="button" class="btn secondary block" id="gh-sync-down" style="margin-top:8px">⬇️ Volledig overschrijven met cloud</button>
        <label class="settings-row" style="text-transform:none;margin-top:8px;padding:0">
          <div class="settings-row-main">
            <div class="settings-row-title">Auto-merge bij openen</div>
            <div class="settings-row-sub muted">Haalt remote data en mergt met lokaal elke keer dat je opent</div>
          </div>
          <span class="ios-switch"><input type="checkbox" id="set-autopull" ${getSetting('autoPullOnOpen')==='1'?'checked':''} /><span></span></span>
        </label>
        <button type="button" class="btn secondary block" id="gh-versions" style="margin-top:8px">📜 Versie-historie bekijken</button>
        <button type="button" class="btn secondary block" id="gh-mirror" style="margin-top:8px" ${sync.gistCount>=2?'disabled':''}>🪞 Voeg tweede gist toe (extra backup)</button>
        <button type="button" class="btn secondary block" id="gh-email" style="margin-top:8px">✉️ Email mezelf de backup-links</button>
        <button type="button" class="btn danger block" id="gh-disconnect" style="margin-top:8px">Verbinding verbreken</button>
      `}

      <hr style="border-color:var(--border);margin:20px 0" />

      <h3>📅 Agenda-export</h3>
      <p class="muted" style="font-size:.85rem;margin:0 0 8px">Download .ics-bestand met al je doelen-deadlines en herhalende taken. Open in Apple Agenda / Google Agenda.</p>
      <button type="button" class="btn block" id="export-ical">📅 Download iCal-bestand</button>

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

      <h3>Lokale backup &amp; export</h3>
      <button type="button" class="btn block" id="export-data">Exporteer data (JSON)</button>
      <label for="import-data" class="btn secondary block" style="text-align:center;display:block;margin-top:8px">Importeer data</label>
      <input type="file" id="import-data" accept=".json" style="display:none" />
      <button type="button" class="btn secondary block" id="export-pdf" style="margin-top:8px">Print/PDF — Maandoverzicht voor administratie</button>
      <button type="button" class="btn secondary block" id="print-page" style="margin-top:8px">Print huidige pagina</button>

      <div class="settings-group" style="margin-top:14px">
        <label class="settings-row" style="text-transform:none">
          <div class="settings-row-main">
            <div class="settings-row-title">Auto-export wekelijks (JSON)</div>
            <div class="settings-row-sub muted">Download elke 7 dagen automatisch</div>
          </div>
          <span class="ios-switch"><input type="checkbox" id="set-auto-export" ${getSetting('autoExport')==='1'?'checked':''} /><span></span></span>
        </label>
        <label class="settings-row" style="text-transform:none">
          <div class="settings-row-main">
            <div class="settings-row-title">Auto-PDF maandelijks</div>
            <div class="settings-row-sub muted">1e van de maand automatisch maandoverzicht openen</div>
          </div>
          <span class="ios-switch"><input type="checkbox" id="set-auto-pdf" ${getSetting('autoPdf')==='1'?'checked':''} /><span></span></span>
        </label>
      </div>

      <hr style="border-color:var(--border);margin:20px 0" />

      <h3>Personaliseren</h3>
      <label>Mascot-emoji (eigen avatar)</label>
      <input id="set-mascot" maxlength="4" placeholder="🦁" value="${customMascot() || ''}" />
      <label style="margin-top:10px">Eigen shame-berichten (één per regel)</label>
      <textarea id="set-shame" rows="4" placeholder="Schrijf je eigen brutale boodschappen…">${(getCustomShame() || []).join('\n')}</textarea>
      <button type="button" class="btn block" id="save-pers" style="margin-top:8px">Opslaan personalisatie</button>

      <hr style="border-color:var(--border);margin:20px 0" />

      <h3>Week-overzicht</h3>
      <p class="muted" style="font-size:.85rem;margin:0 0 8px">Verschijnt automatisch elke zondagavond.</p>
      <button type="button" class="btn block" id="show-weekly">Bekijk week-overzicht nu</button>

      <hr style="border-color:var(--border);margin:20px 0" />

      <h3>Opslag &amp; offline</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-main">
            <div class="settings-row-title">Offline-modus</div>
            <div class="settings-row-sub muted">Werkt zonder internet zodra geïnstalleerd op homescreen</div>
          </div>
          <span style="color:var(--ok);font-weight:600">✓ Klaar</span>
        </div>
        <div class="settings-row" id="online-status">
          <div class="settings-row-main">
            <div class="settings-row-title">Verbinding nu</div>
            <div class="settings-row-sub muted">${navigator.onLine ? 'Online' : 'Offline'}</div>
          </div>
          <span>${navigator.onLine ? '🟢' : '🔴'}</span>
        </div>
      </div>
      <div id="storage-info" class="muted" style="font-size:.85rem;margin-top:8px">Laden…</div>

      <hr style="border-color:var(--border);margin:20px 0" />

      <div class="row">
        <button type="button" class="btn secondary" id="close-settings">Sluiten</button>
      </div>
    </div>`;
  document.body.appendChild(backdrop);

  const close = () => { backdrop.remove(); if (onClose) onClose(); };
  backdrop.querySelector('#close-settings').onclick = close;
  backdrop.querySelector('#close-settings-x').onclick = close;
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });

  backdrop.querySelectorAll('[data-accent]').forEach(btn => {
    btn.onclick = () => {
      setAccent(btn.dataset.accent);
      backdrop.querySelectorAll('.accent-swatch').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
    };
  });

  backdrop.querySelector('#set-theme').onchange = (e) => setThemeMode(e.target.value);

  backdrop.querySelectorAll('[data-preset]').forEach(btn => {
    btn.onclick = () => {
      setPreset(btn.dataset.preset);
      backdrop.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
    };
  });

  backdrop.querySelectorAll('[data-density]').forEach(btn => {
    btn.onclick = () => {
      setDensity(btn.dataset.density);
      backdrop.querySelectorAll('#density-pick .seg').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
    };
  });

  backdrop.querySelector('#save-settings').onclick = () => {
    setSetting('dailyIncomeGoal', backdrop.querySelector('#set-goal').value);
    setSetting('monthlyIncomeGoal', backdrop.querySelector('#set-mgoal').value);
    ok('Opgeslagen');
    close();
  };

  backdrop.querySelector('#set-pin').onclick = async () => {
    const pin = prompt('Kies een 4-6 cijferige PIN:');
    if (!pin) return;
    if (!/^\d{4,6}$/.test(pin)) { err('PIN moet 4-6 cijfers zijn'); return; }
    await setPin(pin);
    ok('PIN ingesteld');
    close();
  };
  // Biometric init
  (async () => {
    const row = backdrop.querySelector('#bio-row');
    if (!row) return;
    const sub = row.querySelector('.settings-row-sub');
    const renderBio = (statusText, btnHTML) => {
      sub.textContent = statusText;
      const existing = row.querySelector('.bio-btns');
      if (existing) existing.remove();
      if (btnHTML) {
        const wrap = document.createElement('div');
        wrap.className = 'row bio-btns';
        wrap.style.cssText = 'flex:0 0 auto';
        wrap.innerHTML = btnHTML;
        row.appendChild(wrap);
      }
    };

    if (!biometricAvailable()) {
      renderBio('Niet ondersteund door deze browser', '');
      return;
    }
    const avail = await platformAuthenticatorAvailable();
    if (!avail) {
      renderBio('Geen Face ID / Touch ID gevonden op dit apparaat', '');
      return;
    }
    const refresh = () => {
      const on = isBiometricEnabled();
      renderBio(on ? 'Actief' : 'Beschikbaar',
        on ? `<button class="btn danger" id="bio-off">Uit</button>`
           : `<button class="btn" id="bio-on">Inschakelen</button>`);
      const onBtn = backdrop.querySelector('#bio-on');
      if (onBtn) onBtn.onclick = async () => {
        try { await registerBiometric(); ok('Face ID ingeschakeld'); refresh(); }
        catch (e) { err('Mislukt: ' + (e.message || e)); }
      };
      const offBtn = backdrop.querySelector('#bio-off');
      if (offBtn) offBtn.onclick = () => {
        if (!confirm('Face ID uitschakelen?')) return;
        disableBiometric();
        ok('Uitgeschakeld');
        refresh();
      };
    };
    refresh();
  })();

  backdrop.querySelector('#lock-grace').onchange = (e) => setSetting('lockGraceMin', e.target.value);
  backdrop.querySelector('#lock-now').onclick = () => { clearUnlock(); ok('Vergrendeld'); close(); setTimeout(() => location.reload(), 400); };

  const remBtn = backdrop.querySelector('#remove-pin');
  if (remBtn) remBtn.onclick = async () => {
    if (!confirm('PIN verwijderen?')) return;
    await setPin(null);
    ok('PIN verwijderd');
    close();
  };

  const ghSetupBtn = backdrop.querySelector('#gh-setup');
  if (ghSetupBtn) ghSetupBtn.onclick = async () => {
    const token = backdrop.querySelector('#gh-token').value.trim();
    if (!token) { err('Geen token ingevuld'); return; }
    setupGithub(token);
    try {
      await syncUp();
      ok('Verbonden + eerste backup gemaakt');
      close();
    } catch (e) { err('Mislukt: ' + e.message); setupGithub(''); }
  };
  const ghUp = backdrop.querySelector('#gh-sync-up');
  if (ghUp) ghUp.onclick = async () => {
    try { await syncUp(); ok('Gesynchroniseerd'); close(); }
    catch (e) { err(e.message); }
  };
  const ghDown = backdrop.querySelector('#gh-sync-down');
  if (ghDown) ghDown.onclick = async () => {
    if (!confirm('Online backup ophalen overschrijft lokale data. Doorgaan?')) return;
    try { await syncDown(); ok('Opgehaald'); setTimeout(() => location.reload(), 500); }
    catch (e) { err(e.message); }
  };
  const ghMerge = backdrop.querySelector('#gh-sync-merge');
  if (ghMerge) ghMerge.onclick = async () => {
    try {
      const r = await syncMerge();
      ok(`Gemerged: ${r.added} nieuw, ${r.updated} bijgewerkt`);
      setTimeout(() => location.reload(), 500);
    } catch (e) { err(e.message); }
  };
  const autoPull = backdrop.querySelector('#set-autopull');
  if (autoPull) autoPull.onchange = (e) => setSetting('autoPullOnOpen', e.target.checked ? '1' : '0');
  const ghDisc = backdrop.querySelector('#gh-disconnect');
  if (ghDisc) ghDisc.onclick = () => {
    if (!confirm('GitHub-verbinding verbreken? Je gists blijven op github bestaan.')) return;
    setupGithub('');
    ok('Verbinding verbroken');
    close();
  };
  const ghMirror = backdrop.querySelector('#gh-mirror');
  if (ghMirror) ghMirror.onclick = async () => {
    if (!confirm('Tweede gist aanmaken voor extra backup-redundantie?')) return;
    try { const id = await createSecondaryGist(); ok('Mirror aangemaakt: ' + id.slice(0,8) + '…'); close(); }
    catch (e) { err(e.message); }
  };
  const ghEmail = backdrop.querySelector('#gh-email');
  if (ghEmail) ghEmail.onclick = () => { emailGistLink(); };
  const ghVer = backdrop.querySelector('#gh-versions');
  if (ghVer) ghVer.onclick = () => { close(); openVersionPicker(); };

  backdrop.querySelector('#export-ical').onclick = async () => {
    try { await exportICal(); ok('iCal gedownload'); }
    catch (e) { err(e.message); }
  };

  backdrop.querySelector('#print-page').onclick = () => { close(); setTimeout(() => window.print(), 200); };
  backdrop.querySelector('#export-pdf').onclick = () => { close(); exportMonthPDF(); };
  backdrop.querySelector('#show-weekly').onclick = () => { close(); openWeeklyReview(); };
  backdrop.querySelector('#set-auto-export').onchange = (e) => setSetting('autoExport', e.target.checked ? '1' : '0');
  backdrop.querySelector('#set-auto-pdf').onchange = (e) => setSetting('autoPdf', e.target.checked ? '1' : '0');
  backdrop.querySelector('#save-pers').onclick = () => {
    const m = backdrop.querySelector('#set-mascot').value.trim();
    const sh = backdrop.querySelector('#set-shame').value.split('\n').map(s => s.trim()).filter(Boolean);
    setCustomMascot(m || null);
    setCustomShame(sh);
    ok('Opgeslagen');
    close();
  };

  // Online/offline live updates
  const onlineRow = backdrop.querySelector('#online-status');
  if (onlineRow) {
    const updateOnline = () => {
      const sub = onlineRow.querySelector('.settings-row-sub');
      const icon = onlineRow.querySelector('span:last-child');
      if (sub) sub.textContent = navigator.onLine ? 'Online' : 'Offline';
      if (icon) icon.textContent = navigator.onLine ? '🟢' : '🔴';
    };
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
  }

  // Storage info
  if (navigator.storage && navigator.storage.estimate) {
    navigator.storage.estimate().then(async (e) => {
      const usedMB = (e.usage / (1024*1024)).toFixed(2);
      const quotaMB = (e.quota / (1024*1024)).toFixed(0);
      const persistent = navigator.storage.persisted ? await navigator.storage.persisted() : false;
      const el = backdrop.querySelector('#storage-info');
      if (el) el.innerHTML = `
        Gebruikt: <b>${usedMB} MB</b> van ${quotaMB} MB beschikbaar
        <div style="font-size:.8rem;margin-top:4px">${persistent ? '🔒 Persistent (browser ruimt niet op)' : '⚠️ Niet persistent — klik om te beschermen'}</div>
        ${!persistent && navigator.storage.persist ? '<button class="btn secondary" id="persist-btn" style="margin-top:6px">Maak persistent</button>' : ''}
      `;
      const pb = backdrop.querySelector('#persist-btn');
      if (pb) pb.onclick = async () => { await navigator.storage.persist(); ok('Aangevraagd'); };
    });
  }

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
