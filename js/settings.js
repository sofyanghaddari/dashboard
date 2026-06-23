const DEFAULTS = {
  theme: 'dark',
  userName: '',
  hizbReminderTime: '20:00',
  hizbStartPoint: 'Surah Al-Fath, 10 hizb',
  dailyIncomeGoal: '200',
  monthlyIncomeGoal: '5000',
  taxReservePercent: '25',
  lockGraceMin: '5',
  autoPullOnOpen: '1',
};

// Niets staat nog sessie-only: zowel de PAT (ghToken) als het encryptie-wachtwoord
// (ghEncPwd) worden nu persistent in localStorage bewaard, zodat ze niet bij elke
// herstart verdwijnen (dat dwong tot telkens opnieuw invoeren én was een hoofdoorzaak
// van het aanmaken van nieuwe gists). Gebruik een fine-grained token met alléén
// Gist-permissie; de app-lock (PIN/Face ID) beschermt de toegang tot het toestel.
const SESSION_KEYS = new Set();

// Keys die vroeger in sessionStorage zaten en nu persistent moeten worden.
const PROMOTE_KEYS = ['ghToken', 'ghEncPwd'];

/**
 * Wordt aangeroepen bij app-start.
 * Promoveert bestaande sessie-waarden (token, encryptie-wachtwoord) éénmalig naar
 * localStorage, zodat gebruikers die nog op de oude opslag zaten niets kwijtraken.
 */
export function migrateSessionKeys() {
  for (const key of PROMOTE_KEYS) {
    const sessVal = sessionStorage.getItem(key);
    if (sessVal && !localStorage.getItem(key)) {
      localStorage.setItem(key, sessVal);
    }
    sessionStorage.removeItem(key);
  }
}

function _storage(key) {
  return SESSION_KEYS.has(key) ? sessionStorage : localStorage;
}

export function getSetting(key) {
  return _storage(key).getItem(key) ?? DEFAULTS[key] ?? '';
}

export function setSetting(key, value) {
  _storage(key).setItem(key, value);
}

export function removeSetting(key) {
  _storage(key).removeItem(key);
}

export function getNumber(key) {
  return parseFloat(getSetting(key)) || 0;
}
