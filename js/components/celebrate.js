// Lichte canvas-confetti + Nederlandse motivatie-popups met humor
import { icon } from '../icons.js';

// 🏆 Cinematische badge-onthulling: medaillon draait in met shine-sweep + confetti.
export function celebrateBadge(badge) {
  if (!badge) return;
  confettiBig();
  const el = document.createElement('div');
  el.className = 'badge-unlock-backdrop';
  const name = String(badge.name || '').replace(/[<>&]/g, '');
  el.innerHTML = `
    <div class="badge-unlock">
      <div class="bu-medallion">
        <div class="bu-shine"></div>
        ${icon(badge.icon, 'bu-ic')}
        <div class="bu-check">✓</div>
      </div>
      <div class="bu-title">Badge ontgrendeld</div>
      <div class="bu-name">${name}</div>
    </div>`;
  document.body.appendChild(el);
  let closed = false;
  const close = () => { if (closed) return; closed = true; el.classList.add('closing'); setTimeout(() => el.remove(), 320); };
  el.addEventListener('click', close);
  setTimeout(close, 3200);
}

const TASK_MOTIVATION = [
  '🪖 Strijder, op naar de volgende!',
  '💪 Een minder! Geen pauze, kampioen.',
  '🎯 Boom! Je bent op rolletjes.',
  '🦁 Leeuw aan het werk. Door, door, door!',
  '⚡ Bliksemsnel. Volgende slachtoffer?',
  '🏆 Eén stap dichter bij wereldheerschappij.',
  '🚀 Lekker bezig! De wereld kijkt mee.',
  '🥷 Stille moordenaar van taken. Respect.',
  '🔥 Je staat in de fik! Op naar de volgende.',
  '🎩 Voilà! Net zo elegant als James Bond.',
  '🐉 Draak verslagen. Volgende grot?',
  '👑 Koninklijk gedaan. Volgende, plebejer.',
  '🍕 Verdiend! Maar eerst de volgende taak.',
  '🦸 Cape uit, taak af. Ga door, held!',
];

const GOAL_HIT = [
  '🎉 DAGDOEL BINNEN! Vandaag winnen we.',
  '💰 Geld in de pocket. Petje af.',
  '🏁 Doel verslagen. Lekker bezig, baas.',
  '🌟 Boom! Je verdient een schouderklopje van jezelf.',
  '🔥 Doel = vernietigd. Volgende graag.',
];

const ALL_DONE = [
  '🎊 ALLE TAKEN VAN VANDAAG: WEG. GANG!',
  '🏆 Je hebt vandaag de taken écht uitgekleed.',
  '🦅 Adelaar boven het slagveld. Niemand overgebleven.',
  '🍷 Klaar. Trakteer jezelf — je hebt het verdiend.',
  '🪩 Wereldkampioen To-do. Welkom op het podium.',
];

const STREAK_MILESTONE = [
  '🔥 Streak! Je staat in lichterlaaie, geen brandweer kan helpen.',
  '⚡ Consistentie is power. Vermoeid? Geen probleem, je bent een machine.',
  '🏔️ Berg beklimmen zonder pauze. Goed bezig.',
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

export function celebrateTask() {
  confettiMini();
  popMessage(pick(TASK_MOTIVATION), 'task');
}

export function celebrateGoalHit() {
  confettiBig();
  popMessage(pick(GOAL_HIT), 'goal');
}

export function celebrateAllDone() {
  confettiBig();
  setTimeout(() => confettiBig(), 400);
  setTimeout(() => confettiBig(), 800);
  popMessage(pick(ALL_DONE), 'big');
}

export function celebrateStreak() {
  confettiMini();
  popMessage(pick(STREAK_MILESTONE), 'goal');
}

function popMessage(text, size = 'task') {
  const el = document.createElement('div');
  el.className = `celebrate-pop celebrate-${size}`;
  el.textContent = text;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  const dur = size === 'big' ? 4000 : 2400;
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 400);
  }, dur);
  el.onclick = () => { el.classList.remove('show'); setTimeout(() => el.remove(), 200); };
}

// Lichte confetti zonder library
export function confettiMini() { fireConfetti(40, 1500); }
export function confettiBig() { fireConfetti(120, 2400); }

function fireConfetti(count, duration) {
  const canvas = ensureCanvas();
  const ctx = canvas.getContext('2d');
  const colors = ['#d4b06b', '#e8c785', '#6ec9ff', '#5dd49a', '#ff6b70', '#ffffff'];
  const pieces = [];
  const w = canvas.width = window.innerWidth;
  const h = canvas.height = window.innerHeight;
  for (let i = 0; i < count; i++) {
    pieces.push({
      x: w / 2 + (Math.random() - 0.5) * 100,
      y: h * 0.6,
      vx: (Math.random() - 0.5) * 14,
      vy: -Math.random() * 14 - 6,
      g: 0.35,
      size: 4 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      life: 1,
    });
  }
  const start = performance.now();
  function frame(now) {
    const elapsed = now - start;
    ctx.clearRect(0, 0, w, h);
    pieces.forEach(p => {
      p.vy += p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life = Math.max(0, 1 - elapsed / duration);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.4);
      ctx.restore();
    });
    if (elapsed < duration) requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, w, h);
  }
  requestAnimationFrame(frame);
}

function ensureCanvas() {
  let c = document.getElementById('confetti-canvas');
  if (c) return c;
  c = document.createElement('canvas');
  c.id = 'confetti-canvas';
  c.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:1000';
  document.body.appendChild(c);
  return c;
}
