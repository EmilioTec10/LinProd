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
  <div class="card"><p>Eficiencia</p><strong>100%</strong></div>
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

    const active = findActiveTask(state);
    if (active) {
      const { proc, task } = active;
      const taskPct = task.cycles > 0
        ? Math.min(100, Math.round((task.cycles - task.cycles_remaining) / task.cycles * 100))
        : 0;

      const taskPctEl  = document.querySelector('.task-progress-head strong');
      const taskFillEl = document.querySelector('.paused-current .progress-fill');
      if (taskPctEl)  taskPctEl.textContent  = `${taskPct}%`;
      if (taskFillEl) taskFillEl.style.width = `${taskPct}%`;

      const procNameEl = document.querySelector('.current-task-copy h3');
      const taskNameEl = document.querySelector('.current-task-copy p');
      const steps      = document.querySelectorAll('.current-task-step span');
      const estimate   = document.querySelector('.task-estimate');
      const tlName     = document.querySelector('.timeline-name');
      const tlTask     = document.querySelector('.timeline-task span:nth-child(2)');
      const tlDur      = document.querySelector('.timeline-task .muted');
      const caption    = document.querySelector('.timeline-caption');

      if (procNameEl) procNameEl.textContent = proc.name;
      if (taskNameEl) taskNameEl.textContent = task.name;
      if (steps[0])   steps[0].textContent   = `Proceso ${proc.index + 1}/${state.state.processes.length}`;
      if (steps[1])   steps[1].textContent   = `Tarea ${task.index + 1}/${proc.tasks.length}`;
      if (estimate)   estimate.textContent   = `${task.cycles_remaining} ciclo(s) restante(s)`;
      if (tlName)     tlName.textContent     = proc.name;
      if (tlTask)     tlTask.textContent     = task.name;
      if (tlDur)      tlDur.textContent      = `· ${task.cycles_remaining} ciclos`;
      if (caption)    caption.textContent    = `Produciendo ${Math.min(state.num_products, done + 1)} de ${state.num_products}`;

      const elCurProd = document.getElementById('sim-current-product');
      const elQueue   = document.getElementById('sim-queue');
      const elTaskCyc = document.getElementById('sim-task-cycle');
      if (elCurProd) elCurProd.textContent = task.current_product_id != null ? `#${task.current_product_id}` : '—';
      if (elQueue)   elQueue.textContent   = task.queue_length ?? '—';
      if (elTaskCyc) elTaskCyc.textContent = task.cycles > 0
        ? `${task.cycles - task.cycles_remaining + 1} de ${task.cycles}` : '—';
    }

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
    document.getElementById('perf-pph').textContent      = report.performance.products_per_hour;

    if (report.metrics && Object.keys(report.metrics).length > 0) {
      document.getElementById('met-first').textContent = fmt(report.metrics.first_completion_cycle);
      document.getElementById('met-last').textContent  = fmt(report.metrics.last_completion_cycle);
      document.getElementById('met-avg').textContent   = fmt(Math.round(report.metrics.avg_duration_cycles));
      document.getElementById('met-total').textContent = fmt(report.metrics.total_cycles);

      document.getElementById('met-bottleneck-name').textContent =
        `${report.metrics.bottleneck_process} → ${report.metrics.bottleneck_task}`;
      document.getElementById('met-bottleneck-time').textContent =
        fmt(report.metrics.bottleneck_wait_cycles);

      document.getElementById('met-longest-task').textContent = report.metrics.longest_task_name;
      document.getElementById('met-longest-task-sub').textContent =
        `${report.metrics.longest_task_process} • ${fmt(report.metrics.longest_task_cycles)}`;
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
