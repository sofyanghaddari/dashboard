const DEFAULTS = {
  theme: 'dark',
  userName: '',
  hizbReminderTime: '20:00',
  hizbStartPoint: 'Surah Al-Fath, 10 hizb',
  dailyIncomeGoal: '200',
  monthlyIncomeGoal: '5000',
  taxReservePercent: '25',
  lockGraceMin: '5',
};

// Sleutels die in sessionStorage worden bewaard (verdwijnen bij afsluiten browser-tab)
const SESSION_KEYS = new Set(['ghToken', 'ghEncPwd']);

/**
 * Eénmalige migratie: verplaats gevoelige keys van localStorage naar sessionStorage.
 * Wordt aangeroepen bij app-start.
 */
export function migrateSessionKeys() {
  for (const key of SESSION_KEYS) {
    const val = localStorage.getItem(key);
    if (val !== null) {
      sessionStorage.setItem(key, val);
      localStorage.removeItem(key);
    }
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
