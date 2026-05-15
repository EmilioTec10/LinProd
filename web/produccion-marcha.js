// ---------- SVG icons ----------
function _svgUri(s) { return 'data:image/svg+xml,' + encodeURIComponent(s); }

const _SVG = {
  FACTORY:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1d3557" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>`,
  CLOCK:      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1d3557" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  HOURGLASS:  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1d3557" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 2h14"/><path d="M5 22h14"/><path d="M17 2v4l-5 4 5 4v4"/><path d="M7 2v4l5 4-5 4v4"/></svg>`,
  BOX:        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1d3557" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>`,
  BARCHART:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1d3557" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  PAUSE:      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
  STOP:       `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`,
  RESTART:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
};

function _injectIcons() {
  document.querySelectorAll('.live-logo, .current-task-logo')
    .forEach(img => { img.src = _svgUri(_SVG.FACTORY); });

  document.querySelectorAll('.stat-card').forEach(card => {
    const label = card.querySelector('.stat-label')?.textContent?.trim() || '';
    const icon  = card.querySelector('.stat-icon');
    if (!icon) return;
    if      (label === 'Tiempo Transcurrido') icon.src = _svgUri(_SVG.CLOCK);
    else if (label === 'Tiempo Restante')     icon.src = _svgUri(_SVG.HOURGLASS);
    else if (label === 'Productos')           icon.src = _svgUri(_SVG.BOX);
    else if (label === 'Progreso')            icon.src = _svgUri(_SVG.BARCHART);
  });

  const pauseImg = document.querySelector('.icon-control.pause:not(.active) img');
  const stopImgs = document.querySelectorAll('.icon-control.stop img');
  const warnImgs = document.querySelectorAll('.icon-control.warn img');
  if (pauseImg) pauseImg.src = _svgUri(_SVG.PAUSE);
  stopImgs.forEach(img => { img.src = _svgUri(_SVG.STOP); });
  warnImgs.forEach(img => { img.src = _svgUri(_SVG.RESTART); });
}
_injectIcons();

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

// Ticks per real second. 1 = 1000ms interval (real-time), 2 = 500ms, 5 = 200ms, 10 = 100ms.
let SPEED = Number(sessionStorage.getItem('sim_speed')) || 1;

function fmt(cycles) {
  if (cycles == null || isNaN(cycles)) return '—';
  const m = Math.floor(cycles / 60);
  const s = cycles % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function findActiveTask(state) {
  for (const proc of state.state.processes) {
    for (const task of proc.tasks) {
      if (task.is_busy) return { proc, task };
    }
  }
  if (state.state.processes.length > 0) {
    const proc = state.state.processes[0];
    if (proc.tasks.length > 0) return { proc, task: proc.tasks[0] };
  }
  return null;
}

function updateDisplay(state) {
  const totalCyclesPerProduct = state.state.processes.reduce(
    (sum, p) => sum + p.tasks.reduce((s, t) => s + t.cycles, 0), 0
  );
  const taskCount    = state.state.processes.reduce((s, p) => s + p.tasks.length, 0);
  const expectedTotal = totalCyclesPerProduct > 0
    ? totalCyclesPerProduct + (state.num_products - 1)
    : 0;
  const done       = state.completed_count;
  const overallPct = state.num_products > 0
    ? Math.min(100, Math.round((done / state.num_products) * 100))
    : 0;
  const remaining  = Math.max(0, expectedTotal - state.current_cycle);

  document.getElementById('stat-elapsed').textContent   = fmt(state.current_cycle);
  document.getElementById('stat-remaining').textContent = fmt(remaining);
  document.getElementById('stat-products').textContent  = `${done} / ${state.num_products}`;
  document.getElementById('stat-progress').textContent  = `${overallPct}%`;

  const caption = document.getElementById('timeline-caption');
  if (caption) {
    caption.textContent = done < state.num_products
      ? `Produciendo ${Math.min(state.num_products, done + 1)} de ${state.num_products}`
      : '¡Producción completada!';
  }

  document.getElementById('summary-pct').textContent  = `${overallPct}%`;
  document.getElementById('summary-fill').style.width = `${overallPct}%`;

  const active = findActiveTask(state);
  if (active) {
    const { proc, task } = active;
    const taskPct = task.cycles > 0
      ? Math.min(100, Math.round((task.cycles - task.cycles_remaining) / task.cycles * 100))
      : 0;

    document.getElementById('task-pct').textContent  = `${taskPct}%`;
    document.getElementById('task-fill').style.width = `${taskPct}%`;

    const procNameEl = document.querySelector('.current-task-copy h3');
    const taskNameEl = document.querySelector('.current-task-copy p');
    const steps      = document.querySelectorAll('.current-task-step span');
    const estimate   = document.querySelector('.task-estimate');
    const tlName     = document.querySelector('.timeline-name');
    const tlTask     = document.querySelector('.timeline-task span:nth-child(2)');
    const tlDur      = document.querySelector('.timeline-task .muted');
    const sumProc    = document.getElementById('summary-process-name');

    if (procNameEl) procNameEl.textContent = proc.name;
    if (taskNameEl) taskNameEl.textContent = task.name;
    if (steps[0])   steps[0].textContent   = `Proceso ${proc.index + 1}/${state.state.processes.length}`;
    if (steps[1])   steps[1].textContent   = `Tarea ${task.index + 1}/${proc.tasks.length}`;
    if (estimate)   estimate.textContent   = `${task.cycles_remaining} ciclo(s) restante(s)`;
    if (tlName)     tlName.textContent     = proc.name;
    if (tlTask)     tlTask.textContent     = task.name;
    if (tlDur)      tlDur.textContent      = `· ${task.cycles_remaining} ciclos`;
    if (sumProc)    sumProc.textContent    = proc.name;

    const elCurProd = document.getElementById('sim-current-product');
    const elQueue   = document.getElementById('sim-queue');
    const elTaskCyc = document.getElementById('sim-task-cycle');
    if (elCurProd) elCurProd.textContent = task.current_product_id != null ? `#${task.current_product_id}` : '—';
    if (elQueue)   elQueue.textContent   = task.queue_length ?? '—';
    if (elTaskCyc) elTaskCyc.textContent = task.cycles > 0
      ? `${task.cycles - task.cycles_remaining + 1} de ${task.cycles}` : '—';
  }

  const procStatsDiv = document.getElementById('sim-proc-stats');
  if (procStatsDiv) {
    procStatsDiv.innerHTML = '';
    state.state.processes.forEach((proc) => {
      const processed = proc.tasks[0]?.products_processed ?? 0;
      const row = document.createElement('div');
      row.className = 'summary-row';
      row.style.fontSize = '12px';
      row.innerHTML = `<span>${proc.index + 1}. ${proc.name}</span><strong>${processed} procesado(s)</strong>`;
      procStatsDiv.appendChild(row);
    });
  }

  // CONFIGURACIÓN / RENDIMIENTO summary (static config values, kept in sync)
  const summaryGroups = document.querySelectorAll('.summary-group');
  if (summaryGroups[0]) {
    const rows = summaryGroups[0].querySelectorAll('.summary-row strong');
    if (rows[0]) rows[0].textContent = state.state.processes.length;
    if (rows[1]) rows[1].textContent = taskCount;
    if (rows[2]) rows[2].textContent = fmt(totalCyclesPerProduct);
  }
  if (summaryGroups[1]) {
    const rows = summaryGroups[1].querySelectorAll('.summary-row strong');
    const pph  = totalCyclesPerProduct > 0 ? (3600 / totalCyclesPerProduct).toFixed(1) : '—';
    if (rows[0]) rows[0].textContent = pph;
  }

  // EN TIEMPO REAL section
  const elLiveCompleted  = document.getElementById('live-completed');
  const elLiveQueue      = document.getElementById('live-queue-total');
  const elLiveCycles     = document.getElementById('live-cycles');
  const elLiveBottleneck = document.getElementById('live-bottleneck');

  if (elLiveCompleted) elLiveCompleted.textContent = `${done} / ${state.num_products}`;
  if (elLiveCycles)    elLiveCycles.textContent    = state.current_cycle;

  if (elLiveQueue || elLiveBottleneck) {
    let totalQueue = 0;
    let maxQ = -1, maxName = '—';
    for (const proc of state.state.processes) {
      for (const task of proc.tasks) {
        const q = task.queue_length || 0;
        totalQueue += q;
        if (q > maxQ) { maxQ = q; maxName = task.name; }
      }
    }
    if (elLiveQueue)      elLiveQueue.textContent      = totalQueue;
    if (elLiveBottleneck) elLiveBottleneck.textContent = maxQ > 0 ? maxName : '—';
  }
}

// ---------- Speed control (injected into .live-actions) ----------
(function injectSpeedControl() {
  const actions = document.querySelector('.live-actions');
  if (!actions) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'speed-control';
  wrapper.style.cssText = 'display:flex;align-items:center;gap:4px;margin-right:8px;';

  const label = document.createElement('span');
  label.textContent = 'Vel:';
  label.style.cssText = 'font-size:11px;opacity:0.6;white-space:nowrap;';
  wrapper.appendChild(label);

  [1, 2, 5, 10].forEach(v => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = `${v}x`;
    btn.dataset.speed = v;
    btn.style.cssText =
      'padding:2px 7px;font-size:11px;border-radius:4px;border:1px solid rgba(255,255,255,0.25);' +
      'background:transparent;cursor:pointer;color:inherit;transition:background 0.15s;';
    if (v === SPEED) btn.style.background = 'rgba(255,255,255,0.18)';
    btn.addEventListener('click', () => {
      SPEED = v;
      sessionStorage.setItem('sim_speed', String(v));
      wrapper.querySelectorAll('button').forEach(b => {
        b.style.background = Number(b.dataset.speed) === v
          ? 'rgba(255,255,255,0.18)' : 'transparent';
      });
      stopInterval();
      startInterval();
    });
    wrapper.appendChild(btn);
  });

  actions.insertBefore(wrapper, actions.firstChild);
})();

// ---------- Inject extra task info blocks ----------
(function _injectSimInfoBlocks() {
  const liveCurrentEl = document.querySelector('.live-current');
  const taskCardEl    = liveCurrentEl?.querySelector('.current-task-card');
  const timelineEl    = liveCurrentEl?.querySelector('.live-timeline');
  if (!taskCardEl || !timelineEl) return;

  const infoDiv = document.createElement('div');
  infoDiv.id = 'sim-task-info';
  infoDiv.style.cssText = 'margin:12px 0;display:grid;grid-template-columns:1fr 1fr;gap:8px;';

  function _makeRow(labelText, id) {
    const row = document.createElement('div');
    row.className = 'summary-row';
    row.style.cssText = 'background:rgba(29,53,87,0.04);border-radius:8px;padding:8px 12px;margin-bottom:0;';
    row.innerHTML = `<span>${labelText}</span><strong id="${id}">—</strong>`;
    return row;
  }

  infoDiv.appendChild(_makeRow('Producto actual', 'sim-current-product'));
  infoDiv.appendChild(_makeRow('En cola', 'sim-queue'));

  const fullRow = document.createElement('div');
  fullRow.style.gridColumn = '1 / -1';
  fullRow.appendChild(_makeRow('Ciclo en tarea', 'sim-task-cycle'));
  infoDiv.appendChild(fullRow);

  liveCurrentEl.insertBefore(infoDiv, timelineEl);

  const procStatsDiv = document.createElement('div');
  procStatsDiv.id = 'sim-proc-stats';
  procStatsDiv.style.marginTop = '12px';
  timelineEl.after(procStatsDiv);
})();

// ---------- Inject live EN TIEMPO REAL sidebar section ----------
(function _injectLiveSummaryExtra() {
  const liveSummary = document.querySelector('.live-summary');
  if (!liveSummary || document.getElementById('live-extra-group')) return;

  const groups     = liveSummary.querySelectorAll('.summary-group');
  const progresoEl = groups[groups.length - 1];

  const section = document.createElement('section');
  section.className = 'summary-group divider';
  section.id = 'live-extra-group';
  section.innerHTML = `
    <h3>EN TIEMPO REAL</h3>
    <div class="summary-row"><span>Completados</span><strong id="live-completed">0 / 0</strong></div>
    <div class="summary-row"><span>En cola total</span><strong id="live-queue-total">0</strong></div>
    <div class="summary-row"><span>Ciclos totales</span><strong id="live-cycles">0</strong></div>
    <div class="summary-row"><span>Cuello actual</span><strong id="live-bottleneck">—</strong></div>`;
  liveSummary.insertBefore(section, progresoEl);
})();

// ---------- Simulation loop ----------
let intervalId = null;
let ticking    = false;

function stopInterval() {
  clearInterval(intervalId);
  intervalId = null;
}

function startInterval() {
  if (intervalId !== null) return;
  intervalId = setInterval(tick, Math.round(1000 / SPEED));
}

async function tick() {
  if (ticking) return;
  ticking = true;
  try {
    const res  = await fetch('/api/simulation/tick', { method: 'POST' });
    const data = await res.json();
    updateDisplay(data);
    if (data.is_complete) {
      stopInterval();
      window.location.href = 'produccion-completada.html';
    }
  } catch (err) {
    console.error('Tick error:', err);
  } finally {
    ticking = false;
  }
}

// Load initial state then start
(async () => {
  try {
    const res  = await fetch('/api/simulation/state');
    const data = await res.json();
    updateDisplay(data);
    if (data.is_complete) {
      window.location.href = 'produccion-completada.html';
    } else {
      startInterval();
    }
  } catch (err) {
    console.error('Initial state error:', err);
    startInterval();
  }
})();

// ---------- Controls ----------
document.querySelector('.icon-control.pause')?.addEventListener('click', async () => {
  stopInterval();
  try { await fetch('/api/simulation/pause', { method: 'POST' }); } catch (_) {}
  window.location.href = 'produccion-pausada.html';
});

const stopModal   = document.getElementById('stop-modal');
const stopCancel  = document.getElementById('stop-cancel');
const stopConfirm = document.getElementById('stop-confirm');

document.querySelector('.icon-control.stop')?.addEventListener('click', () => {
  stopInterval();
  stopModal.removeAttribute('hidden');
  stopModal.focus();
});

stopCancel?.addEventListener('click', () => {
  stopModal.setAttribute('hidden', '');
  startInterval();
});

stopConfirm?.addEventListener('click', () => {
  stopModal.setAttribute('hidden', '');
  window.location.href = 'linea-configurada.html';
});

stopModal?.addEventListener('click', (e) => {
  if (e.target === stopModal) stopCancel.click();
});

document.querySelector('.back-config-btn')?.addEventListener('click', () => {
  stopInterval();
  window.location.href = 'linea-configurada.html';
});

const restartModal   = document.getElementById('restart-modal');
const restartCancel  = document.getElementById('restart-cancel');
const restartConfirm = document.getElementById('restart-confirm');

document.querySelector('.icon-control.warn')?.addEventListener('click', () => {
  stopInterval();
  restartModal.removeAttribute('hidden');
  restartModal.focus();
});

restartCancel?.addEventListener('click', () => {
  restartModal.setAttribute('hidden', '');
  startInterval();
});

restartConfirm?.addEventListener('click', async () => {
  restartModal.setAttribute('hidden', '');
  try {
    await fetch('/api/simulation/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const res  = await fetch('/api/simulation/state');
    const data = await res.json();
    updateDisplay(data);
  } catch (_) {}
  startInterval();
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
