// App-icon badge (Chromium PWA, beperkte iOS support)
import { all } from './db.js';
import { ymd } from './utils.js';

export async function updateBadge() {
  if (!navigator.setAppBadge) return;
  try {
    const [cards, todos, hizb] = await Promise.all([all('cards'), all('todos'), all('hizb_log')]);
    const today = ymd();
    const dueCards = cards.filter(c => c.dueDate <= today).length;
    const openTodos = todos.filter(t => !t.done && t.priority === 'high').length;
    const hizbDone = hizb.some(h => h.date === today);
    const count = dueCards + openTodos + (hizbDone ? 0 : 1);
    if (count > 0) await navigator.setAppBadge(count);
    else await navigator.clearAppBadge?.();
  } catch (_) {}
}
