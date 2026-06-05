const DEFAULTS = {
  theme: 'dark',
  hizbReminderTime: '20:00',
  hizbStartPoint: 'Surah Al-Fath, 10 hizb',
  dailyIncomeGoal: '200',
  monthlyIncomeGoal: '5000',
  taxReservePercent: '25',
};

export function getSetting(key) {
  return localStorage.getItem(key) ?? DEFAULTS[key] ?? '';
}

export function setSetting(key, value) {
  localStorage.setItem(key, value);
}

export function getNumber(key) {
  return parseFloat(getSetting(key)) || 0;
}
