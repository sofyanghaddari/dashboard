// Lichte natural-language parser voor snelle taak-invoer.
// Voorbeelden:
//   "morgen 10:00 APK"          → { title: 'APK', dueDate: tomorrow }
//   "vrijdag boodschappen"       → { title: 'boodschappen', dueDate: friday }
//   "elke maandag tanken checken" → { title: 'tanken checken', recurring: 'weekly', dueDate: monday }
//   "prio belasting indienen"     → { title: 'belasting indienen', priority: 'high' }
import { ymd } from './utils.js';

const DAYS = { zondag:0, maandag:1, dinsdag:2, woensdag:3, donderdag:4, vrijdag:5, zaterdag:6 };

export function parseTaskInput(raw) {
  let s = raw.trim();
  const out = { title: '', priority: 'medium', recurring: null, dueDate: null };

  // priority
  if (/^(prio|urgent|prioriteit)\b/i.test(s)) {
    out.priority = 'high';
    s = s.replace(/^(prio|urgent|prioriteit)\s+/i, '');
  } else if (/^(waiting|wacht)\b/i.test(s)) {
    out.priority = 'waiting';
    s = s.replace(/^(waiting|wacht)\s+/i, '');
  }

  // recurring
  const recurMatch = s.match(/^(elke|every)\s+(dag|dagelijks|daily|maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag|week|wekelijks|weekly)\s+/i);
  if (recurMatch) {
    const w = recurMatch[2].toLowerCase();
    if (w === 'dag' || w === 'dagelijks' || w === 'daily') out.recurring = 'daily';
    else out.recurring = 'weekly';
    if (DAYS[w] != null) out.dueDate = nextWeekday(DAYS[w]);
    s = s.replace(recurMatch[0], '');
  }

  // explicit date words
  if (/^vandaag\b/i.test(s)) { out.dueDate = ymd(); s = s.replace(/^vandaag\s+/i, ''); }
  else if (/^morgen\b/i.test(s)) {
    const d = new Date(); d.setDate(d.getDate() + 1);
    out.dueDate = ymd(d); s = s.replace(/^morgen\s+/i, '');
  } else if (/^overmorgen\b/i.test(s)) {
    const d = new Date(); d.setDate(d.getDate() + 2);
    out.dueDate = ymd(d); s = s.replace(/^overmorgen\s+/i, '');
  } else {
    const dayWordMatch = s.match(/^(zondag|maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag)\s+/i);
    if (dayWordMatch && !out.dueDate) {
      out.dueDate = nextWeekday(DAYS[dayWordMatch[1].toLowerCase()]);
      s = s.replace(dayWordMatch[0], '');
    }
  }

  // strip leading time (we don't store time, just title)
  s = s.replace(/^\d{1,2}[:.]\d{2}\s+/, '');

  out.title = s.trim();
  return out;
}

function nextWeekday(target) {
  const d = new Date(); const cur = d.getDay();
  let diff = target - cur; if (diff <= 0) diff += 7;
  d.setDate(d.getDate() + diff);
  return ymd(d);
}
