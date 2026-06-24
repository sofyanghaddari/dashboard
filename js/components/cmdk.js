// ⌘K / Cmd+K universele zoek over alle data
import { all } from '../db.js';
import { navigate } from '../router.js';
import { fmtMoney } from '../utils.js';
import { icon } from '../icons.js';

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
      <input id="cmdk-input" placeholder="Zoek in alles… (taken, doelen, facturen, klanten, kaarten)" autofocus />
      <div id="cmdk-results" class="cmdk-results"></div>
      <div class="cmdk-hint">Esc om te sluiten · Pijltjes om te navigeren · Enter om te openen</div>
    </div>`;
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeSearch(); });

  const [rides, todos, goals, cards, notes, invoices, clients] = await Promise.all([
    all('rides'), all('todos'), all('goals'), all('cards'), all('notes'), all('invoices'), all('clients'),
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
        { icon: 'home', label: 'Dashboard', action: () => navigate('dashboard') },
        { icon: 'taxi', label: 'Taxi', action: () => navigate('taxi') },
        { icon: 'book', label: 'Koran', action: () => { document.getElementById('view').dataset.geloofSub = 'koran'; navigate('geloof'); } },
        { icon: 'books', label: 'Arabisch', action: () => { document.getElementById('view').dataset.geloofSub = 'arabic'; navigate('geloof'); } },
        { icon: 'target', label: 'Doelen', action: () => navigate('goals') },
        { icon: 'check', label: 'To-do', action: () => navigate('todo') },
        { icon: 'note', label: 'Notities', action: () => navigate('notes') },
        { icon: 'calendar', label: 'Week', action: () => navigate('agenda') },
        { icon: 'stats', label: 'Stats', action: () => navigate('stats') },
        { icon: 'receipt', label: 'Boekhouding', action: () => navigate('boekhouding') },
      ];
    } else {
      todos.filter(t => (t.title || '').toLowerCase().includes(f)).forEach(t => {
        items.push({ icon: 'check', label: `${t.title || '—'} ${t.done ? '(afgerond)' : ''}`, action: () => navigate('todo') });
      });
      goals.filter(g => (g.title || '').toLowerCase().includes(f)).forEach(g => {
        items.push({ icon: 'target', label: `${g.title || '—'}`, action: () => navigate('goals') });
      });
      cards.filter(c => c.front.toLowerCase().includes(f) || c.back.toLowerCase().includes(f)).slice(0, 8).forEach(c => {
        items.push({ icon: 'books', label: `${c.front} → ${c.back}`, action: () => { document.getElementById('view').dataset.geloofSub = 'arabic'; navigate('geloof'); } });
      });
      rides.filter(r => (r.note || '').toLowerCase().includes(f) || String(r.amount).includes(f)).slice(0, 5).forEach(r => {
        items.push({ icon: 'taxi', label: `${fmtMoney(r.amount)} · ${new Date(r.date).toLocaleDateString('nl-NL')}${r.note ? ' · ' + r.note : ''}`, action: () => navigate('taxi') });
      });
      invoices.filter(i => (i.client?.name || '').toLowerCase().includes(f) || (i.number || '').toLowerCase().includes(f) || (i.lines?.[0]?.description || '').toLowerCase().includes(f)).slice(0, 5).forEach(i => {
        items.push({ icon: 'receipt', label: `${i.number} — ${i.client?.name || '—'} · ${fmtMoney(i.totalIncl || 0)}`, action: () => navigate('boekhouding') });
      });
      clients.filter(c => (c.name || '').toLowerCase().includes(f) || (c.email || '').toLowerCase().includes(f) || (c.city || '').toLowerCase().includes(f)).slice(0, 5).forEach(c => {
        items.push({ icon: 'users', label: `${c.name}${c.city ? ' · ' + c.city : ''}${c.email ? ' · ' + c.email : ''}`, action: () => navigate('boekhouding') });
      });
      notes.filter(n => (n.title || '').toLowerCase().includes(f) || (n.body || '').toLowerCase().includes(f)).slice(0, 5).forEach(n => {
        items.push({ icon: 'note', label: `${n.title || '(geen titel)'} — ${(n.body || '').slice(0, 40)}`, action: () => navigate('notes') });
      });
    }
    selected = 0;
    resultsEl.innerHTML = items.length
      ? items.map((it, i) => `<div class="cmdk-item ${i===0?'active':''}" data-i="${i}">${icon(it.icon, 'cmdk-ic')}<span>${escapeHTML(it.label)}</span></div>`).join('')
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
