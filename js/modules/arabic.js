import { all, put, del } from '../db.js';
import { openModal } from '../components/modal.js';
import { newCard, review as reviewUserCard } from '../srs.js';
import { ymd, escapeHTML } from '../utils.js';
import { ok as toastOk, err as toastErr } from '../components/toast.js';
import { ARABIC_WORDS, TYPE_LABELS, TYPE_FILTER_OPTIONS } from '../data/arabic-words.js';
import { confettiMini, confettiBig } from '../components/celebrate.js';
import { countUp } from '../animate.js';
import * as haptic from '../haptic.js';
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

  const writingStats = getWritingStats(today);

  container.innerHTML = `
    <h1 class="page-title">Arabisch</h1>

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
      <button class="srs-tab" data-tab="writing">Schrijven (${writingStats.due})</button>
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
      <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
        <button class="btn secondary" id="add-card" style="flex:1;min-width:140px">+ Nieuwe kaart</button>
        <label for="import-csv" class="btn secondary" style="flex:1;min-width:140px;text-align:center;cursor:pointer;display:flex;align-items:center;justify-content:center">↑ CSV</label>
        <input type="file" id="import-csv" accept=".csv,.tsv,.txt" style="display:none" />
        <label for="import-pdf" class="btn secondary" style="flex:1;min-width:140px;text-align:center;cursor:pointer;display:flex;align-items:center;justify-content:center">↑ PDF</label>
        <input type="file" id="import-pdf" accept=".pdf" style="display:none" />
      </div>
      <div id="custom-list"></div>
    </div>

    <div id="tab-writing" style="display:none">
      <div id="writing-overview"></div>
    </div>
  `;

  renderWordList(container, today, settings, '');
  renderCustomList(container, userCards, today);
  renderWritingOverview(container.querySelector('#writing-overview'), container, today);
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
      container.querySelector('#tab-words').style.display   = tab.dataset.tab === 'words'   ? '' : 'none';
      container.querySelector('#tab-custom').style.display  = tab.dataset.tab === 'custom'  ? '' : 'none';
      container.querySelector('#tab-writing').style.display = tab.dataset.tab === 'writing' ? '' : 'none';
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

  // Geschud vóór de selectie: zo krijg je elke sessie willekeurige woorden i.p.v.
  // telkens dezelfde eerste paar uit de lijst. SRS blijft gelden — due-woorden
  // (incl. "Opnieuw"/fout) komen gewoon terug; alleen de keuze/volgorde is random.
  const dueBuiltin = shuffle(allBuiltin.filter(c => isCardDue(c.id, today)));
  const newBuiltin = shuffle(allBuiltin.filter(c => isCardNew(c.id)));

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
    const progress = Math.round((idx / queue.length) * 100);
    const useFlip = settings.flipAnimation;

    container.innerHTML = `
      <div class="srs-session-header">
        <button class="btn secondary" id="sess-stop" style="padding:6px 12px;font-size:.82rem">✕ Stoppen</button>
        <div class="srs-progress-info">${idx + 1} / ${queue.length}</div>
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
            <div class="srs-card-back-dutch" dir="ltr">${escapeHTML(c.frontDir === 'rtl' ? c.back : c.front)}</div>
            <div class="srs-card-back-arabic arabic-text" dir="rtl">${escapeHTML(c.frontDir === 'rtl' ? c.front : c.back)}</div>
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
            <span>Opnieuw</span>
            <span class="grade-interval">${gradeInterval(c, 1)}</span>
          </button>
          <button class="srs-grade-btn srs-grade-hard" data-grade="2">
            <span class="grade-icon">△</span>
            <span>Moeilijk</span>
            <span class="grade-interval">${gradeInterval(c, 2)}</span>
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
        haptic.light();
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
      let animating = false;
      container.querySelectorAll('[data-grade]').forEach(btn => {
        btn.onclick = async () => {
          if (animating) return;          // voorkom dubbel-graden tijdens animatie
          animating = true;
          const grade = parseInt(btn.dataset.grade);
          grade >= 4 ? haptic.success() : grade <= 1 ? haptic.err() : haptic.tap();

          // Wegglij-animatie (richting volgt het oordeel) + feedback-puls.
          const fc = container.querySelector('#flashcard');
          const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          if (fc && !reduce) {
            fc.classList.add(grade >= 4 ? 'srs-exit-right' : grade === 1 ? 'srs-exit-left' : 'srs-exit-up');
            fc.classList.add(grade >= 3 ? 'srs-flash-good' : 'srs-flash-again');
          }

          await gradeCard(c, grade, todayData, settings);
          grades.push({ id: c.id, grade });
          // Alleen "Opnieuw" (Again) komt later in deze sessie terug; de rest niet,
          // zodat je vlot door de set heen gaat.
          if (grade === 1) queue.push({ ...c, _requeued: true });
          idx++;
          revealed = false;
          if (fc && !reduce) setTimeout(showCard, 220); else showCard();
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

// Voorspelt exact hetzelfde interval als updateCardSrs(), zodat het label op de
// knop klopt met wat er daadwerkelijk gepland wordt. Again (1) komt deze sessie
// terug → geen dag-label.
function predictInterval(card, grade) {
  const srs = getCardSrs(card.id);
  const { interval = 1, easeFactor = 2.5, repetitions = 0 } = srs || {};
  if (grade === 1) return 0;                                   // straks weer (zelfde sessie)
  if (grade === 2) return repetitions === 0 ? 1 : Math.max(1, Math.round(interval * 1.2));
  if (grade === 4) return repetitions === 0 ? 3 : repetitions === 1 ? 7 : Math.round(interval * easeFactor);
  return repetitions === 0 ? 7 : repetitions === 1 ? 16 : Math.round(interval * easeFactor * 1.3); // grade 5
}

function gradeInterval(card, grade) {
  if (!card.isBuiltin) return grade === 1 ? 'straks' : '';
  const interval = predictInterval(card, grade);
  if (interval === 0) return 'straks';
  if (interval === 1) return 'morgen';
  if (interval < 7) return `${interval}d`;
  if (interval < 30) return `${Math.round(interval / 7)}w`;
  return `${Math.round(interval / 30)}m`;
}

// ── Afronden sessie ───────────────────────────────────────────
const SRS_PERFECT_MSG = ['🏆 Vlekkeloos! Je bent een machine.', '🌟 100% — koninklijk gedaan.', '🦁 Geen enkele fout. Leeuwenwerk.', '🔥 Perfect! Je staat in lichterlaaie.'];
const SRS_GREAT_MSG   = ['💪 Sterk gedaan, door op deze weg!', '🎯 Lekker bezig, bijna foutloos.', '⚡ Goeie sessie, kampioen.'];
const SRS_OK_MSG      = ['📈 Elke herhaling telt. Door!', '🌱 Stap voor stap groei je.', '👏 Netjes — morgen weer scherper.'];
const SRS_LOW_MSG     = ['💡 Niet erg, herhaling is de sleutel.', '🤝 Morgen pak je ze terug.', '🧠 Het brein leert juist van fouten.'];
function srsPick(a) { return a[Math.floor(Math.random() * a.length)]; }

function showCompletion(container, grades, total) {
  const correct = grades.filter(g => g.grade >= 3).length;
  const again = grades.filter(g => g.grade < 3).length;
  const score = total > 0 ? Math.round(correct / total * 100) : 0;

  let icon, msg;
  if (score === 100)     { icon = '🏆'; msg = srsPick(SRS_PERFECT_MSG); }
  else if (score >= 80)  { icon = '🌟'; msg = srsPick(SRS_GREAT_MSG); }
  else if (score >= 50)  { icon = '👍'; msg = srsPick(SRS_OK_MSG); }
  else                   { icon = '🌱'; msg = srsPick(SRS_LOW_MSG); }

  container.innerHTML = `
    <div class="srs-completion">
      <div class="srs-completion-icon">${icon}</div>
      <h2>Sessie klaar!</h2>
      <p class="muted">${msg}</p>

      <div class="srs-completion-stats">
        <div class="srs-comp-stat">
          <div class="srs-comp-val ok" data-countup="${correct}">0</div>
          <div class="srs-comp-lbl">Goed</div>
        </div>
        <div class="srs-comp-stat">
          <div class="srs-comp-val ${again > 0 ? 'danger' : ''}" data-countup="${again}">0</div>
          <div class="srs-comp-lbl">Opnieuw</div>
        </div>
        <div class="srs-comp-stat">
          <div class="srs-comp-val" data-countup="${score}" data-suffix="%">0</div>
          <div class="srs-comp-lbl">Score</div>
        </div>
      </div>

      <button class="btn block" id="back-overview" style="max-width:260px;margin:0 auto">Terug naar overzicht</button>
    </div>
  `;

  // Tellende eindcijfers
  container.querySelectorAll('[data-countup]').forEach(el => {
    const to = parseInt(el.dataset.countup);
    const suffix = el.dataset.suffix || '';
    countUp(el, to, { duration: 900, prefix: '', decimals: 0, suffix });
  });

  // Viering naar prestatie
  if (score === 100 && total > 0) {
    haptic.success();
    confettiBig();
    setTimeout(() => confettiBig(), 400);
  } else if (score >= 80) {
    haptic.success();
    confettiMini();
  } else {
    haptic.light();
  }

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

// pdf.js wordt pas geladen wanneer er écht een PDF geïmporteerd wordt —
// niet bij elke app-start (scheelt ~350KB blokkerende download + offline-fout).
let _pdfJsLoading = null;
function loadPdfJs() {
  if (window.pdfjsLib) return Promise.resolve();
  if (_pdfJsLoading) return _pdfJsLoading;
  _pdfJsLoading = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s.onload = () => {
      try { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; } catch (_) {}
      resolve();
    };
    s.onerror = () => {
      _pdfJsLoading = null;
      reject(new Error('PDF-bibliotheek kon niet laden — controleer je internetverbinding'));
    };
    document.head.appendChild(s);
  });
  return _pdfJsLoading;
}

async function importPDF(container, file) {
  if (!file) return;

  try {
    await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument(arrayBuffer).promise;

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

// ── Schrijfoefeningen ─────────────────────────────────────────────────────
const WRITING_SRS_KEY = 'arabic_writing_srs';

// ~25 moeilijk te schrijven woorden, geselecteerd op spellingsvalkuilen
const WRITING_WORDS = [
  // ع (ain) — beginners schrijven dit als ه
  { id: 'w013', arabic: 'عَرَفَ',   dutch: 'hij wist/kende',      hint: '<strong>ع</strong> is een keelklank — niet ه (gewone H). Voel het knijpen achterin je keel.' },
  { id: 'w016', arabic: 'عَمِلَ',   dutch: 'hij werkte',           hint: '<strong>ع</strong> begint met een licht keel-knijpje. Let op de volgorde: ع م ل' },
  { id: 'w037', arabic: 'عِلْمٌ',   dutch: 'kennis',               hint: '<strong>ع</strong> + لْم — ain altijd met dat keel-gevoel, dan sukun op لْ' },
  { id: 'w064', arabic: 'عَظِيمٌ', dutch: 'geweldig/groots',      hint: '<strong>ع</strong> + ظ (zwaar tha) + lange <strong>ي</strong> — drie aparte klanken' },
  { id: 'w068', arabic: 'عَلَى',   dutch: 'op',                   hint: '<strong>ع</strong> + ل + <strong>ى</strong> (alef maqsura, niet ا!)' },
  { id: 'w069', arabic: 'عَنْ',    dutch: 'over/van',             hint: '<strong>ع</strong> + نْ — korte ain, dan sukun op noen' },
  // ح (ha) vs ه (he)
  { id: 'w062', arabic: 'حَسَنٌ',  dutch: 'goed/mooi',            hint: '<strong>ح</strong> = uit de borst blazen. Niet ه (gewone zachte H).' },
  { id: 'w083', arabic: 'نَحْنُ',  dutch: 'wij',                  hint: 'ن + <strong>ح</strong> + ن — de H in het midden is ح (borst-H)' },
  { id: 'w010', arabic: 'فَتَحَ',  dutch: 'hij opende',           hint: 'ف ت <strong>ح</strong> — eindigt op ح, niet op ه' },
  // ق (qaf) vs ك (kaf)
  { id: 'w002', arabic: 'قَرَأَ',  dutch: 'hij las',              hint: '<strong>ق</strong> = diepe K van achterin de keel. Niet ك (gewone K).' },
  { id: 'w036', arabic: 'قُرْآنٌ', dutch: 'Koran',                hint: '<strong>ق</strong> + رْ + <strong>آن</strong> — alef madda (آ = lange A met hamza)' },
  // Hamza-varianten
  { id: 'w040', arabic: 'أُسْتَاذٌ', dutch: 'leraar',             hint: '<strong>أ</strong> = hamza boven alef (dhamma). Let op: ا (lange A) in het midden.' },
  { id: 'w067', arabic: 'إِلَى',   dutch: 'naar/tot',             hint: '<strong>إ</strong> = hamza ónder alef (kasra). Eindigt op ى (alef maqsura).' },
  { id: 'w015', arabic: 'رَأَى',   dutch: 'hij zag',              hint: 'ر + <strong>أ</strong> (hamza op alef) + ى — three letters only' },
  { id: 'w004', arabic: 'جَاءَ',   dutch: 'hij kwam',             hint: 'ج + ا (lange A) + <strong>ء</strong> (losstaande hamza) + ه? Nee: de ه is er niet!' },
  { id: 'w031', arabic: 'مَاءٌ',   dutch: 'water',                hint: 'م + <strong>آء</strong> — alef madda (آ) gevolgd door losstaande hamza (ء)' },
  // Lange klinkers
  { id: 'w038', arabic: 'دِينٌ',   dutch: 'religie/godsdienst',   hint: 'دِ + <strong>ي</strong> = lange ī — de ya is een lange klinker, geen medeklinker hier' },
  { id: 'w046', arabic: 'صَلَاةٌ', dutch: 'gebed',                hint: 'ص + ل + <strong>ا</strong> (lange A) + <strong>ة</strong> (ta marbuta)' },
  { id: 'w050', arabic: 'سَاعَةٌ', dutch: 'uur/horloge',          hint: 'س + <strong>ا</strong> (lang A) + <strong>ع</strong> (ain!) + ة — vergeet ain niet' },
  // Shadda (verdubbelde letter)
  { id: 'w043', arabic: 'أُمٌّ',   dutch: 'moeder',               hint: '<strong>أ</strong> + <strong>مّ</strong> — shadda op miem = dubbele M, maar je schrijft het maar één keer' },
  { id: 'w028', arabic: 'كُرْسِيٌّ', dutch: 'stoel',              hint: 'كُرْسِ + <strong>يّ</strong> — shadda op ya aan het eind + tanwin dhamma' },
  // Gemengde valkuilen
  { id: 'kd_n002', arabic: 'وُضُوء', dutch: 'ritueel wassen (wudu)', hint: 'و + ضُ + <strong>و</strong> (lange ū) + <strong>ء</strong> (losstaande hamza aan het eind)' },
  { id: 'kd_n013', arabic: 'نِعْمَة', dutch: 'gunst/genade',       hint: 'ن + <strong>عْ</strong> (sukun-ain) + م + ة — ain in het midden, makkelijk gemist' },
  { id: 'kd_n022', arabic: 'تَقْوَى', dutch: 'vroomheid',          hint: 'ت + <strong>قْ</strong> (sukun-qaf) + و + <strong>ى</strong> (alef maqsura — eindigt niet op ا!)' },
  { id: 'kd_n028', arabic: 'حُجَّة',  dutch: 'bewijs/argument',    hint: '<strong>حُ</strong> (borst-H!) + <strong>جَّ</strong> (shadda op jim) + ة' },
];

function getWritingSrs() {
  try { return JSON.parse(localStorage.getItem(WRITING_SRS_KEY) || '{}'); }
  catch { return {}; }
}
function saveWritingSrs(data) { localStorage.setItem(WRITING_SRS_KEY, JSON.stringify(data)); }

function writingCardDue(id, today) {
  const s = getWritingSrs()[id];
  if (!s) return true; // nieuw = altijd doen
  return s.nextReview <= today;
}

function updateWritingSrs(id, grade) {
  const store = getWritingSrs();
  const cur = store[id] || { interval: 1, easeFactor: 2.5, repetitions: 0 };
  let { interval, easeFactor, repetitions } = cur;
  if (grade === 1) { repetitions = 0; interval = 1; easeFactor = Math.max(1.3, easeFactor - 0.2); }
  else if (grade === 3) { interval = repetitions === 0 ? 2 : Math.round(interval * 1.4); repetitions++; easeFactor = Math.max(1.3, easeFactor - 0.05); }
  else { interval = repetitions === 0 ? 4 : Math.round(interval * easeFactor); repetitions++; easeFactor += 0.1; }
  const next = new Date(); next.setDate(next.getDate() + interval);
  store[id] = { interval, easeFactor, repetitions, nextReview: next.toISOString().split('T')[0] };
  saveWritingSrs(store);
}

function getWritingStats(today) {
  const due = WRITING_WORDS.filter(w => writingCardDue(w.id, today)).length;
  const store = getWritingSrs();
  const learned = Object.values(store).filter(s => s.repetitions >= 3).length;
  return { due, learned, total: WRITING_WORDS.length };
}

function stripDiacritics(str) {
  return str.replace(/[ؐ-ًؚ-ٰٟۖ-ۜ۟-۪ۤۧۨ-ۭ]/g, '');
}

function charCompare(typed, correct) {
  const t = stripDiacritics(typed.trim());
  const c = stripDiacritics(correct.trim());
  const maxLen = Math.max(t.length, c.length);
  const result = [];
  for (let i = 0; i < maxLen; i++) {
    if (i >= t.length)    result.push({ char: c[i], state: 'miss' });
    else if (i >= c.length) result.push({ char: t[i], state: 'err' });
    else if (t[i] === c[i]) result.push({ char: c[i], state: 'ok' });
    else                    result.push({ char: c[i], state: 'err' });
  }
  const errors = result.filter(r => r.state !== 'ok').length;
  return { result, errors };
}

function renderWritingOverview(el, container, today) {
  if (!el) return;
  const stats = getWritingStats(today);
  const dueWords = WRITING_WORDS.filter(w => writingCardDue(w.id, today));

  el.innerHTML = `
    <div class="writing-stats-grid">
      <div class="writing-stat">
        <div class="writing-stat-val ${stats.due > 0 ? 'accent' : ''}" style="${stats.due > 0 ? 'color:var(--accent)' : ''}">${stats.due}</div>
        <div class="writing-stat-lbl">Te oefenen</div>
      </div>
      <div class="writing-stat">
        <div class="writing-stat-val ok" style="color:var(--ok)">${stats.learned}</div>
        <div class="writing-stat-lbl">Beheerst</div>
      </div>
      <div class="writing-stat">
        <div class="writing-stat-val">${stats.total}</div>
        <div class="writing-stat-lbl">Totaal</div>
      </div>
    </div>
    <button class="btn block" id="start-writing" ${dueWords.length === 0 ? 'disabled' : ''} style="margin-bottom:16px;max-width:280px;margin-left:auto;margin-right:auto">
      ${dueWords.length > 0 ? `✍️ Schrijfoefening starten (${dueWords.length})` : 'Niets te oefenen vandaag'}
    </button>
    <p class="muted" style="font-size:.82rem;text-align:center;margin-bottom:16px">
      Typ het Arabische woord bij de Nederlandse betekenis.<br>Diacritische tekens (harakat) worden genegeerd bij de beoordeling.
    </p>
    <div style="font-size:.8rem;color:var(--text-faint);text-align:center">
      ${WRITING_WORDS.map(w => {
        const s = getWritingSrs()[w.id];
        const done = s && s.repetitions >= 3;
        return `<span style="margin:2px;display:inline-block;opacity:${done?1:.35}" title="${w.dutch}">${w.arabic.replace(/[ؐ-ٟ]/g,'')}</span>`;
      }).join('')}
    </div>
  `;

  const startBtn = el.querySelector('#start-writing');
  if (startBtn && !startBtn.disabled) {
    startBtn.onclick = () => startWritingSession(container, dueWords, today);
  }
}

function startWritingSession(container, words, today) {
  let idx = 0;
  const results = [];

  const showWord = () => {
    if (idx >= words.length) {
      showWritingCompletion(container, results, today);
      return;
    }
    const w = words[idx];
    container.innerHTML = `
      <div class="srs-session-header">
        <button class="btn secondary" id="wr-stop" style="padding:6px 12px;font-size:.82rem">✕ Stoppen</button>
        <div class="srs-progress-info">${idx + 1} / ${words.length}</div>
        <div style="width:60px"></div>
      </div>
      <div class="progress-bar" style="margin-bottom:20px">
        <div class="progress-fill" style="width:${Math.round(idx/words.length*100)}%;transition:width .4s"></div>
      </div>
      <div class="writing-prompt">
        <div class="writing-prompt-dutch">${escapeHTML(w.dutch)}</div>
        <div class="writing-prompt-hint">Typ het Arabische woord</div>
        <input class="writing-input" id="wr-input" type="text" dir="rtl" lang="ar"
               autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
               placeholder="اكتب هنا…" />
      </div>
      <button class="btn block" id="wr-check" style="max-width:240px;margin:0 auto">Controleer</button>
      <div id="wr-result" style="margin-top:12px"></div>
    `;

    container.querySelector('#wr-stop').onclick = () => render(container);
    const input = container.querySelector('#wr-input');
    const checkBtn = container.querySelector('#wr-check');
    const resultEl = container.querySelector('#wr-result');

    let checked = false;

    const doCheck = () => {
      if (checked) return;
      checked = true;
      const typed = input.value;
      const { result, errors } = charCompare(typed, w.arabic);
      const grade = errors === 0 ? 5 : errors <= 2 ? 3 : 1;

      input.classList.add(errors === 0 ? 'correct-border' : 'wrong-border');

      const charsHtml = result.map(r =>
        `<span class="wr-char ${r.state}">${r.char}</span>`
      ).join('');

      const gradeLabel = errors === 0
        ? `<span style="color:var(--ok);font-weight:600">✓ Perfect!</span>`
        : errors <= 2
        ? `<span style="color:#f59e0b;font-weight:600">△ Bijna (${errors} fout${errors>1?'en':''})</span>`
        : `<span style="color:var(--danger);font-weight:600">✗ Fout (${errors} fouten)</span>`;

      resultEl.innerHTML = `
        <div class="writing-result">
          <div style="margin-bottom:6px;font-size:.85rem">${gradeLabel}</div>
          <div class="writing-result-chars">${charsHtml}</div>
          <div style="font-size:.8rem;color:var(--text-faint);margin-bottom:4px">Correct: <span style="font-family:'Amiri','Scheherazade New',Georgia,serif;font-size:1.1rem;color:var(--text);direction:rtl">${w.arabic}</span></div>
          ${errors > 0 ? `<div class="writing-hint-box">${w.hint}</div>` : ''}
        </div>
        <button class="btn block" id="wr-next" style="max-width:240px;margin:12px auto 0">Volgende →</button>
      `;

      haptic[errors === 0 ? 'success' : errors <= 2 ? 'light' : 'err']();
      updateWritingSrs(w.id, grade);
      results.push({ id: w.id, errors });

      resultEl.querySelector('#wr-next').onclick = () => {
        idx++;
        showWord();
      };
      checkBtn.style.display = 'none';
    };

    checkBtn.onclick = doCheck;
    input.onkeydown = e => { if (e.key === 'Enter') doCheck(); };
    setTimeout(() => input.focus(), 100);
  };

  showWord();
}

function showWritingCompletion(container, results, today) {
  const total   = results.length;
  const perfect = results.filter(r => r.errors === 0).length;
  const close   = results.filter(r => r.errors > 0 && r.errors <= 2).length;
  const wrong   = results.filter(r => r.errors > 2).length;
  const score   = total > 0 ? Math.round(perfect / total * 100) : 0;

  container.innerHTML = `
    <div class="srs-completion">
      <div class="srs-completion-icon">${score === 100 ? '✍️' : score >= 60 ? '📝' : '✏️'}</div>
      <h2>Schrijfoefening klaar!</h2>
      <p class="muted">${score === 100 ? 'Elke letter perfect! Je spelling is scherp.' : score >= 60 ? 'Goed gedaan, je hebt de meeste woorden goed.' : 'Herhaling is de sleutel — morgen weer scherper.'}</p>
      <div class="srs-completion-stats">
        <div class="srs-comp-stat">
          <div class="srs-comp-val ok" style="color:var(--ok)">${perfect}</div>
          <div class="srs-comp-lbl">Perfect</div>
        </div>
        <div class="srs-comp-stat">
          <div class="srs-comp-val" style="color:#f59e0b">${close}</div>
          <div class="srs-comp-lbl">Bijna</div>
        </div>
        <div class="srs-comp-stat">
          <div class="srs-comp-val ${wrong>0?'danger':''}" style="${wrong>0?'color:var(--danger)':''}">${wrong}</div>
          <div class="srs-comp-lbl">Fout</div>
        </div>
      </div>
      <button class="btn block" id="wr-done" style="max-width:260px;margin:0 auto">Terug naar overzicht</button>
    </div>
  `;

  if (score === 100 && total > 0) { haptic.success(); confettiBig(); }
  else if (score >= 60) { haptic.success(); confettiMini(); }
  else haptic.light();

  container.querySelector('#wr-done').onclick = () => render(container);
}
