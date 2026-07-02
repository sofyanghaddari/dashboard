// 📖 Stof/grammatica-docent — onderwerpen uit het lesboek (Fusha niveau 3)
// invoeren via foto/tekst en herhalen met AI-beoordeelde i3rab- en
// eigen-woorden-oefeningen. Losstaand van de vocab-module (arabic.js).
import { all, put, del, get } from '../db.js';
import { uid, ymd, escapeHTML } from '../utils.js';
import { icon } from '../icons.js';
import { openModal, confirmModal } from '../components/modal.js';
import { ok as toastOk, err as toastErr, info as toastInfo } from '../components/toast.js';
import { confettiMini, confettiBig } from '../components/celebrate.js';
import * as haptic from '../haptic.js';

const STORE = 'grammar_topics';
const INTERVALLEN = [1, 3, 7, 14, 30]; // dagen — bewust simpeler dan SM-2
const FOUTTYPE_LABEL = { naamval: 'Naamval', functie: 'Functie', regel: 'Regeltoepassing', overig: 'Overig' };
const MAX_FOUTLOG = 100;

// ── Hoofd render ─────────────────────────────────────────────
export async function render(container) {
  const today = ymd();
  const topics = await all(STORE);
  const due = topics.filter(t => t.srs.volgendeHerhaling <= today);
  const nieuw = topics.filter(t => t.status === 'nieuw').length;
  const beheerst = topics.filter(t => t.status === 'beheerst').length;

  container.innerHTML = `
    <h1 class="page-title">Stof herhalen</h1>

    <div class="srs-stats-grid">
      <div class="srs-stat">
        <div class="srs-stat-val ${due.length > 0 ? 'accent' : ''}">${due.length}</div>
        <div class="srs-stat-lbl">Te herhalen</div>
      </div>
      <div class="srs-stat">
        <div class="srs-stat-val">${nieuw}</div>
        <div class="srs-stat-lbl">Nieuw</div>
      </div>
      <div class="srs-stat">
        <div class="srs-stat-val ok">${beheerst}</div>
        <div class="srs-stat-lbl">Beheerst</div>
      </div>
      <div class="srs-stat">
        <div class="srs-stat-val">${topics.length}</div>
        <div class="srs-stat-lbl">Totaal</div>
      </div>
    </div>

    <div class="arabic-start-card">
      ${due.length > 0 ? `
        <h2>${due.length} onderwerp${due.length === 1 ? '' : 'en'} aan de beurt</h2>
        <p>Mix van i3rab-oefeningen en uitleg in eigen woorden</p>
      ` : topics.length ? `
        <h2>Alles up-to-date</h2>
        <p>${volgendeDatumLabel(topics)}</p>
      ` : `
        <h2>Nog geen stof ingevoerd</h2>
        <p>Begin met إعراب of الأسماء الخمسة uit je boek</p>
      `}
      <button class="btn block" id="gram-start" ${due.length === 0 ? 'disabled' : ''} style="max-width:280px;margin:0 auto">
        ${due.length > 0 ? `▶ Start herhaling (${due.length})` : 'Niets te herhalen'}
      </button>
    </div>

    <div class="gram-add-row">
      <label for="gram-foto" class="btn secondary gram-add-btn">${icon('camera')} Foto uit boek</label>
      <input type="file" id="gram-foto" accept="image/*" capture="environment" style="display:none" />
      <button class="btn secondary gram-add-btn" id="gram-tekst">${icon('pencil')} Tekst typen</button>
    </div>

    <div id="gram-list">${topicListHTML(topics, today)}</div>

    <div class="gram-footer">
      <button class="btn secondary" id="gram-worker">${icon('gear')} Worker</button>
      <button class="btn secondary" id="gram-export">${icon('download')} Export</button>
      <label for="gram-import-file" class="btn secondary" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px">↑ Import</label>
      <input type="file" id="gram-import-file" accept=".json" style="display:none" />
    </div>
    ${workerUrl() ? '' : `
      <p class="muted gram-setup-hint">⚠ Nog geen AI-Worker gekoppeld — zonder Worker kun je geen stof toevoegen of oefenen.
      Volg <strong>proxy/README-grammatica-worker.md</strong> (eenmalig, ±10 min) en zet daarna de URL via de Worker-knop hierboven.</p>
    `}
  `;

  bindOverview(container, topics, due);
}

function volgendeDatumLabel(topics) {
  const next = topics.map(t => t.srs.volgendeHerhaling).sort()[0];
  if (!next) return 'Voeg een onderwerp toe';
  const d = new Date(next + 'T12:00:00');
  return `Volgende herhaling: ${d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}`;
}

function topicListHTML(topics, today) {
  if (!topics.length) {
    return `
      <div class="notes-empty">
        <div class="notes-empty-icon">${icon('books')}</div>
        <div class="notes-empty-title">Nog geen onderwerpen</div>
        <div class="notes-empty-sub">Maak een foto van een boekpagina of typ de uitleg — de AI zet het om naar een oefenbaar onderwerp</div>
      </div>`;
  }
  const sorted = [...topics].sort((a, b) => (a.srs.volgendeHerhaling || '').localeCompare(b.srs.volgendeHerhaling || ''));
  return sorted.map(t => {
    const badge = statusBadge(t, today);
    const fouten = topFouttype(t);
    return `
      <div class="gram-topic" data-id="${t.id}">
        <div class="gram-topic-ar arabic-text" dir="rtl">${escapeHTML(t.titelAr)}</div>
        <div class="gram-topic-info">
          <div class="gram-topic-nl">${escapeHTML(t.titelNl)}</div>
          <div class="gram-topic-meta">
            ${t.voorbeeldzinnen?.length || 0} zinnen · ${herhalingLabel(t, today)}
            ${fouten ? ` · <span class="gram-fout-chip">meeste fouten: ${fouten}</span>` : ''}
          </div>
        </div>
        <span class="srs-status-badge ${badge.cls}">${badge.label}</span>
      </div>`;
  }).join('');
}

function statusBadge(t, today) {
  if (t.status === 'nieuw') return { cls: 'srs-badge-new', label: 'Nieuw' };
  if (t.srs.volgendeHerhaling < today) return { cls: 'srs-badge-overdue', label: 'Te laat' };
  if (t.srs.volgendeHerhaling === today) return { cls: 'srs-badge-due', label: 'Vandaag' };
  if (t.status === 'beheerst') return { cls: 'srs-badge-learned', label: 'Beheerst' };
  return { cls: 'srs-badge-learning', label: 'Bezig' };
}

function herhalingLabel(t, today) {
  const d = t.srs.volgendeHerhaling;
  if (!d || d <= today) return 'nu aan de beurt';
  const diff = Math.round((new Date(d) - new Date(today)) / 86400000);
  return diff === 1 ? 'morgen weer' : `over ${diff}d weer`;
}

function topFouttype(t) {
  if (!t.foutgeschiedenis?.length) return null;
  const counts = {};
  for (const f of t.foutgeschiedenis) counts[f.fouttype] = (counts[f.fouttype] || 0) + 1;
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top ? FOUTTYPE_LABEL[top[0]] || top[0] : null;
}

// ── Overview events ───────────────────────────────────────────
function bindOverview(container, topics, due) {
  container.querySelector('#gram-start').onclick = () => {
    if (due.length) startSession(container, due);
  };
  container.querySelector('#gram-foto').onchange = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (f) ingestFromPhoto(container, f);
  };
  container.querySelector('#gram-tekst').onclick = () => openTekstModal(container);
  container.querySelector('#gram-worker').onclick = () => openWorkerModal(container);
  container.querySelector('#gram-export').onclick = () => exportTopics(topics);
  container.querySelector('#gram-import-file').onchange = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (f) importTopics(container, f);
  };
  container.querySelectorAll('.gram-topic').forEach(el => {
    el.onclick = () => {
      const t = topics.find(x => x.id === el.dataset.id);
      if (t) openTopicDetail(container, t);
    };
  });
}

// ── Worker-koppeling ──────────────────────────────────────────
function workerUrl() { return (localStorage.getItem('grammarWorkerUrl') || '').replace(/\/+$/, ''); }

function openWorkerModal(container) {
  openModal('AI-Worker instellen', `
    <label>Worker-URL</label>
    <input name="url" placeholder="https://grammatica.jouwnaam.workers.dev"
           value="${escapeHTML(localStorage.getItem('grammarWorkerUrl') || '')}" inputmode="url" autocapitalize="off" />
    <p class="muted" style="font-size:.8rem;margin-top:8px">Eenmalig instellen — zie <strong>proxy/README-grammatica-worker.md</strong> in de repo voor de deploy-stappen (±10 min). Je API-key blijft in de Worker, nooit in de app.</p>
  `, async (d) => {
    const url = (d.url || '').trim().replace(/\/+$/, '');
    if (url && !/^https:\/\//.test(url)) throw new Error('URL moet met https:// beginnen');
    if (url) localStorage.setItem('grammarWorkerUrl', url);
    else localStorage.removeItem('grammarWorkerUrl');
    toastOk(url ? 'Worker gekoppeld' : 'Worker-URL verwijderd');
    render(container);
  });
}

async function callWorker(path, body) {
  const base = workerUrl();
  if (!base) throw new Error('Geen Worker gekoppeld — stel eerst de Worker-URL in (⚙ Worker-knop)');
  if (!navigator.onLine) throw new Error('Je bent offline — oefenen en toevoegen heeft internet nodig');
  let res;
  try {
    res = await fetch(base + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (_) {
    throw new Error('Worker niet bereikbaar — controleer je verbinding en de Worker-URL');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Worker-fout (HTTP ${res.status})`);
  return data;
}

// ── Onderwerp toevoegen ───────────────────────────────────────
function openTekstModal(container) {
  openModal('Stof toevoegen (tekst)', `
    <label>Uitleg uit het boek (Arabisch en/of Nederlands)</label>
    <textarea name="tekst" rows="8" dir="auto" placeholder="Typ of plak hier de uitleg van het onderwerp…"></textarea>
    <label>Onderwerp-hint (optioneel)</label>
    <input name="hint" placeholder="bijv. الأسماء الخمسة" dir="auto" />
  `, async (d) => {
    if (!d.tekst || d.tekst.trim().length < 20) throw new Error('Typ wat meer tekst — de AI heeft de uitleg zelf nodig');
    ingestAndPreview(container, { text: d.tekst.trim(), hint: d.hint?.trim() || undefined });
  });
}

async function ingestFromPhoto(container, file) {
  try {
    const overlay = showBusy('Foto verwerken…');
    let image, mediaType;
    try {
      ({ image, mediaType } = await fileToResizedBase64(file));
    } finally { overlay.remove(); }
    ingestAndPreview(container, { image, mediaType });
  } catch (e) {
    toastErr(e.message || 'Foto kon niet gelezen worden');
  }
}

async function ingestAndPreview(container, payload) {
  const overlay = showBusy('AI leest de stof… (kan 30-60s duren)');
  let topic;
  try {
    const res = await callWorker('/ingest-topic', payload);
    topic = res.topic;
  } catch (e) {
    overlay.remove();
    toastErr(e.message);
    return;
  }
  overlay.remove();
  openPreview(container, topic, payload.image ? 'foto' : 'tekst');
}

function openPreview(container, t, bron) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <button type="button" class="modal-close" id="gp-close" aria-label="Sluiten">×</button>
      <h2>Controleer het onderwerp</h2>
      <div class="gram-preview">
        <div class="gram-topic-ar arabic-text" dir="rtl" style="font-size:1.4rem">${escapeHTML(t.titelAr || '')}</div>
        <div class="gram-topic-nl" style="margin-bottom:10px">${escapeHTML(t.titelNl || '')}</div>
        <p class="gram-regel">${escapeHTML(t.uitleg?.regel || '')}</p>
        <ul class="gram-punten">
          ${(t.uitleg?.puntenNl || []).map(p => `<li>${escapeHTML(p)}</li>`).join('')}
        </ul>
        <div class="muted" style="font-size:.82rem;margin:8px 0">${(t.voorbeeldzinnen || []).length} voorbeeldzinnen met referentie-i3rab:</div>
        ${(t.voorbeeldzinnen || []).map(z => `
          <div class="gram-zin-preview">
            <span class="arabic-text" dir="rtl">${escapeHTML(z.zin)}</span>
            <span class="muted" style="font-size:.78rem"> — ${escapeHTML(z.vertaling || '')}</span>
          </div>`).join('')}
        <p class="muted" style="font-size:.78rem;margin-top:10px">Klopt er iets niet? Sla niet op maar probeer opnieuw met een scherpere foto of duidelijkere tekst — de referentie-analyse moet kloppen, daar wordt je antwoord tegen beoordeeld.</p>
      </div>
      <div class="row" style="margin-top:14px;display:flex;gap:10px">
        <button class="btn secondary block" id="gp-cancel">Niet opslaan</button>
        <button class="btn block" id="gp-save">Opslaan</button>
      </div>
    </div>`;
  document.body.appendChild(backdrop);
  const close = () => backdrop.remove();
  backdrop.querySelector('#gp-close').onclick = close;
  backdrop.querySelector('#gp-cancel').onclick = close;
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  backdrop.querySelector('#gp-save').onclick = async () => {
    const today = ymd();
    await put(STORE, {
      id: uid(),
      titelAr: t.titelAr || '', titelNl: t.titelNl || '',
      uitleg: {
        regel: t.uitleg?.regel || '',
        puntenNl: t.uitleg?.puntenNl || [],
        puntenAr: t.uitleg?.puntenAr || [],
      },
      voorbeeldzinnen: (t.voorbeeldzinnen || []).map(z => ({
        id: uid(), zin: z.zin || '', vertaling: z.vertaling || '', i3rab: z.i3rab || [],
      })),
      status: 'nieuw',
      srs: { stap: 0, laatsteHerhaling: null, volgendeHerhaling: today },
      foutgeschiedenis: [],
      bron,
      createdAt: Date.now(),
    });
    haptic.success();
    toastOk('Onderwerp opgeslagen — vandaag oefenbaar');
    close();
    render(document.getElementById('geloof-sub-view') || document.getElementById('view'));
  };
}

// ── Oefensessie ───────────────────────────────────────────────
function buildExercises(topics) {
  const ex = [];
  for (const t of topics) {
    ex.push({ topic: t, type: 'uitleg' });
    if (t.voorbeeldzinnen?.length) {
      const zin = t.voorbeeldzinnen[Math.floor(Math.random() * t.voorbeeldzinnen.length)];
      ex.push({ topic: t, type: 'i3rab', zin });
    }
  }
  // Schudden zodat i3rab en uitleg door elkaar komen
  for (let i = ex.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ex[i], ex[j]] = [ex[j], ex[i]];
  }
  return ex;
}

function startSession(container, dueTopics) {
  const queue = buildExercises(dueTopics);
  const results = new Map(); // topicId → ['ja'|'deels'|'nee', ...]
  let idx = 0;

  const showExercise = () => {
    if (idx >= queue.length) { finishSession(container, dueTopics, results); return; }
    const ex = queue[idx];
    const t = ex.topic;

    container.innerHTML = `
      <div class="srs-session-header">
        <button class="btn secondary" id="gr-stop" style="padding:6px 12px;font-size:.82rem">✕ Stoppen</button>
        <div class="srs-progress-info">${idx + 1} / ${queue.length}</div>
        <div style="width:60px"></div>
      </div>
      <div class="progress-bar" style="margin-bottom:20px">
        <div class="progress-fill" style="width:${Math.round(((idx + 1) / queue.length) * 100)}%;transition:width .4s"></div>
      </div>

      <div class="gram-exercise">
        <div class="gram-ex-type">${ex.type === 'i3rab' ? 'إعراب — ontleed de zin' : 'Leg uit in eigen woorden'}</div>
        <div class="gram-topic-nl muted" style="font-size:.82rem;margin-bottom:10px">${escapeHTML(t.titelAr)} — ${escapeHTML(t.titelNl)}</div>
        ${ex.type === 'i3rab' ? `
          <div class="gram-ex-zin arabic-text" dir="rtl">${escapeHTML(ex.zin.zin)}</div>
          <p class="muted" style="font-size:.82rem">Geef per woord de functie en naamval (Nederlands, Arabisch of mix).</p>
        ` : `
          <div class="gram-ex-zin arabic-text" dir="rtl">${escapeHTML(t.titelAr)}</div>
          <p class="muted" style="font-size:.82rem">Wat is de regel? Wanneer geldt hij? Noem een voorbeeld als je kunt.</p>
        `}
        <textarea id="gr-answer" rows="5" dir="auto" placeholder="Typ je antwoord…"></textarea>
        <button class="btn block" id="gr-check" style="max-width:260px;margin:12px auto 0">Controleer</button>
        <div id="gr-feedback"></div>
      </div>
    `;

    container.querySelector('#gr-stop').onclick = async () => {
      // Halverwege stoppen: alleen al-beoordeelde onderwerpen krijgen SRS-update
      await applyResults(dueTopics, results);
      render(container);
    };

    const checkBtn = container.querySelector('#gr-check');
    checkBtn.onclick = async () => {
      const antwoord = container.querySelector('#gr-answer').value.trim();
      if (antwoord.length < 5) { toastErr('Typ eerst een antwoord'); return; }
      checkBtn.disabled = true;
      checkBtn.textContent = 'AI beoordeelt…';
      let res;
      try {
        res = await callWorker('/check-grammar', {
          oefentype: ex.type,
          onderwerp: { titelAr: t.titelAr, titelNl: t.titelNl, regel: t.uitleg.regel, puntenNl: t.uitleg.puntenNl },
          zin: ex.type === 'i3rab' ? ex.zin.zin : undefined,
          referentie: ex.type === 'i3rab' ? ex.zin.i3rab : undefined,
          antwoord,
        });
      } catch (e) {
        checkBtn.disabled = false;
        checkBtn.textContent = 'Controleer';
        toastErr(e.message);
        return;
      }

      if (!results.has(t.id)) results.set(t.id, []);
      results.get(t.id).push({ correct: res.correct, fouttype: res.fouttype, type: ex.type, zinId: ex.zin?.id });

      res.correct === 'ja' ? haptic.success() : res.correct === 'deels' ? haptic.light() : haptic.err();
      checkBtn.style.display = 'none';
      container.querySelector('#gr-answer').disabled = true;

      const fb = container.querySelector('#gr-feedback');
      fb.innerHTML = `
        <div class="gram-feedback gram-fb-${res.correct}">
          <div class="gram-fb-head">
            ${res.correct === 'ja' ? '✓ Goed' : res.correct === 'deels' ? '△ Bijna goed' : '✗ Niet goed'}
            ${res.fouttype ? `<span class="gram-fout-chip">${FOUTTYPE_LABEL[res.fouttype] || res.fouttype}</span>` : ''}
          </div>
          <p>${escapeHTML(res.uitleg || '')}</p>
          ${ex.type === 'i3rab' && ex.zin.i3rab?.length ? `
            <details class="gram-ref">
              <summary>Referentie-analyse</summary>
              ${ex.zin.i3rab.map(w => `<div class="gram-ref-row"><span class="arabic-text" dir="rtl">${escapeHTML(w.woord)}</span><span>${escapeHTML(w.analyse)}</span></div>`).join('')}
            </details>
          ` : ''}
        </div>
        <button class="btn block" id="gr-next" style="max-width:260px;margin:12px auto 0">Volgende →</button>
      `;
      fb.querySelector('#gr-next').onclick = () => { idx++; showExercise(); };
    };
  };

  showExercise();
}

async function applyResults(topics, results) {
  const today = ymd();
  for (const t of topics) {
    const rs = results.get(t.id);
    if (!rs || !rs.length) continue;
    // Slechtste resultaat telt: nee < deels < ja
    const worst = rs.some(r => r.correct === 'nee') ? 'nee' : rs.some(r => r.correct === 'deels') ? 'deels' : 'ja';
    const srs = { ...t.srs, laatsteHerhaling: today };
    if (worst === 'ja') {
      srs.stap = Math.min(t.srs.stap + 1, INTERVALLEN.length - 1);
      srs.volgendeHerhaling = addDays(today, INTERVALLEN[srs.stap]);
    } else if (worst === 'deels') {
      srs.volgendeHerhaling = addDays(today, 1);
    } else {
      srs.stap = Math.max(t.srs.stap - 1, 0);
      srs.volgendeHerhaling = addDays(today, 1);
    }
    const fouten = rs.filter(r => r.correct !== 'ja').map(r => ({
      datum: today, oefentype: r.type, fouttype: r.fouttype || 'overig', zinId: r.zinId || null,
    }));
    const log = [...(t.foutgeschiedenis || []), ...fouten].slice(-MAX_FOUTLOG);
    const status = srs.stap >= INTERVALLEN.length - 1 ? 'beheerst' : 'bezig';
    await put(STORE, { ...t, srs, foutgeschiedenis: log, status });
  }
}

async function finishSession(container, dueTopics, results) {
  await applyResults(dueTopics, results);
  const flat = [...results.values()].flat();
  const goed = flat.filter(r => r.correct === 'ja').length;
  const bijna = flat.filter(r => r.correct === 'deels').length;
  const fout = flat.filter(r => r.correct === 'nee').length;
  const score = flat.length ? Math.round(goed / flat.length * 100) : 0;

  container.innerHTML = `
    <div class="srs-completion">
      <div class="srs-completion-icon">${score === 100 ? icon('trophy') : score >= 60 ? icon('star') : icon('bulb')}</div>
      <h2>Herhaling klaar!</h2>
      <p class="muted">${score === 100 ? 'Alles goed — de stof zit erin.' : score >= 60 ? 'Sterk — de zwakke plekken komen morgen terug.' : 'Herhaling is de sleutel; morgen komen ze terug.'}</p>
      <div class="srs-completion-stats">
        <div class="srs-comp-stat"><div class="srs-comp-val ok">${goed}</div><div class="srs-comp-lbl">Goed</div></div>
        <div class="srs-comp-stat"><div class="srs-comp-val" style="color:#f59e0b">${bijna}</div><div class="srs-comp-lbl">Bijna</div></div>
        <div class="srs-comp-stat"><div class="srs-comp-val ${fout ? 'danger' : ''}">${fout}</div><div class="srs-comp-lbl">Fout</div></div>
      </div>
      <button class="btn block" id="gr-done" style="max-width:260px;margin:0 auto">Terug naar overzicht</button>
    </div>
  `;
  if (score === 100 && flat.length) { haptic.success(); confettiBig(); }
  else if (score >= 60) { haptic.success(); confettiMini(); }
  container.querySelector('#gr-done').onclick = () => render(container);
}

// ── Onderwerp-detail ──────────────────────────────────────────
function openTopicDetail(container, t) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  const foutStats = (t.foutgeschiedenis || []).reduce((acc, f) => {
    acc[f.fouttype] = (acc[f.fouttype] || 0) + 1; return acc;
  }, {});
  backdrop.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <button type="button" class="modal-close" id="gd-close" aria-label="Sluiten">×</button>
      <h2 class="arabic-text" dir="rtl" style="text-align:right">${escapeHTML(t.titelAr)}</h2>
      <div class="gram-topic-nl" style="margin-bottom:12px">${escapeHTML(t.titelNl)}</div>
      <p class="gram-regel">${escapeHTML(t.uitleg.regel)}</p>
      <ul class="gram-punten">${(t.uitleg.puntenNl || []).map(p => `<li>${escapeHTML(p)}</li>`).join('')}</ul>
      ${(t.uitleg.puntenAr || []).length ? `
        <details class="gram-ref"><summary>Arabische kernpunten uit het boek</summary>
          ${(t.uitleg.puntenAr).map(p => `<div class="arabic-text gram-ar-punt" dir="rtl">${escapeHTML(p)}</div>`).join('')}
        </details>` : ''}
      <details class="gram-ref"><summary>Voorbeeldzinnen + referentie-i3rab (${(t.voorbeeldzinnen || []).length})</summary>
        ${(t.voorbeeldzinnen || []).map(z => `
          <div class="gram-zin-preview" style="margin-top:8px">
            <div class="arabic-text" dir="rtl">${escapeHTML(z.zin)}</div>
            <div class="muted" style="font-size:.78rem">${escapeHTML(z.vertaling || '')}</div>
            ${(z.i3rab || []).map(w => `<div class="gram-ref-row"><span class="arabic-text" dir="rtl">${escapeHTML(w.woord)}</span><span>${escapeHTML(w.analyse)}</span></div>`).join('')}
          </div>`).join('')}
      </details>
      ${Object.keys(foutStats).length ? `
        <div class="gram-fout-overzicht">
          ${Object.entries(foutStats).sort((a, b) => b[1] - a[1]).map(([k, n]) =>
            `<span class="gram-fout-chip">${FOUTTYPE_LABEL[k] || k}: ${n}×</span>`).join(' ')}
        </div>` : ''}
      <div class="row" style="margin-top:16px;display:flex;gap:10px">
        <button class="btn secondary block" id="gd-del">${icon('trash')} Verwijderen</button>
        <button class="btn block" id="gd-oefen">Nu oefenen</button>
      </div>
    </div>`;
  document.body.appendChild(backdrop);
  const close = () => backdrop.remove();
  backdrop.querySelector('#gd-close').onclick = close;
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  backdrop.querySelector('#gd-oefen').onclick = () => { close(); startSession(container, [t]); };
  backdrop.querySelector('#gd-del').onclick = async () => {
    close();
    if (await confirmModal(`"${t.titelNl}" en alle voortgang verwijderen?`, { title: 'Onderwerp verwijderen', confirmLabel: 'Verwijderen', danger: true })) {
      await del(STORE, t.id);
      toastOk('Onderwerp verwijderd');
      render(container);
    }
  };
}

// ── Export / import ───────────────────────────────────────────
function exportTopics(topics) {
  if (!topics.length) { toastInfo('Nog niets te exporteren'); return; }
  const blob = new Blob([JSON.stringify({ grammar_topics: topics, exportedAt: new Date().toISOString() }, null, 2)],
    { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `grammatica-export-${ymd()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  toastOk(`${topics.length} onderwerp${topics.length === 1 ? '' : 'en'} geëxporteerd`);
}

async function importTopics(container, file) {
  try {
    const data = JSON.parse(await file.text());
    const items = data.grammar_topics || data;
    if (!Array.isArray(items)) throw new Error('Onbekend bestandsformaat');
    let added = 0, skipped = 0;
    for (const t of items) {
      if (!t.id || !t.titelAr) { skipped++; continue; }
      if (await get(STORE, t.id)) { skipped++; continue; }
      await put(STORE, t);
      added++;
    }
    toastOk(`${added} geïmporteerd${skipped ? ` · ${skipped} overgeslagen` : ''}`);
    render(container);
  } catch (e) {
    toastErr('Import mislukt: ' + e.message);
  }
}

// ── Helpers ───────────────────────────────────────────────────
function addDays(isoDate, n) {
  const d = new Date(isoDate + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function showBusy(label) {
  const el = document.createElement('div');
  el.className = 'gram-busy';
  el.innerHTML = `<div class="gram-busy-box"><div class="gram-spinner"></div><div>${escapeHTML(label)}</div></div>`;
  document.body.appendChild(el);
  return el;
}

// Boekfoto's zijn vaak 3-8MB; verklein client-side naar max 1568px lange zijde
// (voldoende voor OCR, scheelt fors upload + tokens; API-limiet is ~5MB base64).
function fileToResizedBase64(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 1568;
      let { width, height } = img;
      const scale = Math.min(1, MAX / Math.max(width, height));
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      resolve({ image: dataUrl.split(',')[1], mediaType: 'image/jpeg' });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Afbeelding kon niet gelezen worden')); };
    img.src = url;
  });
}
