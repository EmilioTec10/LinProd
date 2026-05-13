// ---------- Entry animation ----------
const completedAnimated = document.querySelectorAll(
  '.live-header, .live-stats, .live-current, .completed-summary, .stat-card, .completed-banner'
);
requestAnimationFrame(() => {
  completedAnimated.forEach((el, i) => {
    el.style.setProperty('--delay', `${i * 55}ms`);
    el.classList.add('reveal');
  });
});

// ---------- Load config & state ----------
function loadConfig() {
  try {
    const s = sessionStorage.getItem('sim_config');
    if (s) return JSON.parse(s);
  } catch (_) { /* ignore */ }
  return {
    processes: [{ name: 's', tasks: [{ name: 'q', durationMin: 2 }] }],
    totalProducts: 5,
    speedMultiplier: 10
  };
}

function loadState() {
  try {
    const s = sessionStorage.getItem('sim_state');
    if (s) return JSON.parse(s);
  } catch (_) { /* ignore */ }
  return { elapsed: 0 };
}

const cfg   = loadConfig();
const state = loadState();

const TOTAL = cfg.totalProducts || 5;
const PROCS = cfg.processes     || [];

// Build flat task sequence
function buildSequence(processes) {
  const seq = [];
  processes.forEach((proc, pi) => {
    proc.tasks.forEach((task, ti) => {
      seq.push({
        processName:    proc.name,
        taskName:       task.name,
        durationSec:    task.durationMin * 60,
        durationMin:    task.durationMin,
        processIndex:   pi,
        taskIndex:      ti,
        totalProcesses: processes.length,
        totalTasks:     proc.tasks.length
      });
    });
  });
  return seq;
}

const seq      = buildSequence(PROCS);
const cycleSec = seq.reduce((s, t) => s + t.durationSec, 0);
const totalSec = cycleSec * TOTAL;
const elapsed  = typeof state.elapsed === 'number' ? Math.max(state.elapsed, totalSec) : totalSec;

function fmt(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ---------- Derived metrics ----------
const totalTasks    = seq.length;
const totalProcs    = PROCS.length;
const timePerProd   = cycleSec;
const pph           = cycleSec > 0 ? (3600 / cycleSec).toFixed(1) : '—';
const firstProduct  = fmt(cycleSec);                   // first product completed at end of first cycle
const lastProduct   = fmt(totalSec);                   // last product at simulation end
const avgTime       = fmt(cycleSec);                   // average = cycle time (all cycles identical)
const totalTime     = fmt(elapsed);

// Find bottleneck process (longest sum of task durations)
const bottleneck = PROCS.reduce((best, proc) => {
  const dur = proc.tasks.reduce((s, t) => s + t.durationMin * 60, 0);
  return dur > best.dur ? { name: proc.name, dur } : best;
}, { name: '—', dur: 0 });

// Find longest individual task
const longestTask = seq.reduce((best, t) => {
  return t.durationSec > best.durationSec ? t : best;
}, seq[0] || { taskName: '—', processName: '—', durationSec: 0, durationMin: 0 });

// ---------- Populate stats ----------
document.getElementById('stat-elapsed').textContent   = fmt(elapsed);
document.getElementById('stat-remaining').textContent = '0:00';
document.getElementById('stat-products').textContent  = `${TOTAL} / ${TOTAL}`;
document.getElementById('stat-progress').textContent  = '100%';

// ---------- Completion subtitle ----------
const subtitleEl = document.getElementById('completed-subtitle');
if (subtitleEl) subtitleEl.textContent = `${TOTAL} producto${TOTAL !== 1 ? 's' : ''} finalizado${TOTAL !== 1 ? 's' : ''}`;

// ---------- Last process/task row ----------
const lastTask = seq[seq.length - 1];
if (lastTask) {
  const procIdx = document.getElementById('completed-proc-index');
  const procName = document.getElementById('completed-proc-name');
  const taskName = document.getElementById('completed-task-name');
  const taskDur  = document.getElementById('completed-task-dur');
  if (procIdx)  procIdx.textContent  = lastTask.processIndex + 1;
  if (procName) procName.textContent = lastTask.processName;
  if (taskName) taskName.textContent = lastTask.taskName;
  if (taskDur)  taskDur.textContent  = `· ${lastTask.durationMin} min`;
}

// ---------- Summary sidebar ----------
document.getElementById('cfg-processes').textContent = totalProcs;
document.getElementById('cfg-tasks').textContent     = totalTasks;
document.getElementById('cfg-time-per').textContent  = fmt(timePerProd);
document.getElementById('perf-pph').textContent      = pph;
// Eficiencia stays 100%

document.getElementById('met-first').textContent    = firstProduct;
document.getElementById('met-last').textContent     = lastProduct;
document.getElementById('met-avg').textContent      = avgTime;
document.getElementById('met-total').textContent    = totalTime;

document.getElementById('met-bottleneck-name').textContent = bottleneck.name;
document.getElementById('met-bottleneck-time').textContent = fmt(bottleneck.dur);
document.getElementById('met-longest-task').textContent    = longestTask?.taskName || '—';
document.getElementById('met-longest-task-sub').textContent =
  longestTask ? `${longestTask.processName} • ${fmt(longestTask.durationSec)}` : '—';

const summaryProcName = document.getElementById('summary-process-name');
if (summaryProcName && PROCS[0]) summaryProcName.textContent = PROCS[0].name;

// ---------- Controls ----------
document.querySelector('.back-config-btn')?.addEventListener('click', () => {
  sessionStorage.removeItem('sim_state');
  window.location.href = 'linea-configurada.html';
});

document.querySelector('.download-btn')?.addEventListener('click', () => {
  window.alert('Resumen descargado.');
});

// Reiniciar modal — warn button
const restartModal   = document.getElementById('restart-modal');
const restartCancel  = document.getElementById('restart-cancel');
const restartConfirm = document.getElementById('restart-confirm');

document.querySelector('.icon-control.warn')?.addEventListener('click', () => {
  restartModal?.removeAttribute('hidden');
});

restartCancel?.addEventListener('click', () => {
  restartModal.setAttribute('hidden', '');
});

restartConfirm?.addEventListener('click', () => {
  restartModal.setAttribute('hidden', '');
  sessionStorage.removeItem('sim_state');
  window.location.href = 'produccion-marcha.html';
});

restartModal?.addEventListener('click', (e) => {
  if (e.target === restartModal) restartCancel?.click();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && restartModal && !restartModal.hasAttribute('hidden')) {
    restartCancel?.click();
  }
});
