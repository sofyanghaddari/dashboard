// Lock-screen: Face ID (WebAuthn) of PIN als fallback.
import { isBiometricEnabled, verifyBiometric } from './biometric.js';
import { getSetting } from './settings.js';

const GRACE_KEY    = 'lastUnlock';
const FAIL_KEY     = 'pinFailCount';
const LOCKOUT_KEY  = 'pinLockUntil';
const MAX_FAILS    = 5;
const LOCKOUT_MS   = 15 * 60 * 1000;

function gracePeriodMs() {
  const min = parseInt(getSetting('lockGraceMin') || '5', 10);
  return Math.max(0, min) * 60 * 1000;
}

function inGracePeriod() {
  const last = parseInt(sessionStorage.getItem(GRACE_KEY) || '0', 10);
  return last > 0 && (Date.now() - last) < gracePeriodMs();
}

function markUnlocked() {
  sessionStorage.setItem(GRACE_KEY, Date.now().toString());
}

function isPinLockedOut() {
  const until = parseInt(sessionStorage.getItem(LOCKOUT_KEY) || '0', 10);
  return until > 0 && Date.now() < until;
}

function lockoutMinutes() {
  const until = parseInt(sessionStorage.getItem(LOCKOUT_KEY) || '0', 10);
  return Math.max(1, Math.ceil((until - Date.now()) / 60000));
}

function recordPinFail() {
  const fails = parseInt(sessionStorage.getItem(FAIL_KEY) || '0', 10) + 1;
  if (fails >= MAX_FAILS) {
    sessionStorage.setItem(LOCKOUT_KEY, String(Date.now() + LOCKOUT_MS));
    sessionStorage.removeItem(FAIL_KEY);
  } else {
    sessionStorage.setItem(FAIL_KEY, String(fails));
  }
  return fails;
}

function clearPinFails() {
  sessionStorage.removeItem(FAIL_KEY);
  sessionStorage.removeItem(LOCKOUT_KEY);
}

async function hash(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,'0')).join('');
}

export function isLockEnabled() {
  return !!localStorage.getItem('pinHash');
}

export function anyLockEnabled() {
  return isLockEnabled() || isBiometricEnabled();
}

export async function setPin(pin) {
  if (!pin) { localStorage.removeItem('pinHash'); return; }
  localStorage.setItem('pinHash', await hash(pin));
}

export async function verifyPin(pin) {
  const stored = localStorage.getItem('pinHash');
  if (!stored) return true;
  return stored === await hash(pin);
}

export async function lockScreen(onUnlock) {
  if (!anyLockEnabled()) { onUnlock(); return; }
  if (inGracePeriod()) { onUnlock(); return; }

  const overlay = document.createElement('div');
  overlay.className = 'lock-overlay';
  document.body.appendChild(overlay);
  renderLock(overlay, () => { markUnlocked(); onUnlock(); });
}

export function clearUnlock() { sessionStorage.removeItem(GRACE_KEY); }

function renderLock(overlay, onUnlock) {
  const hasBio = isBiometricEnabled();
  const hasPin = isLockEnabled();

  overlay.innerHTML = `
    <div class="lock-box">
      <div class="lock-icon">${hasBio ? '👤' : '🔒'}</div>
      <h2 style="margin:8px 0">${hasBio ? 'Ontgrendelen' : 'Voer pincode in'}</h2>
      ${hasBio ? `
        <button class="btn block" id="bio-try" style="margin-top:14px">Gebruik Face ID</button>
        ${hasPin ? `<button class="btn secondary block" id="show-pin" style="margin-top:8px">Gebruik PIN</button>` : ''}
        <div id="bio-err" style="color:var(--danger);min-height:1em;margin-top:8px;font-size:.85rem"></div>
      ` : `
        <input id="pin-input" type="password" inputmode="numeric" maxlength="6" autocomplete="off" placeholder="••••" />
        <div id="pin-error" style="color:var(--danger);min-height:1em;margin-top:6px;font-size:.85rem"></div>
      `}
    </div>`;

  if (hasBio) {
    const tryBio = async () => {
      const err = overlay.querySelector('#bio-err');
      err.textContent = '';
      try {
        await verifyBiometric();
        overlay.remove();
        onUnlock();
      } catch (e) {
        err.textContent = 'Mislukt. Probeer opnieuw of gebruik PIN.';
      }
    };
    overlay.querySelector('#bio-try').onclick = tryBio;
    const showPin = overlay.querySelector('#show-pin');
    if (showPin) showPin.onclick = () => { showPinForm(overlay, onUnlock); };
    setTimeout(tryBio, 200);
  } else {
    bindPinInput(overlay, onUnlock);
  }
}

function showPinForm(overlay, onUnlock) {
  overlay.innerHTML = `
    <div class="lock-box">
      <div class="lock-icon">🔒</div>
      <h2 style="margin:8px 0">Voer pincode in</h2>
      <input id="pin-input" type="password" inputmode="numeric" maxlength="6" autocomplete="off" placeholder="••••" />
      <div id="pin-error" style="color:var(--danger);min-height:1em;margin-top:6px;font-size:.85rem"></div>
      ${isBiometricEnabled() ? `<button class="btn secondary block" id="back-bio" style="margin-top:12px">Terug naar Face ID</button>` : ''}
    </div>`;
  bindPinInput(overlay, onUnlock);
  const back = overlay.querySelector('#back-bio');
  if (back) back.onclick = () => renderLock(overlay, onUnlock);
}

function bindPinInput(overlay, onUnlock) {
  const input = overlay.querySelector('#pin-input');
  const errEl = overlay.querySelector('#pin-error');
  setTimeout(() => input.focus(), 50);

  // Check lockout state on bind
  if (isPinLockedOut()) {
    input.disabled = true;
    errEl.textContent = `Te veel pogingen. Wacht ${lockoutMinutes()} min.`;
    // Re-enable when lockout expires
    const remaining = parseInt(sessionStorage.getItem(LOCKOUT_KEY) || '0', 10) - Date.now();
    if (remaining > 0) setTimeout(() => {
      input.disabled = false;
      errEl.textContent = '';
      clearPinFails();
    }, remaining);
    return;
  }

  input.oninput = async () => {
    errEl.textContent = '';
    if (input.value.length < 4) return;

    if (isPinLockedOut()) {
      errEl.textContent = `Te veel pogingen. Wacht ${lockoutMinutes()} min.`;
      input.value = '';
      input.disabled = true;
      return;
    }

    if (await verifyPin(input.value)) {
      clearPinFails();
      overlay.remove();
      onUnlock();
    } else if (input.value.length === 6) {
      const fails = recordPinFail();
      if (isPinLockedOut()) {
        errEl.textContent = `Te veel pogingen. Vergrendeld voor ${lockoutMinutes()} min.`;
        input.value = '';
        input.disabled = true;
      } else {
        const left = MAX_FAILS - fails;
        errEl.textContent = `Onjuiste code${left <= 2 ? ` · nog ${left} poging${left !== 1 ? 'en' : ''}` : ''}`;
        input.value = '';
      }
    }
  };
}
