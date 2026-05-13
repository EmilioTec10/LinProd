// ---------- Entry animation ----------
const pausedAnimated = document.querySelectorAll(
  '.live-header, .live-stats, .paused-current, .paused-summary, .stat-card, .paused-banner'
);
requestAnimationFrame(() => {
  pausedAnimated.forEach((el, i) => {
    el.style.setProperty('--delay', `${i * 55}ms`);
    el.classList.add('reveal');
  });
});

// ---------- Restore state from sessionStorage ----------
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

const TOTAL   = cfg.totalProducts || 5;
const PROCS   = cfg.processes     || [];

function buildSequence(processes) {
  const seq = [];
  processes.forEach((proc, pi) => {
    proc.tasks.forEach((task, ti) => {
      seq.push({
        processName:    proc.name,
        taskName:       task.name,
        durationSec:    task.durationMin * 60,
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
const elapsed  = typeof state.elapsed === 'number' ? state.elapsed : 0;

function fmt(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function resolveTask(elapsedSec) {
  const cyclePos = elapsedSec % cycleSec;
  let rem = cyclePos;
  for (const t of seq) {
    if (rem < t.durationSec) return { task: t, taskElapsed: rem };
    rem -= t.durationSec;
  }
  return { task: seq[seq.length - 1], taskElapsed: seq[seq.length - 1].durationSec };
}

// ---------- Populate dynamic values ----------
const done       = Math.min(TOTAL, Math.floor(elapsed / cycleSec));
const overallPct = Math.min(100, Math.round((done / TOTAL) * 100));
const remaining  = Math.max(0, totalSec - elapsed);
const { task, taskElapsed } = resolveTask(elapsed);
const taskPct    = Math.min(100, Math.round((taskElapsed / task.durationSec) * 100));

// Stat cards
const statValues = document.querySelectorAll('.stat-value');
if (statValues[0]) statValues[0].textContent = fmt(elapsed);
if (statValues[1]) statValues[1].textContent = fmt(remaining);
if (statValues[2]) statValues[2].textContent = `${done} / ${TOTAL}`;
if (statValues[3]) statValues[3].textContent = `${overallPct}%`;

// Task progress
const taskPctEl  = document.querySelector('.task-progress-head strong');
const taskFillEl = document.querySelector('.paused-current .progress-fill');
if (taskPctEl)  taskPctEl.textContent  = `${taskPct}%`;
if (taskFillEl) taskFillEl.style.width = `${taskPct}%`;

const pausedProcName = document.querySelector('.current-task-copy h3');
const pausedTaskName = document.querySelector('.current-task-copy p');
const pausedSteps = document.querySelectorAll('.current-task-step span');
const pausedEstimate = document.querySelector('.task-estimate');
if (pausedProcName) pausedProcName.textContent = task.processName;
if (pausedTaskName) pausedTaskName.textContent = task.taskName;
if (pausedSteps[0]) pausedSteps[0].textContent = `Proceso ${task.processIndex + 1}/${task.totalProcesses}`;
if (pausedSteps[1]) pausedSteps[1].textContent = `Tarea ${task.taskIndex + 1}/${task.totalTasks}`;
if (pausedEstimate) pausedEstimate.textContent = `${Math.round(task.durationSec / 60)} minutos estimados`;

// Timeline caption
const caption = document.querySelector('.timeline-caption');
if (caption) caption.textContent = `Produciendo ${Math.min(TOTAL, done + 1)} de ${TOTAL}`;

const timelineName = document.querySelector('.timeline-name');
const timelineTaskName = document.querySelector('.timeline-task span:nth-child(2)');
const timelineTaskDur = document.querySelector('.timeline-task .muted');
if (timelineName) timelineName.textContent = task.processName;
if (timelineTaskName) timelineTaskName.textContent = task.taskName;
if (timelineTaskDur) timelineTaskDur.textContent = `· ${Math.round(task.durationSec / 60)} min`;

// Summary PROGRESO mini bar
const summaryPct  = document.querySelector('.paused-summary .muted-strong');
const summaryFill = document.querySelector('.paused-summary .mini-fill');
if (summaryPct)  summaryPct.textContent  = `${overallPct}%`;
if (summaryFill) summaryFill.style.width = `${overallPct}%`;

const summaryProcName = document.querySelector('.paused-summary .summary-row.compact span');
if (summaryProcName) summaryProcName.textContent = task.processName;

// ---------- Controls ----------
document.querySelector('.back-config-btn')?.addEventListener('click', () => {
  window.location.href = 'linea-configurada.html';
});

// Resume: keep sim_state so produccion-marcha.js can restore elapsed
document.querySelector('.icon-control.pause.active')?.addEventListener('click', () => {
  // sim_state already has { elapsed } — marcha will read and continue from there
  window.location.href = 'produccion-marcha.html';
});

document.querySelector('.download-btn')?.addEventListener('click', () => {
  window.alert('Resumen descargado.');
});
