// Genereer iCal (.ics) van doelen + herhalende taken voor Apple/Google Agenda.
import { all } from './db.js';

function fmt(d) {
  const z = (n) => String(n).padStart(2, '0');
  return d.getUTCFullYear() + z(d.getUTCMonth()+1) + z(d.getUTCDate()) + 'T' + z(d.getUTCHours()) + z(d.getUTCMinutes()) + '00Z';
}
function fmtDate(yyyymmdd) {
  return yyyymmdd.replace(/-/g, '');
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
      `SUMMARY:🎯 ${g.title}`,
      g.description ? `DESCRIPTION:${g.description.replace(/\n/g, '\\n')}` : '',
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
      `SUMMARY:✅ ${t.title}`,
      t.note ? `DESCRIPTION:${t.note.replace(/\n/g, '\\n')}` : '',
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
