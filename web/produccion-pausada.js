// ---------- SVG icons ----------
function _svgUri(s) { return 'data:image/svg+xml,' + encodeURIComponent(s); }

const _SVG = {
  FACTORY:     `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1d3557" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>`,
  CLOCK:       `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1d3557" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  HOURGLASS:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1d3557" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 2h14"/><path d="M5 22h14"/><path d="M17 2v4l-5 4 5 4v4"/><path d="M7 2v4l5 4-5 4v4"/></svg>`,
  BOX:         `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1d3557" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>`,
  BARCHART:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1d3557" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  PLAY:        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  STOP:        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`,
  RESTART:     `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
  DOWNLOAD:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  PAUSE_CIRCLE:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#698796" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="10" y1="15" x2="10" y2="9"/><line x1="14" y1="15" x2="14" y2="9"/></svg>`,
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

  const resumeImg = document.querySelector('.icon-control.pause.active img');
  const stopImgs  = document.querySelectorAll('.icon-control.stop img');
  const warnImgs  = document.querySelectorAll('.icon-control.warn img');
  if (resumeImg) resumeImg.src = _svgUri(_SVG.PLAY);
  stopImgs.forEach(img => { img.src = _svgUri(_SVG.STOP); });
  warnImgs.forEach(img => { img.src = _svgUri(_SVG.RESTART); });

  const dlImg = document.querySelector('.download-btn img, .download-btn .add-process-icon');
  if (dlImg) dlImg.src = _svgUri(_SVG.DOWNLOAD);

  const pausedBannerImg = document.querySelector('.paused-banner img');
  if (pausedBannerImg) pausedBannerImg.src = _svgUri(_SVG.PAUSE_CIRCLE);
}
_injectIcons();

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

  const snapshotDiv = document.createElement('div');
  snapshotDiv.id = 'task-snapshot';
  snapshotDiv.style.marginTop = '16px';
  procStatsDiv.after(snapshotDiv);
})();

// Hide large task progress card — superseded by production board
(function _hideTaskCard() {
  const card = document.querySelector('.current-task-card');
  if (card) card.style.display = 'none';
  const info = document.getElementById('sim-task-info');
  if (info) info.style.display = 'none';
})();

// Change 3 — Hide PROGRESO section from sidebar
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

// ---------- Inject EN TIEMPO REAL sidebar section ----------
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

// Change 5 — Hide EN TIEMPO REAL section from sidebar (shown in main area via board)
(function _hideEnTiempoRealSidebar() {
  const byId = document.getElementById('live-extra-group');
  if (byId) { byId.style.display = 'none'; return; }
  for (const h3 of document.querySelectorAll('.summary-group h3')) {
    if (h3.textContent.trim() === 'EN TIEMPO REAL') {
      h3.closest('.summary-group').style.display = 'none';
      break;
    }
  }
})();

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

function _downloadReport(report, state, isPartial) {
  const cfg      = report.config      || {};
  const perf     = report.performance || {};
  const metrics  = report.metrics     || {};
  const products = report.products    || [];
  const now      = new Date().toLocaleString('es-MX');

  const partialBanner = isPartial
    ? `<div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:12px 16px;margin-bottom:24px;color:#856404;">
         &#9888; Reporte parcial — producción pausada en ciclo ${state.current_cycle}
       </div>`
    : '';

  const metRows = Object.keys(metrics).length > 0 ? `
    <tr><td>Primer producto</td><td>${fmt(metrics.first_completion_cycle)}</td></tr>
    <tr><td>Último producto</td><td>${fmt(metrics.last_completion_cycle)}</td></tr>
    <tr><td>Tiempo promedio</td><td>${fmt(Math.round(metrics.avg_duration_cycles))}</td></tr>
    <tr><td>Tiempo total</td><td>${fmt(metrics.total_cycles)}</td></tr>
    <tr><td>Tiempo promedio de espera</td><td>${fmt(Math.round(metrics.avg_wait_time ?? 0))}</td></tr>
    <tr><td>Mayor congestionamiento</td><td>${metrics.bottleneck_process} → ${metrics.bottleneck_task} (${fmt(metrics.bottleneck_wait_cycles)})</td></tr>
    <tr><td>Tarea más larga</td><td>${metrics.longest_task_name} — ${metrics.longest_task_process} (${fmt(metrics.longest_task_cycles)})</td></tr>
  ` : '<tr><td colspan="2">Sin métricas disponibles</td></tr>';

  const taskStatRows = (metrics.per_task_stats ?? []).map(ts => `
    <tr>
      <td>${ts.process_name}</td>
      <td>${ts.task_name}</td>
      <td>${ts.process_time}</td>
      <td>${ts.products_processed}</td>
      <td>${ts.utilization_pct}%</td>
      <td>${fmt(Math.round(ts.avg_wait_cycles))}</td>
    </tr>`).join('');

  const prodRows = products.map(p => `
    <tr>
      <td>${p.id}</td>
      <td>${p.status || '—'}</td>
      <td>${fmt(p.entry_cycle)}</td>
      <td>${p.exit_cycle != null ? fmt(p.exit_cycle) : '—'}</td>
      <td>${p.duration != null ? fmt(p.duration) : '—'}</td>
      <td>${p.total_wait_time != null ? fmt(p.total_wait_time) : '—'}</td>
    </tr>`).join('');

  const procRows = state.state.processes.map(proc => {
    const taskNames = proc.tasks.map(t => t.name).join(', ');
    const processed = proc.tasks[0]?.products_processed ?? '—';
    const totalWait = proc.tasks.reduce((s, t) => s + (t.total_wait_accumulated || 0), 0);
    return `<tr>
      <td>${proc.index + 1}</td>
      <td>${proc.name}</td>
      <td>${taskNames}</td>
      <td>${processed}</td>
      <td>${fmt(totalWait)}</td>
    </tr>`;
  }).join('');

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Reporte de Producción — ${now}</title>
<style>
  body{font-family:system-ui,sans-serif;margin:0;padding:32px;color:#1d3557;background:#f8f9fa;}
  h1{font-size:1.6rem;margin-bottom:4px;}
  .subtitle{color:#6c757d;margin-bottom:24px;}
  h2{font-size:1.1rem;margin:24px 0 8px;border-bottom:2px solid #1d3557;padding-bottom:4px;}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:24px;}
  .card{background:#fff;border-radius:10px;padding:16px;box-shadow:0 1px 4px rgba(0,0,0,.08);}
  .card p{margin:0;font-size:11px;color:#6c757d;text-transform:uppercase;}
  .card strong{font-size:1.4rem;display:block;margin-top:4px;}
  table{width:100%;border-collapse:collapse;margin-bottom:24px;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);}
  th{background:#1d3557;color:#fff;padding:10px 14px;text-align:left;font-size:12px;}
  td{padding:9px 14px;border-bottom:1px solid #e9ecef;font-size:13px;}
  tr:last-child td{border-bottom:none;}
  tr:nth-child(even) td{background:#f8f9fa;}
</style>
</head>
<body>
<h1>Reporte de Producción</h1>
<p class="subtitle">Generado el ${now}${isPartial ? ' · Producción pausada' : ' · Producción completada'}</p>
${partialBanner}
<h2>Configuración</h2>
<div class="grid">
  <div class="card"><p>Procesos</p><strong>${cfg.process_count ?? '—'}</strong></div>
  <div class="card"><p>Tareas</p><strong>${cfg.task_count ?? '—'}</strong></div>
  <div class="card"><p>Tiempo / producto</p><strong>${fmt(cfg.total_cycles_per_product)}</strong></div>
  <div class="card"><p>Productos</p><strong>${report.num_products ?? '—'}</strong></div>
</div>
<h2>Rendimiento</h2>
<div class="grid">
  <div class="card"><p>Productos / hora</p><strong>${perf.products_per_hour ?? '—'}</strong></div>
  <div class="card"><p>Eficiencia</p><strong>${perf.efficiency_pct ?? '—'}%</strong></div>
</div>
<h2>Métricas</h2>
<table><thead><tr><th>Indicador</th><th>Valor</th></tr></thead><tbody>${metRows}</tbody></table>
<h2>Productos</h2>
<table><thead><tr><th>ID</th><th>Estado</th><th>Entrada</th><th>Salida</th><th>Duración</th><th>Espera</th></tr></thead><tbody>${prodRows || '<tr><td colspan="6">Sin datos</td></tr>'}</tbody></table>
<h2>Por Proceso</h2>
<table><thead><tr><th>#</th><th>Proceso</th><th>Tareas</th><th>Procesados</th><th>Espera acum.</th></tr></thead><tbody>${procRows || '<tr><td colspan="5">Sin datos</td></tr>'}</tbody></table>
<h2>Por Tarea (Utilización)</h2>
<table><thead><tr><th>Proceso</th><th>Tarea</th><th>Ciclos/prod</th><th>Procesados</th><th>Utilización</th><th>Espera prom.</th></tr></thead><tbody>${taskStatRows || '<tr><td colspan="6">Sin datos</td></tr>'}</tbody></table>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `reporte-produccion-${Date.now()}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

(async () => {
  try {
    const [stateRes, reportRes] = await Promise.all([
      fetch('/api/simulation/state'),
      fetch('/api/simulation/report')
    ]);
    const state  = await stateRes.json();
    const report = await reportRes.json();

    const totalCyclesPerProduct = state.state.processes.reduce(
      (sum, p) => sum + p.tasks.reduce((s, t) => s + t.cycles, 0), 0
    );
    const expectedTotal = totalCyclesPerProduct > 0
      ? totalCyclesPerProduct + (state.num_products - 1)
      : 0;
    const done       = state.completed_count;
    const overallPct = state.num_products > 0
      ? Math.min(100, Math.round((done / state.num_products) * 100))
      : 0;
    const remaining  = Math.max(0, expectedTotal - state.current_cycle);

    // Stat cards (no IDs — positional)
    const statValues = document.querySelectorAll('.stat-value');
    if (statValues[0]) statValues[0].textContent = fmt(state.current_cycle);
    if (statValues[1]) statValues[1].textContent = fmt(remaining);
    if (statValues[2]) statValues[2].textContent = `${done} / ${state.num_products}`;
    if (statValues[3]) statValues[3].textContent = `${overallPct}%`;

    // PROGRESO section
    const summaryPct  = document.querySelector('.paused-summary .muted-strong');
    const summaryFill = document.querySelector('.paused-summary .mini-fill');
    const summaryProc = document.querySelector('.paused-summary .summary-row.compact span');
    if (summaryPct)  summaryPct.textContent  = `${overallPct}%`;
    if (summaryFill) summaryFill.style.width = `${overallPct}%`;
    if (summaryProc && state.state.processes.length > 0) {
      summaryProc.textContent = state.state.processes[0].name;
    }

    // CONFIGURACIÓN / RENDIMIENTO / MÉTRICAS
    document.getElementById('cfg-processes').textContent = report.config.process_count;
    document.getElementById('cfg-tasks').textContent     = report.config.task_count;
    document.getElementById('cfg-time-per').textContent  = fmt(report.config.total_cycles_per_product);
    const pphEl = document.getElementById('perf-pph');
    if (pphEl) {
      pphEl.textContent = report.performance.products_per_hour;
      pphEl.title = '1 ciclo de simulación ≈ 1 segundo real';
    }

    // Change 4 — Rewrite MÉTRICAS section with 7 clean rows
    const metSection = Array.from(document.querySelectorAll('.summary-group h3'))
      .find(h => h.textContent.trim() === 'MÉTRICAS')
      ?.closest('.summary-group');
    if (metSection) {
      while (metSection.children.length > 1) metSection.removeChild(metSection.lastChild);

      const _metRow = (label, value) => {
        const row = document.createElement('div');
        row.className = 'summary-row';
        row.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
        return row;
      };

      const m = report.metrics;
      if (m && Object.keys(m).length > 0) {
        const bn = `${m.bottleneck_process} › ${m.bottleneck_task}`;
        metSection.appendChild(_metRow('Primer producto completado',          fmt(m.first_completion_cycle)));
        metSection.appendChild(_metRow('Último producto completado',          fmt(m.last_completion_cycle)));
        metSection.appendChild(_metRow('Tiempo promedio de completación',     fmt(Math.round(m.avg_duration_cycles))));
        metSection.appendChild(_metRow('Proceso con mayor congestionamiento', bn));
        metSection.appendChild(_metRow('Tiempo promedio de espera',           fmt(Math.round(m.avg_wait_time ?? 0))));
        metSection.appendChild(_metRow('Proceso y tarea con mayor espera',    `${bn} (espera: ${fmt(m.bottleneck_wait_cycles)})`));
        metSection.appendChild(_metRow('Tiempo total de procesamiento',       fmt(m.total_cycles)));
      } else {
        const empty = document.createElement('p');
        empty.style.cssText = 'font-size:12px;color:#94a3b8;margin:4px 0;';
        empty.textContent = 'Sin métricas disponibles';
        metSection.appendChild(empty);
      }
    }

    // Populate sim-proc-stats
    const procStatsDiv = document.getElementById('sim-proc-stats');
    if (procStatsDiv) {
      procStatsDiv.innerHTML = '';
      state.state.processes.forEach(proc => {
        const processed = proc.tasks[0]?.products_processed ?? 0;
        const row = document.createElement('div');
        row.className = 'summary-row';
        row.style.fontSize = '12px';
        row.innerHTML = `<span>${proc.index + 1}. ${proc.name}</span><strong>${processed} procesado(s)</strong>`;
        procStatsDiv.appendChild(row);
      });
    }

    // Per-task queue snapshot (Feature 21)
    const snapshotDiv = document.getElementById('task-snapshot');
    if (snapshotDiv) {
      snapshotDiv.innerHTML = '';
      const hdr = document.createElement('p');
      hdr.style.cssText =
        'font-size:11px;font-weight:700;text-transform:uppercase;opacity:0.6;' +
        'margin:0 0 6px;letter-spacing:0.05em;';
      hdr.textContent = 'Estado por tarea';
      snapshotDiv.appendChild(hdr);

      state.state.processes.forEach(proc => {
        proc.tasks.forEach(task => {
          const row = document.createElement('div');
          row.style.cssText =
            'background:rgba(29,53,87,0.04);border-radius:8px;padding:8px 10px;' +
            'margin:4px 0;font-size:12px;line-height:1.6;';
          const inProc   = task.current_product_id != null ? `#${task.current_product_id}` : '—';
          const queueStr = (task.queue_ids && task.queue_ids.length > 0)
            ? task.queue_ids.map(id => `#${id}`).join(', ')
            : 'vacío';
          row.innerHTML =
            `<strong>${proc.name} › ${task.name}</strong><br>` +
            `<span style="color:var(--text);">En proceso: <strong>${inProc}</strong>` +
            ` · En cola: ${queueStr}</span>`;
          snapshotDiv.appendChild(row);
        });
      });

      const pending = state.num_products - state.products_injected;
      const pendRow = document.createElement('div');
      pendRow.className = 'summary-row';
      pendRow.style.cssText = 'font-size:11px;opacity:0.7;margin-top:6px;';
      pendRow.innerHTML = `<span>Sin inyectar aún</span><strong>${pending}</strong>`;
      snapshotDiv.appendChild(pendRow);
    }

    // Populate EN TIEMPO REAL section
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

    buildProductionBoard(state);
  } catch (err) {
    console.error('Error cargando estado pausado:', err);
  }
})();

// ---------- Controls ----------
document.querySelector('.back-config-btn')?.addEventListener('click', () => {
  window.location.href = 'linea-configurada.html';
});

document.querySelector('.icon-control.pause.active')?.addEventListener('click', async () => {
  try { await fetch('/api/simulation/resume', { method: 'POST' }); } catch (_) {}
  window.location.href = 'produccion-marcha.html';
});

document.querySelector('.download-btn')?.addEventListener('click', async () => {
  try {
    const [reportRes, stateRes] = await Promise.all([
      fetch('/api/simulation/report'),
      fetch('/api/simulation/state')
    ]);
    _downloadReport(await reportRes.json(), await stateRes.json(), true);
  } catch (err) { console.error('Error al descargar:', err); }
});

// ---------- Stop button (Fix A) ----------
document.querySelector('.icon-control.stop')?.addEventListener('click', () => {
  window.location.href = 'linea-configurada.html';
});

// ---------- Restart modal (Fix B) ----------
(function _injectPausedRestartModal() {
  const modal = document.createElement('div');
  modal.id = 'pause-restart-modal';
  modal.className = 'modal-backdrop';
  modal.setAttribute('hidden', '');
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML = `
    <div class="modal-card">
      <h3 class="modal-title">Reiniciar Producción</h3>
      <p class="modal-body">
        ¿Estás seguro de que deseas reiniciar la producción? Se perderá todo el progreso actual y comenzarás desde cero.
      </p>
      <div class="modal-actions">
        <button class="modal-btn modal-cancel" type="button" id="pause-restart-cancel">Cancelar</button>
        <button class="modal-btn modal-restart" type="button" id="pause-restart-confirm">Reiniciar</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  const closeModal = () => modal.setAttribute('hidden', '');

  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.getElementById('pause-restart-cancel').addEventListener('click', closeModal);
  document.getElementById('pause-restart-confirm').addEventListener('click', async () => {
    closeModal();
    try {
      await fetch('/api/simulation/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
    } catch (_) {}
    window.location.href = 'produccion-marcha.html';
  });
})();

document.querySelector('.icon-control.warn')?.addEventListener('click', () => {
  document.getElementById('pause-restart-modal')?.removeAttribute('hidden');
});

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const m = document.getElementById('pause-restart-modal');
  if (m && !m.hasAttribute('hidden')) m.setAttribute('hidden', '');
});