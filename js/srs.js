import { ymd, uid } from './utils.js';

export function newCard(front, back, note = null) {
  return {
    id: uid(),
    front, back, note,
    interval: 0, ease: 2.5, repetitions: 0,
    dueDate: ymd(), createdAt: new Date().toISOString(),
  };
}

export function review(card, grade) {
  const c = { ...card };
  if (grade === 'again') {
    c.interval = 0;
    c.repetitions = 0;
    c.ease = Math.max(1.3, c.ease - 0.2);
  } else if (grade === 'hard') {
    c.interval = Math.max(1, Math.round(c.interval * 1.2));
    c.ease = Math.max(1.3, c.ease - 0.15);
    c.repetitions += 1;
  } else if (grade === 'good') {
    c.interval = Math.max(2, Math.round(c.interval * c.ease));
    c.repetitions += 1;
  } else if (grade === 'easy') {
    c.interval = Math.max(4, Math.round(c.interval * c.ease * 1.3));
    c.ease = c.ease + 0.15;
    c.repetitions += 1;
  }
  const due = new Date();
  due.setDate(due.getDate() + c.interval);
  c.dueDate = ymd(due);
  return c;
}
