// Pomodoro-timer als floating widget
import { toast } from './toast.js';

let _state = null;
let _interval = null;
let _bubble = null;

const WORK = 25 * 60;
const BREAK = 5 * 60;

export function initPomodoro() {
  _bubble = document.createElement('button');
  _bubble.id = 'pomodoro-bubble';
  _bubble.className = 'pomodoro-bubble';
  _bubble.innerHTML = '🍅';
  _bubble.title = 'Pomodoro timer';
  _bubble.onclick = togglePanel;
  document.body.appendChild(_bubble);
}

function togglePanel() {
  let panel = document.getElementById('pomodoro-panel');
  if (panel) { panel.remove(); return; }
  panel = document.createElement('div');
  panel.id = 'pomodoro-panel';
  panel.className = 'pomodoro-panel';
  renderPanel(panel);
  document.body.appendChild(panel);
}

function renderPanel(panel) {
  const running = _state && !_state.paused;
  const phase = _state?.phase || 'work';
  const remaining = _state ? Math.max(0, _state.endsAt - Date.now()) : (phase === 'work' ? WORK*1000 : BREAK*1000);
  const m = Math.floor(remaining / 60000);
  const s = Math.floor((remaining % 60000) / 1000);

  panel.innerHTML = `
    <div class="pomo-head">🍅 Pomodoro <span class="muted">${phase === 'work' ? 'Werk' : 'Pauze'}</span></div>
    <div class="pomo-time">${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}</div>
    <div class="row">
      ${running
        ? `<button class="btn secondary" id="pomo-pause">Pauze</button>`
        : `<button class="btn" id="pomo-start">${_state ? 'Hervat' : 'Start ' + (phase === 'work' ? '25m' : '5m')}</button>`}
      <button class="btn danger" id="pomo-stop">Stop</button>
    </div>
    <div class="row" style="margin-top:6px">
      <button class="btn secondary" id="pomo-work">25m werk</button>
      <button class="btn secondary" id="pomo-break">5m pauze</button>
    </div>
  `;
  const startBtn = panel.querySelector('#pomo-start');
  if (startBtn) startBtn.onclick = () => { startTimer(phase); refresh(); };
  const pauseBtn = panel.querySelector('#pomo-pause');
  if (pauseBtn) pauseBtn.onclick = () => { pauseTimer(); refresh(); };
  panel.querySelector('#pomo-stop').onclick = () => { stopTimer(); refresh(); };
  panel.querySelector('#pomo-work').onclick = () => { _state = null; startTimer('work'); refresh(); };
  panel.querySelector('#pomo-break').onclick = () => { _state = null; startTimer('break'); refresh(); };
}

function refresh() {
  const panel = document.getElementById('pomodoro-panel');
  if (panel) renderPanel(panel);
}

function startTimer(phase) {
  const duration = phase === 'work' ? WORK : BREAK;
  if (_state && _state.paused) {
    _state.endsAt = Date.now() + _state.remaining;
    _state.paused = false;
  } else {
    _state = { phase, endsAt: Date.now() + duration * 1000, paused: false };
  }
  if (_bubble) _bubble.classList.add('running', phase);
  if (_interval) clearInterval(_interval);
  _interval = setInterval(() => {
    if (!_state || _state.paused) return;
    const left = _state.endsAt - Date.now();
    updateBubble(left);
    if (left <= 0) {
      const justFinished = _state.phase;
      stopTimer();
      toast(justFinished === 'work' ? '🍅 Werk-blok klaar! Pauze tijd.' : '☕ Pauze voorbij. Door!', { type: 'ok', duration: 6000 });
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Pomodoro', { body: justFinished === 'work' ? 'Werk-blok klaar' : 'Pauze voorbij' });
      }
      refresh();
    } else {
      refresh();
    }
  }, 1000);
  updateBubble(_state.endsAt - Date.now());
}

function pauseTimer() {
  if (!_state) return;
  _state.remaining = _state.endsAt - Date.now();
  _state.paused = true;
  if (_bubble) _bubble.classList.remove('running');
}

function stopTimer() {
  if (_interval) { clearInterval(_interval); _interval = null; }
  _state = null;
  if (_bubble) { _bubble.classList.remove('running', 'work', 'break'); _bubble.innerHTML = '🍅'; }
}

function updateBubble(ms) {
  if (!_bubble) return;
  const m = Math.floor(ms / 60000);
  _bubble.innerHTML = `<span>🍅</span><small>${m}m</small>`;
}
