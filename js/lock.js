// Lichte PIN-lock. Niet militaire encryptie — bescherming tegen toevallige kijkers.
async function hash(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,'0')).join('');
}

export function isLockEnabled() {
  return !!localStorage.getItem('pinHash');
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

export function lockScreen(onUnlock) {
  if (!isLockEnabled()) { onUnlock(); return; }
  const overlay = document.createElement('div');
  overlay.className = 'lock-overlay';
  overlay.innerHTML = `
    <div class="lock-box">
      <div class="lock-icon">🔒</div>
      <h2 style="margin:8px 0">Voer pincode in</h2>
      <input id="pin-input" type="password" inputmode="numeric" maxlength="6" autocomplete="off" placeholder="••••" />
      <div id="pin-error" style="color:var(--danger);min-height:1em;margin-top:6px;font-size:.85rem"></div>
    </div>`;
  document.body.appendChild(overlay);
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
