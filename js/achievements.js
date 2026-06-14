import { all } from './db.js';
import { ymd } from './utils.js';

export const BADGES = [
  { id: 'first-ride',  emoji: '🚖', name: 'Eerste rit', desc: 'Je eerste rit gelogd' },
  { id: 'rides-10',    emoji: '🔟', name: '10 ritten',  desc: '10 ritten gelogd' },
  { id: 'rides-50',    emoji: '5️⃣0️⃣', name: '50 ritten', desc: '50 ritten gelogd' },
  { id: 'rides-100',   emoji: '💯', name: '100 ritten', desc: '100 ritten gelogd' },
  { id: 'rides-500',   emoji: '🏎️', name: '500 ritten', desc: '500 ritten gelogd' },
  { id: 'streak-7',    emoji: '🔥', name: 'Week-streak', desc: '7 dagen hizb op rij' },
  { id: 'streak-30',   emoji: '🏔️', name: 'Maand-streak', desc: '30 dagen hizb op rij' },
  { id: 'streak-100',  emoji: '🌋', name: 'Vulkaan', desc: '100 dagen hizb op rij' },
  { id: 'cards-50',    emoji: '📚', name: '50 woorden', desc: '50 Arabische kaarten' },
  { id: 'cards-200',   emoji: '🧠', name: '200 woorden', desc: '200 Arabische kaarten' },
  { id: 'goal-done',   emoji: '🎯', name: 'Doel behaald', desc: 'Eerste doel op 100%' },
  { id: 'daily-100',   emoji: '💪', name: 'Honderd euro dag', desc: 'Eerste dag met €100+ inkomen' },
];

export async function computeEarnedBadges() {
  const [rides, hizb, cards, goals] = await Promise.all([
    all('rides'), all('hizb_log'), all('cards'), all('goals'),
  ]);
  const earned = new Set();
  if (rides.length >= 1) earned.add('first-ride');
  if (rides.length >= 10) earned.add('rides-10');
  if (rides.length >= 50) earned.add('rides-50');
  if (rides.length >= 100) earned.add('rides-100');
  if (rides.length >= 500) earned.add('rides-500');

  const doneSet = new Set(hizb.map(h => h.date));
  let streak = 0;
  const cur = new Date();
  while (doneSet.has(ymd(cur))) { streak++; cur.setDate(cur.getDate() - 1); }
  if (streak >= 7) earned.add('streak-7');
  if (streak >= 30) earned.add('streak-30');
  if (streak >= 100) earned.add('streak-100');

  if (cards.length >= 50) earned.add('cards-50');
  if (cards.length >= 200) earned.add('cards-200');

  if (goals.some(g => Number(g.progress) >= 100)) earned.add('goal-done');
  // Groepeer ritten per dag en check of er een dag is met 100+ inkomen
  const byDay = {};
  rides.forEach(r => { const d = r.date.slice(0, 10); byDay[d] = (byDay[d] || 0) + Number(r.amount || 0); });
  if (Object.values(byDay).some(t => t >= 100)) earned.add('daily-100');

  return earned;
}

// Detect newly-earned badges since last check; returns array of newly-earned badge objects.
export async function checkNewBadges() {
  const earned = await computeEarnedBadges();
  const stored = JSON.parse(localStorage.getItem('earnedBadges') || '[]');
  const storedSet = new Set(stored);
  const newOnes = [...earned].filter(id => !storedSet.has(id));
  if (newOnes.length) localStorage.setItem('earnedBadges', JSON.stringify([...earned]));
  return newOnes.map(id => BADGES.find(b => b.id === id)).filter(Boolean);
}
