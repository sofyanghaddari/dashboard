// Patroon-detectie zonder AI — pure data-analyse
import { ymd, fmtMoney } from './utils.js';

const DAY_NAMES_NL = ['zondag','maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag'];

export function detectInsights(rides, hizb) {
  const out = [];
  if (rides.length < 7 && hizb.length < 7) return out;

  // === DAY-OF-WEEK INKOMEN ===
  const byDay = Array(7).fill(0).map(() => []);
  rides.forEach(r => {
    const d = new Date(r.date).getDay();
    byDay[d].push(Number(r.amount || 0));
  });
  const dayAvg = byDay.map((arr, i) => ({
    i, name: DAY_NAMES_NL[i],
    avg: arr.length ? arr.reduce((a,b) => a+b, 0) / arr.length : 0,
    n: arr.length,
  })).filter(d => d.n >= 2);

  if (dayAvg.length >= 3) {
    const overall = rides.reduce((s, r) => s + Number(r.amount || 0), 0) / rides.length;
    const best = [...dayAvg].sort((a,b) => b.avg - a.avg)[0];
    const worst = [...dayAvg].sort((a,b) => a.avg - b.avg)[0];
    if (best.avg > overall * 1.3) {
      out.push({ icon: '💰', text: `Op ${best.name} verdien je gem ${fmtMoney(best.avg)} — <b>+${Math.round((best.avg/overall - 1) * 100)}%</b> boven gemiddeld` });
    }
    if (worst.avg > 0 && worst.avg < overall * 0.7) {
      out.push({ icon: '📉', text: `${capitalize(worst.name)} blijft achter — gem ${fmtMoney(worst.avg)} (${Math.round((worst.avg/overall - 1) * 100)}%)` });
    }
  }

  // === HIZB PATROON LAATSTE 60 DAGEN ===
  const sixtyAgo = new Date(Date.now() - 60 * 86400000);
  const hizbByDay = Array(7).fill(0).map(() => ({ done: 0, total: 0 }));
  for (let i = 0; i < 60; i++) {
    const d = new Date(sixtyAgo); d.setDate(d.getDate() + i);
    if (d > new Date()) break;
    const w = d.getDay();
    hizbByDay[w].total++;
    if (hizb.some(h => h.date === ymd(d))) hizbByDay[w].done++;
  }
  const rates = hizbByDay.map((b, i) => ({ i, rate: b.total ? b.done / b.total : 0, total: b.total }))
    .filter(d => d.total >= 3);
  if (rates.length >= 4) {
    const overallHizbRate = rates.reduce((s, d) => s + d.rate, 0) / rates.length;
    const worst = [...rates].sort((a,b) => a.rate - b.rate)[0];
    if (worst.rate < overallHizbRate - 0.2 && worst.rate < 0.6) {
      out.push({ icon: '📖', text: `Je vergeet hizb meestal op <b>${DAY_NAMES_NL[worst.i]}</b> — slechts ${Math.round(worst.rate * 100)}% gedaan` });
    }
  }

  // === GROEI VS LAST MAAND ===
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const daysIn = now.getDate();
  const thisMonth = rides.filter(r => new Date(r.date) >= thisMonthStart).reduce((s, r) => s + Number(r.amount || 0), 0);
  const lastMonthSoFar = rides.filter(r => {
    const d = new Date(r.date);
    return d >= lastMonthStart && d <= lastMonthEnd && d.getDate() <= daysIn;
  }).reduce((s, r) => s + Number(r.amount || 0), 0);
  if (lastMonthSoFar > 100 && thisMonth > 100) {
    const delta = (thisMonth - lastMonthSoFar) / lastMonthSoFar * 100;
    if (Math.abs(delta) > 15) {
      out.push({
        icon: delta > 0 ? '📈' : '📊',
        text: `Deze maand <b>${delta > 0 ? '+' : ''}${Math.round(delta)}%</b> vs vorige maand op dag ${daysIn}`,
      });
    }
  }

  // === STREAK RECORD ===
  const hizbDates = new Set(hizb.map(h => h.date));
  let longestStreak = 0, currentStreak = 0;
  const sorted = [...hizbDates].sort();
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0 || isDayAfter(sorted[i-1], sorted[i])) currentStreak++;
    else currentStreak = 1;
    if (currentStreak > longestStreak) longestStreak = currentStreak;
  }
  if (longestStreak >= 14) {
    out.push({ icon: '🏆', text: `Langste hizb-streak ooit: <b>${longestStreak} dagen</b>` });
  }

  return out.slice(0, 4);
}

export function goalFeasibility(monthIncome, monthlyGoal) {
  if (monthlyGoal <= 0) return null;
  const now = new Date();
  const daysIn = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - daysIn;
  const remaining = monthlyGoal - monthIncome;
  if (remaining <= 0) return { reached: true };
  const dailyNeeded = remaining / Math.max(1, daysLeft);
  const currentDaily = daysIn > 0 ? monthIncome / daysIn : 0;
  const projectedFinal = currentDaily * daysInMonth;
  const onTrack = projectedFinal >= monthlyGoal;
  const daysNeeded = currentDaily > 0 ? Math.ceil(remaining / currentDaily) : null;
  return {
    reached: false,
    remaining,
    dailyNeeded,
    currentDaily,
    projectedFinal,
    onTrack,
    daysNeeded,
    daysLeft,
    shortage: projectedFinal < monthlyGoal ? monthlyGoal - projectedFinal : 0,
  };
}

export function goalTrajectoryPath(rides, monthlyGoal, width = 280, height = 60) {
  // SVG path met ideale lijn vs werkelijke cumulatief
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const dailyTotals = Array(daysInMonth).fill(0);
  rides.forEach(r => {
    const d = new Date(r.date);
    if (d >= monthStart && d <= now) dailyTotals[d.getDate() - 1] += Number(r.amount || 0);
  });
  const cumul = [];
  let running = 0;
  for (let i = 0; i < now.getDate(); i++) { running += dailyTotals[i]; cumul.push(running); }

  const maxVal = Math.max(monthlyGoal, running, 1);
  const xStep = width / (daysInMonth - 1);
  const y = (v) => height - (v / maxVal) * (height - 4) - 2;

  // Ideale lijn
  const idealEndX = width;
  const idealY = y(monthlyGoal);
  const ideal = `M 0 ${y(0)} L ${idealEndX} ${idealY}`;

  // Actuele lijn
  const actual = cumul.map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i * xStep).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');

  return { idealPath: ideal, actualPath: actual, width, height };
}

function isDayAfter(a, b) {
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return (db - da) === 86400000;
}
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
