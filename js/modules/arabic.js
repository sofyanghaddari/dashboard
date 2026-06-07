import { all, put, del } from '../db.js';
import { openModal } from '../components/modal.js';
import { newCard, review as reviewUserCard } from '../srs.js';
import { ymd, escapeHTML } from '../utils.js';
import { ok as toastOk, err as toastErr } from '../components/toast.js';
import { ARABIC_WORDS, TYPE_LABELS, TYPE_FILTER_OPTIONS } from '../data/arabic-words.js';
import {
  getCardSrs, updateCardSrs, isCardNew, isCardDue,
  getTodayData, saveTodayData, resetAllProgress,
  getArabicSettings, getSrsStats, getCardStatus,
} from './arabic-srs.js';

// ── Hoofd render ─────────────────────────────────────────────
export async function render(container) {
  const today = ymd();
  const settings = getArabicSettings();
  const userCards = await all('cards');

  // Genereer kaart-IDs voor ingebouwde woorden
  const builtinIds = [];
  for (const w of ARABIC_WORDS) {
    if (settings.directionArNl) builtinIds.push(`${w.id}_ar-nl`);
    if (settings.directionNlAr) builtinIds.push(`${w.id}_nl-ar`);
  }

  const stats = getSrsStats(builtinIds, today);
  const dueUserCards = userCards.filter(c => c.dueDate <= today);
  const totalDue = stats.dueCount + dueUserCards.length;

  // Bouw sessie-wachtrij voor preview
  const sessionInfo = buildSessionQueue(settings, today, userCards);

  container.innerHTML = `
    <h1>Arabisch</h1>

    <div class="srs-stats-grid">
      <div class="srs-stat">
        <div class="srs-stat-val ${totalDue > 0 ? 'accent' : ''}">${totalDue}</div>
        <div class="srs-stat-lbl">Te herhalen</div>
      </div>
      <div class="srs-stat">
        <div class="srs-stat-val">${stats.newCount}</div>
        <div class="srs-stat-lbl">Nieuw</div>
      </div>
      <div class="srs-stat">
        <div class="srs-stat-val ok">${stats.learnedCount}</div>
        <div class="srs-stat-lbl">Beheerst</div>
      </div>
      <div class="srs-stat">
        <div class="srs-stat-val">${stats.learningCount}</div>
        <div class="srs-stat-lbl">In leerproces</div>
      </div>
    </div>

    <div class="arabic-start-card">
      ${sessionInfo.total > 0 ? `
        <h2>${sessionInfo.total} kaart${sessionInfo.total === 1 ? '' : 'en'} klaar</h2>
        <p>${sessionInfo.newInQueue > 0 ? `${sessionInfo.newInQueue} nieuw · ` : ''}${sessionInfo.reviewInQueue} te herhalen</p>
      ` : `
        <h2>Alles up-to-date</h2>
        <p>${stats.nextReviewDate ? `Volgende review: ${formatDate(stats.nextReviewDate)}` : 'Voeg kaarten toe of kom morgen terug'}</p>
      `}
      <button class="btn block" id="start-session" ${sessionInfo.total === 0 ? 'disabled' : ''} style="max-width:280px;margin:0 auto">
        ${sessionInfo.total > 0 ? `▶ Start sessie (${sessionInfo.total})` : 'Niets te herhalen'}
      </button>
    </div>

    <div class="srs-tab-bar" id="srs-tabs">
      <button class="srs-tab active" data-tab="words">Woorden (${ARABIC_WORDS.length})</button>
      <button class="srs-tab" data-tab="custom">Eigen kaarten (${userCards.length})</button>
    </div>

    <div id="tab-words">
      <div class="srs-filter-bar">
        <div class="notes-search-wrap" style="flex:1;margin-bottom:0">
          <span class="notes-search-icon">🔍</span>
          <input id="srs-search" placeholder="Zoek Arabisch of Nederlands…" />
        </div>
        <select id="srs-type-filter" style="min-width:140px">
          ${TYPE_FILTER_OPTIONS.map(o => `<option value="${o.value}">${o.label}</option>`).join('')}
        </select>
      </div>
      <div id="word-list"></div>
    </div>

    <div id="tab-custom" style="display:none">
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <button class="btn secondary" id="add-card" style="flex:1">+ Nieuwe kaart</button>
        <label for="import-csv" class="btn secondary" style="flex:1;text-align:center;cursor:pointer;display:flex;align-items:center;justify-content:center">↑ CSV importeren</label>
        <input type="file" id="import-csv" accept=".csv,.tsv,.txt" style="display:none" />
        <label for="import-pdf" class="btn secondary" style="flex:1;text-align:center;cursor:pointer;display:flex;align-items:center;justify-content:center">↑ PDF importeren</label>
        <input type="file" id="import-pdf" accept=".pdf" style="display:none" />
      </div>
      <div id="custom-list"></div>
    </div>
  `;

  renderWordList(container, today, settings, '');
  renderCustomList(container, userCards, today);
  bindOverviewEvents(container, today, settings, userCards, sessionInfo);
}

// ── Woordenlijst renderen ─────────────────────────────────────
function renderWordList(container, today, settings, filter, typeFilter = '') {
  const list = container.querySelector('#word-list');
  if (!list) return;

  const f = filter.toLowerCase();
  const filtered = ARABIC_WORDS.filter(w => {
    if (typeFilter && w.type !== typeFilter) return false;
    if (!f) return true;
    return w.arabic.includes(f) || w.dutch.toLowerCase().includes(f) ||
           w.transliteration.toLowerCase().includes(f);
  });

  if (!filtered.length) {
    list.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-faint);font-size:.88rem">Geen overeenkomsten</div>`;
    return;
  }

  const showTypeBadge = settings.showTypeBadge;
  const showLesson = settings.showLessonNumber;

  list.innerHTML = filtered.map(w => {
    const arNlId = `${w.id}_ar-nl`;
    const nlArId = `${w.id}_nl-ar`;
    const statusArNl = settings.directionArNl ? getCardStatus(arNlId, today) : null;
    const statusNlAr = settings.directionNlAr ? getCardStatus(nlArId, today) : null;

    const bestStatus = dominantStatus(statusArNl, statusNlAr);
    const { cls, label } = statusBadge(bestStatus);

    return `
      <div class="srs-word-row">
        <div class="srs-word-arabic">${escapeHTML(w.arabic)}</div>
        <div class="srs-word-info">
          <div class="srs-word-dutch">${escapeHTML(w.dutch)}</div>
          <div class="srs-word-translit">${escapeHTML(w.transliteration)}</div>
          ${showTypeBadge ? `<span class="srs-type-badge srs-type-${w.type}">${TYPE_LABELS[w.type] || w.type}</span>` : ''}
          ${showLesson ? `<span class="srs-lesson-badge">Les ${w.lesson}</span>` : ''}
        </div>
        <span class="srs-status-badge ${cls}">${label}</span>
      </div>`;
  }).join('');
}

function renderCustomList(container, userCards, today) {
  const list = container.querySelector('#custom-list');
  if (!list) return;

  if (!userCards.length) {
    list.innerHTML = `
      <div class="notes-empty">
        <div class="notes-empty-icon">📚</div>
        <div class="notes-empty-title">Nog geen eigen kaarten</div>
        <div class="notes-empty-sub">Voeg handmatig toe of importeer via CSV (Arabisch[tab]vertaling)</div>
      </div>`;
    return;
  }

  list.innerHTML = userCards.map(c => {
    const badge = dueBadge(c.dueDate, today);
    return `
      <div class="arabic-card">
        <div class="arabic-card-front">${escapeHTML(c.front)}</div>
        <div class="arabic-sep"></div>
        <div class="arabic-card-back">${escapeHTML(c.back)}</div>
        <div class="arabic-card-meta">
          <span class="arabic-due-badge ${badge.cls}">${badge.label}</span>
        </div>
        <div class="arabic-card-actions">
          <button class="arabic-act-btn" data-edit="${c.id}">✎</button>
          <button class="arabic-act-btn del" data-del="${c.id}">✕</button>
        </div>
      </div>`;
  }).join('');

  list.querySelectorAll('[data-del]').forEach(b =>
    b.onclick = async () => { await del('cards', b.dataset.del); render(container); });
  list.querySelectorAll('[data-edit]').forEach(b =>
    b.onclick = () => openCardModal(container, userCards.find(c => c.id === b.dataset.edit)));
}

// ── Events voor het overzicht ─────────────────────────────────
function bindOverviewEvents(container, today, settings, userCards, sessionInfo) {
  // Tabs
  container.querySelectorAll('.srs-tab').forEach(tab => {
    tab.onclick = () => {
      container.querySelectorAll('.srs-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      container.querySelector('#tab-words').style.display = tab.dataset.tab === 'words' ? '' : 'none';
      container.querySelector('#tab-custom').style.display = tab.dataset.tab === 'custom' ? '' : 'none';
    };
  });

  // Zoeken + filteren
  const searchEl = container.querySelector('#srs-search');
  const typeEl = container.querySelector('#srs-type-filter');
  const refilter = () => renderWordList(container, today, settings, searchEl.value, typeEl.value);
  if (searchEl) searchEl.oninput = refilter;
  if (typeEl) typeEl.onchange = refilter;

  // Sessie starten
  container.querySelector('#start-session').onclick = async () => {
    const queue = await buildFullQueue(settings, today, userCards);
    if (!queue.length) { toastOk('Niets te herhalen'); return; }
    startSession(container, queue, settings);
  };

  // Eigen kaarten
  container.querySelector('#add-card').onclick = () => openCardModal(container, null);
  container.querySelector('#import-csv').onchange = (e) => importCSV(container, e.target.files[0]);
  container.querySelector('#import-pdf').onchange = (e) => importPDF(container, e.target.files[0]);
}

// ── Sessie wachtrij bouwen ────────────────────────────────────
function buildSessionQueue(settings, today, userCards) {
  const todayData = getTodayData();
  const dirs = [];
  if (settings.directionArNl) dirs.push('ar-nl');
  if (settings.directionNlAr) dirs.push('nl-ar');

  const allIds = ARABIC_WORDS.flatMap(w => dirs.map(d => `${w.id}_${d}`));
  const dueIds = allIds.filter(id => isCardDue(id, today));
  const newIds = allIds.filter(id => isCardNew(id));

  const alreadyNewToday = todayData.newSeen.length;
  const newLimit = Math.max(0, settings.newCardsPerDay - alreadyNewToday);
  const reviewLimit = Math.max(0, settings.reviewLimitPerDay - todayData.reviewDone);

  const selectedNew = newIds.slice(0, newLimit);
  const selectedDue = dueIds.slice(0, reviewLimit);
  const dueUserCards = userCards.filter(c => c.dueDate <= today);

  return {
    newInQueue: selectedNew.length,
    reviewInQueue: selectedDue.length + dueUserCards.length,
    total: selectedNew.length + selectedDue.length + dueUserCards.length,
  };
}

async function buildFullQueue(settings, today, userCards) {
  const todayData = getTodayData();
  const dirs = [];
  if (settings.directionArNl) dirs.push('ar-nl');
  if (settings.directionNlAr) dirs.push('nl-ar');

  const allBuiltin = ARABIC_WORDS.flatMap(w =>
    dirs.map(d => ({ word: w, dir: d, id: `${w.id}_${d}` }))
  );

  const dueBuiltin = allBuiltin.filter(c => isCardDue(c.id, today));
  const newBuiltin = allBuiltin.filter(c => isCardNew(c.id));

  const alreadyNewToday = todayData.newSeen.length;
  const newLimit = Math.max(0, settings.newCardsPerDay - alreadyNewToday);
  const reviewLimit = Math.max(0, settings.reviewLimitPerDay - todayData.reviewDone);

  const selectedNew = newBuiltin.slice(0, newLimit);
  const selectedDue = dueBuiltin.slice(0, reviewLimit);

  const toCard = (c, isNewCard) => {
    const { word, dir, id } = c;
    if (dir === 'ar-nl') {
      return {
        id, isBuiltin: true, isNew: isNewCard, dir,
        front: word.arabic, frontDir: 'rtl',
        translitFront: settings.showTranslitFront ? word.transliteration : null,
        back: word.dutch, backDir: 'ltr',
        backTranslit: word.transliteration,
        wordType: word.type, lesson: word.lesson,
      };
    } else {
      return {
        id, isBuiltin: true, isNew: isNewCard, dir,
        front: word.dutch, frontDir: 'ltr',
        translitFront: null,
        back: word.arabic, backDir: 'rtl',
        backTranslit: word.transliteration,
        wordType: word.type, lesson: word.lesson,
      };
    }
  };

  const dueUserCards = userCards.filter(c => c.dueDate <= today);
  const userSessionCards = dueUserCards.map(c => ({
    id: `user_${c.id}`, dbId: c.id, dbCard: c,
    isBuiltin: false, isNew: c.repetitions === 0,
    front: c.front, frontDir: 'rtl',
    translitFront: null,
    back: c.back, backDir: 'ltr',
    backTranslit: c.note || null,
    wordType: null, lesson: null,
  }));

  let queue;
  const newCards = selectedNew.map(c => toCard(c, true));
  const reviewCards = [...selectedDue.map(c => toCard(c, false)), ...userSessionCards];

  if (settings.startOrder === 'new-first') queue = [...newCards, ...reviewCards];
  else if (settings.startOrder === 'review-first') queue = [...reviewCards, ...newCards];
  else queue = shuffle([...newCards, ...reviewCards]);

  return queue;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Flashcard sessie ──────────────────────────────────────────
function startSession(container, queue, settings) {
  let idx = 0;
  let revealed = false;
  const startCount = queue.length;
  const todayData = getTodayData();
  const grades = []; // { cardId, grade } per kaart

  const showCard = () => {
    if (idx >= queue.length) {
      showCompletion(container, grades, startCount);
      return;
    }

    const c = queue[idx];
    const progress = Math.round((idx / startCount) * 100);
    const useFlip = settings.flipAnimation;

    container.innerHTML = `
      <div class="srs-session-header">
        <button class="btn secondary" id="sess-stop" style="padding:6px 12px;font-size:.82rem">✕ Stoppen</button>
        <div class="srs-progress-info">${idx + 1} / ${startCount}</div>
        <div style="width:60px"></div>
      </div>
      <div class="progress-bar" style="margin-bottom:20px">
        <div class="progress-fill" style="width:${progress}%;transition:width .4s"></div>
      </div>

      <div class="srs-flashcard ${revealed ? 'flipped' : ''}" id="flashcard" ${useFlip ? '' : 'data-noflip'}>
        <div class="srs-flashcard-inner">
          <div class="srs-flashcard-front">
            ${settings.showTypeBadge && c.wordType ? `<div class="srs-type-badge srs-type-${c.wordType}" style="margin-bottom:12px">${TYPE_LABELS[c.wordType] || c.wordType}</div>` : ''}
            ${settings.showLessonNumber && c.lesson ? `<div class="srs-lesson-badge" style="margin-bottom:8px">Les ${c.lesson}</div>` : ''}
            <div class="srs-card-front-text ${c.frontDir === 'rtl' ? 'arabic-text' : ''}" dir="${c.frontDir}">${escapeHTML(c.front)}</div>
            ${c.translitFront ? `<div class="srs-translit">${escapeHTML(c.translitFront)}</div>` : ''}
            ${c.isNew ? `<div class="srs-new-badge">Nieuw woord</div>` : ''}
          </div>
          <div class="srs-flashcard-back">
            ${settings.showTypeBadge && c.wordType ? `<div class="srs-type-badge srs-type-${c.wordType}" style="margin-bottom:12px">${TYPE_LABELS[c.wordType] || c.wordType}</div>` : ''}
            <div class="srs-card-back-text ${c.backDir === 'rtl' ? 'arabic-text' : ''}" dir="${c.backDir}">${escapeHTML(c.back)}</div>
            ${c.backTranslit ? `<div class="srs-translit">${escapeHTML(c.backTranslit)}</div>` : ''}
          </div>
        </div>
      </div>

      ${!revealed ? `
        <button class="btn block" id="reveal-btn" style="max-width:300px;margin:0 auto 16px">Toon antwoord</button>
      ` : `
        <div class="srs-grade-grid">
          <button class="srs-grade-btn srs-grade-again" data-grade="1">
            <span class="grade-icon">✗</span>
            <span>Again</span>
            <span class="grade-interval">morgen</span>
          </button>
          <button class="srs-grade-btn srs-grade-hard" data-grade="2">
            <span class="grade-icon">△</span>
            <span>Moeilijk</span>
            <span class="grade-interval">morgen</span>
          </button>
          <button class="srs-grade-btn srs-grade-good" data-grade="4">
            <span class="grade-icon">✓</span>
            <span>Goed</span>
            <span class="grade-interval">${gradeInterval(c, 4)}</span>
          </button>
          <button class="srs-grade-btn srs-grade-perfect" data-grade="5">
            <span class="grade-icon">★</span>
            <span>Perfect</span>
            <span class="grade-interval">${gradeInterval(c, 5)}</span>
          </button>
        </div>
      `}
    `;

    container.querySelector('#sess-stop').onclick = () => render(container);

    const flashcard = container.querySelector('#flashcard');

    if (!revealed) {
      const revealBtn = container.querySelector('#reveal-btn');
      revealBtn.onclick = () => {
        revealed = true;
        if (useFlip) {
          flashcard.classList.add('flipped');
          setTimeout(() => showCard(), 0); // re-render alleen de knoppen
        } else {
          showCard();
        }
      };
      // Tik op kaart ook onthullen
      flashcard.onclick = () => { if (!revealed) revealBtn.click(); };
    } else {
      container.querySelectorAll('[data-grade]').forEach(btn => {
        btn.onclick = async () => {
          const grade = parseInt(btn.dataset.grade);
          await gradeCard(c, grade, todayData, settings);
          grades.push({ id: c.id, grade });
          idx++;
          revealed = false;
          showCard();
        };
      });
    }
  };

  showCard();
}

async function gradeCard(card, grade, todayData, settings) {
  if (card.isBuiltin) {
    // SM-2 in localStorage
    updateCardSrs(card.id, grade);
    if (card.isNew && grade >= 3) {
      if (!todayData.newSeen.includes(card.id)) {
        todayData.newSeen.push(card.id);
        saveTodayData(todayData);
      }
    }
    if (!card.isNew) {
      todayData.reviewDone = (todayData.reviewDone || 0) + 1;
      saveTodayData(todayData);
    }
  } else {
    // Gebruikerskaart in IndexedDB
    const gradeStr = grade <= 2 ? 'again' : grade === 4 ? 'good' : 'easy';
    const updated = reviewUserCard(card.dbCard, gradeStr);
    await put('cards', updated);
  }
}

function gradeInterval(card, grade) {
  if (!card.isBuiltin) return '';
  const srs = getCardSrs(card.id);
  const existing = srs || { interval: 1, easeFactor: 2.5, repetitions: 0 };
  let interval;
  if (grade >= 3) {
    if (existing.repetitions === 0) interval = 1;
    else if (existing.repetitions === 1) interval = 6;
    else interval = Math.round(existing.interval * existing.easeFactor);
    if (grade === 5) interval = Math.round(interval * 1.3);
  } else {
    interval = 1;
  }
  if (interval === 1) return 'morgen';
  if (interval < 7) return `${interval}d`;
  if (interval < 30) return `${Math.round(interval / 7)}w`;
  return `${Math.round(interval / 30)}m`;
}

// ── Afronden sessie ───────────────────────────────────────────
function showCompletion(container, grades, total) {
  const correct = grades.filter(g => g.grade >= 3).length;
  const again = grades.filter(g => g.grade < 3).length;

  container.innerHTML = `
    <div class="srs-completion">
      <div class="srs-completion-icon">🎉</div>
      <h2>Sessie klaar!</h2>
      <p class="muted">${total} kaart${total === 1 ? '' : 'en'} herhaald</p>

      <div class="srs-completion-stats">
        <div class="srs-comp-stat">
          <div class="srs-comp-val ok">${correct}</div>
          <div class="srs-comp-lbl">Goed</div>
        </div>
        <div class="srs-comp-stat">
          <div class="srs-comp-val ${again > 0 ? 'danger' : ''}">${again}</div>
          <div class="srs-comp-lbl">Opnieuw</div>
        </div>
        <div class="srs-comp-stat">
          <div class="srs-comp-val">${total > 0 ? Math.round(correct / total * 100) : 0}%</div>
          <div class="srs-comp-lbl">Score</div>
        </div>
      </div>

      <button class="btn block" id="back-overview" style="max-width:260px;margin:0 auto">Terug naar overzicht</button>
    </div>
  `;

  container.querySelector('#back-overview').onclick = () => render(container);
}

// ── Eigen kaarten beheren ─────────────────────────────────────
function openCardModal(container, existing) {
  openModal(existing ? 'Kaart bewerken' : 'Nieuwe kaart', `
    <label>Arabisch (voorkant) *</label>
    <input name="front" required value="${existing ? escapeHTML(existing.front) : ''}" dir="rtl" style="font-size:1.2rem;text-align:right" />
    <label>Vertaling (achterkant) *</label>
    <input name="back" required value="${existing ? escapeHTML(existing.back) : ''}" />
    <label>Notitie / transliteratie</label>
    <input name="note" value="${existing?.note ? escapeHTML(existing.note) : ''}" />
  `, async (d) => {
    if (!d.front || !d.back) throw new Error('Vul beide velden in');
    if (existing) await put('cards', { ...existing, front: d.front, back: d.back, note: d.note || null });
    else await put('cards', newCard(d.front, d.back, d.note || null));
    render(container);
  });
}

async function importCSV(container, file) {
  if (!file) return;
  const text = await file.text();
  const rawLines = text.split(/\r?\n/).filter(l => l.trim());
  if (!rawLines.length) { toastErr('Leeg bestand'); return; }

  const delim = rawLines[0].includes('\t') ? '\t' : ',';
  let imported = 0, skipped = 0;
  for (const line of rawLines) {
    const parts = line.split(delim).map(p => (p || '').trim());
    if (parts.length < 2) { skipped++; continue; }
    const [front, back, note] = parts;
    if (!front || !back) { skipped++; continue; }
    await put('cards', newCard(front, back, note || null));
    imported++;
  }

  if (imported === 0) toastErr('Geen geldige kaarten. Formaat: arabisch[tab]vertaling');
  else if (skipped > 0) toastErr(`${imported} geïmporteerd, ${skipped} overgeslagen`);
  else toastOk(`${imported} kaart${imported !== 1 ? 'en' : ''} geïmporteerd`);
  render(container);
}

async function importPDF(container, file) {
  if (!file) return;
  if (!window.pdfjsLib) { toastErr('PDF-bibliotheek laadt...'); return; }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

    let imported = 0;
    const wordsAdded = new Set();

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const text = await page.getTextContent();
      const items = text.items.filter(item => item.str.trim());

      for (let j = 0; j < items.length - 1; j++) {
        const front = items[j].str.trim();
        const back = items[j + 1].str.trim();

        if (isArabic(front) && isEnglish(back) && front.length > 1 && back.length > 2) {
          const key = front + '|' + back;
          if (!wordsAdded.has(key)) {
            wordsAdded.add(key);
            await put('cards', newCard(front, back, null));
            imported++;
          }
        }
      }
    }

    if (imported === 0) toastErr('Geen woorden gevonden in PDF. Controleer het formaat.');
    else toastOk(`✓ ${imported} kaart${imported !== 1 ? 'en' : ''} geïmporteerd`);
    render(container);
  } catch (e) {
    toastErr('PDF-fout: ' + e.message);
  }
}

function isArabic(str) {
  return /[؀-ۿ]/.test(str);
}

function isEnglish(str) {
  return /[a-zA-Z]/.test(str);
}

// ── Hulpfuncties ──────────────────────────────────────────────
function statusBadge(status) {
  switch (status) {
    case 'new':      return { cls: 'srs-badge-new',      label: 'Nieuw' };
    case 'due':      return { cls: 'srs-badge-due',      label: 'Vandaag' };
    case 'overdue':  return { cls: 'srs-badge-overdue',  label: 'Te laat' };
    case 'learning': return { cls: 'srs-badge-learning', label: 'Leerproces' };
    case 'learned':  return { cls: 'srs-badge-learned',  label: 'Beheerst' };
    default:         return { cls: '', label: '' };
  }
}

function dominantStatus(s1, s2) {
  const order = ['overdue', 'due', 'learning', 'new', 'learned'];
  if (!s1) return s2;
  if (!s2) return s1;
  const i1 = order.indexOf(s1);
  const i2 = order.indexOf(s2);
  return i1 <= i2 ? s1 : s2;
}

function dueBadge(dueDate, today) {
  if (dueDate < today)  return { label: 'Te laat',  cls: 'adu-overdue' };
  if (dueDate === today) return { label: 'Vandaag', cls: 'adu-today' };
  const diff = Math.round((new Date(dueDate) - new Date(today)) / 86400000);
  if (diff <= 3) return { label: `Over ${diff}d`, cls: 'adu-soon' };
  return { label: `Over ${diff}d`, cls: 'adu-ok' };
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' });
}
