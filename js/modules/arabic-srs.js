// SM-2 Spaced Repetition Engine voor Arabisch
const SRS_KEY = 'arabic_srs_data';
const SETTINGS_KEY = 'arabic_settings';
const TODAY_KEY = 'arabic_today';

export const DEFAULT_ARABIC_SETTINGS = {
  newCardsPerDay: 10,
  reviewLimitPerDay: 50,
  directionArNl: true,
  directionNlAr: true,
  showTranslitFront: false,
  repeatAgainToday: true,
  minEaseFactor: 1.3,
  startOrder: 'mixed',
  showLargeArabic: true,
  showTypeBadge: true,
  showLessonNumber: false,
  flipAnimation: true,
};

function getSrsStore() {
  try { return JSON.parse(localStorage.getItem(SRS_KEY) || '{}'); }
  catch { return {}; }
}

function saveSrsStore(data) {
  localStorage.setItem(SRS_KEY, JSON.stringify(data));
}

export function getCardSrs(id) {
  return getSrsStore()[id] || null;
}

// SM-2 algoritme — grade: 1=Again, 2=Moeilijk, 4=Goed, 5=Perfect
export function updateCardSrs(id, grade) {
  const store = getSrsStore();
  const existing = store[id] || { interval: 1, easeFactor: 2.5, repetitions: 0 };
  let { interval, easeFactor, repetitions } = existing;

  if (grade >= 3) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
    repetitions++;
  } else {
    repetitions = 0;
    interval = 1;
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);
  const nextReview = nextDate.toISOString().split('T')[0];

  store[id] = { interval, easeFactor, repetitions, nextReview, lastGrade: grade };
  saveSrsStore(store);
  return store[id];
}

export function isCardNew(id) { return !getCardSrs(id); }

export function isCardDue(id, today) {
  const c = getCardSrs(id);
  if (!c) return false;
  return c.nextReview <= today;
}

export function getTodayData() {
  try {
    const d = JSON.parse(localStorage.getItem(TODAY_KEY) || '{}');
    const today = new Date().toISOString().split('T')[0];
    if (d.date !== today) return { date: today, newSeen: [], reviewDone: 0 };
    return { date: today, newSeen: d.newSeen || [], reviewDone: d.reviewDone || 0 };
  } catch {
    return { date: new Date().toISOString().split('T')[0], newSeen: [], reviewDone: 0 };
  }
}

export function saveTodayData(data) {
  localStorage.setItem(TODAY_KEY, JSON.stringify(data));
}

export function resetAllProgress() {
  localStorage.removeItem(SRS_KEY);
  localStorage.removeItem(TODAY_KEY);
}

export function getArabicSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    return { ...DEFAULT_ARABIC_SETTINGS, ...stored };
  } catch {
    return { ...DEFAULT_ARABIC_SETTINGS };
  }
}

export function saveArabicSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Geeft statistieken terug voor een lijst van kaart-IDs
export function getSrsStats(cardIds, today) {
  const store = getSrsStore();
  let newCount = 0, dueCount = 0, learnedCount = 0, learningCount = 0;
  let nextReviewDate = null;

  for (const id of cardIds) {
    const c = store[id];
    if (!c) { newCount++; continue; }
    if (c.nextReview < today) { dueCount++; continue; }
    if (c.nextReview === today) { dueCount++; continue; }
    if (c.interval > 21 && c.repetitions >= 4) { learnedCount++; }
    else { learningCount++; }
    if (!nextReviewDate || c.nextReview < nextReviewDate) nextReviewDate = c.nextReview;
  }

  return { newCount, dueCount, learnedCount, learningCount, nextReviewDate };
}

export function getCardStatus(id, today) {
  const c = getCardSrs(id);
  if (!c) return 'new';
  if (c.nextReview < today) return 'overdue';
  if (c.nextReview === today) return 'due';
  if (c.interval > 21 && c.repetitions >= 4) return 'learned';
  return 'learning';
}
