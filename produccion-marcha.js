// ---------- Entry animation ----------
const liveAnimated = document.querySelectorAll(
  '.live-header, .live-stats, .live-current, .live-summary, .stat-card, .current-task-card'
);
requestAnimationFrame(() => {
  liveAnimated.forEach((el, i) => {
    el.style.setProperty('--delay', `${i * 55}ms`);
    el.classList.add('reveal');
  });
});

// ---------- Load configuration ----------
function loadConfig() {
  try {
    const stored = sessionStorage.getItem('sim_config');
    if (stored) return JSON.parse(stored);
  } catch (_) { /* ignore */ }
  // Defaults matching the static design
  return {
    processes: [{ name: 's', tasks: [{ name: 'q', durationMin: 2 }] }],
    totalProducts: 5,
    speedMultiplier: 10
  };
}

const cfg = loadConfig();
const SPEED   = cfg.speedMultiplier || 10;   // virtual seconds per real second
const TOTAL   = cfg.totalProducts   || 5;
const PROCS   = cfg.processes       || [];

// Build a flat task sequence (one full product cycle)
function buildSequence(processes) {
  const seq = [];
  processes.forEach((proc, pi) => {
    proc.tasks.forEach((task, ti) => {
      seq.push({
        processName:   proc.name,
        taskName:      task.name,
        durationSec:   task.durationMin * 60,
        processIndex:  pi,
        taskIndex:     ti,
        totalProcesses: processes.length,
        totalTasks:    proc.tasks.length
      });
    });
  });
  return seq;
}

const seq      = buildSequence(PROCS);
const cycleSec = seq.reduce((s, t) => s + t.durationSec, 0); // one product
const totalSec = cycleSec * TOTAL;

// ---------- Restore paused state ----------
let elapsed = 0;
try {
  const saved = JSON.parse(sessionStorage.getItem('sim_state') || '{}');
  if (typeof saved.elapsed === 'number') elapsed = saved.elapsed;
} catch (_) { /* ignore */ }
sessionStorage.removeItem('sim_state');

// ---------- DOM refs ----------
const elElapsed   = document.getElementById('stat-elapsed');
const elRemaining = document.getElementById('stat-remaining');
const elProducts  = document.getElementById('stat-products');
const elProgress  = document.getElementById('stat-progress');
const elTaskPct   = document.getElementById('task-pct');
const elTaskFill  = document.getElementById('task-fill');
const elCaption   = document.getElementById('timeline-caption');
const elSummaryPct  = document.getElementById('summary-pct');
const elSummaryFill = document.getElementById('summary-fill');
const elProcName  = document.querySelector('.current-task-copy h3');
const elTaskName  = document.querySelector('.current-task-copy p');
const elSteps     = document.querySelectorAll('.current-task-step span');
const elTaskEstimate = document.querySelector('.task-estimate');
const elTimelineName = document.querySelector('.timeline-name');
const elTimelineTaskName = document.querySelector('.timeline-task span:nth-child(2)');
const elTimelineTaskDur = document.querySelector('.timeline-task .muted');

// ---------- Helpers ----------
function fmt(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function resolveTask(elapsedSec) {
  const cyclePos = elapsedSec % cycleSec;
  let remaining = cyclePos;
  for (const t of seq) {
    if (remaining < t.durationSec) {
      return { task: t, taskElapsed: remaining };
    }
    remaining -= t.durationSec;
  }
  // At exact boundary — last task just finished
  return { task: seq[seq.length - 1], taskElapsed: seq[seq.length - 1].durationSec };
}

// ---------- Display update ----------
function updateDisplay() {
  const done = Math.min(TOTAL, Math.floor(elapsed / cycleSec));
  const overallPct = Math.min(100, Math.round((done / TOTAL) * 100));
  const remaining  = Math.max(0, totalSec - elapsed);
  const { task, taskElapsed } = resolveTask(elapsed);
  const taskPct = Math.min(100, Math.round((taskElapsed / task.durationSec) * 100));
  const currentProduct = Math.min(TOTAL, done + 1);

  elElapsed.textContent   = fmt(elapsed);
  elRemaining.textContent = fmt(remaining);
  elProducts.textContent  = `${done} / ${TOTAL}`;
  elProgress.textContent  = `${overallPct}%`;
  elTaskPct.textContent   = `${taskPct}%`;
  elTaskFill.style.width  = `${taskPct}%`;
  elCaption.textContent   = done < TOTAL
    ? `Produciendo ${currentProduct} de ${TOTAL}`
    : `¡Producción completada!`;
  elSummaryPct.textContent  = `${overallPct}%`;
  elSummaryFill.style.width = `${overallPct}%`;

  if (elProcName) elProcName.textContent = task.processName;
  if (elTaskName) elTaskName.textContent = task.taskName;
  if (elSteps[0]) elSteps[0].textContent = `Proceso ${task.processIndex + 1}/${task.totalProcesses}`;
  if (elSteps[1]) elSteps[1].textContent = `Tarea ${task.taskIndex + 1}/${task.totalTasks}`;
  if (elTaskEstimate) elTaskEstimate.textContent = `${Math.round(task.durationSec / 60)} minutos estimados`;
  if (elTimelineName) elTimelineName.textContent = task.processName;
  if (elTimelineTaskName) elTimelineTaskName.textContent = task.taskName;
  if (elTimelineTaskDur) elTimelineTaskDur.textContent = `· ${Math.round(task.durationSec / 60)} min`;
}

// ---------- Simulation loop ----------
let running = true;
let intervalId = null;

function tick() {
  elapsed += 1;
  updateDisplay();
  if (elapsed >= totalSec) {
    running = false;
    clearInterval(intervalId);
    sessionStorage.setItem('sim_state', JSON.stringify({ elapsed, completed: true }));
    window.location.href = 'produccion-completada.html';
  }
}

updateDisplay(); // render immediately before first tick

// Each real-world tick interval = 1000ms / SPEED (e.g. 10x → 100ms per virtual second)
intervalId = setInterval(tick, Math.round(1000 / SPEED));

// ---------- Controls ----------
function stopSim() {
  running = false;
  clearInterval(intervalId);
}

function startSim() {
  if (!running && elapsed < totalSec) {
    running = true;
    clearInterval(intervalId);
    intervalId = setInterval(tick, Math.round(1000 / SPEED));
  }
}

document.querySelector('.icon-control.pause')?.addEventListener('click', () => {
  stopSim();
  sessionStorage.setItem('sim_state', JSON.stringify({ elapsed, paused: true }));
  window.location.href = 'produccion-pausada.html';
});

// Stop button opens confirmation modal
const stopModal   = document.getElementById('stop-modal');
const stopCancel  = document.getElementById('stop-cancel');
const stopConfirm = document.getElementById('stop-confirm');

document.querySelector('.icon-control.stop')?.addEventListener('click', () => {
  // Pause the clock while the dialog is open
  if (running) { running = false; clearInterval(intervalId); }
  stopModal.removeAttribute('hidden');
  stopModal.focus();
});

stopCancel?.addEventListener('click', () => {
  stopModal.setAttribute('hidden', '');
  startSim();
});

stopConfirm?.addEventListener('click', () => {
  stopModal.setAttribute('hidden', '');
  sessionStorage.removeItem('sim_state');
  window.location.href = 'linea-configurada.html';
});

// Dismiss on backdrop click
stopModal?.addEventListener('click', (e) => {
  if (e.target === stopModal) stopCancel.click();
});

// Dismiss on Escape
document.querySelector('.back-config-btn')?.addEventListener('click', () => {
  stopSim();
  window.location.href = 'linea-configurada.html';
});

// Reiniciar modal — warn button
const restartModal   = document.getElementById('restart-modal');
const restartCancel  = document.getElementById('restart-cancel');
const restartConfirm = document.getElementById('restart-confirm');

document.querySelector('.icon-control.warn')?.addEventListener('click', () => {
  if (running) { running = false; clearInterval(intervalId); }
  restartModal.removeAttribute('hidden');
  restartModal.focus();
});

restartCancel?.addEventListener('click', () => {
  restartModal.setAttribute('hidden', '');
  startSim();
});

restartConfirm?.addEventListener('click', () => {
  restartModal.setAttribute('hidden', '');
  clearInterval(intervalId);
  elapsed = 0;
  sessionStorage.removeItem('sim_state');
  updateDisplay();
  running = false;
  startSim();
});

restartModal?.addEventListener('click', (e) => {
  if (e.target === restartModal) restartCancel.click();
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (stopModal && !stopModal.hasAttribute('hidden')) {
    stopCancel?.click();
    return;
  }
  if (restartModal && !restartModal.hasAttribute('hidden')) {
    restartCancel?.click();
  }
});
