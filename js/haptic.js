// Lichte haptic feedback helper (vibration API)
const isCapable = 'vibrate' in navigator;

export function tap()    { if (isCapable) navigator.vibrate(8); }
export function light()  { if (isCapable) navigator.vibrate(15); }
export function medium() { if (isCapable) navigator.vibrate(25); }
export function heavy()  { if (isCapable) navigator.vibrate([10, 30, 10]); }
export function success() { if (isCapable) navigator.vibrate([8, 40, 12]); }
export function err()    { if (isCapable) navigator.vibrate([20, 50, 20, 50, 20]); }

// Automatisch: alle .btn / .tab / .modal-close clicks krijgen tap-feedback
export function autoHaptic() {
  document.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('.btn, .tab, .modal-close, .income-cell, .hab-check');
    if (el) tap();
  });
}
