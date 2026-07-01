// Genereer iCal (.ics) van doelen + herhalende taken voor Apple/Google Agenda.
import { all } from './db.js';

function fmt(d) {
  const z = (n) => String(n).padStart(2, '0');
  return d.getUTCFullYear() + z(d.getUTCMonth()+1) + z(d.getUTCDate()) + 'T' + z(d.getUTCHours()) + z(d.getUTCMinutes()) + '00Z';
}
function fmtDate(yyyymmdd) {
  return yyyymmdd.replace(/-/g, '');
}
// RFC 5545: backslash, puntkomma, komma en newlines escapen in tekstvelden,
// anders breekt een titel met een komma de import in Apple/Google Agenda.
function esc(s) {
  return String(s ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

export async function exportICal() {
  const [goals, todos] = await Promise.all([all('goals'), all('todos')]);
  const now = new Date();
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dashboard//NL',
    'CALSCALE:GREGORIAN',
  ];

  goals.filter(g => g.deadline).forEach(g => {
    lines.push(
      'BEGIN:VEVENT',
      `UID:goal-${g.id}@dashboard`,
      `DTSTAMP:${fmt(now)}`,
      `DTSTART;VALUE=DATE:${fmtDate(g.deadline)}`,
      `SUMMARY:Doel: ${esc(g.title)}`,
      g.description ? `DESCRIPTION:${esc(g.description)}` : '',
      'END:VEVENT',
    );
  });

  todos.filter(t => !t.done && t.dueDate).forEach(t => {
    const rrule = t.recurring === 'daily' ? 'RRULE:FREQ=DAILY'
                : t.recurring === 'weekly' ? 'RRULE:FREQ=WEEKLY' : '';
    lines.push(
      'BEGIN:VEVENT',
      `UID:todo-${t.id}@dashboard`,
      `DTSTAMP:${fmt(now)}`,
      `DTSTART;VALUE=DATE:${fmtDate(t.dueDate)}`,
      `SUMMARY:Taak: ${esc(t.title)}`,
      t.note ? `DESCRIPTION:${esc(t.note)}` : '',
      rrule,
      'END:VEVENT',
    );
  });

  lines.push('END:VCALENDAR');
  const ics = lines.filter(Boolean).join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'dashboard-agenda.ics';
  a.click();
  URL.revokeObjectURL(a.href);
}
