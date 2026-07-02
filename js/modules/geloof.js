import { render as renderKoran } from './koran.js';
import { render as renderArabic } from './arabic.js';
import { render as renderGrammatica } from './grammatica.js';
import { icon } from '../icons.js';

export async function render(container) {
  const sub = container.dataset.geloofSub || 'koran';

  container.innerHTML = `
    <div class="geloof-subnav">
      <button class="geloof-sub-btn${sub === 'koran' ? ' active' : ''}" data-sub="koran">${icon('book')} Koran</button>
      <button class="geloof-sub-btn${sub === 'arabic' ? ' active' : ''}" data-sub="arabic">${icon('books')} Arabisch</button>
      <button class="geloof-sub-btn${sub === 'grammatica' ? ' active' : ''}" data-sub="grammatica">${icon('note')} Stof</button>
    </div>
    <div id="geloof-sub-view"></div>
  `;

  container.querySelectorAll('.geloof-sub-btn').forEach(btn => {
    btn.onclick = () => {
      container.dataset.geloofSub = btn.dataset.sub;
      render(container).catch(e => console.error('Geloof render fout:', e));
    };
  });

  const view = container.querySelector('#geloof-sub-view');
  if (sub === 'koran') {
    await renderKoran(view);
  } else if (sub === 'grammatica') {
    await renderGrammatica(view);
  } else {
    await renderArabic(view);
  }
}
