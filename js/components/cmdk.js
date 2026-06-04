// ⌘K / Cmd+K universele zoek over alle data
import { all } from '../db.js';
import { navigate } from '../router.js';
import { fmtMoney } from '../utils.js';

let _open = false;

export function initCmdK() {
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openSearch();
    }
    if (e.key === 'Escape' && _open) closeSearch();
  });
}

export async function openSearch() {
  if (_open) return;
  _open = true;
  const backdrop = document.createElement('div');
  backdrop.id = 'cmdk-backdrop';
  backdrop.className = 'cmdk-backdrop';
  backdrop.innerHTML = `
    <div class="cmdk">
      <input id="cmdk-input" placeholder="Zoek in alles… (ritten, taken, doelen, kaarten)" autofocus />
      <div id="cmdk-results" class="cmdk-results"></div>
      <div class="cmdk-hint">Esc om te sluiten · Pijltjes om te navigeren · Enter om te openen</div>
    </div>`;
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeSearch(); });

  const [rides, expenses, todos, goals, cards] = await Promise.all([
    all('rides'), all('expenses'), all('todos'), all('goals'), all('cards'),
  ]);

  let selected = 0;
  let items = [];

  const input = backdrop.querySelector('#cmdk-input');
  const resultsEl = backdrop.querySelector('#cmdk-results');

  const renderResults = (q) => {
    const f = q.toLowerCase().trim();
    items = [];
    if (!f) {
      items = [
        { label: '🏠 Dashboard', action: () => navigate('dashboard') },
        { label: '🚖 Taxi', action: () => navigate('taxi') },
        { label: '📖 Koran', action: () => navigate('koran') },
        { label: '📚 Arabisch', action: () => navigate('arabic') },
        { label: '🎯 Doelen', action: () => navigate('goals') },
        { label: '✅ To-do', action: () => navigate('todo') },
      ];
    } else {
      todos.filter(t => t.title.toLowerCase().includes(f)).forEach(t => {
        items.push({ label: `✅ ${t.title} ${t.done ? '(afgerond)' : ''}`, action: () => navigate('todo') });
      });
      goals.filter(g => g.title.toLowerCase().includes(f)).forEach(g => {
        items.push({ label: `🎯 ${g.title}`, action: () => navigate('goals') });
      });
      cards.filter(c => c.front.toLowerCase().includes(f) || c.back.toLowerCase().includes(f)).slice(0, 8).forEach(c => {
        items.push({ label: `📚 ${c.front} → ${c.back}`, action: () => navigate('arabic') });
      });
      rides.filter(r => (r.note || '').toLowerCase().includes(f) || (r.source || '').includes(f) || String(r.amount).includes(f)).slice(0, 8).forEach(r => {
        items.push({ label: `🚖 ${fmtMoney(r.amount)} · ${r.source} · ${new Date(r.date).toLocaleDateString('nl-NL')}`, action: () => navigate('taxi') });
      });
      expenses.filter(e => (e.note || '').toLowerCase().includes(f) || (e.category || '').includes(f)).slice(0, 8).forEach(e => {
        items.push({ label: `💸 ${fmtMoney(e.amount)} · ${e.category}`, action: () => navigate('taxi') });
      });
    }
    selected = 0;
    resultsEl.innerHTML = items.length
      ? items.map((it, i) => `<div class="cmdk-item ${i===0?'active':''}" data-i="${i}">${escapeHTML(it.label)}</div>`).join('')
      : '<div class="cmdk-empty">Geen resultaten</div>';
    resultsEl.querySelectorAll('.cmdk-item').forEach(el => {
      el.onclick = () => { items[+el.dataset.i].action(); closeSearch(); };
    });
  };

  const updateSelected = () => {
    resultsEl.querySelectorAll('.cmdk-item').forEach((el, i) => el.classList.toggle('active', i === selected));
    const active = resultsEl.querySelector('.cmdk-item.active');
    if (active) active.scrollIntoView({ block: 'nearest' });
  };

  input.oninput = (e) => renderResults(e.target.value);
  input.onkeydown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); selected = Math.min(items.length - 1, selected + 1); updateSelected(); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); selected = Math.max(0, selected - 1); updateSelected(); }
    if (e.key === 'Enter')     { e.preventDefault(); if (items[selected]) { items[selected].action(); closeSearch(); } }
  };
  renderResults('');
  setTimeout(() => input.focus(), 50);
}

function closeSearch() {
  const el = document.getElementById('cmdk-backdrop');
  if (el) el.remove();
  _open = false;
}

function escapeHTML(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
}
