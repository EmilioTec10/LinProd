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
    if (rows[0]) {
      rows[0].textContent = pph;
      rows[0].title = '1 ciclo de simulación ≈ 1 segundo real';
    }
    if (rows[1]) rows[1].textContent = state.efficiency_pct != null ? `${state.efficiency_pct}%` : '—';
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

  if (!document.getElementById('pb-scroll')) buildProductionBoard(state);
  updateProductionBoard(state);
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

// Hide large task progress card — superseded by production board
(function _hideTaskCard() {
  const card = document.querySelector('.current-task-card');
  if (card) card.style.display = 'none';
  const info = document.getElementById('sim-task-info');
  if (info) info.style.display = 'none';
})();

// Hide PROGRESO section from sidebar
(function _hideProgresoSection() {
  for (const h3 of document.querySelectorAll('.summary-group h3')) {
    if (h3.textContent.trim() === 'PROGRESO') {
      h3.closest('.summary-group').style.display = 'none';
      break;
    }
  }
})();

// ---------- Production board styles ----------
(function _injectBoardStyles() {
  if (document.getElementById('pb-style')) return;
  const s = document.createElement('style');
  s.id = 'pb-style';
  s.textContent = [
    '#pb-wrapper{margin:12px 0;min-width:0;width:100%}',
    '#pb-scroll{overflow-x:auto;white-space:nowrap;width:100%;padding-bottom:4px}',
    '.pb-columns{display:flex;align-items:stretch;gap:0;min-width:max-content}',
    '.pb-column{background:#fff;border:1px solid var(--border,#dee2e6);border-radius:10px;padding:10px 10px 12px;min-width:200px;max-width:200px;flex-shrink:0;display:flex;flex-direction:column}',
    '.pb-column.pb-collapsed{min-width:200px;max-width:200px;flex-shrink:0}',
    '.pb-column.pb-collapsed .pb-task-card{display:none}',
    '.pb-col-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;gap:6px}',
    '.pb-col-name{font-size:12px;font-weight:700;color:var(--text,#1d3557);text-transform:uppercase;letter-spacing:.04em;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.pb-col-summary{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;gap:6px}',
    '.pb-col-pct{font-size:11px;font-weight:600;color:var(--text,#1d3557);opacity:.7}',
    '.pb-col-toggle{font-size:10px;background:none;border:1px solid var(--border,#dee2e6);border-radius:4px;padding:2px 6px;cursor:pointer;color:var(--text,#1d3557);white-space:nowrap;line-height:1.4}',
    '.pb-badge{font-size:9px;font-weight:700;border-radius:4px;padding:2px 5px;text-transform:uppercase;letter-spacing:.04em;flex-shrink:0}',
    '.pb-badge--active{background:#dbeafe;color:#1d4ed8}',
    '.pb-badge--done{background:#dcfce7;color:#15803d}',
    '.pb-badge--waiting{background:#f1f5f9;color:#64748b}',
    '.pb-task-card{background:#f8f9fa;border-radius:8px;padding:8px;margin:4px 0}',
    '.pb-task-name{font-size:11px;font-weight:600;color:var(--text,#1d3557);margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.pb-task-label{font-size:9px;text-transform:uppercase;letter-spacing:.04em;color:#94a3b8;margin-bottom:3px;font-weight:600}',
    '.pb-chips{display:flex;flex-wrap:wrap;gap:4px;min-height:22px;align-items:center}',
    '.pb-chip{border-radius:20px;padding:2px 10px;font-size:12px;font-weight:600;white-space:nowrap}',
    '.pb-chip--active{background:var(--button,#1d3557);color:#fff}',
    '.pb-chip--queued{background:#fff;border:1.5px solid var(--button,#1d3557);color:var(--button,#1d3557)}',
    '.pb-empty{font-size:11px;color:#cbd5e1;font-style:italic}',
    '.pb-prog-track{height:4px;background:var(--border,#dee2e6);border-radius:2px;margin-top:6px;overflow:hidden}',
    '.pb-prog-fill{height:100%;background:var(--button,#1d3557);border-radius:2px;transition:width .3s}',
    '.pb-cycle-info{font-size:10px;color:var(--text,#1d3557);opacity:.6;margin-top:3px;line-height:1.3}',
    '.pb-arrow-col{display:flex;align-items:center;padding:0 6px;flex-shrink:0;color:var(--text,#1d3557);opacity:.4;font-size:20px}',
    '#pb-footer{margin-top:10px;display:flex;gap:16px;font-size:12px;color:var(--text,#1d3557);opacity:.7;flex-wrap:wrap}',
    '.pb-footer-stat strong{font-weight:700;opacity:1}',
    '#pb-finalizados{margin-top:8px;display:none}',
    '#pb-finalizados-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text,#1d3557);opacity:.5;margin-bottom:6px}',
    '#pb-finalizados-chips{display:flex;flex-wrap:wrap;gap:6px}',
    '.pb-fin-chip{background:#dcfce7;color:#15803d;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:600}',
  ].join('');
  document.head.appendChild(s);
})();

// ---------- Production board container ----------
(function _injectBoardContainer() {
  const liveCurrentEl = document.querySelector('.live-current') || document.querySelector('.paused-current');
  const timelineEl    = liveCurrentEl?.querySelector('.live-timeline');
  if (!timelineEl || document.getElementById('pb-wrapper')) return;

  const wrapper = document.createElement('div');
  wrapper.id = 'pb-wrapper';
  timelineEl.before(wrapper);
  timelineEl.style.display = 'none';
})();

// ---------- Build production board (once) ----------
const _pbFinalized = new Set();

function buildProductionBoard(state) {
  const wrapper = document.getElementById('pb-wrapper');
  if (!wrapper || wrapper.querySelector('#pb-scroll')) return;

  const processes = state.state.processes;

  const scroll = document.createElement('div');
  scroll.id = 'pb-scroll';
  const cols = document.createElement('div');
  cols.className = 'pb-columns';

  processes.forEach((proc, i) => {
    const col = document.createElement('div');
    col.className = 'pb-column pb-collapsed';
    col.id = `pb-col-${i}`;

    const hdr = document.createElement('div');
    hdr.className = 'pb-col-header';
    const nameEl = document.createElement('div');
    nameEl.className = 'pb-col-name';
    nameEl.title = proc.name;
    nameEl.textContent = proc.name;
    const badge = document.createElement('span');
    badge.className = 'pb-badge';
    badge.id = `pb-badge-${i}`;
    hdr.appendChild(nameEl);
    hdr.appendChild(badge);
    col.appendChild(hdr);

    const summary = document.createElement('div');
    summary.className = 'pb-col-summary';
    const pctSpan = document.createElement('span');
    pctSpan.className = 'pb-col-pct';
    pctSpan.id = `pb-pct-${i}`;
    pctSpan.textContent = '0%';
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'pb-col-toggle';
    toggleBtn.textContent = 'Ver tareas ∨';
    toggleBtn.addEventListener('click', () => {
      const collapsed = col.classList.toggle('pb-collapsed');
      toggleBtn.textContent = collapsed ? 'Ver tareas ∨' : 'Ocultar ∧';
    });
    summary.appendChild(pctSpan);
    summary.appendChild(toggleBtn);
    col.appendChild(summary);

    proc.tasks.forEach((task, j) => {
      const card = document.createElement('div');
      card.className = 'pb-task-card';
      card.id = `pb-task-${i}-${j}`;
      const nameDiv = document.createElement('div');
      nameDiv.className = 'pb-task-name';
      nameDiv.title = task.name;
      nameDiv.textContent = task.name;
      const inner = document.createElement('div');
      inner.className = 'pb-task-inner';
      card.appendChild(nameDiv);
      card.appendChild(inner);
      col.appendChild(card);
    });

    cols.appendChild(col);

    if (i < processes.length - 1) {
      const arrowCol = document.createElement('div');
      arrowCol.className = 'pb-arrow-col';
      arrowCol.textContent = '→';
      cols.appendChild(arrowCol);
    }
  });

  scroll.appendChild(cols);
  wrapper.appendChild(scroll);

  const finDiv = document.createElement('div');
  finDiv.id = 'pb-finalizados';
  const finLabel = document.createElement('div');
  finLabel.id = 'pb-finalizados-label';
  finLabel.textContent = 'Procesos Finalizados';
  const finChips = document.createElement('div');
  finChips.id = 'pb-finalizados-chips';
  finDiv.appendChild(finLabel);
  finDiv.appendChild(finChips);
  wrapper.appendChild(finDiv);

  const footer = document.createElement('div');
  footer.id = 'pb-footer';
  wrapper.appendChild(footer);

  const pbWrapper = document.getElementById('pb-wrapper');
  if (pbWrapper) {
    pbWrapper.style.minWidth = '0';
    pbWrapper.style.width = '100%';
    pbWrapper.style.overflow = 'hidden';
  }

  const pbScroll = document.getElementById('pb-scroll');
  if (pbScroll) {
    pbScroll.style.width = '100%';
    pbScroll.style.overflowX = 'auto';
    pbScroll.style.whiteSpace = 'nowrap';
    pbScroll.style.display = 'block';
  }

  const liveMain = document.querySelector('.live-main');
  if (liveMain) liveMain.style.overflow = 'hidden';

  const liveCurrent = document.querySelector('.live-current');
  if (liveCurrent) {
    liveCurrent.style.minWidth = '0';
    liveCurrent.style.overflow = 'hidden';
  }

  updateProductionBoard(state);
}

// ---------- Update production board (every tick) ----------
function updateProductionBoard(state) {
  if (!document.getElementById('pb-wrapper')) return;

  const processes = state.state.processes;

  processes.forEach((proc, i) => {
    // Completion detection: move finished processes to the Finalizados section
    const allDone = proc.tasks.length > 0 &&
      proc.tasks.every(t => !t.is_busy && (t.queue_length || 0) === 0) &&
      proc.tasks.some(t => (t.products_processed ?? 0) > 0);

    if (allDone && !_pbFinalized.has(i)) {
      _pbFinalized.add(i);
      const col = document.getElementById(`pb-col-${i}`);
      if (col) {
        const next = col.nextElementSibling;
        const prev = col.previousElementSibling;
        if (next && next.classList.contains('pb-arrow-col')) {
          next.remove();
        } else if (prev && prev.classList.contains('pb-arrow-col')) {
          prev.remove();
        }
        col.remove();
      }
      const chipsDiv = document.getElementById('pb-finalizados-chips');
      if (chipsDiv) {
        const chip = document.createElement('span');
        chip.className = 'pb-fin-chip';
        chip.textContent = proc.name;
        chipsDiv.appendChild(chip);
      }
      const finDiv = document.getElementById('pb-finalizados');
      if (finDiv) finDiv.style.display = 'block';
    }

    // Update progress % in collapsed header
    if (!_pbFinalized.has(i)) {
      const lastTask = proc.tasks[proc.tasks.length - 1];
      const processed = lastTask?.products_processed ?? 0;
      const pct = state.num_products > 0
        ? Math.round(processed / state.num_products * 100)
        : 0;
      const pctSpan = document.getElementById(`pb-pct-${i}`);
      if (pctSpan) pctSpan.textContent = `${pct}%`;
    }

    let inside = 0;
    proc.tasks.forEach(t => {
      if (t.is_busy) inside++;
      inside += t.queue_length || 0;
    });
    const lastTask  = proc.tasks[proc.tasks.length - 1];
    const completed = lastTask?.products_processed ?? 0;
    const status    = inside > 0 ? 'active' : completed > 0 ? 'done' : 'waiting';

    const badge = document.getElementById(`pb-badge-${i}`);
    if (badge) {
      badge.className = `pb-badge pb-badge--${status}`;
      badge.textContent = status === 'active' ? 'ACTIVO' : status === 'done' ? 'LISTO' : 'ESPERA';
    }

    proc.tasks.forEach((task, j) => {
      const card = document.getElementById(`pb-task-${i}-${j}`);
      if (!card) return;
      const inner = card.querySelector('.pb-task-inner');
      if (!inner) return;

      const pct = task.is_busy && task.cycles > 0
        ? Math.min(100, Math.round((task.cycles - task.cycles_remaining) / task.cycles * 100))
        : 0;

      const procChip = task.is_busy && task.current_product_id != null
        ? `<span class="pb-chip pb-chip--active"># ${task.current_product_id}</span>`
        : `<span class="pb-empty">—</span>`;

      const queueChips = (task.queue_ids && task.queue_ids.length > 0)
        ? task.queue_ids.map(id => `<span class="pb-chip pb-chip--queued"># ${id}</span>`).join('')
        : `<span class="pb-empty">vacío</span>`;

      const cycleX  = task.cycles - task.cycles_remaining + 1;
      const progBar = task.is_busy && task.current_product_id != null && task.cycles > 0
        ? `<div class="pb-prog-track"><div class="pb-prog-fill" style="width:${pct}%"></div></div>` +
          `<div class="pb-cycle-info">${task.cycles_remaining} ciclo(s) restante(s)</div>` +
          `<div class="pb-cycle-info">Ciclo ${cycleX} de ${task.cycles}</div>`
        : '';

      inner.innerHTML =
        `<div class="pb-task-label">Procesando</div>` +
        `<div class="pb-chips">${procChip}</div>` +
        `<div class="pb-task-label" style="margin-top:5px">Cola</div>` +
        `<div class="pb-chips">${queueChips}</div>` +
        progBar;
    });
  });

  const footer = document.getElementById('pb-footer');
  if (footer) {
    let inLine = 0;
    for (const proc of processes)
      for (const t of proc.tasks) {
        if (t.is_busy) inLine++;
        inLine += t.queue_length || 0;
      }
    footer.innerHTML =
      `<span class="pb-footer-stat">En línea: <strong>${inLine}</strong></span>` +
      `<span class="pb-footer-stat">Completados: <strong>${state.completed_count} / ${state.num_products}</strong></span>` +
      `<span class="pb-footer-stat">Sin inyectar: <strong>${state.num_products - (state.products_injected ?? 0)}</strong></span>`;
  }
}

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