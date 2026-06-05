// Lock-screen: Face ID (WebAuthn) of PIN als fallback.
import { isBiometricEnabled, verifyBiometric } from './biometric.js';
import { getSetting } from './settings.js';

const GRACE_KEY = 'lastUnlock';

function gracePeriodMs() {
  const min = parseInt(getSetting('lockGraceMin') || '5', 10);
  return Math.max(0, min) * 60 * 1000;
}

function inGracePeriod() {
  const last = parseInt(localStorage.getItem(GRACE_KEY) || '0', 10);
  return last > 0 && (Date.now() - last) < gracePeriodMs();
}

function markUnlocked() {
  localStorage.setItem(GRACE_KEY, Date.now().toString());
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
  // Grace-periode: nog steeds binnen tijdsvenster sinds laatste ontgrendeling?
  if (inGracePeriod()) { onUnlock(); return; }

  const overlay = document.createElement('div');
  overlay.className = 'lock-overlay';
  document.body.appendChild(overlay);
  renderLock(overlay, () => { markUnlocked(); onUnlock(); });
}

export function clearUnlock() { localStorage.removeItem(GRACE_KEY); }

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
    // Probeer meteen
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
  const err = overlay.querySelector('#pin-error');
  setTimeout(() => input.focus(), 50);
  input.oninput = async () => {
    err.textContent = '';
    if (input.value.length >= 4) {
      if (await verifyPin(input.value)) {
        overlay.remove();
        onUnlock();
      } else if (input.value.length === 6) {
        err.textContent = 'Onjuiste code';
        input.value = '';
      }
    }
  };
}
