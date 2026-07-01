import { all, put, clear, STORE_NAMES } from '../db.js';
import { escapeHTML, parseAmount } from '../utils.js';
import { getSetting, setSetting } from '../settings.js';
import { openModal, confirmModal } from './modal.js';
import { setPreset, THEME_PRESETS, setDensity, PRESET_DOT_COLORS } from '../theme.js';
import { BADGES, computeEarnedBadges } from '../achievements.js';
import { icon } from '../icons.js';
import { ok, err } from './toast.js';
import { exportICal } from '../export-ical.js';
import { setupGithub, syncUp, syncDown, syncMerge, getSyncStatus, listVersions, createSecondaryGist, removeGist, emailGistLink, findMyGists, useExistingGist } from '../github-sync.js';
import { isLockEnabled, setPin, clearUnlock } from '../lock.js';
import { biometricAvailable, platformAuthenticatorAvailable, registerBiometric, isBiometricEnabled, disableBiometric } from '../biometric.js';
import { exportMonthPDF } from '../pdf-export.js';
import { openWeeklyReview } from './weekly-review.js';
import { getCustomShame, setCustomShame, customMascot, setCustomMascot } from '../mascot.js';
import { getArabicSettings, saveArabicSettings, resetAllProgress as resetArabicProgress, DEFAULT_ARABIC_SETTINGS } from '../modules/arabic-srs.js';
import { requestNotificationPermission, checkPendingNotifications, sendTestNotification } from '../notifications.js';
import { enablePush, pushSupported } from '../push.js';

const STORES = STORE_NAMES;

export async function openGistPicker() {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal">
      <button type="button" class="modal-close" id="gp-x" aria-label="Sluiten">×</button>
      <h2>Mijn dashboard-gists</h2>
      <p class="muted" style="font-size:.85rem">Heb je per ongeluk meerdere gists aangemaakt (1 op laptop, 1 op telefoon)? Kies hier degene die je wilt gebruiken — beide apparaten gaan dan naar dezelfde data.</p>
      <div id="gp-list" style="margin-top:12px">Laden…</div>
    </div>`;
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.remove(); });
  backdrop.querySelector('#gp-x').onclick = () => backdrop.remove();

  try {
    const gists = await findMyGists();
    const list = backdrop.querySelector('#gp-list');
    if (!gists.length) { list.innerHTML = '<p class="muted">Geen dashboard-gists gevonden in jouw account.</p>'; return; }
    list.innerHTML = '<div class="list">' + gists.map(g => `
      <div class="list-item">
        <div style="flex:1;min-width:0">
          <b>${escapeHTML(g.description || '')} ${g.isCurrent ? '<span class="pill" style="background:var(--ok);color:#000">huidig</span>' : ''}</b>
          <div class="muted" style="font-size:.75rem;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${g.id}</div>
          <div class="muted" style="font-size:.72rem;margin-top:2px">${g.files.length} bestand${g.files.length===1?'':'en'} · laatst aangepast ${new Date(g.updated_at).toLocaleDateString('nl-NL')}</div>
        </div>
        <div class="row" style="flex:0 0 auto;gap:4px">
          ${g.isCurrent ? '' : `<button class="btn" data-use="${g.id}">Gebruik deze</button>`}
          <button class="btn secondary" data-copy-id="${g.id}">${icon('clipboard')}</button>
        </div>
      </div>
    `).join('') + '</div>';
    list.querySelectorAll('[data-use]').forEach(b => {
      b.onclick = async () => {
        if (!await confirmModal('Wissel naar deze gist? Eerst auto-merge zodat je niets verliest.', { confirmLabel: 'Wisselen' })) return;
        try {
          useExistingGist(b.dataset.use);
          await syncMerge();
          ok('Verbonden + gemerged');
          setTimeout(() => location.reload(), 500);
        } catch (e) { err(e.message); }
      };
    });
    list.querySelectorAll('[data-copy-id]').forEach(b => {
      b.onclick = async () => {
        try { await navigator.clipboard.writeText(b.dataset.copyId); ok('Gist-ID gekopieerd'); }
        catch (_) { prompt('Kopieer:', b.dataset.copyId); }
      };
    });
  } catch (e) {
    backdrop.querySelector('#gp-list').innerHTML = `<p class="muted">Fout: ${e.message}</p>`;
  }
}

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
        if (!await confirmModal(`Backup van ${b.previousElementSibling.querySelector('b').textContent} herstellen? Huidige data wordt overschreven.`, { confirmLabel: 'Herstellen', danger: true })) return;
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

const APP_VERSION = 'v162';

// Onthoud binnen de sessie welke settings-tab open stond
let _lastSettingsTab = 'profiel';

const SETTINGS_TABS = [
  { id: 'profiel',  icon: 'user',    label: 'Profiel' },
  { id: 'weergave', icon: 'palette', label: 'Stijl' },
  { id: 'doelen',   icon: 'target',  label: 'Doelen' },
  { id: 'data',     icon: 'cloud',   label: 'Data' },
  { id: 'systeem',  icon: 'lock',    label: 'Systeem' },
];

export async function openSettings(onClose) {
  const earned = await computeEarnedBadges();
  const preset = getSetting('themePreset') || 'midnight';
  const sync = getSyncStatus();
  const lockOn = isLockEnabled();
  const userName = getSetting('userName') || '';
  const hizbTime = getSetting('hizbReminderTime') || '20:00';
  const arabicSettings = getArabicSettings();
  const activeTab = SETTINGS_TABS.some(t => t.id === _lastSettingsTab) ? _lastSettingsTab : 'profiel';

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal settings-modal" role="dialog" aria-modal="true">
      <button type="button" class="modal-close" id="close-settings-x" aria-label="Sluiten">×</button>
      <h2>Instellingen</h2>

      <div class="settings-tabs" role="tablist">
        ${SETTINGS_TABS.map(t => `
          <button type="button" role="tab" class="settings-tab ${t.id === activeTab ? 'active' : ''}" data-pane-btn="${t.id}" aria-selected="${t.id === activeTab}">
            <span class="settings-tab-icon">${icon(t.icon)}</span><span>${t.label}</span>
          </button>`).join('')}
      </div>

      <!-- ════ TAB: PROFIEL ════ -->
      <div class="settings-pane ${activeTab === 'profiel' ? 'active' : ''}" data-pane="profiel">

      <!-- PROFIEL -->
      <div class="settings-section">
        <div class="settings-section-header">
          <span class="settings-section-icon">${icon('user')}</span>
          <div>
            <div class="settings-section-title">Profiel</div>
            <div class="settings-section-desc">Naam en persoonlijke stijl</div>
          </div>
        </div>
        <div class="settings-group">
          <div class="settings-row">
            <div class="settings-row-main">
              <div class="settings-row-title">Naam</div>
              <div class="settings-row-sub muted">Hoe wil je aangesproken worden?</div>
            </div>
            <input id="set-username" type="text" placeholder="Bijv. Soef" value="${escapeHTML(userName)}" style="width:130px;text-align:right" />
          </div>
          <div class="settings-row">
            <div class="settings-row-main">
              <div class="settings-row-title">Mascot-emoji</div>
              <div class="settings-row-sub muted">Persoonlijke avatar in het dashboard</div>
            </div>
            <input id="set-mascot" maxlength="4" placeholder="🦁" value="${customMascot() || ''}" style="width:60px;text-align:center;font-size:1.2rem" />
          </div>
        </div>
        <div class="settings-group">
          <div class="settings-row" style="flex-direction:column;align-items:stretch;gap:8px">
            <div class="settings-row-main">
              <div class="settings-row-title">Motivatie-berichten</div>
              <div class="settings-row-sub muted">Eigen berichten als je streak mist — één per regel</div>
            </div>
            <textarea id="set-shame" rows="3" placeholder="Schrijf je eigen motivatie-berichten…">${(getCustomShame() || []).join('\n')}</textarea>
            <button type="button" class="btn secondary" id="previewShameBtn" style="margin-top:6px;font-size:.82rem;align-self:flex-start">Bekijk willekeurig bericht</button>
            <div id="shamePreview" style="margin-top:8px;padding:8px;background:var(--bg2);border-radius:6px;font-size:13px;display:none;color:var(--text);line-height:1.4"></div>
          </div>
        </div>
        <button type="button" class="btn block" id="save-pers" style="margin-top:8px">Profiel opslaan</button>
      </div>
      </div>

      <!-- ════ TAB: WEERGAVE ════ -->
      <div class="settings-pane ${activeTab === 'weergave' ? 'active' : ''}" data-pane="weergave">

      <!-- WEERGAVE -->
      <div class="settings-section">
        <div class="settings-section-header">
          <span class="settings-section-icon">${icon('palette')}</span>
          <div>
            <div class="settings-section-title">Weergave</div>
            <div class="settings-section-desc">Thema, kleuren en dichtheid</div>
          </div>
        </div>
        <div class="settings-group">
          <div class="settings-row" style="flex-direction:column;align-items:stretch;gap:10px">
            <div class="settings-row-main">
              <div class="settings-row-title">Thema</div>
              <div class="settings-row-sub muted">Onyx · Midnight · Daylight</div>
            </div>
            <div class="preset-picker">
              ${THEME_PRESETS.map(p => `<button type="button" class="preset-chip preset-${p} ${p===preset?'active':''}" data-preset="${p}">${p}<span class="preset-dot" style="background:${PRESET_DOT_COLORS[p]||'currentColor'}"></span></button>`).join('')}
            </div>
          </div>
          <div class="settings-row">
            <div class="settings-row-main">
              <div class="settings-row-title">Dichtheid</div>
              <div class="settings-row-sub muted">Ruimte tussen elementen</div>
            </div>
            <div class="segmented" id="density-pick">
              <button type="button" class="seg ${(getSetting('density')||'comfortable')==='comfortable'?'active':''}" data-density="comfortable">Ruim</button>
              <button type="button" class="seg ${getSetting('density')==='compact'?'active':''}" data-density="compact">Compact</button>
            </div>
          </div>
          <label class="settings-row" style="text-transform:none;margin-top:4px">
            <div class="settings-row-main">
              <div class="settings-row-title">Automatisch dag/nacht</div>
              <div class="settings-row-sub muted">06:00–20:00 daylight · 20:00–06:00 jouw donkere thema</div>
            </div>
            <span class="ios-switch"><input type="checkbox" id="set-auto-theme" ${getSetting('autoTheme') !== '0' ? 'checked' : ''} /><span></span></span>
          </label>
        </div>
      </div>
      </div>

      <!-- ════ TAB: DOELEN & LEREN ════ -->
      <div class="settings-pane ${activeTab === 'doelen' ? 'active' : ''}" data-pane="doelen">

      <!-- DOELEN -->
      <div class="settings-section">
        <div class="settings-section-header">
          <span class="settings-section-icon">${icon('target')}</span>
          <div>
            <div class="settings-section-title">Doelen</div>
            <div class="settings-section-desc">Dagelijkse en maandelijkse inkomenstargets</div>
          </div>
        </div>
        <div class="settings-group">
          <div class="settings-row">
            <div class="settings-row-main">
              <div class="settings-row-title">Dagelijks inkomensdoel</div>
              <div class="settings-row-sub muted">Streefbedrag per werkdag</div>
            </div>
            <div class="settings-euro">
              <span>€</span>
              <input id="set-goal" type="text" inputmode="decimal" value="${getSetting('dailyIncomeGoal')}" />
            </div>
          </div>
          <div class="settings-row">
            <div class="settings-row-main">
              <div class="settings-row-title">Maandelijks inkomensdoel</div>
              <div class="settings-row-sub muted">Streefbedrag per maand</div>
            </div>
            <div class="settings-euro">
              <span>€</span>
              <input id="set-mgoal" type="text" inputmode="decimal" value="${getSetting('monthlyIncomeGoal')}" />
            </div>
          </div>
        </div>
        <button type="button" class="btn block" id="save-settings" style="margin-top:8px">Doelen opslaan</button>
      </div>

      <!-- HERINNERINGEN -->
      <div class="settings-section">
        <div class="settings-section-header">
          <span class="settings-section-icon">${icon('bell')}</span>
          <div>
            <div class="settings-section-title">Herinneringen</div>
            <div class="settings-section-desc">Herinneringen voor inkomen, taken, facturen en Koran — ook als de app dicht is</div>
          </div>
        </div>
        <div class="settings-group">
          <div class="settings-row">
            <div class="settings-row-main">
              <div class="settings-row-title">Meldingen</div>
              <div class="settings-row-sub muted" id="notif-status-label">${
                !('Notification' in window) ? 'Niet ondersteund op dit apparaat' :
                Notification.permission === 'denied'  ? 'Geblokkeerd — zet aan via iPhone-instellingen → (de app) → Meldingen' :
                (Notification.permission === 'granted' && localStorage.getItem('taskNotifications') !== '0')
                  ? 'Aan — je krijgt herinneringen, ook als de app dicht is'
                  : 'Uit — zet aan voor herinneringen, ook als de app dicht is'
              }</div>
            </div>
            ${!('Notification' in window) ? ''
              : Notification.permission === 'denied'
                ? `<button type="button" class="btn secondary" id="notif-settings-btn" style="flex-shrink:0;font-size:.8rem">Uitleg</button>`
                : `<span class="ios-switch"><input type="checkbox" id="notif-toggle" ${(Notification.permission === 'granted' && localStorage.getItem('taskNotifications') !== '0') ? 'checked' : ''} /><span></span></span>`
            }
          </div>
          <div class="settings-row" id="notif-test-row" style="${(('Notification' in window) && Notification.permission === 'granted' && localStorage.getItem('taskNotifications') !== '0') ? '' : 'display:none'}">
            <div class="settings-row-main">
              <div class="settings-row-sub muted">Even checken of een melding aankomt</div>
            </div>
            <button type="button" class="btn secondary" id="notif-test-btn" style="flex-shrink:0;font-size:.8rem;white-space:nowrap">Test melding</button>
          </div>
          <div class="settings-row">
            <div class="settings-row-main">
              <div class="settings-row-title">Hizb-herinnering</div>
              <div class="settings-row-sub muted">Tijdstip voor dagelijkse Koran-notificatie</div>
            </div>
            <input id="set-hizb-time" type="time" value="${hizbTime}" />
          </div>
          <div class="settings-row">
            <div class="settings-row-main">
              <div class="settings-row-title">Week-overzicht</div>
              <div class="settings-row-sub muted">Verschijnt automatisch elke zondagavond</div>
            </div>
            <button type="button" class="btn secondary" id="show-weekly" style="flex-shrink:0">Bekijk nu</button>
          </div>
        </div>
      </div>

      <!-- ARABISCH LEREN -->
      <div class="settings-section">
        <div class="settings-section-header">
          <span class="settings-section-icon">${icon('books')}</span>
          <div>
            <div class="settings-section-title">Arabisch leren</div>
            <div class="settings-section-desc">Spaced repetition — dagelijkse dosering en weergave</div>
          </div>
        </div>
        <div class="settings-group">
          <div class="settings-row" style="flex-direction:column;align-items:stretch;gap:8px">
            <div class="settings-row-main">
              <div class="settings-row-title">Nieuwe kaarten per dag</div>
              <div class="settings-row-sub muted">Hoeveel nieuwe woorden je dagelijks leert</div>
            </div>
            <div class="row" style="gap:10px;align-items:center">
              <input type="range" id="set-ar-new" min="5" max="50" step="1" value="${arabicSettings.newCardsPerDay}" style="flex:1">
              <span id="set-ar-new-val" style="min-width:36px;text-align:right;font-weight:600;font-variant-numeric:tabular-nums">${arabicSettings.newCardsPerDay}</span>
            </div>
          </div>
          <div class="settings-row" style="flex-direction:column;align-items:stretch;gap:8px">
            <div class="settings-row-main">
              <div class="settings-row-title">Review-limiet per dag</div>
              <div class="settings-row-sub muted">Maximum herhalingen per sessie</div>
            </div>
            <div class="row" style="gap:10px;align-items:center">
              <input type="range" id="set-ar-review" min="20" max="200" step="5" value="${arabicSettings.reviewLimitPerDay}" style="flex:1">
              <span id="set-ar-review-val" style="min-width:36px;text-align:right;font-weight:600;font-variant-numeric:tabular-nums">${arabicSettings.reviewLimitPerDay}</span>
            </div>
          </div>
        </div>
        <div class="settings-group">
          <label class="settings-row" style="text-transform:none">
            <div class="settings-row-main">
              <div class="settings-row-title">Arabisch → Nederlands</div>
              <div class="settings-row-sub muted">Arabisch zien, Nederlands beantwoorden</div>
            </div>
            <span class="ios-switch"><input type="checkbox" id="set-ar-ar-nl" ${arabicSettings.directionArNl ? 'checked' : ''} /><span></span></span>
          </label>
          <label class="settings-row" style="text-transform:none">
            <div class="settings-row-main">
              <div class="settings-row-title">Nederlands → Arabisch</div>
              <div class="settings-row-sub muted">Nederlands zien, Arabisch beantwoorden</div>
            </div>
            <span class="ios-switch"><input type="checkbox" id="set-ar-nl-ar" ${arabicSettings.directionNlAr ? 'checked' : ''} /><span></span></span>
          </label>
          <label class="settings-row" style="text-transform:none">
            <div class="settings-row-main">
              <div class="settings-row-title">Transliteratie op voorkant</div>
              <div class="settings-row-sub muted">Uitspraak direct tonen (makkelijker)</div>
            </div>
            <span class="ios-switch"><input type="checkbox" id="set-ar-translit" ${arabicSettings.showTranslitFront ? 'checked' : ''} /><span></span></span>
          </label>
        </div>
        <div class="settings-group">
          <div class="settings-row">
            <div class="settings-row-main">
              <div class="settings-row-title">Startvolgorde</div>
              <div class="settings-row-sub muted">Welke kaarten verschijnen eerst</div>
            </div>
            <select id="set-ar-order">
              <option value="mixed" ${arabicSettings.startOrder === 'mixed' ? 'selected' : ''}>Gemengd</option>
              <option value="new-first" ${arabicSettings.startOrder === 'new-first' ? 'selected' : ''}>Nieuw eerst</option>
              <option value="review-first" ${arabicSettings.startOrder === 'review-first' ? 'selected' : ''}>Review eerst</option>
            </select>
          </div>
          <label class="settings-row" style="text-transform:none">
            <div class="settings-row-main">
              <div class="settings-row-title">3D flip-animatie</div>
              <div class="settings-row-sub muted">Kaart draait om bij tonen antwoord</div>
            </div>
            <span class="ios-switch"><input type="checkbox" id="set-ar-flip" ${arabicSettings.flipAnimation ? 'checked' : ''} /><span></span></span>
          </label>
          <label class="settings-row" style="text-transform:none">
            <div class="settings-row-main">
              <div class="settings-row-title">Woordtype badge</div>
              <div class="settings-row-sub muted">Werkwoord / zelfstandig naamwoord tonen</div>
            </div>
            <span class="ios-switch"><input type="checkbox" id="set-ar-badge" ${arabicSettings.showTypeBadge ? 'checked' : ''} /><span></span></span>
          </label>
          <label class="settings-row" style="text-transform:none">
            <div class="settings-row-main">
              <div class="settings-row-title">Lesnummer tonen</div>
              <div class="settings-row-sub muted">Les 1, 2, 3… naast het woord</div>
            </div>
            <span class="ios-switch"><input type="checkbox" id="set-ar-lesson" ${arabicSettings.showLessonNumber ? 'checked' : ''} /><span></span></span>
          </label>
        </div>
        <div class="settings-group">
          <div class="settings-row">
            <div class="settings-row-main">
              <div class="settings-row-title">Reset alle voortgang</div>
              <div class="settings-row-sub muted">Alle SRS-data wissen, opnieuw beginnen</div>
            </div>
            <button type="button" class="btn danger" id="ar-reset-all" style="flex-shrink:0">Reset</button>
          </div>
        </div>
        <button type="button" class="btn block" id="save-ar-settings" style="margin-top:8px">Arabisch opslaan</button>
      </div>
      </div>

      <!-- ════ TAB: SYSTEEM (deel 1: beveiliging) ════ -->
      <div class="settings-pane ${activeTab === 'systeem' ? 'active' : ''}" data-pane="systeem">

      <!-- BEVEILIGING -->
      <div class="settings-section">
        <div class="settings-section-header">
          <span class="settings-section-icon">${icon('lock')}</span>
          <div>
            <div class="settings-section-title">Beveiliging</div>
            <div class="settings-section-desc">Vergrendel de app met PIN of biometrie</div>
          </div>
        </div>
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
              <div class="settings-row-sub muted">${lockOn ? 'Actief · 4 tot 6 cijfers' : 'Niet ingesteld'}</div>
            </div>
            <div class="row" style="flex-shrink:0;gap:6px">
              <button type="button" class="btn secondary" id="set-pin">${lockOn ? 'Wijzigen' : 'Instellen'}</button>
              ${lockOn ? `<button type="button" class="btn danger" id="remove-pin">Verwijder</button>` : ''}
            </div>
          </div>
          <div class="settings-row">
            <div class="settings-row-main">
              <div class="settings-row-title">Automatisch vergrendelen na</div>
              <div class="settings-row-sub muted">App blijft open na ontgrendeling</div>
            </div>
            <select id="lock-grace">
              ${[
                ['0','Altijd vragen'],['1','1 minuut'],['5','5 minuten'],
                ['15','15 minuten'],['60','1 uur'],['1440','24 uur'],
              ].map(([v,l]) => `<option value="${v}" ${getSetting('lockGraceMin')===v?'selected':''}>${l}</option>`).join('')}
            </select>
          </div>
          <div class="settings-row">
            <div class="settings-row-main">
              <div class="settings-row-title">Nu vergrendelen</div>
              <div class="settings-row-sub muted">Vraag direct opnieuw om authenticatie</div>
            </div>
            <button type="button" class="btn secondary" id="lock-now" style="flex-shrink:0">Vergrendel</button>
          </div>
        </div>
      </div>
      </div>

      <!-- ════ TAB: DATA & SYNC ════ -->
      <div class="settings-pane ${activeTab === 'data' ? 'active' : ''}" data-pane="data">

      <!-- SYNCHRONISATIE -->
      <div class="settings-section">
        <div class="settings-section-header">
          <span class="settings-section-icon">${icon('cloud')}</span>
          <div>
            <div class="settings-section-title">Synchronisatie</div>
            <div class="settings-section-desc">
              ${sync.enabled
                ? `Actief · Laatste sync: ${sync.last ? sync.last.toLocaleString('nl-NL') : 'Nooit'}`
                : 'Automatisch back-uppen naar privé GitHub Gist'}
            </div>
          </div>
        </div>
        ${!sync.enabled ? `
          <div class="settings-group">
            <div class="settings-row" style="flex-direction:column;align-items:stretch;gap:8px">
              <div class="settings-row-main">
                <div class="settings-row-title">GitHub Personal Access Token</div>
                <div class="settings-row-sub muted">
                  Vereist scope: <code>gist</code> —
                  <a href="https://github.com/settings/tokens/new?scopes=gist&description=Dashboard" target="_blank" style="color:var(--accent)">token aanmaken</a>
                </div>
              </div>
              <input id="gh-token" type="password" placeholder="ghp_…" />
            </div>
            <div class="settings-row" style="flex-direction:column;align-items:stretch;gap:8px">
              <div class="settings-row-main">
                <div class="settings-row-title">Bestaande Gist-ID (optioneel)</div>
                <div class="settings-row-sub muted">Sync je tussen telefoon en laptop? Plak hier de ID van je eerste apparaat</div>
              </div>
              <input id="gh-existing-id" placeholder="abc123…" />
            </div>
          </div>
          <div style="display:flex;gap:8px;margin-top:8px">
            <button type="button" class="btn block" id="gh-setup">Verbind met GitHub</button>
            <button type="button" class="btn secondary" id="gh-test-conn" title="Test of het token + gist-ID kloppen">Test</button>
          </div>
          <p class="muted" style="font-size:.76rem;margin-top:8px;padding:0 2px">Gebruik "Test" om te checken of je token en gist-ID kloppen voordat je verbindt.</p>
        ` : `
          <div class="settings-group">
            <div class="settings-row">
              <div class="settings-row-main">
                <div class="settings-row-title">Status</div>
                <div class="settings-row-sub muted">${sync.gistCount} gist${sync.gistCount===1?'':'s'} actief</div>
              </div>
              <div class="row" style="flex-shrink:0;gap:6px">
                <button type="button" class="btn" id="gh-sync-up">Pushen</button>
                <button type="button" class="btn secondary" id="gh-sync-merge">Mergen</button>
                <button type="button" class="btn secondary" id="gh-test-conn" title="Test of het token + gist-ID nog kloppen">Test</button>
              </div>
            </div>
            ${sync.gistIds.map(id => `
              <div class="settings-row">
                <code style="font-size:.72rem;font-family:monospace;color:var(--text-dim);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${id}</code>
                <button type="button" class="btn secondary" style="flex-shrink:0;padding:5px 10px;font-size:.78rem" data-copy="${id}">Kopieer</button>
              </div>
            `).join('')}
            <label class="settings-row" style="text-transform:none">
              <div class="settings-row-main">
                <div class="settings-row-title">Auto-merge bij openen</div>
                <div class="settings-row-sub muted">Remote data ophalen en mergen bij elk openen</div>
              </div>
              <span class="ios-switch"><input type="checkbox" id="set-autopull" ${getSetting('autoPullOnOpen')==='1'?'checked':''} /><span></span></span>
            </label>
          </div>
          <div class="settings-group">
            <div class="settings-row">
              <div class="settings-row-main">
                <div class="settings-row-title">Zoek mijn gists</div>
                <div class="settings-row-sub muted">Meerdere apparaten? Kies de juiste gist</div>
              </div>
              <button type="button" class="btn secondary" id="gh-find" style="flex-shrink:0">Zoeken</button>
            </div>
            <div class="settings-row">
              <div class="settings-row-main">
                <div class="settings-row-title">Versie-historie</div>
                <div class="settings-row-sub muted">Herstel een eerdere backup (30 versies bewaard)</div>
              </div>
              <button type="button" class="btn secondary" id="gh-versions" style="flex-shrink:0">Bekijk</button>
            </div>
            <div class="settings-row">
              <div class="settings-row-main">
                <div class="settings-row-title">Mirror-gist aanmaken</div>
                <div class="settings-row-sub muted">Extra redundantie via tweede gist</div>
              </div>
              <button type="button" class="btn secondary" id="gh-mirror" style="flex-shrink:0" ${sync.gistCount>=2?'disabled':''}>Aanmaken</button>
            </div>
            <div class="settings-row">
              <div class="settings-row-main">
                <div class="settings-row-title">Email backup-links</div>
                <div class="settings-row-sub muted">Stuur jezelf de gist-ID's ter bewaring</div>
              </div>
              <button type="button" class="btn secondary" id="gh-email" style="flex-shrink:0">Verstuur</button>
            </div>
          </div>
          <div class="settings-group">
            <div class="settings-row">
              <div class="settings-row-main">
                <div class="settings-row-title">Cloud ophalen</div>
                <div class="settings-row-sub muted">Lokale data volledig vervangen door cloud-versie</div>
              </div>
              <button type="button" class="btn secondary" id="gh-sync-down" style="flex-shrink:0">Overschrijven</button>
            </div>
            <div class="settings-row">
              <div class="settings-row-main">
                <div class="settings-row-title">Verbinding verbreken</div>
                <div class="settings-row-sub muted">Gists op GitHub blijven bestaan</div>
              </div>
              <button type="button" class="btn danger" id="gh-disconnect" style="flex-shrink:0">Verbreken</button>
            </div>
          </div>
        `}
      </div>

      <!-- GMAIL -->
      <div class="settings-section">
        <div class="settings-section-header">
          <span class="settings-section-icon">${icon('mail')}</span>
          <div>
            <div class="settings-section-title">Gmail automatisch versturen</div>
            <div class="settings-section-desc">${localStorage.getItem('gmailClientId') ? '✓ Gekoppeld — facturen worden direct verstuurd' : 'Koppel Gmail om facturen automatisch te mailen'}</div>
          </div>
        </div>
        <div class="settings-group">
          <div class="settings-row" style="flex-direction:column;align-items:stretch;gap:8px">
            <div class="settings-row-title">Google OAuth Client ID</div>
            <input type="text" id="gmail-client-id"
                   placeholder="123456789-xxx.apps.googleusercontent.com"
                   value="${escapeHTML(localStorage.getItem('gmailClientId') || '')}"
                   style="padding:10px 12px;border-radius:10px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:.85rem;width:100%;box-sizing:border-box" />
            <div style="font-size:.78rem;color:var(--text-dim);line-height:1.5">
              Maak aan via <strong>Google Cloud Console</strong> → APIs &amp; Services → Credentials → OAuth 2.0 Client IDs (type: Webapplicatie).
              Voeg als authorized JavaScript origin toe: <code style="background:rgba(0,0,0,.1);padding:1px 5px;border-radius:4px">https://sofyanghaddari.github.io</code>
            </div>
          </div>
          <div class="settings-row">
            <div class="settings-row-main">
              <div class="settings-row-title">Status</div>
              <div class="settings-row-sub muted" id="gmail-status">${localStorage.getItem('gmailClientId') ? '✓ Client ID opgeslagen' : 'Niet ingesteld'}</div>
            </div>
            <div style="display:flex;gap:6px;flex-shrink:0">
              <button type="button" class="btn secondary" id="gmail-save">Opslaan</button>
              ${localStorage.getItem('gmailClientId') ? '<button type="button" class="btn secondary" id="gmail-test">Test</button>' : ''}
            </div>
          </div>
          ${localStorage.getItem('gmailClientId') ? `
          <div class="settings-row">
            <div class="settings-row-main">
              <div class="settings-row-title">Verbinding verbreken</div>
              <div class="settings-row-sub muted">Client ID verwijderen uit instellingen</div>
            </div>
            <button type="button" class="btn secondary" id="gmail-disconnect" style="flex-shrink:0">Verbreken</button>
          </div>` : ''}
        </div>
      </div>

      <!-- DATA & EXPORT -->
      <div class="settings-section">
        <div class="settings-section-header">
          <span class="settings-section-icon">${icon('box')}</span>
          <div>
            <div class="settings-section-title">Data &amp; Export</div>
            <div class="settings-section-desc">Importeer, exporteer en print je gegevens</div>
          </div>
        </div>
        <div class="settings-group">
          <div class="settings-row">
            <div class="settings-row-main">
              <div class="settings-row-title">Exporteer als JSON</div>
              <div class="settings-row-sub muted">Volledige lokale backup van alle data</div>
            </div>
            <button type="button" class="btn secondary" id="export-data" style="flex-shrink:0">Exporteer</button>
          </div>
          <div class="settings-row">
            <div class="settings-row-main">
              <div class="settings-row-title">Importeer JSON</div>
              <div class="settings-row-sub muted">Laad een eerdere backup in (overschrijft huidige data)</div>
            </div>
            <label for="import-data" class="btn secondary" style="flex-shrink:0;cursor:pointer">Importeer</label>
            <input type="file" id="import-data" accept=".json" style="display:none" />
          </div>
          <label class="settings-row" style="text-transform:none">
            <div class="settings-row-main">
              <div class="settings-row-title">Auto-export wekelijks</div>
              <div class="settings-row-sub muted">Elke 7 dagen automatisch een JSON backup downloaden</div>
            </div>
            <span class="ios-switch"><input type="checkbox" id="set-auto-export" ${getSetting('autoExport')==='1'?'checked':''} /><span></span></span>
          </label>
        </div>
        <div class="settings-group">
          <div class="settings-row">
            <div class="settings-row-main">
              <div class="settings-row-title">PDF maandoverzicht</div>
              <div class="settings-row-sub muted">Printbaar overzicht voor boekhouder of administratie</div>
            </div>
            <button type="button" class="btn secondary" id="export-pdf" style="flex-shrink:0">Exporteer</button>
          </div>
          <label class="settings-row" style="text-transform:none">
            <div class="settings-row-main">
              <div class="settings-row-title">Auto-PDF maandelijks</div>
              <div class="settings-row-sub muted">Elke 1e van de maand automatisch maandoverzicht openen</div>
            </div>
            <span class="ios-switch"><input type="checkbox" id="set-auto-pdf" ${getSetting('autoPdf')==='1'?'checked':''} /><span></span></span>
          </label>
          <div class="settings-row">
            <div class="settings-row-main">
              <div class="settings-row-title">Agenda-export (iCal)</div>
              <div class="settings-row-sub muted">Deadlines en taken naar Apple/Google Agenda</div>
            </div>
            <button type="button" class="btn secondary" id="export-ical" style="flex-shrink:0">Download</button>
          </div>
          <div class="settings-row">
            <div class="settings-row-main">
              <div class="settings-row-title">Print huidige pagina</div>
              <div class="settings-row-sub muted">Stuur de huidige weergave naar de printer</div>
            </div>
            <button type="button" class="btn secondary" id="print-page" style="flex-shrink:0">Print</button>
          </div>
        </div>
      </div>
      </div>

      <!-- ════ TAB: SYSTEEM (deel 2: badges + opslag) ════ -->
      <div class="settings-pane ${activeTab === 'systeem' ? 'active' : ''}" data-pane="systeem">

      <!-- BADGES -->
      <div class="settings-section">
        <div class="settings-section-header">
          <span class="settings-section-icon">${icon('trophy')}</span>
          <div>
            <div class="settings-section-title">Badges</div>
            <div class="settings-section-desc">${earned.size} van ${BADGES.length} behaald</div>
          </div>
        </div>
        <div class="badge-grid">
          ${BADGES.map(b => `
            <div class="badge ${earned.has(b.id) ? 'earned' : 'locked'}" title="${b.desc}">
              <div class="badge-emoji">${earned.has(b.id) ? icon(b.icon, 'ic-lg') : icon('lock', 'ic-lg')}</div>
              <div class="badge-name">${b.name}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- OPSLAG & VERBINDING -->
      <div class="settings-section">
        <div class="settings-section-header">
          <span class="settings-section-icon">${icon('stats')}</span>
          <div>
            <div class="settings-section-title">Opslag &amp; Verbinding</div>
            <div class="settings-section-desc">Apparaatstatus en offline-bescherming</div>
          </div>
        </div>
        <div class="settings-group">
          <div class="settings-row">
            <div class="settings-row-main">
              <div class="settings-row-title">Offline-modus</div>
              <div class="settings-row-sub muted">Volledig bruikbaar zonder internet na installatie</div>
            </div>
            <span style="color:var(--ok);font-weight:600;font-size:.88rem;flex-shrink:0">✓ Actief</span>
          </div>
          <div class="settings-row" id="online-status">
            <div class="settings-row-main">
              <div class="settings-row-title">Verbinding</div>
              <div class="settings-row-sub muted">${navigator.onLine ? 'Online' : 'Offline'}</div>
            </div>
            <span class="conn-dot ${navigator.onLine ? 'on' : 'off'}" style="flex-shrink:0"></span>
          </div>
        </div>
        <div id="storage-info" class="muted" style="font-size:.82rem;margin-top:8px;padding:0 2px">Opslag laden…</div>
      </div>
      </div>

      <div style="margin-top:24px;padding-top:16px;border-top:1px solid var(--border);text-align:center">
        <button type="button" class="btn secondary" id="close-settings">Sluiten</button>
        <div style="margin-top:10px"><span style="opacity:0.4;font-size:11px">dashboard-${APP_VERSION}</span></div>
      </div>
    </div>`;
  document.body.appendChild(backdrop);

  const _settingsAbort = new AbortController();
  const _settingsSig = { signal: _settingsAbort.signal };
  const close = () => { _settingsAbort.abort(); backdrop.remove(); if (onClose) onClose(); };
  backdrop.querySelector('#close-settings').onclick = close;
  backdrop.querySelector('#close-settings-x').onclick = close;
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });

  // Tab-navigatie (Systeem bestaat uit twee pane-delen — beide togglen)
  const modalEl = backdrop.querySelector('.settings-modal');
  const tabBtns = backdrop.querySelectorAll('[data-pane-btn]');
  const panes = backdrop.querySelectorAll('.settings-pane');
  tabBtns.forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.paneBtn;
      _lastSettingsTab = id;
      tabBtns.forEach(b => {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
      });
      panes.forEach(p => p.classList.toggle('active', p.dataset.pane === id));
      if (modalEl) modalEl.scrollTop = 0;
    };
  });

  // Weergave
  backdrop.querySelectorAll('[data-preset]').forEach(btn => {
    btn.onclick = () => {
      setPreset(btn.dataset.preset);
      backdrop.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
    };
  });
  const autoThemeEl = backdrop.querySelector('#set-auto-theme');
  if (autoThemeEl) autoThemeEl.onchange = (e) => {
    setSetting('autoTheme', e.target.checked ? '1' : '0');
  };
  backdrop.querySelectorAll('[data-density]').forEach(btn => {
    btn.onclick = () => {
      setDensity(btn.dataset.density);
      backdrop.querySelectorAll('#density-pick .seg').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
    };
  });

  // Doelen
  backdrop.querySelector('#save-settings').onclick = () => {
    // Komma-tolerant parsen (NL-toetsenbord) en genormaliseerd opslaan
    const goal = parseAmount(backdrop.querySelector('#set-goal').value);
    const mgoal = parseAmount(backdrop.querySelector('#set-mgoal').value);
    if (!isFinite(goal) || goal < 0 || !isFinite(mgoal) || mgoal < 0) {
      err('Voer een geldig bedrag in');
      return;
    }
    setSetting('dailyIncomeGoal', String(goal));
    setSetting('monthlyIncomeGoal', String(mgoal));
    ok('Doelen opgeslagen');
  };

  // Herinneringen — één aan/uit-schakelaar die alles regelt
  const notifToggle = backdrop.querySelector('#notif-toggle');
  if (notifToggle) {
    notifToggle.onchange = async () => {
      const label = backdrop.querySelector('#notif-status-label');
      const testRow = backdrop.querySelector('#notif-test-row');
      if (notifToggle.checked) {
        // AANZETTEN
        notifToggle.disabled = true;
        const result = await requestNotificationPermission();
        notifToggle.disabled = false;
        if (result === 'granted') {
          localStorage.setItem('taskNotifications', '1');
          checkPendingNotifications();
          sendTestNotification(); // meteen een melding zodat je ziet dat het werkt
          if (pushSupported()) {
            enablePush().catch(e => { console.warn('Push niet ingeschakeld:', e); });
          }
          if (label) label.textContent = 'Aan — je krijgt herinneringen, ook als de app dicht is';
          if (testRow) testRow.style.display = '';
          ok('Meldingen aan');
        } else {
          // geweigerd of weggeklikt → terug naar uit
          notifToggle.checked = false;
          if (result === 'denied') {
            if (label) label.textContent = 'Geblokkeerd — zet aan via iPhone-instellingen → (de app) → Meldingen';
            err('Geblokkeerd — zet meldingen aan in je iPhone-instellingen');
          }
        }
      } else {
        // UITZETTEN
        localStorage.setItem('taskNotifications', '0');
        try { const m = await import('../push.js'); await m.disablePush(); } catch (_) {}
        if (label) label.textContent = 'Uit — zet aan voor herinneringen, ook als de app dicht is';
        if (testRow) testRow.style.display = 'none';
        ok('Meldingen uit');
      }
    };
  }
  const notifSettingsBtn = backdrop.querySelector('#notif-settings-btn');
  if (notifSettingsBtn) {
    notifSettingsBtn.onclick = () => {
      ok('Meldingen staan geblokkeerd. Zet ze aan via iPhone-instellingen → (de app) → Meldingen.');
    };
  }
  const notifTestBtn = backdrop.querySelector('#notif-test-btn');
  if (notifTestBtn) {
    notifTestBtn.onclick = async () => {
      notifTestBtn.disabled = true;
      // Zorg meteen dat het push-abonnement (achtergrond-meldingen) actief/vers is.
      if (pushSupported()) { try { await enablePush(); } catch (_) {} }
      const sent = await sendTestNotification();
      notifTestBtn.disabled = false;
      ok(sent ? 'Testmelding verstuurd — check je meldingen' : 'Kon geen melding sturen');
    };
  }

  backdrop.querySelector('#set-hizb-time').onchange = (e) => {
    setSetting('hizbReminderTime', e.target.value);
    ok('Herinnering bijgewerkt');
  };
  backdrop.querySelector('#show-weekly').onclick = () => { close(); openWeeklyReview(); };

  // Arabisch leren
  const arNewSlider = backdrop.querySelector('#set-ar-new');
  const arNewVal = backdrop.querySelector('#set-ar-new-val');
  if (arNewSlider) arNewSlider.oninput = () => { arNewVal.textContent = arNewSlider.value; };
  const arRevSlider = backdrop.querySelector('#set-ar-review');
  const arRevVal = backdrop.querySelector('#set-ar-review-val');
  if (arRevSlider) arRevSlider.oninput = () => { arRevVal.textContent = arRevSlider.value; };

  backdrop.querySelector('#save-ar-settings').onclick = () => {
    const current = getArabicSettings();
    saveArabicSettings({
      ...current,
      newCardsPerDay: parseInt(backdrop.querySelector('#set-ar-new').value),
      reviewLimitPerDay: parseInt(backdrop.querySelector('#set-ar-review').value),
      directionArNl: backdrop.querySelector('#set-ar-ar-nl').checked,
      directionNlAr: backdrop.querySelector('#set-ar-nl-ar').checked,
      showTranslitFront: backdrop.querySelector('#set-ar-translit').checked,
      startOrder: backdrop.querySelector('#set-ar-order').value,
      flipAnimation: backdrop.querySelector('#set-ar-flip').checked,
      showTypeBadge: backdrop.querySelector('#set-ar-badge').checked,
      showLessonNumber: backdrop.querySelector('#set-ar-lesson').checked,
    });
    ok('Arabisch-instellingen opgeslagen');
  };

  backdrop.querySelector('#ar-reset-all').onclick = async () => {
    if (!await confirmModal('Alle Arabisch SRS-voortgang wissen? Je begint opnieuw. Dit kan niet ongedaan worden gemaakt.', { confirmLabel: 'Wissen', danger: true })) return;
    resetArabicProgress();
    ok('Voortgang gewist');
  };

  // Profiel
  backdrop.querySelector('#set-username').onblur = (e) => {
    setSetting('userName', e.target.value.trim());
  };
  backdrop.querySelector('#save-pers').onclick = () => {
    const name = backdrop.querySelector('#set-username').value.trim();
    const m = backdrop.querySelector('#set-mascot').value.trim();
    const sh = backdrop.querySelector('#set-shame').value.split('\n').map(s => s.trim()).filter(Boolean);
    if (name) setSetting('userName', name);
    setCustomMascot(m || null);
    setCustomShame(sh);
    ok('Profiel opgeslagen');
  };

  // Shame preview
  backdrop.querySelector('#previewShameBtn').onclick = () => {
    const textarea = backdrop.querySelector('#set-shame');
    const lines = textarea.value.split('\n').map(s => s.trim()).filter(Boolean);
    const pool = lines.length ? lines : (getCustomShame() || []);
    const preview = backdrop.querySelector('#shamePreview');
    if (!pool.length) { preview.textContent = 'Geen berichten ingesteld.'; preview.style.display = 'block'; return; }
    const msg = pool[Math.floor(Math.random() * pool.length)];
    preview.textContent = msg;
    preview.style.display = 'block';
  };

  // Beveiliging
  backdrop.querySelector('#set-pin').onclick = () => {
    openModal(isLockEnabled() ? 'PIN wijzigen' : 'PIN instellen', `
      <p class="muted" style="font-size:.88rem;margin:0 0 12px">Kies een 4 tot 6 cijferige pincode.</p>
      <label>Pincode *</label>
      <input name="pin" type="password" inputmode="numeric" maxlength="6" autocomplete="new-password" placeholder="••••" required autofocus />
      <label>Herhaal pincode *</label>
      <input name="pin2" type="password" inputmode="numeric" maxlength="6" autocomplete="new-password" placeholder="••••" required />
    `, async (d) => {
      if (!/^\d{4,6}$/.test(d.pin)) throw new Error('PIN moet 4-6 cijfers zijn');
      if (d.pin !== d.pin2) throw new Error('Pincodes komen niet overeen');
      await setPin(d.pin);
      ok('PIN ingesteld');
      close();
    });
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
        wrap.style.cssText = 'flex-shrink:0';
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
      renderBio('Geen Face ID / Touch ID gevonden', '');
      return;
    }
    const refresh = () => {
      const on = isBiometricEnabled();
      renderBio(on ? 'Actief' : 'Beschikbaar',
        on ? `<button class="btn danger" id="bio-off">Uitschakelen</button>`
           : `<button class="btn" id="bio-on">Inschakelen</button>`);
      const onBtn = backdrop.querySelector('#bio-on');
      if (onBtn) onBtn.onclick = async () => {
        try { await registerBiometric(); ok('Face ID ingeschakeld'); refresh(); }
        catch (e) { err('Mislukt: ' + (e.message || e)); }
      };
      const offBtn = backdrop.querySelector('#bio-off');
      if (offBtn) offBtn.onclick = async () => {
        if (!await confirmModal('Face ID uitschakelen?', { confirmLabel: 'Uitschakelen', danger: true })) return;
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
    if (!await confirmModal('PIN verwijderen?', { confirmLabel: 'Verwijderen', danger: true })) return;
    await setPin(null);
    ok('PIN verwijderd');
    close();
  };

  // Synchronisatie
  const ghSetupBtn = backdrop.querySelector('#gh-setup');
  if (ghSetupBtn) ghSetupBtn.onclick = async () => {
    const token = backdrop.querySelector('#gh-token').value.trim();
    const existingId = backdrop.querySelector('#gh-existing-id').value.trim();
    if (!token) { err('Geen token ingevuld'); return; }
    // Sla token altijd op — NIET wissen als sync mislukt, zodat de user kan herproberen
    setupGithub(token, existingId);
    try {
      if (existingId) {
        await syncMerge();
        ok('Verbonden met bestaande gist + gemerged ✓');
      } else {
        await syncUp();
        ok('Verbonden + eerste backup gemaakt ✓');
      }
      setTimeout(() => location.reload(), 400);
    } catch (e) {
      // Token/gist bewaren — user kan handmatig herproberen via Mergen-knop
      err('Sync mislukt: ' + e.message);
    }
  };

  const ghTestBtn = backdrop.querySelector('#gh-test-conn');
  if (ghTestBtn) ghTestBtn.onclick = async () => {
    // Lees token + gist uit invoervelden (niet-verbonden) of uit opgeslagen settings (verbonden)
    const token = (backdrop.querySelector('#gh-token')?.value.trim()) || getSetting('ghToken');
    const gistId = (backdrop.querySelector('#gh-existing-id')?.value.trim()) || getSyncStatus().gistIds[0] || '';
    if (!token) { err('Vul eerst een token in'); return; }
    ghTestBtn.textContent = '…';
    ghTestBtn.disabled = true;
    try {
      // Test 1: token geldig?
      const userRes = await fetch('https://api.github.com/user', {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' },
      });
      if (!userRes.ok) { err(`Token ongeldig (${userRes.status}) — maak een nieuw token aan met scope 'gist'`); return; }
      const user = await userRes.json();
      if (gistId) {
        // Test 2: gist bereikbaar?
        const gistRes = await fetch(`https://api.github.com/gists/${gistId}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' },
        });
        if (!gistRes.ok) { err(`Gist niet gevonden (${gistRes.status}) — controleer de ID`); return; }
        const gist = await gistRes.json();
        const files = Object.keys(gist.files || {});
        const hasBackup = files.includes('dashboard-backup.json') || files.some(f => f.startsWith('backup-'));
        if (!hasBackup) { err(`Gist gevonden maar bevat geen dashboard-backup — bestanden: ${files.join(', ') || 'leeg'}`); return; }
        ok(`✓ Token OK (${user.login}) · Gist OK · Backup aanwezig`);
      } else {
        ok(`✓ Token OK — ingelogd als ${user.login}`);
      }
    } catch (e) {
      err('Verbindingsfout: ' + e.message);
    } finally {
      ghTestBtn.textContent = 'Test';
      ghTestBtn.disabled = false;
    }
  };

  const ghFind = backdrop.querySelector('#gh-find');
  if (ghFind) ghFind.onclick = async () => { close(); openGistPicker(); };
  const ghUp = backdrop.querySelector('#gh-sync-up');
  if (ghUp) ghUp.onclick = async () => {
    try { await syncUp(); ok('Gesynchroniseerd'); close(); }
    catch (e) { err(e.message); }
  };
  const ghDown = backdrop.querySelector('#gh-sync-down');
  if (ghDown) ghDown.onclick = async () => {
    if (!await confirmModal('Online backup ophalen overschrijft lokale data. Doorgaan?', { confirmLabel: 'Ophalen', danger: true })) return;
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
  backdrop.querySelectorAll('[data-copy]').forEach(b => {
    b.onclick = async () => {
      try {
        await navigator.clipboard.writeText(b.dataset.copy);
        ok('Gist-ID gekopieerd — plak in email/Notes');
      } catch (_) {
        prompt('Kopieer dit:', b.dataset.copy);
      }
    };
  });
  const ghDisc = backdrop.querySelector('#gh-disconnect');
  if (ghDisc) ghDisc.onclick = async () => {
    if (!await confirmModal('GitHub-verbinding verbreken? Je gists blijven op GitHub bestaan.', { confirmLabel: 'Verbreken', danger: true })) return;
    setupGithub('');
    ok('Verbinding verbroken');
    close();
  };
  const ghMirror = backdrop.querySelector('#gh-mirror');
  if (ghMirror) ghMirror.onclick = async () => {
    if (!await confirmModal('Tweede gist aanmaken voor extra backup-redundantie?', { confirmLabel: 'Aanmaken' })) return;
    try { const id = await createSecondaryGist(); ok('Mirror aangemaakt: ' + id.slice(0,8) + '…'); close(); }
    catch (e) { err(e.message); }
  };
  const ghEmail = backdrop.querySelector('#gh-email');
  if (ghEmail) ghEmail.onclick = () => { emailGistLink(); };
  const ghVer = backdrop.querySelector('#gh-versions');
  if (ghVer) ghVer.onclick = () => { close(); openVersionPicker(); };

  // Gmail
  backdrop.querySelector('#gmail-save').onclick = () => {
    const val = (backdrop.querySelector('#gmail-client-id')?.value || '').trim();
    if (val) {
      localStorage.setItem('gmailClientId', val);
      const el = backdrop.querySelector('#gmail-status');
      if (el) el.textContent = '✓ Client ID opgeslagen';
      ok('Gmail Client ID opgeslagen');
    } else {
      localStorage.removeItem('gmailClientId');
      const el = backdrop.querySelector('#gmail-status');
      if (el) el.textContent = 'Niet ingesteld';
      ok('Gmail Client ID verwijderd');
    }
  };
  const gmailTest = backdrop.querySelector('#gmail-test');
  if (gmailTest) gmailTest.onclick = async () => {
    gmailTest.disabled = true; gmailTest.textContent = 'Bezig…';
    try {
      const { getGmailToken } = await import('../gmail.js');
      await getGmailToken();
      const el = backdrop.querySelector('#gmail-status');
      if (el) el.textContent = '✓ Verbonden met Google';
      ok('Gmail-verbinding gelukt ✓');
    } catch (e) {
      err('Gmail: ' + (e.message || 'Verbinding mislukt'));
    } finally {
      gmailTest.disabled = false; gmailTest.textContent = 'Test';
    }
  };
  const gmailDisc = backdrop.querySelector('#gmail-disconnect');
  if (gmailDisc) gmailDisc.onclick = async () => {
    if (!await confirmModal('Gmail-koppeling verwijderen?', { confirmLabel: 'Verwijderen', danger: true })) return;
    localStorage.removeItem('gmailClientId');
    ok('Gmail-koppeling verwijderd');
    close();
  };

  // Data & Export
  backdrop.querySelector('#export-ical').onclick = async () => {
    try { await exportICal(); ok('iCal gedownload'); }
    catch (e) { err(e.message); }
  };
  backdrop.querySelector('#print-page').onclick = () => { close(); setTimeout(() => window.print(), 200); };
  backdrop.querySelector('#export-pdf').onclick = () => { close(); exportMonthPDF(); };
  backdrop.querySelector('#set-auto-export').onchange = (e) => setSetting('autoExport', e.target.checked ? '1' : '0');
  backdrop.querySelector('#set-auto-pdf').onchange = (e) => setSetting('autoPdf', e.target.checked ? '1' : '0');

  // Online/offline live updates — AbortController al gedeclareerd boven, cleanup bij sluiten
  const onlineRow = backdrop.querySelector('#online-status');
  if (onlineRow) {
    const updateOnline = () => {
      const sub = onlineRow.querySelector('.settings-row-sub');
      const dot = onlineRow.querySelector('.conn-dot');
      if (sub) sub.textContent = navigator.onLine ? 'Online' : 'Offline';
      if (dot) dot.className = `conn-dot ${navigator.onLine ? 'on' : 'off'}`;
    };
    window.addEventListener('online', updateOnline, _settingsSig);
    window.addEventListener('offline', updateOnline, _settingsSig);
  }

  // Sync buttons disabled when offline
  const syncBtns = backdrop.querySelectorAll('#gh-setup, #gh-sync-up, #gh-sync-merge, #gh-sync-down, #gh-mirror, #gh-email, #gh-find, #gh-versions');
  const updateSyncBtns = () => {
    syncBtns.forEach(btn => {
      btn.disabled = !navigator.onLine;
      btn.title = !navigator.onLine ? 'Geen internetverbinding' : '';
    });
  };
  updateSyncBtns();
  window.addEventListener('online', updateSyncBtns, _settingsSig);
  window.addEventListener('offline', updateSyncBtns, _settingsSig);

  // Opslag info
  if (navigator.storage && navigator.storage.estimate) {
    navigator.storage.estimate().then(async (e) => {
      const usedMB = (e.usage / (1024*1024)).toFixed(2);
      const quotaMB = (e.quota / (1024*1024)).toFixed(0);
      const persistent = navigator.storage.persisted ? await navigator.storage.persisted() : false;
      const el = backdrop.querySelector('#storage-info');
      if (el) el.innerHTML = `
        Gebruikt: <b>${usedMB} MB</b> van ${quotaMB} MB beschikbaar
        <div style="margin-top:4px;display:flex;align-items:center;gap:6px">${persistent ? `${icon('lock')} Persistent — browser ruimt niet automatisch op` : `${icon('warning')} Niet persistent — klik hieronder om te beschermen`}</div>
        ${!persistent && navigator.storage.persist ? '<button class="btn secondary" id="persist-btn" style="margin-top:8px">Maak opslag persistent</button>' : ''}
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
        monthlyIncomeGoal: getSetting('monthlyIncomeGoal'),
        taxReservePercent: getSetting('taxReservePercent'),
        hizbReminderTime: getSetting('hizbReminderTime'),
        hizbStartPoint: getSetting('hizbStartPoint'),
        themeMode: getSetting('themeMode'),
        themePreset: getSetting('themePreset'),
        accentColor: getSetting('accentColor'),
        density: getSetting('density'),
        userName: getSetting('userName'),
        autoTheme: getSetting('autoTheme'),
        lockGraceMin: getSetting('lockGraceMin'),
      };
      // Taxikosten + custom personalisatie zitten in losse localStorage-keys
      try { data._taxiExpenses = JSON.parse(localStorage.getItem('taxiExpenses') || '[]'); } catch (_) {}
      try { data._customShame = JSON.parse(localStorage.getItem('customShame') || '[]'); } catch (_) {}
      try { data._hizbVoortgang = JSON.parse(localStorage.getItem('hizb_voortgang') || '{}'); } catch (_) {}
      data._customMascot = localStorage.getItem('customMascot') || null;
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
    if (!await confirmModal('Importeren overschrijft al je huidige data. Doorgaan?', { confirmLabel: 'Importeren', danger: true })) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      for (const s of STORES) {
        if (!Array.isArray(data[s])) continue;
        await clear(s);
        for (const item of data[s]) await put(s, item);
      }
      if (data._settings) {
        for (const [k, v] of Object.entries(data._settings)) { if (v != null && v !== '') setSetting(k, v); }
      }
      if (Array.isArray(data._taxiExpenses)) localStorage.setItem('taxiExpenses', JSON.stringify(data._taxiExpenses));
      if (Array.isArray(data._customShame) && data._customShame.length) localStorage.setItem('customShame', JSON.stringify(data._customShame));
      if (data._hizbVoortgang && typeof data._hizbVoortgang === 'object') localStorage.setItem('hizb_voortgang', JSON.stringify(data._hizbVoortgang));
      if (data._customMascot) localStorage.setItem('customMascot', data._customMascot);
      ok('Geïmporteerd. Pagina ververst.');
      setTimeout(() => location.reload(), 500);
    } catch (e2) { err('Import mislukt: ' + e2.message); }
  };
}
