// Mascot die reageert op je voortgang
import { all } from './db.js';
import { ymd } from './utils.js';
import { getNumber } from './settings.js';

const STATES = [
  { id: 'fire',    e: '🦁🔥', msg: 'Op vuur. Niet te stoppen!' },
  { id: 'happy',   e: '🦁', msg: 'Lekker bezig vandaag.' },
  { id: 'neutral', e: '😌', msg: 'Rustige dag. Even doorpakken?' },
  { id: 'worried', e: '🤨', msg: 'Hmm. Iets vergeten?' },
  { id: 'broken',  e: '💀', msg: 'Streak: GONE. Wat ben je aan het doen?' },
];

const SHAME = [
  'Streak weg. Discipline weg. Wat heb je nog?',
  'Allah ziet jou. Wat ben jij nu aan het doen?',
  'Zwak. Punt. Geen excuses, niemand gelooft ze toch.',
  'Anderen memoriseren. Jij scrollt. Voel de schaamte.',
  'Vroeger had je vuur. Wat is daarmee gebeurd, lafaard?',
  'Je verraadt jezelf. Elke dag een beetje meer.',
  'Lui. Slordig. Vergeetachtig. Kies maar welke vandaag past.',
  'Mensen winnen in stilte. Jij verliest in stilte.',
  'Streak: 0. Karakter: 0. Toeval?',
  'Je toekomstige ik kotst hierop. Stop met dit gedrag.',
  'Excuses, excuses, excuses. Zielig, zielig, zielig.',
  'De Mushaf staat te wachten. Jij ook — maar dan op niets.',
  'Vandaag was je optie A: discipline. Jij koos D: niets.',
  'Niemand respecteert iemand die zichzelf niet respecteert.',
  'Het is niet moeilijk. Jij bent gewoon lui.',
];

export function pickShame() {
  return SHAME[Math.floor(Math.random() * SHAME.length)];
}

export async function getMascotState() {
  const [rides, hizb, todos] = await Promise.all([all('rides'), all('hizb_log'), all('todos')]);
  const today = ymd();
  const doneSet = new Set(hizb.map(h => h.date));

  let streak = 0;
  const cur = new Date();
  while (doneSet.has(ymd(cur))) { streak++; cur.setDate(cur.getDate() - 1); }

  const todayIncome = rides.filter(r => ymd(new Date(r.date)) === today)
    .reduce((s, r) => s + Number(r.amount || 0), 0);
  const goal = getNumber('dailyIncomeGoal');
  const goalProg = goal > 0 ? todayIncome / goal : 0;

  const todayHizb = doneSet.has(today);
  const remainingTasks = todos.filter(t => !t.done && !t.savedForLater).length;

  // Bepaal state
  if (streak >= 7 && todayHizb && goalProg >= 1) return STATES[0]; // fire
  if (todayHizb && goalProg >= 0.5) return STATES[1]; // happy
  if (todayHizb || streak >= 1) return STATES[2]; // neutral

  // Brutaal als streak vandaag al voorbij is en het is na 22:00
  const yesterday = ymd(new Date(Date.now() - 86400000));
  const had2DayBreak = !doneSet.has(today) && !doneSet.has(yesterday);
  if (had2DayBreak) return STATES[4]; // broken/shame

  return STATES[3]; // worried
}

// Detecteer of streak vandaag verbroken is (gisteren wel, vandaag nog niet en het is laat)
export async function shouldShame() {
  const hizb = await all('hizb_log');
  const today = ymd();
  const yesterday = ymd(new Date(Date.now() - 86400000));
  const doneSet = new Set(hizb.map(h => h.date));
  const yesterdayDone = doneSet.has(yesterday);
  const todayDone = doneSet.has(today);
  const hour = new Date().getHours();

  // Alleen 's avonds laat, en als gisteren wel maar vandaag niet
  if (yesterdayDone && !todayDone && hour >= 21) return true;

  // Streak gebroken (gisteren niet, vandaag niet) → permanent shame deze sessie
  const dayBefore = ymd(new Date(Date.now() - 2 * 86400000));
  const dayBeforeDone = doneSet.has(dayBefore);
  if (dayBeforeDone && !yesterdayDone) return true;

  return false;
}
